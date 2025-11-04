package com.edufy.user.controller.profile;

import com.edufy.user.domain.model.UserProfile;
import com.edufy.user.security.JwtUtil;
import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    private String getAccessToken(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if ("accessToken".equals(c.getName())) return c.getValue();
        }
        return null;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) { return ResponseEntity.status(401).body(Map.of("message", "Invalid token")); }

        UserProfile p = profileService.getOrCreate(username);
        return ResponseEntity.ok(Map.of(
                "userId", p.getUserId(),
                "username", p.getUsername(),
                "phone", p.getPhone(),
                "birthDate", p.getBirthDate(),
                "location", p.getLocation(),
                "avatarUrl", p.getAvatarUrl()
        ));
    }

    @PutMapping("/profile")
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
        return ResponseEntity.ok(Map.of("message", "Profile updated",
                "username", p.getUsername(),
                "phone", p.getPhone(),
                "birthDate", p.getBirthDate(),
                "location", p.getLocation(),
                "avatarUrl", p.getAvatarUrl()
        ));
    }
}
