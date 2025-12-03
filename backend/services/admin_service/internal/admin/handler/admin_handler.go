package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"
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

type grantSubscriptionRequest struct {
	Username string `json:"username"`
	Plan     string `json:"plan"`
	Period   string `json:"period"`
}

// GrantSubscription allows an authenticated admin to grant or extend a user subscription
// by forwarding the request to user_service internal admin endpoint.
func (h *AdminHandler) GrantSubscription(c *gin.Context) {
	var req grantSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if req.Username == "" || req.Plan == "" || req.Period == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username, plan and period are required"})
		return
	}

	userBase := h.cfg.UserServiceURL
	if userBase == "" {
		userBase = "http://user_service:8080"
	}
	body, err := json.Marshal(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode_request_failed"})
		return
	}

	url := userBase + "/user/internal/admin/subscriptions/grant"
	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "user_service_unreachable"})
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	for k, v := range resp.Header {
		if len(v) > 0 {
			c.Writer.Header().Set(k, v[0])
		}
	}
	c.Status(resp.StatusCode)
	if len(respBody) > 0 {
		_, _ = c.Writer.Write(respBody)
	}
}

type subscriptionSummary struct {
	Username    string      `json:"username"`
	Plan        string      `json:"plan"`
	ActiveUntil interface{} `json:"activeUntil"`
	GrantedAt   interface{} `json:"grantedAt"`
}

type userWithSubscription struct {
	Username    string      `json:"username"`
	Email       string      `json:"email"`
	Plan        string      `json:"plan"`
	GrantedAt   interface{} `json:"grantedAt,omitempty"`
	ActiveUntil interface{} `json:"activeUntil,omitempty"`
}

func (h *AdminHandler) SearchSubscriptions(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		c.JSON(http.StatusOK, []userWithSubscription{})
		return
	}

	authBase := h.cfg.AuthServiceURL
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}
	authURL := authBase + "/auth/internal/admin/users/search?q=" + url.QueryEscape(q)
	authResp, err := http.Get(authURL)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unreachable"})
		return
	}
	defer authResp.Body.Close()
	if authResp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unexpected_status", "status": authResp.StatusCode})
		return
	}

	var authUsers []struct {
		Username  string      `json:"username"`
		Email     string      `json:"email"`
		CreatedAt interface{} `json:"createdAt"`
	}
	if err := json.NewDecoder(authResp.Body).Decode(&authUsers); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_decode_failed"})
		return
	}

	userBase := h.cfg.UserServiceURL
	if userBase == "" {
		userBase = "http://user_service:8080"
	}

	results := make([]userWithSubscription, 0, len(authUsers))
	for _, u := range authUsers {
		summaryURL := userBase + "/user/internal/admin/subscriptions/summary?username=" + url.QueryEscape(u.Username)
		resp, err := http.Get(summaryURL)
		if err != nil {
			results = append(results, userWithSubscription{
				Username: u.Username,
				Email:    u.Email,
				Plan:     "free",
			})
			continue
		}
		func() {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusNotFound {
				results = append(results, userWithSubscription{
					Username: u.Username,
					Email:    u.Email,
					Plan:     "free",
				})
				return
			}
			if resp.StatusCode != http.StatusOK {
				results = append(results, userWithSubscription{
					Username: u.Username,
					Email:    u.Email,
					Plan:     "free",
				})
				return
			}
			var sub subscriptionSummary
			if err := json.NewDecoder(resp.Body).Decode(&sub); err != nil {
				results = append(results, userWithSubscription{
					Username: u.Username,
					Email:    u.Email,
					Plan:     "free",
				})
				return
			}
			plan := sub.Plan
			if plan == "" {
				plan = "free"
			}
			results = append(results, userWithSubscription{
				Username:    u.Username,
				Email:       u.Email,
				Plan:        plan,
				GrantedAt:   sub.GrantedAt,
				ActiveUntil: sub.ActiveUntil,
			})
		}()
	}

	c.JSON(http.StatusOK, results)
}
