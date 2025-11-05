package com.edufy.user.controller.internal;

import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class UpdatePhoneController {

    private final ProfileService profileService;

    @PostMapping("/update-phone")
    public ResponseEntity<?> updatePhone(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String phone = payload.get("phone");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username required"));
        }
        profileService.updateBasics(username, phone, null, null);
        return ResponseEntity.ok(Map.of("message", "ok"));
    }
}
