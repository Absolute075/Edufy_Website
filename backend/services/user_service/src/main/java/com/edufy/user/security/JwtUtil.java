package com.edufy.user.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.security.Key;
import java.util.Date;

public class JwtUtil {

    // Use the same secret as auth_service JwtService
    private static final String SECRET = "EdUFySuperSecretKeyForJWTGeneration1234567890"; // >=32 chars
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET.getBytes());

    public static String extractUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (JwtException e) {
            throw new RuntimeException("Invalid JWT token", e);
        }
    }

    public static boolean isExpired(String token) {
        try {
            Date exp = Jwts.parserBuilder()
                    .setSigningKey(KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
            return exp != null && exp.before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }
}
