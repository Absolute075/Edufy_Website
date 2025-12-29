package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
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
	Email  string `json:"email"`
	Period string `json:"period"`
}

type revokeSubscriptionRequest struct {
	Email string `json:"email"`
}

// GrantSubscription allows an authenticated admin to grant or extend a user subscription
// by forwarding the request to user_service internal admin endpoint.
func (h *AdminHandler) GrantSubscription(c *gin.Context) {
	var req grantSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	log.Printf("GrantSubscription: incoming email=%q period=%q", strings.TrimSpace(req.Email), strings.TrimSpace(req.Period))
	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Period) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and period are required"})
		return
	}
	periodRaw := strings.TrimSpace(req.Period)
	periodKey := strings.ToLower(periodRaw)
	period := ""
	switch periodKey {
	case "monthly", "month", "1month", "1-month", "1_month":
		period = "monthly"
	case "sixmonths", "6months", "6month", "6-months", "6_months", "halfyear", "half-year", "half_year":
		period = "sixMonths"
	case "yearly", "year", "annual", "1year", "12months", "12-months", "12_months":
		period = "yearly"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported period"})
		return
	}

	authBase := h.cfg.AuthServiceURL
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}

	// Resolve username by email in auth_service DB.
	email := strings.TrimSpace(req.Email)
	lookupURL := authBase + "/auth/internal/admin/users/by-email?email=" + email
	log.Printf("GrantSubscription: auth lookup url=%s", lookupURL)
	client := &http.Client{Timeout: 5 * time.Second}
	lookupReq, err := http.NewRequest(http.MethodGet, lookupURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	// Some Tomcat configurations reject Host headers containing underscores.
	// Docker service names often contain underscores (e.g. auth_service). We keep the URL for DNS,
	// but sanitize the Host header to avoid Tomcat returning HTTP 400 before hitting Spring MVC.
	lookupReq.Host = strings.ReplaceAll(lookupReq.Host, "_", "-")
	lookupReq.Header.Set("Accept", "application/json")
	lookupResp, err := client.Do(lookupReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unreachable"})
		return
	}
	defer lookupResp.Body.Close()
	lookupBody, _ := io.ReadAll(lookupResp.Body)
	log.Printf("GrantSubscription: auth lookup status=%d body=%s", lookupResp.StatusCode, string(lookupBody))
	if lookupResp.StatusCode != http.StatusOK {
		c.Status(lookupResp.StatusCode)
		if len(lookupBody) > 0 {
			_, _ = c.Writer.Write(lookupBody)
		} else {
			c.JSON(lookupResp.StatusCode, gin.H{"error": "user_lookup_failed"})
		}
		return
	}

	var user struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	_ = json.Unmarshal(lookupBody, &user)
	if strings.TrimSpace(user.Username) == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_invalid_response"})
		return
	}

	// Call user_service directly inside the Docker network
	base := h.cfg.UserServiceURL
	if base == "" {
		base = "http://user_service:8080"
	}
	// Only premium can be granted via admin panel.
	upstreamReq := map[string]any{
		"username": user.Username,
		"plan":     "premium",
		"period":   period,
	}
	body, err := json.Marshal(upstreamReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode_request_failed"})
		return
	}

	url := base + "/user/internal/admin/subscriptions/grant"
	log.Printf("GrantSubscription: forwarding to %s payload=%s", url, string(body))
	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	// Same Host header sanitization for user_service.
	httpReq.Host = strings.ReplaceAll(httpReq.Host, "_", "-")
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "user_service_unreachable"})
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("GrantSubscription: upstream status=%d body=%s", resp.StatusCode, string(respBody))

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

func (h *AdminHandler) RevokeSubscription(c *gin.Context) {
	var req revokeSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	log.Printf("RevokeSubscription: incoming email=%q", strings.TrimSpace(req.Email))
	if strings.TrimSpace(req.Email) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email is required"})
		return
	}

	authBase := h.cfg.AuthServiceURL
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}

	email := strings.TrimSpace(req.Email)
	lookupURL := authBase + "/auth/internal/admin/users/by-email?email=" + email
	log.Printf("RevokeSubscription: auth lookup url=%s", lookupURL)
	client := &http.Client{Timeout: 5 * time.Second}
	lookupReq, err := http.NewRequest(http.MethodGet, lookupURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	lookupReq.Host = strings.ReplaceAll(lookupReq.Host, "_", "-")
	lookupReq.Header.Set("Accept", "application/json")
	lookupResp, err := client.Do(lookupReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unreachable"})
		return
	}
	defer lookupResp.Body.Close()
	lookupBody, _ := io.ReadAll(lookupResp.Body)
	log.Printf("RevokeSubscription: auth lookup status=%d body=%s", lookupResp.StatusCode, string(lookupBody))
	if lookupResp.StatusCode != http.StatusOK {
		c.Status(lookupResp.StatusCode)
		if len(lookupBody) > 0 {
			_, _ = c.Writer.Write(lookupBody)
		} else {
			c.JSON(lookupResp.StatusCode, gin.H{"error": "user_lookup_failed"})
		}
		return
	}

	var user struct {
		Username string `json:"username"`
		Email    string `json:"email"`
	}
	_ = json.Unmarshal(lookupBody, &user)
	if strings.TrimSpace(user.Username) == "" {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_invalid_response"})
		return
	}

	base := h.cfg.UserServiceURL
	if base == "" {
		base = "http://user_service:8080"
	}
	upstreamReq := map[string]any{
		"username": user.Username,
	}
	body, err := json.Marshal(upstreamReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode_request_failed"})
		return
	}

	url := base + "/user/internal/admin/subscriptions/revoke"
	log.Printf("RevokeSubscription: forwarding to %s payload=%s", url, string(body))
	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	httpReq.Host = strings.ReplaceAll(httpReq.Host, "_", "-")
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "user_service_unreachable"})
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("RevokeSubscription: upstream status=%d body=%s", resp.StatusCode, string(respBody))

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
	Role        string      `json:"role,omitempty"`
	Active      bool        `json:"active"`
}

type authUser struct {
	Username  string      `json:"username"`
	Email     string      `json:"email"`
	Role      string      `json:"role"`
	Active    bool        `json:"active"`
	CreatedAt interface{} `json:"createdAt"`
}

func (h *AdminHandler) getSubscriptionSummary(client *http.Client, username string) (subscriptionSummary, bool) {
	base := h.cfg.UserServiceURL
	if base == "" {
		base = "http://user_service:8080"
	}
	summaryURL := base + "/user/internal/admin/subscriptions/summary?username=" + url.QueryEscape(username)
	resp, err := client.Get(summaryURL)
	if err != nil {
		return subscriptionSummary{}, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return subscriptionSummary{}, false
	}
	var s subscriptionSummary
	if err := json.NewDecoder(resp.Body).Decode(&s); err != nil {
		return subscriptionSummary{}, false
	}
	return s, true
}

func (h *AdminHandler) searchUsersFromDB(q string) ([]authUser, int, []byte, error) {
	authBase := h.cfg.AuthServiceURL
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}
	client := &http.Client{Timeout: 5 * time.Second}
	searchURL := authBase + "/auth/internal/admin/users/search?q=" + url.QueryEscape(q)
	req, err := http.NewRequest(http.MethodGet, searchURL, nil)
	if err != nil {
		return nil, http.StatusBadGateway, nil, err
	}
	// Tomcat may reject Host headers with underscores (e.g. auth_service).
	req.Host = strings.ReplaceAll(req.Host, "_", "-")
	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return nil, 0, nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, resp.StatusCode, body, nil
	}
	var users []authUser
	if err := json.Unmarshal(body, &users); err != nil {
		return nil, http.StatusBadGateway, nil, err
	}
	return users, http.StatusOK, nil, nil
}

func (h *AdminHandler) buildUsersWithSubscriptions(q string) ([]userWithSubscription, int, []byte) {
	q = strings.TrimSpace(q)
	if q == "" {
		return []userWithSubscription{}, http.StatusOK, nil
	}

	users, status, rawBody, err := h.searchUsersFromDB(q)
	if err != nil {
		return nil, http.StatusBadGateway, []byte(`{"error":"auth_service_unreachable"}`)
	}
	if status != http.StatusOK {
		return nil, status, rawBody
	}

	client := &http.Client{Timeout: 5 * time.Second}
	results := make([]userWithSubscription, 0, len(users))
	for _, u := range users {
		plan := "free"
		var grantedAt interface{} = nil
		var activeUntil interface{} = nil
		if s, ok := h.getSubscriptionSummary(client, u.Username); ok {
			if s.Plan != "" {
				plan = s.Plan
			}
			grantedAt = s.GrantedAt
			activeUntil = s.ActiveUntil
		}
		results = append(results, userWithSubscription{
			Username:    u.Username,
			Email:       u.Email,
			Plan:        plan,
			GrantedAt:   grantedAt,
			ActiveUntil: activeUntil,
			Role:        u.Role,
			Active:      u.Active,
		})
	}
	return results, http.StatusOK, nil
}

func (h *AdminHandler) SearchSubscriptions(c *gin.Context) {
	results, status, raw := h.buildUsersWithSubscriptions(c.Query("q"))
	if status != http.StatusOK {
		c.Status(status)
		if len(raw) > 0 {
			_, _ = c.Writer.Write(raw)
		} else {
			c.JSON(status, gin.H{"error": "request_failed"})
		}
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *AdminHandler) ListPremiumSubscriptions(c *gin.Context) {
	client := &http.Client{Timeout: 8 * time.Second}

	userBase := h.cfg.UserServiceURL
	if userBase == "" {
		userBase = "http://user_service:8080"
	}
	premiumURL := userBase + "/user/internal/admin/subscriptions/premium"
	req, err := http.NewRequest(http.MethodGet, premiumURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	req.Host = strings.ReplaceAll(req.Host, "_", "-")
	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "user_service_unreachable"})
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		c.Status(resp.StatusCode)
		if len(body) > 0 {
			_, _ = c.Writer.Write(body)
		} else {
			c.JSON(resp.StatusCode, gin.H{"error": "request_failed"})
		}
		return
	}

	var subs []subscriptionSummary
	if err := json.Unmarshal(body, &subs); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "invalid_upstream_response"})
		return
	}

	usernames := make([]string, 0, len(subs))
	for _, s := range subs {
		if strings.TrimSpace(s.Username) != "" {
			usernames = append(usernames, s.Username)
		}
	}

	authBase := h.cfg.AuthServiceURL
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}
	batchURL := authBase + "/auth/internal/admin/users/by-usernames"
	payload, _ := json.Marshal(map[string]any{"usernames": usernames})
	batchReq, err := http.NewRequest(http.MethodPost, batchURL, bytes.NewReader(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	batchReq.Host = strings.ReplaceAll(batchReq.Host, "_", "-")
	batchReq.Header.Set("Content-Type", "application/json")
	batchReq.Header.Set("Accept", "application/json")
	batchResp, err := client.Do(batchReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unreachable"})
		return
	}
	defer batchResp.Body.Close()
	batchBody, _ := io.ReadAll(batchResp.Body)
	if batchResp.StatusCode != http.StatusOK {
		c.Status(batchResp.StatusCode)
		if len(batchBody) > 0 {
			_, _ = c.Writer.Write(batchBody)
		} else {
			c.JSON(batchResp.StatusCode, gin.H{"error": "request_failed"})
		}
		return
	}

	var users []authUser
	if err := json.Unmarshal(batchBody, &users); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "invalid_upstream_response"})
		return
	}

	userByUsername := make(map[string]authUser, len(users))
	for _, u := range users {
		userByUsername[u.Username] = u
	}

	results := make([]userWithSubscription, 0, len(subs))
	for _, s := range subs {
		u, ok := userByUsername[s.Username]
		email := ""
		role := ""
		active := true
		if ok {
			email = u.Email
			role = u.Role
			active = u.Active
		}
		results = append(results, userWithSubscription{
			Username:    s.Username,
			Email:       email,
			Plan:        "premium",
			GrantedAt:   s.GrantedAt,
			ActiveUntil: s.ActiveUntil,
			Role:        role,
			Active:      active,
		})
	}

	c.JSON(http.StatusOK, results)
}

func (h *AdminHandler) SearchUsers(c *gin.Context) {
	results, status, raw := h.buildUsersWithSubscriptions(c.Query("q"))
	if status != http.StatusOK {
		c.Status(status)
		if len(raw) > 0 {
			_, _ = c.Writer.Write(raw)
		} else {
			c.JSON(status, gin.H{"error": "request_failed"})
		}
		return
	}
	c.JSON(http.StatusOK, results)
}

type setUserActiveRequest struct {
	Username string `json:"username"`
	Active   bool   `json:"active"`
}

// SetUserActive allows an authenticated admin to block or unblock a user account
// by toggling the 'active' flag in auth_service.
func (h *AdminHandler) SetUserActive(c *gin.Context) {
	var req setUserActiveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}
	if strings.TrimSpace(req.Username) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username_required"})
		return
	}

	authBase := h.cfg.AuthServiceURL
	if authBase == "" {
		authBase = "http://auth_service:8080"
	}
	body, err := json.Marshal(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "encode_request_failed"})
		return
	}

	url := authBase + "/auth/internal/admin/users/set-active"
	httpReq, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "build_request_failed"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "auth_service_unreachable"})
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
