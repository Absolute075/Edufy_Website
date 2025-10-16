package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Простой тестовый маршрут
	r.GET("/ping", func(c *gin.Context) {
		c.String(200, "pong")
	})

// Пример маршрута для user_service
r.Any("/api/users/*path", proxy.ReverseProxy("http://localhost:8081"))


	// Запускаем сервер на порту 8080
	r.Run(":8080")
}
