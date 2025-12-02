package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"admin_service/internal/admin/dto"
	"admin_service/internal/admin/service"
	"admin_service/internal/config"
	adminjwt "admin_service/pkg/jwt"
)

type AdminHandler struct {
	cfg *config.Config
	svc *service.AdminService
}

func NewAdminHandler(cfg *config.Config, svc *service.AdminService) *AdminHandler {
	return &AdminHandler{cfg: cfg, svc: svc}
}

// Login authenticates admin credentials and issues JWT + cookie.
func (h *AdminHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	if !h.svc.Authenticate(req.Username, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := adminjwt.GenerateAdminToken(req.Username, h.cfg.AdminJWTSecret, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// HttpOnly cookie for browser-based admin panel
	httpOnly := true
	secure := c.Request.TLS != nil
	c.SetCookie("admin_token", token, int(24*time.Hour/time.Second), "/", "", secure, httpOnly)

	c.JSON(http.StatusOK, dto.LoginResponse{Token: token})
}

// AdminInfo is a simple protected endpoint to verify auth works.
func (h *AdminHandler) AdminInfo(c *gin.Context) {
	username, _ := c.Get("adminUsername")
	c.JSON(http.StatusOK, gin.H{
		"admin":  username,
		"status": "ok",
	})
}
