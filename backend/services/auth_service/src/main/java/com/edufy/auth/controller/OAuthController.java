package com.edufy.auth.controller;

import com.edufy.auth.entity.UserEntity;
import com.edufy.auth.repository.UserRepository;
import com.edufy.auth.security.JwtService;
import com.edufy.auth.service.OAuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/auth/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthService oAuthService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final com.edufy.auth.service.AuthService authService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${USER_SERVICE_URL:http://user_service:8080}")
    private String userServiceBase;

    private static final String DASH_URL = "https://dash.edufyuzbekistan.com/";
    private static final String COOKIE_DOMAIN = ".edufyuzbekistan.com";

    @GetMapping("/google")
    public ResponseEntity<Void> google(@RequestParam(value = "remember", required = false) Integer remember,
                                       @RequestParam(value = "redirect", required = false) String redirect,
                                       HttpServletResponse response) {
        String state = UUID.randomUUID().toString();
        String nonce = Long.toHexString(Instant.now().toEpochMilli());

        // Узкий срок действия state/nonce через cookies (5 минут)
        ResponseCookie stateCookie = ResponseCookie.from("oauth_state", state)
                .httpOnly(true).secure(true).sameSite("None").domain(COOKIE_DOMAIN).path("/").maxAge(5 * 60).build();
        ResponseCookie nonceCookie = ResponseCookie.from("oauth_nonce", nonce)
                .httpOnly(true).secure(true).sameSite("None").domain(COOKIE_DOMAIN).path("/").maxAge(5 * 60).build();
        if (remember != null) {
            ResponseCookie rememberCookie = ResponseCookie.from("oauth_remember", String.valueOf(remember))
                    .httpOnly(true).secure(true).sameSite("None").domain(COOKIE_DOMAIN).path("/").maxAge(10 * 60).build();
            response.addHeader(HttpHeaders.SET_COOKIE, rememberCookie.toString());
        }
        if (StringUtils.hasText(redirect)) {
            ResponseCookie redirectCookie = ResponseCookie.from("oauth_target", redirect)
                    .httpOnly(true).secure(true).sameSite("None").domain(COOKIE_DOMAIN).path("/").maxAge(10 * 60).build();
            response.addHeader(HttpHeaders.SET_COOKIE, redirectCookie.toString());
        }
        response.addHeader(HttpHeaders.SET_COOKIE, stateCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, nonceCookie.toString());

        String url = oAuthService.getAuthorizeUrl(state, nonce);
        return ResponseEntity.status(302).location(URI.create(url)).build();
    }

    @GetMapping("/google/callback")
    public ResponseEntity<Void> googleCallback(@RequestParam("code") String code,
                                               @RequestParam(value = "state", required = false) String state,
                                               HttpServletRequest request,
                                               HttpServletResponse response) {
        // Проверка state по куке
        String stateCookie = readCookie(request, "oauth_state");
        if (stateCookie != null && state != null && !stateCookie.equals(state)) {
            return ResponseEntity.status(302).location(URI.create(DASH_URL + "?oauth=state_mismatch")).build();
        }

        Map<String, Object> tokenMap = oAuthService.exchangeCodeForTokens(code);
        if (tokenMap == null || !tokenMap.containsKey("access_token")) {
            return ResponseEntity.status(302).location(URI.create(DASH_URL + "?oauth=token_error")).build();
        }
        String googleAccessToken = String.valueOf(tokenMap.get("access_token"));

        Map<String, Object> info = oAuthService.getUserInfo(googleAccessToken);
        String email = info != null ? (String) info.get("email") : null;
        String name = info != null ? (String) info.get("name") : null;
        if (!StringUtils.hasText(email)) {
            return ResponseEntity.status(302).location(URI.create(DASH_URL + "?oauth=no_email")).build();
        }

        // Найти/создать пользователя
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);
        UserEntity user = userOpt.orElseGet(() -> {
            UserEntity u = new UserEntity();
            // username: если длинный, укоротить
            String base = (StringUtils.hasText(name) ? name : email.split("@")[0]).replaceAll("[^a-zA-Z0-9._-]", "");
            if (!StringUtils.hasText(base)) base = "user" + UUID.randomUUID().toString().substring(0, 6);
            String username = base;
            int i = 1;
            while (userRepository.existsByUsername(username)) {
                username = base + i++;
            }
            u.setUsername(username);
            u.setEmail(email);
            u.setRole(UserEntity.Role.STUDENT);
            // Пароль-заглушка (соц. вход): хранить случайное значение
            u.setPassword(UUID.randomUUID().toString());
            u.setActive(true);
            return userRepository.save(u);
        });

        authService.ensurePublicId(user);

        // Сгенерировать JWT
        String accessToken = jwtService.generateAccessToken(user.getUsername());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        // Настроить куки (совместимые с сабдоменами)
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", accessToken)
                .httpOnly(true).secure(true).sameSite("None").domain(COOKIE_DOMAIN).path("/").maxAge(24 * 60 * 60).build(); // 24 часа
        int refreshMaxAge = ("1".equals(readCookie(request, "oauth_remember")) ? (30 * 24 * 60 * 60) : (7 * 24 * 60 * 60));
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true).secure(true).sameSite("None").domain(COOKIE_DOMAIN).path("/").maxAge(refreshMaxAge).build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // Очистить вспомогательные куки
        clearCookie(response, "oauth_state");
        clearCookie(response, "oauth_nonce");
        clearCookie(response, "oauth_remember");

        // Best-effort: авто-создать профиль в user_service c привязкой userId
        try {
            String base = userServiceBase;
            if (base == null || base.isBlank()) {
                base = "http://userservice:8080";
            }
            String url = base + "/user/internal/create-profile";

            String safeUsername = user.getUsername() != null ? user.getUsername().replace("\"", "'") : "";
            Long userId = user.getId();
            String payload;
            if (userId != null) {
                payload = "{\"username\":\"" + safeUsername + "\",\"userId\":" + userId + "}";
            } else {
                payload = "{\"username\":\"" + safeUsername + "\"}";
            }

            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> req = new HttpEntity<>(payload, h);
            restTemplate.exchange(url, HttpMethod.POST, req, String.class);
        } catch (Exception ignored) {}

        String target = readCookie(request, "oauth_target");
        if (!StringUtils.hasText(target)) target = DASH_URL;
        clearCookie(response, "oauth_target");

        return ResponseEntity.status(302).location(URI.create(target)).build();
    }

    private static String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    private static void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true).secure(true).sameSite("None").domain(COOKIE_DOMAIN).path("/").maxAge(0).build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
