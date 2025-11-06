package config

import (
	"os"
)

type Config struct {
	Port            string
	PublicDir       string
	ManifestRelPath string
}

func Load() Config {
	port := getenv("PORT", "8080")
	pub := getenv("PUBLIC_DIR", "public")
	// materials/manifest.json inside PublicDir
	man := getenv("MANIFEST_PATH", "materials/manifest.json")
	return Config{Port: port, PublicDir: pub, ManifestRelPath: man}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
