package materials

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type Handler struct {
	svc Service
}

func NewHandler(s Service) *Handler { return &Handler{svc: s} }

func (h *Handler) Manifest(c *gin.Context) {
	m, err := h.svc.GetManifest()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "manifest error"})
		return
	}
	c.Header("Cache-Control", "public, max-age=300")
	c.JSON(http.StatusOK, m)
}
