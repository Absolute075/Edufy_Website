package httpserver

import (
	"net/http"
	"time"

	"edufy/file_service/internal/config"
	"edufy/file_service/internal/httpserver/middleware"
	"edufy/file_service/internal/materials"
	"github.com/gin-gonic/gin"
)

func NewRouter(cfg config.Config) *gin.Engine {
	r := gin.Default()

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })

	// Materials feature
	service := materials.NewServiceWithConfig(cfg)
	h := materials.NewHandler(service)
	r.GET("/materials/manifest", h.Manifest)

	// Manual reindex endpoint (admin)
	r.POST("/materials/reindex", func(c *gin.Context) {
		token := c.GetHeader("X-Admin-Token")
		if cfg.AdminReindexToken == "" || token != cfg.AdminReindexToken {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		if err := service.Reindex(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "reindex error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "reindexed"})
	})

	// Protected static under /materials with access control
	mg := r.Group("/materials")
	mg.Use(middleware.NewAccessMiddleware(service))
	// Serve static under /materials/content to avoid conflict with /materials/manifest
	mg.Static("/content", cfg.PublicDir+"/materials")

	// Optionally expose other public assets if needed (not materials)
	// r.Static("/static", cfg.PublicDir)

	// Autoscan ticker
	if cfg.AutoScanSeconds > 0 {
		go func() {
			t := time.NewTicker(time.Duration(cfg.AutoScanSeconds) * time.Second)
			defer t.Stop()
			for range t.C {
				_ = service.Reindex()
			}
		}()
	}
	return r
}
