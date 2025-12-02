package service

import "admin_service/internal/config"

// AdminService contains business logic for admin authentication and actions.
type AdminService struct {
	cfg *config.Config
}

func NewAdminService(cfg *config.Config) *AdminService {
	return &AdminService{cfg: cfg}
}

// Authenticate checks plain username/password against configured admin credentials.
func (s *AdminService) Authenticate(username, password string) bool {
	if s.cfg.AdminUsername == "" || s.cfg.AdminPassword == "" {
		return false
	}
	return username == s.cfg.AdminUsername && password == s.cfg.AdminPassword
}
