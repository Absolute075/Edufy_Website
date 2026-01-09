package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"admin_service/internal/config"
	adminjwt "admin_service/pkg/jwt"
)

type authMeResponse struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

// AdminAuth validates admin JWT token and protects admin routes.
func AdminAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) Legacy admin_token flow (kept for backward compatibility)
		if token := extractToken(c.Request); token != "" {
			claims, err := adminjwt.ParseAdminToken(token, cfg.AdminJWTSecret)
			if err == nil {
				c.Set("adminUsername", claims.Username)
				c.Next()
				return
			}
		}

		// 2) Role-based flow via auth_service /auth/me using accessToken cookie
		cookieHeader := c.Request.Header.Get("Cookie")
		if strings.TrimSpace(cookieHeader) == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		base := strings.TrimRight(cfg.AuthServiceURL, "/")
		if base == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		req, err := http.NewRequest("GET", base+"/auth/me", nil)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		req.Header.Set("Cookie", cookieHeader)
		req.Header.Set("Accept", "application/json")
		req.Header.Set("x-edufy-middleware", "1")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		var me authMeResponse
		if err := json.NewDecoder(resp.Body).Decode(&me); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		if strings.ToUpper(strings.TrimSpace(me.Role)) != "ADMIN" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		adminName := strings.TrimSpace(me.Username)
		if adminName == "" {
			adminName = strings.TrimSpace(me.Email)
		}
		if adminName == "" {
			adminName = "admin"
		}
		c.Set("adminUsername", adminName)
		c.Next()
	}
}

func extractToken(r *http.Request) string {
	// 1) Authorization: Bearer <token>
	if auth := r.Header.Get("Authorization"); auth != "" {
		parts := strings.Fields(auth)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			return parts[1]
		}
	}

	// 2) Cookie: admin_token
	if cookie, err := r.Cookie("admin_token"); err == nil {
		if v := strings.TrimSpace(cookie.Value); v != "" {
			return v
		}
	}

	return ""
}
