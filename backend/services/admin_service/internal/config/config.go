package config

// Config holds runtime configuration for the admin_service.
// Values are typically loaded from environment variables via pkg/config.
type Config struct {
	// HTTP server port, e.g. "8080".
	Port string

	// Admin panel credentials.
	AdminUsername  string
	AdminPassword  string
	AdminJWTSecret string

	// URLs of other backend services inside the Docker network.
	AuthServiceURL    string
	UserServiceURL    string
	GatewayServiceURL string
	FileServiceURL    string
}
