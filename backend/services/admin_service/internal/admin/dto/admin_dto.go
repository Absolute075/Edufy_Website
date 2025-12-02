package dto

// LoginRequest represents admin login payload.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse represents admin login response.
type LoginResponse struct {
	Token string `json:"token"`
}
