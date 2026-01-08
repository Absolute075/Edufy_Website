package com.edufy.auth.controller;

import com.edufy.auth.dto.RegisterRequest;
import com.edufy.auth.dto.LoginRequest;
import com.edufy.auth.dto.RefreshRequest;
import com.edufy.auth.dto.TokenResponse;
import com.edufy.auth.dto.AuthResponse;
import com.edufy.auth.dto.ForgotPasswordRequest;
import com.edufy.auth.dto.ResetPasswordRequest;
import com.edufy.auth.dto.VerifyEmailRequest;
import com.edufy.auth.dto.ResendVerificationRequest;
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

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtService jwtService;
    private final AuthService authService;
    private final UserRepository userRepository;

    // Регистрация
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response;
        try {
            response = authService.register(request);
        } catch (Exception e) {
            try {
                System.out.println("[auth_service] /auth/register error: " + e.getClass().getName());
                e.printStackTrace();
            } catch (Exception ignore) {}
            return ResponseEntity.status(500).body(new AuthResponse("❌ Registration failed"));
        }
        if (response.getMessage().startsWith("❌")) {
            // Ошибка регистрации — вернём 400
            return ResponseEntity.badRequest().body(response);
        }
        // Успешная регистрация — 200 OK
        try {
            Optional<UserEntity> userOpt = userRepository.findByUsername(request.getUsername());
            Long userId = userOpt.map(UserEntity::getId).orElse(null);
            postCreateProfile(request.getUsername(), userId);
        } catch (Exception ignored) {}
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@RequestBody VerifyEmailRequest request) {
        AuthResponse response = authService.verifyEmail(request);
        if (response.getMessage().startsWith("❌")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<AuthResponse> resendVerification(@RequestBody ResendVerificationRequest request) {
        AuthResponse response = authService.resendVerification(request);
        if (response.getMessage().startsWith("❌")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email-login")
    public ResponseEntity<?> verifyEmailLogin(@RequestBody VerifyEmailRequest request, HttpServletRequest httpRequest) {
        TokenResponse tokenResponse;
        try {
            tokenResponse = authService.verifyEmailAndLogin(request);
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            if (msg == null || msg.isBlank()) msg = "Verification failed";
            return ResponseEntity.status(400).body(Map.of("message", msg));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Verification failed"));
        }

        if (tokenResponse == null || tokenResponse.getAccessToken() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Verification failed"));
        }

        ResponseCookie accessCookie = ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(30L * 24 * 60 * 60)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(30L * 24 * 60 * 60)
                .build();

        try {
            String username = jwtService.extractUsername(tokenResponse.getAccessToken());
            String clientIp = extractClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            postLoginAudit(username, clientIp, userAgent);
        } catch (Exception ignored) {}

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokenResponse);
    }

    // Логин + установка HttpOnly cookie для токенов на домен .edufyuzbekistan.com
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        TokenResponse tokenResponse;
        try {
            tokenResponse = authService.login(request);
        } catch (RuntimeException e) {
            String msg = e.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = "Login failed";
            }
            return ResponseEntity.status(401).body(Map.of("message", msg));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Login failed"));
        }

        if (tokenResponse == null || tokenResponse.getAccessToken() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Login failed"));
        }

        // Куки для поддоменов: .edufyuzbekistan.com
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(30L * 24 * 60 * 60) // 30 дней
                .build();

        long refreshMaxAge = 30L * 24 * 60 * 60;
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(refreshMaxAge)
                .build();

        // Fire-and-forget: записать аудит логина в user_service
        try {
            String username = jwtService.extractUsername(tokenResponse.getAccessToken());
            String clientIp = extractClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            postLoginAudit(username, clientIp, userAgent);
        } catch (Exception ignored) {}

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokenResponse);
    }

    private String extractClientIp(HttpServletRequest req) {
        String ip = req.getHeader("CF-Connecting-IP");
        if (ip == null || ip.isBlank()) ip = firstXff(req.getHeader("X-Forwarded-For"));
        if (ip == null || ip.isBlank()) ip = req.getHeader("X-Real-IP");
        if (ip == null || ip.isBlank()) ip = req.getRemoteAddr();
        return ip;
    }

    private String firstXff(String xff) {
        if (xff == null || xff.isBlank()) return null;
        int comma = xff.indexOf(',');
        return comma == -1 ? xff.trim() : xff.substring(0, comma).trim();
    }

    private void postLoginAudit(String username, String ip, String userAgent) {
        String ua = userAgent != null ? userAgent.replace("\"", "'") : null;
        String payload = "{\"username\":\"" + safe(username) + "\",\"ip\":\"" + safe(ip) + "\",\"userAgent\":\"" + safe(ua) + "\"}";
        String envBase = System.getenv("USER_SERVICE_URL");
        String gatewayBase = System.getenv("GATEWAY_URL");
        String[] bases = new String[]{
                // Prefer gateway inside cluster, then direct user_service
                gatewayBase,
                envBase,
                // common host aliases when running in docker on dev/servers
                "http://gateway_service:8080",
                "http://user_service:8080",
                "http://host.docker.internal:8083",
                "http://localhost:8083",
                "http://127.0.0.1:8083"
        };
        for (String base : bases) {
            if (base == null || base.isBlank()) continue;
            try {
                java.net.URL url = new java.net.URL(base + "/user/internal/login-audit");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                int code = conn.getResponseCode();
                conn.disconnect();
                try { System.out.println("[auth_service] audit post -> " + base + " code=" + code); } catch (Exception ignore) {}
                if (code >= 200 && code < 300) return; // success
            } catch (Exception e) {
                try { System.out.println("[auth_service] audit post failed -> " + base + " err=" + e.getClass().getSimpleName()); } catch (Exception ignore) {}
            }
        }
        try { System.out.println("[auth_service] login audit post failed for all bases"); } catch (Exception ignore) {}
    }

    private void postCreateProfile(String username, Long userId) {
        String payload;
        if (userId != null) {
            payload = "{\"username\":\"" + safe(username) + "\",\"userId\":" + userId + "}";
        } else {
            payload = "{\"username\":\"" + safe(username) + "\"}";
        }
        String envBase = System.getenv("USER_SERVICE_URL");
        String gatewayBase = System.getenv("GATEWAY_URL");
        String[] bases = new String[]{
                gatewayBase,
                envBase,
                "http://gateway_service:8080",
                "http://user_service:8080",
                "http://host.docker.internal:8083",
                "http://localhost:8083",
                "http://127.0.0.1:8083"
        };
        for (String base : bases) {
            if (base == null || base.isBlank()) continue;
            try {
                java.net.URL url = new java.net.URL(base + "/user/internal/create-profile");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                int code = conn.getResponseCode();
                conn.disconnect();
                try { System.out.println("[auth_service] create-profile post -> " + base + " code=" + code); } catch (Exception ignore) {}
                if (code >= 200 && code < 300) return;
            } catch (Exception e) {
                try { System.out.println("[auth_service] create-profile post failed -> " + base + " err=" + e.getClass().getSimpleName()); } catch (Exception ignore) {}
            }
        }
        try { System.out.println("[auth_service] create-profile post failed for all bases"); } catch (Exception ignore) {}
    }

    private String safe(String s) { return s == null ? "" : s; }

    public static class InternalSetActiveRequest {
        public String username;
        public Boolean active;
    }

    @GetMapping("/internal/admin/users/search")
    public ResponseEntity<?> internalAdminSearchUsers(@RequestParam(name = "q", required = false) String q) {
        String query = q != null ? q.trim() : "";
        if (query.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<UserEntity> users = userRepository
                .findTop20ByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query);
        return ResponseEntity.ok(
                users.stream().map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("publicId", u.getPublicId());
                    m.put("username", u.getUsername());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole());
                    m.put("active", u.getActive());
                    m.put("createdAt", u.getCreatedAt());
                    return m;
                }).toList()
        );
    }

    @GetMapping("/internal/admin/users/by-email")
    public ResponseEntity<?> internalAdminUserByEmail(@RequestParam(name = "email") String email) {
        String e = email != null ? email.trim() : "";
        if (e.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "email required"));
        }
        Optional<UserEntity> userOpt = userRepository.findByEmail(e);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        UserEntity u = userOpt.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("publicId", u.getPublicId());
        m.put("username", u.getUsername());
        m.put("email", u.getEmail());
        m.put("role", u.getRole());
        m.put("active", u.getActive());
        m.put("createdAt", u.getCreatedAt());
        return ResponseEntity.ok(m);
    }

    @PostMapping("/internal/admin/users/by-usernames")
    public ResponseEntity<?> internalAdminUsersByUsernames(@RequestBody Map<String, Object> payload) {
        Object raw = payload != null ? payload.get("usernames") : null;
        if (!(raw instanceof List<?>)) {
            return ResponseEntity.badRequest().body(Map.of("message", "usernames required"));
        }

        List<?> list = (List<?>) raw;
        if (list.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "usernames required"));
        }

        List<String> usernames = new java.util.ArrayList<>();
        for (Object v : list) {
            if (v == null) continue;
            String s = v.toString().trim();
            if (s.isBlank()) continue;
            if (!usernames.contains(s)) {
                usernames.add(s);
            }
            if (usernames.size() >= 500) {
                break;
            }
        }

        if (usernames.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "usernames required"));
        }

        List<UserEntity> users = userRepository.findByUsernameIn(usernames);

        return ResponseEntity.ok(
                users.stream().map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("publicId", u.getPublicId());
                    m.put("username", u.getUsername());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole());
                    m.put("active", u.getActive());
                    m.put("createdAt", u.getCreatedAt());
                    return m;
                }).toList()
        );
    }

    @PostMapping("/internal/admin/users/set-active")
    public ResponseEntity<?> internalAdminSetUserActive(@RequestBody InternalSetActiveRequest payload) {
        if (payload == null || payload.username == null || payload.username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username required"));
        }
        if (payload.active == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "active required"));
        }
        String username = payload.username.trim();
        Optional<UserEntity> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        UserEntity user = userOpt.get();
        user.setActive(payload.active);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "active", user.getActive()
        ));
    }

    @GetMapping("/internal/admin/users/all")
    public ResponseEntity<?> internalAdminListAllUsers() {
        List<UserEntity> users = userRepository.findAll();
        return ResponseEntity.ok(
                users.stream().map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole());
                    m.put("active", u.getActive());
                    m.put("createdAt", u.getCreatedAt());
                    return m;
                }).toList()
        );
    }

    // Обновление токена
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody(required = false) RefreshRequest request, HttpServletRequest httpRequest) {
        String refreshToken = request != null ? request.getRefreshToken() : null;
        if (refreshToken == null || refreshToken.isBlank()) {
            if (httpRequest.getCookies() != null) {
                for (Cookie c : httpRequest.getCookies()) {
                    if ("refreshToken".equals(c.getName())) {
                        refreshToken = c.getValue();
                        break;
                    }
                }
            }
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        RefreshRequest effective = new RefreshRequest();
        effective.setRefreshToken(refreshToken);

        TokenResponse tokenResponse;
        try {
            tokenResponse = authService.refresh(effective);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid refresh token"));
        }
        if (tokenResponse.getAccessToken() == null) {
            return ResponseEntity.badRequest().body(tokenResponse);
        }
        // Re-issue HttpOnly cookies on refresh as well
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", tokenResponse.getAccessToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(30L * 24 * 60 * 60) // 30 дней
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .domain(".edufyuzbekistan.com")
                .path("/")
                .maxAge(30L * 24 * 60 * 60) // 30 days
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(tokenResponse);
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
        authService.ensurePublicId(user);
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", user.getId());
        payload.put("publicId", user.getPublicId());
        payload.put("username", user.getUsername());
        payload.put("email", user.getEmail());
        payload.put("role", user.getRole());
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
        String newUsernameCandidate = null;
        if (payload.getUsername() != null && !payload.getUsername().isBlank()
                && !payload.getUsername().equals(u.getUsername())) {
            // Check uniqueness
            if (userRepository.existsByUsername(payload.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
            }
            usernameChanged = true;
            newUsernameCandidate = payload.getUsername();
        }
        if (payload.getPhone() != null) u.setPhone(payload.getPhone());
        // location/birthDate fields are not managed in auth_service anymore

        // If username changes, first rename in user_service to avoid duplicates, then persist in auth DB
        if (usernameChanged) {
            boolean renamedOk = false;
            try { renamedOk = postRenameUsername(username, newUsernameCandidate); } catch (Exception ignore) {}
            if (!renamedOk) {
                return ResponseEntity.internalServerError().body(Map.of("message", "Rename failed in user_service"));
            }
            u.setUsername(newUsernameCandidate);
        }

        userRepository.save(u);

        // Sync phone to user_service (best-effort)
        if (payload.getPhone() != null) {
            try { postUpdatePhone(u.getUsername(), payload.getPhone()); } catch (Exception ignore) {}
        }

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
                    .maxAge(30L * 24 * 60 * 60)
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", newRefreshToken)
                    .httpOnly(true)
                    .secure(true)
                    .sameSite("None")
                    .domain(".edufyuzbekistan.com")
                    .path("/")
                    .maxAge(30L * 24 * 60 * 60)
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

    private boolean postRenameUsername(String oldUsername, String newUsername) {
        String payload = "{\"oldUsername\":\"" + safe(oldUsername) + "\",\"newUsername\":\"" + safe(newUsername) + "\"}";
        String envBase = System.getenv("USER_SERVICE_URL");
        String gatewayBase = System.getenv("GATEWAY_URL");
        String[] bases = new String[]{
                gatewayBase,
                envBase,
                "http://gateway_service:8080",
                "http://user_service:8080",
                "http://host.docker.internal:8083",
                "http://localhost:8083",
                "http://127.0.0.1:8083"
        };
        for (String base : bases) {
            if (base == null || base.isBlank()) continue;
            try {
                java.net.URL url = new java.net.URL(base + "/user/internal/rename-username");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                int code = conn.getResponseCode();
                conn.disconnect();
                try { System.out.println("[auth_service] rename post -> " + base + " code=" + code); } catch (Exception ignore) {}
                if (code >= 200 && code < 300) return true;
            } catch (Exception e) {
                try { System.out.println("[auth_service] rename post failed -> " + base + " err=" + e.getClass().getSimpleName()); } catch (Exception ignore) {}
            }
        }
        try { System.out.println("[auth_service] rename post failed for all bases"); } catch (Exception ignore) {}
        return false;
    }

    private void postUpdatePhone(String username, String phone) {
        String payload = "{\"username\":\"" + safe(username) + "\",\"phone\":\"" + safe(phone) + "\"}";
        String envBase = System.getenv("USER_SERVICE_URL");
        String gatewayBase = System.getenv("GATEWAY_URL");
        String[] bases = new String[]{
                gatewayBase,
                envBase,
                "http://gateway_service:8080",
                "http://user_service:8080",
                "http://host.docker.internal:8083",
                "http://localhost:8083",
                "http://127.0.0.1:8083"
        };
        for (String base : bases) {
            if (base == null || base.isBlank()) continue;
            try {
                java.net.URL url = new java.net.URL(base + "/user/internal/update-phone");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                try (java.io.OutputStream os = conn.getOutputStream()) {
                    os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                }
                int code = conn.getResponseCode();
                conn.disconnect();
                try { System.out.println("[auth_service] update-phone post -> " + base + " code=" + code); } catch (Exception ignore) {}
                if (code >= 200 && code < 300) return;
            } catch (Exception e) {
                try { System.out.println("[auth_service] update-phone post failed -> " + base + " err=" + e.getClass().getSimpleName()); } catch (Exception ignore) {}
            }
        }
        try { System.out.println("[auth_service] update-phone post failed for all bases"); } catch (Exception ignore) {}
    }

    // Проверка здоровья сервиса
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    // Сброс пароля: отправка кода на email
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        AuthResponse response = authService.forgotPassword(request);
        if (response.getMessage().startsWith("❌")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    // Сброс пароля: установка нового пароля по коду
    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        AuthResponse response = authService.resetPassword(request);
        if (response.getMessage().startsWith("❌")) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
