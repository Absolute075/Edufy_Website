package com.edufy.auth.controller;

import com.edufy.auth.dto.RegisterRequest;
import com.edufy.auth.dto.LoginRequest;
import com.edufy.auth.dto.RefreshRequest;
import com.edufy.auth.dto.TokenResponse;
import com.edufy.auth.dto.AuthResponse;
import com.edufy.auth.dto.UpdateProfileRequest;
import com.edufy.auth.entity.UserEntity;
import com.edufy.auth.repository.UserRepository;
import com.edufy.auth.security.JwtService;
import com.edufy.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    // Регистрация
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (response.getMessage().startsWith("❌")) {
            // Ошибка регистрации — вернём 400
            return ResponseEntity.badRequest().body(response);
        }
        // Успешная регистрация — 200 OK
        return ResponseEntity.ok(response);
    }

    // Логин + установка HttpOnly cookie для токенов на домен .edufyuzbekistan.com
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        TokenResponse tokenResponse = authService.login(request);
        if (tokenResponse.getAccessToken() == null) {
            return ResponseEntity.badRequest().body(tokenResponse);
        }

        // Куки для поддоменов: .edufyuzbekistan.com
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(15 * 60) // 15 минут
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 дней
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokenResponse);
    }

    // Обновление токена
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshRequest request) {
        TokenResponse tokenResponse = authService.refresh(request);
        if (tokenResponse.getAccessToken() == null) {
            return ResponseEntity.badRequest().body(tokenResponse);
        }
        return ResponseEntity.ok(tokenResponse);
    }

    // Выход: очистка HttpOnly куки
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        ResponseCookie clearAccess = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(0)
                .build();
        ResponseCookie clearRefresh = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(0)
                .build();

        Map<String, String> body = Map.of("message", "Logged out");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccess.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefresh.toString())
                .body(body);
    }

    // Текущий пользователь по куке accessToken
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String accessToken = null;
        if (request.getCookies() != null) {
            for (var c : request.getCookies()) {
                if ("accessToken".equals(c.getName())) {
                    accessToken = c.getValue();
                    break;
                }
            }
        }
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try {
            username = jwtService.extractUsername(accessToken);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }
        UserEntity user = userOpt.get();
        Map<String, Object> payload = new HashMap<>();
        payload.put("username", user.getUsername());
        payload.put("email", user.getEmail());
        payload.put("role", user.getRole());
        payload.put("birthDate", user.getBirthDate());
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(HttpServletRequest request) {
        String accessToken = null;
        if (request.getCookies() != null) {
            for (var c : request.getCookies()) {
                if ("accessToken".equals(c.getName())) { accessToken = c.getValue(); break; }
            }
        }
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = jwtService.extractUsername(accessToken); }
        catch (Exception e) { return ResponseEntity.status(401).body(Map.of("message", "Invalid token")); }
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        UserEntity u = userOpt.get();
        Map<String, Object> body = new HashMap<>();
        body.put("username", u.getUsername());
        body.put("email", u.getEmail());
        body.put("phone", u.getPhone());
        body.put("role", u.getRole());
        body.put("birthDate", u.getBirthDate());
        body.put("createdAt", u.getCreatedAt());
        return ResponseEntity.ok(body);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest payload, HttpServletRequest request) {
        String accessToken = null;
        if (request.getCookies() != null) {
            for (var c : request.getCookies()) {
                if ("accessToken".equals(c.getName())) { accessToken = c.getValue(); break; }
            }
        }
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = jwtService.extractUsername(accessToken); }
        catch (Exception e) { return ResponseEntity.status(401).body(Map.of("message", "Invalid token")); }
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        UserEntity u = userOpt.get();

        // Update fields if present
        boolean usernameChanged = false;
        if (payload.getUsername() != null && !payload.getUsername().isBlank()
                && !payload.getUsername().equals(u.getUsername())) {
            // Check uniqueness
            if (userRepository.existsByUsername(payload.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
            }
            u.setUsername(payload.getUsername());
            usernameChanged = true;
        }
        if (payload.getPhone() != null) u.setPhone(payload.getPhone());
        if (payload.getLocation() != null) u.setLastLoginCountry(payload.getLocation());
        if (payload.getBirthDate() != null && !payload.getBirthDate().isBlank()) {
            try {
                u.setBirthDate(java.time.LocalDate.parse(payload.getBirthDate()));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid birthDate format, expected YYYY-MM-DD"));
            }
        }
        userRepository.save(u);
        // If username changed, re-issue tokens so subject matches
        if (usernameChanged) {
            String newAccessToken = jwtService.generateAccessToken(u.getUsername());
            String newRefreshToken = jwtService.generateRefreshToken(u.getUsername());

            ResponseCookie accessCookie = ResponseCookie.from("accessToken", newAccessToken)
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .domain(".edufyuzbekistan.com")
                    .path("/")
                    .maxAge(15 * 60)
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", newRefreshToken)
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .domain(".edufyuzbekistan.com")
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60)
                    .build();

            Map<String, Object> body = new HashMap<>();
            body.put("message", "Profile updated");
            body.put("username", u.getUsername());
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(body);
        }
        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    // Проверка здоровья сервиса
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
