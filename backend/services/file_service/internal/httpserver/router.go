package httpserver

import (
	"net/http"

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

	// Protected static under /materials with access control
	mg := r.Group("/materials")
	mg.Use(middleware.NewAccessMiddleware(service))
	mg.Static("/", cfg.PublicDir+"/materials")

	// Optionally expose other public assets if needed (not materials)
	// r.Static("/static", cfg.PublicDir)
	return r
}
