package httpserver

import (
	"crypto/md5"
	"encoding/base64"
	"net/http"
	"net/url"
	"strconv"
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

	// Signed link issuer: /materials/link?id=<path-like-id>
	mg.GET("/link", func(c *gin.Context) {
		id := c.Query("id")
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "missing id"})
			return
		}
		if strings.Contains(id, "..") {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
			return
		}
		if cfg.ResourcesBase == "" || cfg.LinkSigningSecret == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "signing not configured"})
			return
		}
		// uri on resources must map to disk path, keep leading slash
		uri := "/" + strings.TrimPrefix(id, "/")
		exp := time.Now().Unix() + int64(cfg.LinkTTLSeconds)
		expStr := strconv.FormatInt(exp, 10)
		// Nginx: secure_link_md5 "$uri$arg_e$secure_link_secret"
		sum := md5.Sum([]byte(uri + expStr + cfg.LinkSigningSecret))
		sig := base64.URLEncoding.WithPadding(base64.NoPadding).EncodeToString(sum[:])

		// Build final redirect URL to resources
		u, _ := url.Parse(cfg.ResourcesBase)
		// ensure path join
		u.Path = strings.TrimRight(u.Path, "/") + uri
		q := u.Query()
		q.Set("e", expStr)
		q.Set("sig", sig)
		u.RawQuery = q.Encode()
		c.Redirect(http.StatusFound, u.String())
	})

	// Serve static under /materials/content from external materials dir
	// This maps URLs like /materials/content/reading/file.html -> <cfg.MaterialsDir>/reading/file.html
	if cfg.MaterialsDir != "" {
		mg.Static("/content", cfg.MaterialsDir)
	} else {
		mg.Static("/content", cfg.PublicDir+"/materials")
	}

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
