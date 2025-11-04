package router

import (
	"io"
	"net/http"
	"os"

	"gateway_service/internal/proxy"

	"github.com/gin-gonic/gin"
)

// SetupRouter создаёт и настраивает все маршруты для gateway_service
func SetupRouter() *gin.Engine {
	r := gin.Default()

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

	// Proxy всех запросов к auth_service
	r.Any("/auth/*path", proxy.ServiceProxy(authBase, "/auth"))

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

	return r
}
