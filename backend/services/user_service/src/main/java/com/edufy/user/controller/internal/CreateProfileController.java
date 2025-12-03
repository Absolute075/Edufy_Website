package com.edufy.user.controller.internal;

import com.edufy.user.domain.model.UserProfile;
import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class CreateProfileController {

    private final ProfileService profileService;

    public static class CreateProfileRequest {
        public String username;
    }

    @PostMapping("/create-profile")
    public ResponseEntity<?> createProfile(@RequestBody CreateProfileRequest body) {
        if (body == null || body.username == null || body.username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username required"));
        }
        String username = body.username.trim();
        UserProfile p = profileService.getOrCreate(username);
        return ResponseEntity.ok(Map.of(
                "id", p.getId(),
                "username", p.getUsername(),
                "plan", p.getPlan()
        ));
    }
}
