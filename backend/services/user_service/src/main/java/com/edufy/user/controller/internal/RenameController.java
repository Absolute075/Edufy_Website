package com.edufy.user.controller.internal;

import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class RenameController {
    private final ProfileService profileService;

    public static class RenameRequest {
        public String oldUsername;
        public String newUsername;
    }

    @PostMapping("/rename-username")
    public ResponseEntity<?> renameUsername(@RequestBody RenameRequest body) {
        if (body == null || body.oldUsername == null || body.newUsername == null
                || body.oldUsername.isBlank() || body.newUsername.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "oldUsername and newUsername required"));
        }
        profileService.renameUsername(body.oldUsername, body.newUsername);
        return ResponseEntity.ok(Map.of("message", "ok"));
    }
}
