package materials

import (
	"net/http"
	"strings"
	"time"

	"edufy/file_service/internal/config"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc Service
	cfg config.Config
}

func NewHandlerWithConfig(cfg config.Config, s Service) *Handler { return &Handler{svc: s, cfg: cfg} }

func (h *Handler) Manifest(c *gin.Context) {
	m, err := h.svc.GetManifest()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "manifest error"})
		return
	}
	c.Header("Cache-Control", "private, no-store")
	c.JSON(http.StatusOK, m)
}

func (h *Handler) Sign(c *gin.Context) {
	// Requires AccessMiddleware (login), which sets user_plan + user_name.
	planAny, _ := c.Get("user_plan")
	userPlan, _ := planAny.(string)
	userPlan = strings.ToLower(strings.TrimSpace(userPlan))

	nameAny, _ := c.Get("user_name")
	userName, _ := nameAny.(string)
	userName = strings.TrimSpace(userName)

	rel := strings.TrimSpace(c.Query("rel"))
	rel = strings.TrimPrefix(rel, "/")
	if rel == "" || strings.Contains(rel, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid_rel"})
		return
	}

	item, found := h.svc.FindByID(rel)
	if !found || item == nil || !item.Active {
		c.JSON(http.StatusNotFound, gin.H{"message": "not_found"})
		return
	}

	required := strings.ToLower(strings.TrimSpace(item.RequiredPlan))
	if required == "" {
		required = "free"
	}
	if !planAllowsLocal(userPlan, required) {
		c.JSON(http.StatusForbidden, gin.H{"message": "forbidden", "upgradeRedirectUrl": h.cfg.UpgradeRedirectURL})
		return
	}

	ttl := h.cfg.LinkTTLSeconds
	if ttl <= 0 {
		ttl = 3600
	}
	exp := time.Now().UTC().Add(time.Duration(ttl) * time.Second).Unix()

	tok, ok := SignMaterialAccessToken(h.cfg.LinkSigningSecret, rel, userName, exp)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "sign_error"})
		return
	}

	base := strings.TrimRight(h.cfg.ResourcesBase, "/")
	url := base + "/materials/s/" + tok
	c.Header("Cache-Control", "private, no-store")
	c.JSON(http.StatusOK, gin.H{"url": url, "exp": exp})
}

func planAllowsLocal(userPlan, requiredPlan string) bool {
	return planRankLocal(userPlan) >= planRankLocal(requiredPlan)
}

func planRankLocal(plan string) int {
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
