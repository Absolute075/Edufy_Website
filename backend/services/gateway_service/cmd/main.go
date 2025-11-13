package main

import (
	"net/http"
	"os"

	"gateway_service/internal/proxy"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// === CORS middleware (credentials-friendly) ===
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == http.MethodOptions {
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

	// === Materials proxy -> file_service with user headers ===
	fileBase := os.Getenv("FILE_SERVICE_URL")
	if fileBase == "" {
		fileBase = "http://file_service:8080"
	}
	router.Any("/materials/*path", proxy.ServiceProxyWithUserHeaders(fileBase, "/materials"))

	// === Health-check для gateway ===
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "gateway_service running"})
	})

	// === Запуск сервера на порту 8080 ===
	router.Run(":8080")
}
