package com.edufy.user.controller.profile;

import com.edufy.user.domain.model.UserProfile;
import com.edufy.user.domain.model.Subscription;
import com.edufy.user.domain.repository.SubscriptionRepository;
import com.edufy.user.security.JwtUtil;
import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final SubscriptionRepository subscriptionRepository;

    private String getAccessToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7).trim();
            if (!token.isEmpty()) return token;
        }
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("accessToken".equals(c.getName())) return c.getValue();
            }
        }
        return null;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("message", "Unauthorized");
            return ResponseEntity.status(401).body(body);
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("message", "Invalid token");
            return ResponseEntity.status(401).body(body);
        }

        // Load subscription once to determine canonical plan
        Subscription sub = subscriptionRepository.findByUsername(username).orElse(null);

        String planForResponse = "free";
        if (sub != null && sub.getPlan() != null && !sub.getPlan().isBlank()) {
            // Treat expired subscription as free
            LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Tashkent"));
            if (sub.getActiveUntil() == null || sub.getActiveUntil().isAfter(now)) {
                planForResponse = sub.getPlan();
            }
        }

        // Do NOT auto-create on GET to avoid duplicates during rename race
        UserProfile p = profileService.find(username);
        Map<String, Object> body = new LinkedHashMap<>();
        if (p != null) {
            body.put("userId", p.getUserId());
            body.put("username", p.getUsername());
            body.put("phone", p.getPhone());
            body.put("birthDate", p.getBirthDate());
            body.put("avatarUrl", p.getAvatarUrl());
            body.put("certificate", p.getCertificate());
            body.put("favorite_subject", p.getFavoriteSubject());
            body.put("daily_hours", p.getDailyHours());
        } else {
            body.put("username", username);
        }

        body.put("plan", planForResponse);

        // Attach subscription summary if present
        if (sub != null) {
            body.put("subscriptionPlan", sub.getPlan());
            body.put("subscriptionPeriod", sub.getPeriod());
            body.put("subscriptionActiveSince", sub.getCreatedAt());
            body.put("subscriptionActiveUntil", sub.getActiveUntil());
        }
        return ResponseEntity.ok(body);
    }

    @PutMapping("/profile/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) { return ResponseEntity.status(401).body(Map.of("message", "Invalid token")); }

        String certificate = null;
        Object certObj = payload.get("certificates");
        if (certObj instanceof java.util.Collection<?>) {
            java.util.List<String> list = new java.util.ArrayList<>();
            for (Object o : (java.util.Collection<?>) certObj) {
                if (o != null) list.add(o.toString());
            }
            if (!list.isEmpty()) {
                certificate = String.join(", ", list);
            }
        }
        if (certificate == null) {
            Object single = payload.get("certificate");
            if (single != null) certificate = single.toString();
        }
        String favoriteSubject = payload.get("favorite_subject") != null ? payload.get("favorite_subject").toString() : null;
        String dailyHours = payload.get("daily_hours") != null ? payload.get("daily_hours").toString() : null;

        UserProfile p = profileService.updatePreferences(username, certificate, favoriteSubject, dailyHours);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Preferences updated");
        body.put("username", p.getUsername());
        body.put("certificate", p.getCertificate());
        body.put("favorite_subject", p.getFavoriteSubject());
        body.put("daily_hours", p.getDailyHours());
        return ResponseEntity.ok(body);
    }

    @RequestMapping(value = "/profile", method = { RequestMethod.PUT, RequestMethod.POST })
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) { return ResponseEntity.status(401).body(Map.of("message", "Invalid token")); }

        String phone = payload.getOrDefault("phone", null);
        String birthDate = payload.getOrDefault("birthDate", null);
        // Ensure profile exists, then update
        if (profileService.find(username) == null) {
            profileService.getOrCreate(username);
        }
        UserProfile p = profileService.updateBasics(username, phone, birthDate, null);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Profile updated");
        body.put("username", p.getUsername());
        body.put("phone", p.getPhone());
        body.put("birthDate", p.getBirthDate());
        body.put("avatarUrl", p.getAvatarUrl());
        return ResponseEntity.ok(body);
    }
}
