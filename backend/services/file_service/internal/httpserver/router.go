package httpserver

import (
	"net/http"
	"path/filepath"
	"strings"
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
	h := materials.NewHandlerWithConfig(cfg, service)

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
	mg.Use(middleware.NewAccessMiddleware(cfg, service))

	mg.GET("/manifest", h.Manifest)
	mg.GET("/sign", h.Sign)

	serveResolved := func(c *gin.Context) {
		relAny, ok := c.Get("material_rel")
		if !ok {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		rel, _ := relAny.(string)
		rel = strings.TrimPrefix(rel, "/")
		if rel == "" || strings.Contains(rel, "..") {
			c.AbortWithStatus(http.StatusBadRequest)
			return
		}
		baseDir := cfg.MaterialsDir
		if baseDir == "" {
			baseDir = filepath.Join(cfg.PublicDir, "materials")
		}
		c.File(filepath.Join(baseDir, filepath.FromSlash(rel)))
	}

	mg.GET("/t/:token", serveResolved)

	mg.GET("/:category/:token", serveResolved)

	mg.GET("/s/:signed", serveResolved)

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
