package config

import (
	"os"

	internal "admin_service/internal/config"
)

// Load reads environment variables and constructs a Config instance
// with sensible defaults for local/docker environments.
func Load() *internal.Config {
	cfg := &internal.Config{
		Port:              getEnv("ADMIN_SERVICE_PORT", "8080"),
		AdminUsername:     os.Getenv("ADMIN_USERNAME"),
		AdminPassword:     os.Getenv("ADMIN_PASSWORD"),
		AdminJWTSecret:    getEnv("ADMIN_JWT_SECRET", "change-me-admin-secret"),
		AuthServiceURL:    getEnv("AUTH_SERVICE_URL", "http://auth_service:8080"),
		UserServiceURL:    getEnv("USER_SERVICE_URL", "http://user_service:8080"),
		GatewayServiceURL: getEnv("GATEWAY_URL", "http://gateway_service:8080"),
		FileServiceURL:    getEnv("FILE_SERVICE_URL", "http://file_service:8080"),
		SearchServiceURL:  getEnv("SEARCH_SERVICE_URL", "http://search_service:8080"),
	}

	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
