package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port                   string
	PublicDir              string
	ManifestRelPath        string
	MaterialsDir           string
	UserServiceURL         string
	ResourcesBase          string
	LoginRedirectURL       string
	UpgradeRedirectURL     string
	OverridesPath          string
	AutoScanSeconds        int
	AdminReindexToken      string
	DefaultRequiredPlan    string
	PlanDefaultReading     string
	PlanDefaultListening   string
	PlanDefaultSpeaking    string
	PlanDefaultWriting     string
	PlanDefaultMock        string
	LinkSigningSecret      string
	LinkTTLSeconds         int
	MaterialTokenSecret    string
	ListeningRequireSigned bool
}

func Load() Config {
	port := getenv("PORT", "8080")
	pub := getenv("PUBLIC_DIR", "public")
	// materials/manifest.json inside PublicDir
	man := getenv("MANIFEST_PATH", "materials/manifest.json")
	materialsDir := getenv("MATERIALS_DIR", "")
	userServiceURL := getenv("USER_SERVICE_URL", "http://userservice:8080")
	resourcesBase := getenv("RESOURCES_BASE", "")
	loginRedirect := getenv("LOGIN_REDIRECT_URL", "https://access.edufyuzbekistan.com/login")
	upgradeRedirect := getenv("UPGRADE_REDIRECT_URL", "https://edufyuzbekistan.com/pricing")
	overrides := getenv("OVERRIDES_PATH", "")
	scanSec := getinti("AUTOSCAN_SECONDS", 5)
	adminToken := getenv("REINDEX_ADMIN_TOKEN", "")
	defPlan := getenv("DEFAULT_REQUIRED_PLAN", "free")
	linkSecret := getenv("LINK_SIGNING_SECRET", "")
	linkTTL := getinti("LINK_TTL_SECONDS", 120)
	tokenSecret := getenv("MATERIAL_TOKEN_SECRET", "edufy_material_token_secret")
	requireSigned := getbool("LISTENING_REQUIRE_SIGNED", false)
	return Config{
		Port:                   port,
		PublicDir:              pub,
		ManifestRelPath:        man,
		MaterialsDir:           materialsDir,
		UserServiceURL:         userServiceURL,
		ResourcesBase:          resourcesBase,
		LoginRedirectURL:       loginRedirect,
		UpgradeRedirectURL:     upgradeRedirect,
		OverridesPath:          overrides,
		AutoScanSeconds:        scanSec,
		AdminReindexToken:      adminToken,
		DefaultRequiredPlan:    defPlan,
		PlanDefaultReading:     getenv("PLAN_DEFAULT_READING", ""),
		PlanDefaultListening:   getenv("PLAN_DEFAULT_LISTENING", ""),
		PlanDefaultSpeaking:    getenv("PLAN_DEFAULT_SPEAKING", ""),
		PlanDefaultWriting:     getenv("PLAN_DEFAULT_WRITING", ""),
		PlanDefaultMock:        getenv("PLAN_DEFAULT_MOCK", ""),
		LinkSigningSecret:      linkSecret,
		LinkTTLSeconds:         linkTTL,
		MaterialTokenSecret:    tokenSecret,
		ListeningRequireSigned: requireSigned,
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getinti(k string, def int) int {
	if v := os.Getenv(k); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func getbool(k string, def bool) bool {
	if v := os.Getenv(k); v != "" {
		vv := v
		if vv == "1" {
			return true
		}
		if vv == "0" {
			return false
		}
		b, err := strconv.ParseBool(vv)
		if err == nil {
			return b
		}
	}
	return def
}
