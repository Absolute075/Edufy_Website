package materials

import (
	"net/http"

	"github.com/gin-gonic/gin"
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
	c.Header("Cache-Control", "private, no-store")
	c.JSON(http.StatusOK, m)
}
