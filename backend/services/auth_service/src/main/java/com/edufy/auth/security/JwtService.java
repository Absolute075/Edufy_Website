package com.edufy.auth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    // Секретный ключ для подписи JWT (в продакшене хранить безопасно!)
    private final String SECRET = "EdUFySuperSecretKeyForJWTGeneration1234567890"; // минимум 32 символа
    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    // Время жизни токенов
    private final long ACCESS_TOKEN_EXP = 1000 * 60 * 15; // 15 минут
    private final long REFRESH_TOKEN_EXP = 1000 * 60 * 60 * 24 * 7; // 7 дней

    // ================== GENERATE ACCESS TOKEN ==================
    public String generateAccessToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXP))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ================== GENERATE REFRESH TOKEN ==================
    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXP))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ================== EXTRACT USERNAME ==================
    public String extractUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (JwtException e) {
            throw new RuntimeException("❌ Invalid JWT token!");
        }
    }

    // ================== VALIDATE TOKEN ==================
    public boolean isTokenValid(String token, String username) {
        String extractedUsername = extractUsername(token);
        return extractedUsername.equals(username) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return expiration.before(new Date());
    }
}
