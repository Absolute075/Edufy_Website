package router

import (
	"io"
	"net/http"
	"os"
	"path/filepath"

	"gateway_service/internal/proxy"

	"github.com/gin-gonic/gin"
)

// SetupRouter создаёт и настраивает все маршруты для gateway_service
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Trust all proxies by default so ClientIP() can resolve real client IP from headers
	// In production, consider restricting to your proxy ranges (e.g., Cloudflare IPs)
	if err := r.SetTrustedProxies([]string{"0.0.0.0/0", "::/0"}); err != nil {
		panic(err)
	}

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Base URL для auth_service
	authBase := os.Getenv("AUTH_SERVICE_URL")
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}

	// Base URL для user_service
	userBase := os.Getenv("USER_SERVICE_URL")
	if userBase == "" {
		userBase = "http://user_service:8080"
	}

	// Proxy всех запросов к auth_service и user_service
	r.Any("/auth/*path", proxy.ServiceProxy(authBase, "/auth"))
	r.Any("/user/*path", proxy.ServiceProxy(userBase, "/user"))

	// Health-check самого gateway
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "gateway_service running"})
	})

	// Health-check для auth_service (опционально)
	r.GET("/auth/health", func(c *gin.Context) {
		resp, err := http.Get(authBase + "/auth/health")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), body)
	})

	// Health-check для user_service (опционально)
	r.GET("/user/health", func(c *gin.Context) {
		resp, err := http.Get(userBase + "/user/health")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, resp.Header.Get("Content-Type"), body)
	})

	// Serve custom 404 page directly
	r.GET("/404.html", func(c *gin.Context) {
		// Try a few likely locations depending on container/workdir
		candidates := []string{
			"frontend/main/404.html",
			"../frontend/main/404.html",
			"/app/frontend/main/404.html",
		}
		for _, p := range candidates {
			if _, err := os.Stat(p); err == nil {
				c.Header("Content-Type", "text/html; charset=utf-8")
				c.File(filepath.Clean(p))
				return
			}
		}
		c.String(http.StatusNotFound, "404 page not found")
	})

	// Serve custom 404 page for any unmatched routes
	r.NoRoute(func(c *gin.Context) {
		c.Status(http.StatusNotFound)
		c.Header("Content-Type", "text/html; charset=utf-8")
		// Try robust candidates
		candidates := []string{
			"frontend/main/404.html",
			"../frontend/main/404.html",
			"/app/frontend/main/404.html",
		}
		for _, p := range candidates {
			if _, err := os.Stat(p); err == nil {
				c.File(filepath.Clean(p))
				return
			}
		}
		c.String(http.StatusNotFound, "404 page not found")
	})

	return r
}
