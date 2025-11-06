package util

import (
	"encoding/base64"
	"encoding/json"
	"strings"
)

// ExtractUserAndPlan parses Authorization: Bearer <jwt> and extracts username and plan from claims
// It does not verify signature (best-effort), only decodes claims.
// Username is taken from claims["username"] or claims["sub"]. Plan from claims["plan"].
func ExtractUserAndPlan(authHeader string) (username, plan string) {
	if authHeader == "" {
		return "", ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", ""
	}
	jwt := parts[1]
	segs := strings.Split(jwt, ".")
	if len(segs) < 2 {
		return "", ""
	}
	payload := segs[1]
	// JWT base64 is URL-safe and may be without padding
	b, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		// try with standard encoding as fallback
		b, err = base64.StdEncoding.DecodeString(payload)
		if err != nil {
			return "", ""
		}
	}
	var m map[string]any
	if err := json.Unmarshal(b, &m); err != nil {
		return "", ""
	}
	// username
	if v, ok := m["username"].(string); ok && v != "" {
		username = v
	}
	if username == "" {
		if v, ok := m["sub"].(string); ok {
			username = v
		}
	}
	// plan
	if v, ok := m["plan"].(string); ok {
		plan = v
	}
	return username, plan
}
