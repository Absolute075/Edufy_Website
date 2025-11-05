package com.edufy.user.controller.internal;

import com.edufy.user.domain.model.LoginAudit;
import com.edufy.user.service.LoginAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class AuditController {
    private final LoginAuditService auditService;

    public static class AuditRequest {
        public String username;
        public String ip;
        public String userAgent;
    }

    @PostMapping("/login-audit")
    public ResponseEntity<?> save(@RequestBody AuditRequest body) {
        if (body == null || body.username == null || body.username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username required"));
        }
        LoginAudit a = auditService.record(body.username, body.ip, body.userAgent);
        return ResponseEntity.ok(Map.of(
                "id", a.getId(),
                "username", a.getUsername(),
                "ip", a.getIp(),
                "country", a.getCountry(),
                "city", a.getCity()
        ));
    }
}
