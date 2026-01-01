package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"edufy/file_service/internal/config"
	"edufy/file_service/internal/materials"

	"github.com/gin-gonic/gin"
)

type AccessMiddleware struct {
	svc materials.Service
	cfg config.Config
	hc  *http.Client
}

func NewAccessMiddleware(cfg config.Config, s materials.Service) gin.HandlerFunc {
	m := &AccessMiddleware{svc: s, cfg: cfg, hc: &http.Client{Timeout: 5 * time.Second}}
	return m.handle
}

func (m *AccessMiddleware) handle(c *gin.Context) {
	// Only apply quotas to /materials/** paths
	p := c.Request.URL.Path
	if !strings.HasPrefix(p, "/materials/") {
		c.Next()
		return
	}

	// Require login on any materials access
	accessToken := accessTokenFromRequest(c.Request)
	if accessToken == "" {
		c.Redirect(http.StatusFound, m.cfg.LoginRedirectURL)
		c.Abort()
		return
	}

	userPlan, ok := m.fetchUserPlan(accessToken)
	if !ok {
		c.Redirect(http.StatusFound, m.cfg.LoginRedirectURL)
		c.Abort()
		return
	}

	// If this is a tokenized material request, enforce plan against requiredPlan
	category := strings.TrimSpace(c.Param("category"))
	token := strings.TrimSpace(c.Param("token"))
	if token != "" {
		var rel string
		var item *materials.ManifestItem
		var found bool
		if category != "" {
			rel, item, found = m.svc.ResolveToken(category, token)
		} else {
			rel, item, found = m.svc.ResolveTokenAny(token)
		}
		if !found || item == nil || !item.Active {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		required := strings.ToLower(strings.TrimSpace(item.RequiredPlan))
		if required == "" {
			required = "free"
		}
		if !planAllows(userPlan, required) {
			c.Redirect(http.StatusFound, m.cfg.UpgradeRedirectURL)
			c.Abort()
			return
		}
		c.Set("material_rel", rel)
		c.Set("material_required_plan", required)
		c.Set("material_user_plan", userPlan)
	} else {
		// Direct listening file path under /materials/listening/:listeningId/:file
		listeningId := strings.TrimSpace(c.Param("listeningId"))
		file := strings.TrimSpace(c.Param("file"))
		if listeningId != "" && file != "" {
			id := "listening/" + listeningId + "/" + file
			item, found := m.svc.FindByID(id)
			if !found || item == nil || !item.Active {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}
			required := strings.ToLower(strings.TrimSpace(item.RequiredPlan))
			if required == "" {
				required = "free"
			}
			if !planAllows(userPlan, required) {
				c.Redirect(http.StatusFound, m.cfg.UpgradeRedirectURL)
				c.Abort()
				return
			}
			c.Set("material_rel", id)
			c.Set("material_required_plan", required)
			c.Set("material_user_plan", userPlan)
		}
	}

	c.Next()
}

func accessTokenFromRequest(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		v := strings.TrimSpace(auth[len("Bearer "):])
		if v != "" {
			return v
		}
	}
	if c, err := r.Cookie("accessToken"); err == nil {
		if c.Value != "" {
			return c.Value
		}
	}
	return ""
}

func (m *AccessMiddleware) fetchUserPlan(accessToken string) (string, bool) {
	base := strings.TrimRight(m.cfg.UserServiceURL, "/")
	if base == "" {
		return "", false
	}
	req, err := http.NewRequest(http.MethodGet, base+"/user/profile", nil)
	if err != nil {
		return "", false
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := m.hc.Do(req)
	if err != nil {
		return "", false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", false
	}
	var payload struct {
		Plan string `json:"plan"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return "", false
	}
	plan := strings.ToLower(strings.TrimSpace(payload.Plan))
	if plan == "" {
		plan = "free"
	}
	return plan, true
}

func planAllows(userPlan, requiredPlan string) bool {
	return planRank(userPlan) >= planRank(requiredPlan)
}

func planRank(plan string) int {
	p := strings.ToLower(strings.TrimSpace(plan))
	switch p {
	case "admin":
		return 100
	case "", "free":
		return 0
	default:
		return 1
	}
}
