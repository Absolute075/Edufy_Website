package middleware

import (
	"encoding/json"
	"io"
	"log"
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

	isApiStyle := strings.HasPrefix(p, "/materials/sign") || strings.HasPrefix(p, "/materials/s/") || strings.HasPrefix(p, "/materials/manifest")

	// Require login on any materials access
	accessToken := accessTokenFromRequest(c.Request)
	if accessToken == "" {
		if isApiStyle {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		c.Redirect(http.StatusFound, m.cfg.LoginRedirectURL)
		c.Abort()
		return
	}

	userPlan, userName, ok := m.fetchUserPlan(accessToken)
	if !ok {
		if isApiStyle {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		c.Redirect(http.StatusFound, m.cfg.LoginRedirectURL)
		c.Abort()
		return
	}

	c.Set("user_plan", userPlan)
	c.Set("user_name", userName)

	// If this is a tokenized material request, enforce plan against requiredPlan
	category := strings.TrimSpace(c.Param("category"))
	token := strings.TrimSpace(c.Param("token"))
	if token != "" {
		if m.cfg.ListeningRequireSigned && strings.ToLower(strings.TrimSpace(category)) == "listening" {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
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
		if m.cfg.ListeningRequireSigned {
			relLower := strings.ToLower(strings.TrimSpace(rel))
			catLower := strings.ToLower(strings.TrimSpace(item.Category))
			if strings.HasPrefix(relLower, "listening/") || catLower == "listening" {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}
		}
		required := strings.ToLower(strings.TrimSpace(item.RequiredPlan))
		if required == "" {
			required = "free"
		}
		if !planAllows(userPlan, required) {
			if isApiStyle {
				c.AbortWithStatus(http.StatusForbidden)
				return
			}
			c.Redirect(http.StatusFound, m.cfg.UpgradeRedirectURL)
			c.Abort()
			return
		}
		c.Set("material_rel", rel)
		c.Set("material_required_plan", required)
		c.Set("material_user_plan", userPlan)
	} else {
		// Signed material access: /materials/s/:signed
		signed := strings.TrimSpace(c.Param("signed"))
		if signed != "" {
			rel, ok := materials.VerifyMaterialAccessToken(m.cfg.LinkSigningSecret, signed, userName, time.Now().UTC().Unix())
			if !ok {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}
			item, found := m.svc.FindByID(rel)
			if !found || item == nil || !item.Active {
				c.AbortWithStatus(http.StatusNotFound)
				return
			}
			required := strings.ToLower(strings.TrimSpace(item.RequiredPlan))
			if required == "" {
				required = "free"
			}
			if !planAllows(userPlan, required) {
				if isApiStyle {
					c.AbortWithStatus(http.StatusForbidden)
					return
				}
				c.Redirect(http.StatusFound, m.cfg.UpgradeRedirectURL)
				c.Abort()
				return
			}
			c.Set("material_rel", rel)
			c.Set("material_required_plan", required)
			c.Set("material_user_plan", userPlan)
			c.Next()
			return
		}

		// Direct listening route disabled when LISTENING_REQUIRE_SIGNED is enabled.
		if m.cfg.ListeningRequireSigned && strings.HasPrefix(strings.ToLower(p), "/materials/listening/") {
			c.AbortWithStatus(http.StatusNotFound)
			return
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

func (m *AccessMiddleware) fetchUserPlan(accessToken string) (string, string, bool) {
	base := strings.TrimRight(m.cfg.UserServiceURL, "/")
	if base == "" {
		log.Printf("file_service: fetchUserPlan: USER_SERVICE_URL is empty")
		return "", "", false
	}
	req, err := http.NewRequest(http.MethodGet, base+"/user/profile", nil)
	if err != nil {
		log.Printf("file_service: fetchUserPlan: build request failed: %v", err)
		return "", "", false
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := m.hc.Do(req)
	if err != nil {
		log.Printf("file_service: fetchUserPlan: request failed url=%s err=%v", base+"/user/profile", err)
		return "", "", false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		msg := strings.TrimSpace(string(b))
		if msg != "" {
			log.Printf("file_service: fetchUserPlan: non-200 from user service url=%s status=%d body=%q", base+"/user/profile", resp.StatusCode, msg)
		} else {
			log.Printf("file_service: fetchUserPlan: non-200 from user service url=%s status=%d", base+"/user/profile", resp.StatusCode)
		}
		return "", "", false
	}
	var payload struct {
		Plan     string `json:"plan"`
		Username string `json:"username"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		log.Printf("file_service: fetchUserPlan: decode json failed url=%s err=%v", base+"/user/profile", err)
		return "", "", false
	}
	plan := strings.ToLower(strings.TrimSpace(payload.Plan))
	if plan == "" {
		plan = "free"
	}
	username := strings.TrimSpace(payload.Username)
	return plan, username, true
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
