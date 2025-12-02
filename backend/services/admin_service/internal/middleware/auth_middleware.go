package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"admin_service/internal/config"
	adminjwt "admin_service/pkg/jwt"
)

// AdminAuth validates admin JWT token and protects admin routes.
func AdminAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c.Request)
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing admin token"})
			return
		}

		claims, err := adminjwt.ParseAdminToken(token, cfg.AdminJWTSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid admin token"})
			return
		}

		c.Set("adminUsername", claims.Username)
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
