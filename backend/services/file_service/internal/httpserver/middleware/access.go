package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"edufy/file_service/internal/materials"
	"github.com/gin-gonic/gin"
)

type AccessMiddleware struct {
	svc materials.Service
	mu  sync.Mutex
	// counters[key(user, day)] = count
	counters map[string]int
}

func NewAccessMiddleware(s materials.Service) gin.HandlerFunc {
	m := &AccessMiddleware{svc: s, counters: map[string]int{}}
	return m.handle
}

func (m *AccessMiddleware) handle(c *gin.Context) {
	// Only apply quotas to /materials/** paths
	p := c.Request.URL.Path
	if !strings.HasPrefix(p, "/materials/") {
		c.Next()
		return
	}

	// We don't hard-block by plan; enforce daily quotas instead
	userPlan := planFromRequest(c)
	username := usernameFromRequest(c)
	if username == "" {
		// If username is unknown, treat as free and anonymous bucket
		username = "anonymous"
	}
	// Determine daily limit by plan
	limit := planDailyLimit(userPlan)
	if limit > 0 {
		// Use Asia/Tashkent (UTC+5) day boundary
		now := time.Now().UTC().Add(5 * time.Hour)
		dayKey := now.Format("2006-01-02")
		key := username + "|" + dayKey
		m.mu.Lock()
		count := m.counters[key]
		if count >= limit {
			m.mu.Unlock()
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "Daily limit reached for your plan"})
			return
		}
		m.counters[key] = count + 1
		m.mu.Unlock()
	}
	c.Next()
}

func planFromRequest(c *gin.Context) string {
	// 1) Prefer explicit header from gateway
	if v := c.GetHeader("X-User-Plan"); v != "" {
		return strings.ToLower(strings.TrimSpace(v))
	}
	// 2) Fallback: treat as free until JWT parsing is implemented here
	return "free"
}

func usernameFromRequest(c *gin.Context) string {
	if v := c.GetHeader("X-User-Name"); v != "" {
		return v
	}
	return ""
}

func planDailyLimit(plan string) int {
	switch strings.ToLower(plan) {
	case "admin", "pro":
		return 0 // unlimited
	case "plus":
		return 35
	default: // free and unknown
		return 20
	}
}
