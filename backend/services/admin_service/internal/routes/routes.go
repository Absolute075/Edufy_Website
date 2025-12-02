package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"admin_service/internal/admin/handler"
	"admin_service/internal/config"
	"admin_service/internal/middleware"
)

// Register sets up all HTTP routes for admin_service.
func Register(r *gin.Engine, cfg *config.Config, h *handler.AdminHandler) {
	// Public health check for k8s/docker
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "admin_service running"})
	})

	// Admin login (no auth yet)
	r.POST("/admin/login", h.Login)

	// Protected admin endpoints
	adminGroup := r.Group("/admin")
	adminGroup.Use(middleware.AdminAuth(cfg))
	adminGroup.GET("/info", h.AdminInfo)
}
