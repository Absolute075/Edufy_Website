package main

import (
	"net/http"
	"os"

	"gateway_service/internal/proxy"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// === CORS middleware ===
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

	// === Auth service proxy ===
	authBase := os.Getenv("AUTH_SERVICE_URL")
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}
	router.Any("/auth/*path", proxy.ServiceProxy(authBase, "/auth"))

	// === Пример другого сервиса (по желанию) ===
	userBase := os.Getenv("USER_SERVICE_URL")
	if userBase == "" {
		userBase = "http://user_service:8080"
	}
	router.Any("/user/*path", proxy.ServiceProxy(userBase, "/user"))

	// === Health-check для gateway ===
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "gateway_service running"})
	})

	// === Запуск сервера на порту 8080 ===
	router.Run(":8080")
}
