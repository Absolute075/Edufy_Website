package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port                 string
	PublicDir            string
	ManifestRelPath      string
	MaterialsDir         string
	ResourcesBase        string
	OverridesPath        string
	AutoScanSeconds      int
	AdminReindexToken    string
	DefaultRequiredPlan  string
	PlanDefaultReading   string
	PlanDefaultListening string
	PlanDefaultSpeaking  string
	PlanDefaultWriting   string
	PlanDefaultMock      string
	LinkSigningSecret    string
	LinkTTLSeconds       int
}

func Load() Config {
	port := getenv("PORT", "8080")
	pub := getenv("PUBLIC_DIR", "public")
	// materials/manifest.json inside PublicDir
	man := getenv("MANIFEST_PATH", "materials/manifest.json")
	materialsDir := getenv("MATERIALS_DIR", "")
	resourcesBase := getenv("RESOURCES_BASE", "")
	overrides := getenv("OVERRIDES_PATH", "")
	scanSec := getinti("AUTOSCAN_SECONDS", 5)
	adminToken := getenv("REINDEX_ADMIN_TOKEN", "")
	defPlan := getenv("DEFAULT_REQUIRED_PLAN", "free")
	linkSecret := getenv("LINK_SIGNING_SECRET", "")
	linkTTL := getinti("LINK_TTL_SECONDS", 120)
	return Config{
		Port:                 port,
		PublicDir:            pub,
		ManifestRelPath:      man,
		MaterialsDir:         materialsDir,
		ResourcesBase:        resourcesBase,
		OverridesPath:        overrides,
		AutoScanSeconds:      scanSec,
		AdminReindexToken:    adminToken,
		DefaultRequiredPlan:  defPlan,
		PlanDefaultReading:   getenv("PLAN_DEFAULT_READING", ""),
		PlanDefaultListening: getenv("PLAN_DEFAULT_LISTENING", ""),
		PlanDefaultSpeaking:  getenv("PLAN_DEFAULT_SPEAKING", ""),
		PlanDefaultWriting:   getenv("PLAN_DEFAULT_WRITING", ""),
		PlanDefaultMock:      getenv("PLAN_DEFAULT_MOCK", ""),
		LinkSigningSecret:    linkSecret,
		LinkTTLSeconds:       linkTTL,
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
