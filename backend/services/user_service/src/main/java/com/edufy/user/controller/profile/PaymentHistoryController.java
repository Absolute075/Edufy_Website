package com.edufy.user.controller.profile;

import com.edufy.user.domain.model.Payment;
import com.edufy.user.security.JwtUtil;
import com.edufy.user.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class PaymentHistoryController {

    private final PaymentService paymentService;

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

    @GetMapping("/payments/history")
    public ResponseEntity<?> history(HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }

        List<Payment> list = paymentService.getPaymentsForUser(username);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Payment p : list) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", p.getId());
            row.put("createdAt", p.getCreatedAt());
            row.put("amount", p.getAmount());
            row.put("currency", p.getCurrency());
            row.put("status", p.getStatus());
            row.put("plan", p.getPlan());
            row.put("period", p.getPeriod());
            row.put("provider", p.getProvider());
            out.add(row);
        }
        return ResponseEntity.ok(out);
    }
}
