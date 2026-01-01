package proxy

import (
	"encoding/base64"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
)

// ServiceProxy создаёт gin.HandlerFunc для любого сервиса по его URL и basePath
func ServiceProxy(target string, basePath string) gin.HandlerFunc {
	targetURL, err := url.Parse(target)
	if err != nil {
		panic("Invalid proxy target URL: " + target)
	}

	return func(c *gin.Context) {
		proxy := httputil.NewSingleHostReverseProxy(targetURL)

		// корректный путь на целевой сервис
		c.Request.URL.Path = basePath + c.Param("path")
		// IMPORTANT: rewrite Host header to upstream host.
		// Some upstream servers (e.g., Tomcat) reject invalid hostnames like "gateway_service" (underscore).
		c.Request.Host = sanitizeHost(targetURL.Host)

		// Пробрасываем реальный IP клиента в заголовках
		clientIP := c.ClientIP()
		if clientIP != "" {
			// X-Forwarded-For (добавляем к цепочке)
			xff := c.Request.Header.Get("X-Forwarded-For")
			if xff == "" {
				c.Request.Header.Set("X-Forwarded-For", clientIP)
			} else {
				c.Request.Header.Set("X-Forwarded-For", xff+", "+clientIP)
			}
			// X-Real-IP
			if c.Request.Header.Get("X-Real-IP") == "" {
				c.Request.Header.Set("X-Real-IP", clientIP)
			}
			// CF-Connecting-IP для совместимости, если за Cloudflare
			if c.Request.Header.Get("CF-Connecting-IP") == "" {
				c.Request.Header.Set("CF-Connecting-IP", clientIP)
			}
		}

		// обработка ошибок
		proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte("Proxy error: " + err.Error()))
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func sanitizeHost(hostport string) string {
	if hostport == "" {
		return hostport
	}
	// Preserve port if present; only sanitize hostname.
	host := hostport
	port := ""
	if h, p, err := net.SplitHostPort(hostport); err == nil {
		host = h
		port = p
	}
	host = strings.ReplaceAll(host, "_", "-")
	if port != "" {
		return net.JoinHostPort(host, port)
	}
	return host
}

func ensureAuthorizationFromCookie(c *gin.Context) string {
	if c == nil || c.Request == nil {
		return ""
	}
	if existing := c.Request.Header.Get("Authorization"); existing != "" {
		return existing
	}
	cookie, err := c.Request.Cookie("accessToken")
	if err != nil || cookie == nil || strings.TrimSpace(cookie.Value) == "" {
		return ""
	}
	auth := "Bearer " + strings.TrimSpace(cookie.Value)
	c.Request.Header.Set("Authorization", auth)
	return auth
}

// ServiceProxyWithUserHeaders аналог ServiceProxy, но дополнительно выставляет X-User-Name и X-User-Plan из JWT
func ServiceProxyWithUserHeaders(target string, basePath string) gin.HandlerFunc {
	targetURL, err := url.Parse(target)
	if err != nil {
		panic("Invalid proxy target URL: " + target)
	}
	return func(c *gin.Context) {
		proxy := httputil.NewSingleHostReverseProxy(targetURL)

		c.Request.URL.Path = basePath + c.Param("path")
		// Rewrite Host header to upstream to avoid invalid hostnames being forwarded.
		c.Request.Host = sanitizeHost(targetURL.Host)

		authHeader := ensureAuthorizationFromCookie(c)
		if authHeader == "" {
			authHeader = c.Request.Header.Get("Authorization")
		}

		// Extract from Authorization
		user, plan := extractUserAndPlan(authHeader)
		if user != "" {
			c.Request.Header.Set("X-User-Name", user)
		}
		if plan == "" {
			plan = "free"
		}
		c.Request.Header.Set("X-User-Plan", strings.ToLower(plan))

		// Pass client IP headers
		clientIP := c.ClientIP()
		if clientIP != "" {
			xff := c.Request.Header.Get("X-Forwarded-For")
			if xff == "" {
				c.Request.Header.Set("X-Forwarded-For", clientIP)
			} else {
				c.Request.Header.Set("X-Forwarded-For", xff+", "+clientIP)
			}
			if c.Request.Header.Get("X-Real-IP") == "" {
				c.Request.Header.Set("X-Real-IP", clientIP)
			}
			if c.Request.Header.Get("CF-Connecting-IP") == "" {
				c.Request.Header.Set("CF-Connecting-IP", clientIP)
			}
		}

		proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte("Proxy error: " + err.Error()))
		}
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

func extractUserAndPlan(authHeader string) (string, string) {
	if authHeader == "" {
		return "", ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", ""
	}
	segs := strings.Split(parts[1], ".")
	if len(segs) < 2 {
		return "", ""
	}
	payload := segs[1]
	b, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		b, err = base64.StdEncoding.DecodeString(payload)
		if err != nil {
			return "", ""
		}
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		return "", ""
	}
	user := ""
	if v, ok := m["username"].(string); ok && v != "" {
		user = v
	} else if v, ok := m["sub"].(string); ok {
		user = v
	}
	plan := ""
	if v, ok := m["plan"].(string); ok {
		plan = v
	}
	return user, plan
}
