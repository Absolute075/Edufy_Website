package materials

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"strings"
)

type signedMaterialPayload struct {
	Rel  string `json:"rel"`
	Exp  int64  `json:"exp"`
	User string `json:"user"`
}

func SignMaterialAccessToken(secret, rel, user string, expUnix int64) (string, bool) {
	secret = strings.TrimSpace(secret)
	if secret == "" {
		return "", false
	}
	rel = strings.TrimSpace(rel)
	if rel == "" || strings.Contains(rel, "..") {
		return "", false
	}

	p := signedMaterialPayload{Rel: rel, Exp: expUnix, User: strings.TrimSpace(user)}
	b, err := json.Marshal(p)
	if err != nil {
		return "", false
	}
	payloadB64 := base64.RawURLEncoding.EncodeToString(b)

	h := hmac.New(sha256.New, []byte(secret))
	_, _ = h.Write([]byte(payloadB64))
	sig := h.Sum(nil)
	sigB64 := base64.RawURLEncoding.EncodeToString(sig)

	return payloadB64 + "." + sigB64, true
}

func VerifyMaterialAccessToken(secret, token, expectedUser string, nowUnix int64) (string, bool) {
	secret = strings.TrimSpace(secret)
	if secret == "" {
		return "", false
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return "", false
	}

	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", false
	}
	payloadB64 := parts[0]
	sigB64 := parts[1]

	sig, err := base64.RawURLEncoding.DecodeString(sigB64)
	if err != nil {
		return "", false
	}

	h := hmac.New(sha256.New, []byte(secret))
	_, _ = h.Write([]byte(payloadB64))
	expectedSig := h.Sum(nil)
	if !hmac.Equal(sig, expectedSig) {
		return "", false
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return "", false
	}
	var p signedMaterialPayload
	if err := json.Unmarshal(payloadBytes, &p); err != nil {
		return "", false
	}

	if p.Rel == "" || strings.Contains(p.Rel, "..") {
		return "", false
	}
	if p.Exp > 0 && nowUnix > 0 && nowUnix > p.Exp {
		return "", false
	}

	if strings.TrimSpace(p.User) != "" {
		if strings.TrimSpace(expectedUser) == "" {
			return "", false
		}
		if strings.TrimSpace(p.User) != strings.TrimSpace(expectedUser) {
			return "", false
		}
	}

	return p.Rel, true
}
