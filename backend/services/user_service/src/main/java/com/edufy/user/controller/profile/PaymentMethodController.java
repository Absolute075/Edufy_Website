package com.edufy.user.controller.profile;

import com.edufy.user.domain.model.PaymentMethod;
import com.edufy.user.security.JwtUtil;
import com.edufy.user.service.PaymentMethodService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

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

    @GetMapping("/payment-methods")
    public ResponseEntity<?> list(HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }

        List<PaymentMethod> list = paymentMethodService.getMethodsForUser(username);
        List<Map<String, Object>> out = new ArrayList<>();
        for (PaymentMethod pm : list) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", pm.getId());
            row.put("provider", pm.getProvider());
            row.put("cardBrand", pm.getCardBrand());
            row.put("lastDigits", pm.getLastDigits());
            row.put("expiryMonth", pm.getExpiryMonth());
            row.put("expiryYear", pm.getExpiryYear());
            row.put("isDefault", pm.isDefault());
            row.put("createdAt", pm.getCreatedAt());
            out.add(row);
        }
        return ResponseEntity.ok(out);
    }

    @DeleteMapping("/payment-methods/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id, HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }

        boolean deleted = paymentMethodService.deleteForUser(username, id);
        if (!deleted) {
            return ResponseEntity.status(404).body(Map.of("message", "Payment method not found"));
        }
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/payment-methods/{id}/default")
    public ResponseEntity<?> makeDefault(@PathVariable("id") Long id, HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
        }

        PaymentMethod updated = paymentMethodService.setDefault(username, id);
        if (updated == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Payment method not found"));
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", "Default payment method updated");
        body.put("id", updated.getId());
        body.put("cardBrand", updated.getCardBrand());
        body.put("lastDigits", updated.getLastDigits());
        return ResponseEntity.ok(body);
    }
}
