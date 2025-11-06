package httpserver

import (
	"net/http"

	"edufy/file_service/internal/config"
	"edufy/file_service/internal/materials"
	"github.com/gin-gonic/gin"
)

func NewRouter(cfg config.Config) *gin.Engine {
	r := gin.Default()

	// Health
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })

	// Materials feature
	repo := materials.NewFileRepository(cfg.PublicDir, cfg.ManifestRelPath)
	service := materials.NewService(repo)
	h := materials.NewHandler(service)
	r.GET("/materials/manifest", h.Manifest)

	// Static files under public/
	r.Static("/", cfg.PublicDir)
	return r
}
