package main

import (
	"net/http"
	"os"

	"gateway_service/internal/proxy"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// Base URL for auth_service (inside Docker network)
	authBase := os.Getenv("AUTH_SERVICE_URL")
	if authBase == "" {
		// auth_service listens on 8080 inside the container
		authBase = "http://auth_service:8080"
	}

	// Proxy /auth/* to auth_service
	router.Any("/auth/*path", proxy.ReverseProxy(authBase))

	// Health-check
	router.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "gateway_service running"}) })

	router.Run(":8080")
}
