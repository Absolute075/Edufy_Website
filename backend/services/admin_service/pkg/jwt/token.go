package jwt

import (
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"
)

// AdminClaims describes JWT payload for admin panel authentication.
type AdminClaims struct {
	Username string `json:"username"`
	jwtlib.RegisteredClaims
}

// GenerateAdminToken creates a signed JWT for the given admin username.
func GenerateAdminToken(username, secret string, ttl time.Duration) (string, error) {
	claims := AdminClaims{
		Username: username,
		RegisteredClaims: jwtlib.RegisteredClaims{
			Subject:   username,
			IssuedAt:  jwtlib.NewNumericDate(time.Now().UTC()),
			ExpiresAt: jwtlib.NewNumericDate(time.Now().UTC().Add(ttl)),
			Audience:  []string{"admin_panel"},
		},
	}

	token := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseAdminToken validates the token and returns its claims.
func ParseAdminToken(tokenString, secret string) (*AdminClaims, error) {
	token, err := jwtlib.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwtlib.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid {
		return nil, jwtlib.ErrTokenInvalidClaims
	}

	return claims, nil
}
