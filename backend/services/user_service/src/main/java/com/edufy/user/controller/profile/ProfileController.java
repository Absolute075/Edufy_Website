package com.edufy.user.controller.profile;

import com.edufy.user.domain.model.UserProfile;
import com.edufy.user.security.JwtUtil;
import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

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

        UserProfile p = profileService.getOrCreate(username);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("userId", p.getUserId());
        body.put("username", p.getUsername());
        body.put("phone", p.getPhone());
        body.put("birthDate", p.getBirthDate());
        body.put("location", p.getLocation());
        body.put("avatarUrl", p.getAvatarUrl());
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
        String location = payload.getOrDefault("location", null);
        UserProfile p = profileService.updateBasics(username, phone, birthDate, location);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Profile updated");
        body.put("username", p.getUsername());
        body.put("phone", p.getPhone());
        body.put("birthDate", p.getBirthDate());
        body.put("location", p.getLocation());
        body.put("avatarUrl", p.getAvatarUrl());
        return ResponseEntity.ok(body);
    }
}
