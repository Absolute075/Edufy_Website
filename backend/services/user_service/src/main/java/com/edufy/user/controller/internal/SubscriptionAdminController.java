package com.edufy.user.controller.internal;

import com.edufy.user.domain.model.Subscription;
import com.edufy.user.domain.repository.SubscriptionRepository;
import com.edufy.user.domain.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class SubscriptionAdminController {

    private final SubscriptionRepository subscriptionRepository;
    private final UserProfileRepository userProfileRepository;

    public static class GrantSubscriptionRequest {
        public String username;
        public String plan;   // Free | Plus | Pro | Premium (case-insensitive)
        public String period; // monthly | sixMonths | yearly
    }

    @PostMapping("/admin/subscriptions/grant")
    public ResponseEntity<?> grant(@RequestBody GrantSubscriptionRequest body) {
        if (body == null || body.username == null || body.username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username required"));
        }
        if (body.plan == null || body.plan.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "plan required"));
        }
        if (body.period == null || body.period.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "period required"));
        }

        String username = body.username.trim();
        String planInput = body.plan.trim();
        String period = body.period.trim();

        String planLower = planInput.toLowerCase(Locale.ROOT);
        // Accept legacy "pro" input but normalize to "premium" internally.
        String normalizedPlan = "pro".equals(planLower) ? "premium" : planLower;
        if (!("free".equals(normalizedPlan) || "plus".equals(normalizedPlan) || "premium".equals(normalizedPlan))) {
            return ResponseEntity.badRequest().body(Map.of("message", "unsupported plan"));
        }
        if (!("monthly".equals(period) || "sixMonths".equals(period) || "yearly".equals(period))) {
            return ResponseEntity.badRequest().body(Map.of("message", "unsupported period"));
        }

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Tashkent"));

        Subscription sub = subscriptionRepository.findByUsername(username).orElseGet(() ->
                Subscription.builder()
                        .username(username)
                        .plan(normalizedPlan)
                        .period(period)
                        .autoRenewal(false)
                        .activeUntil(now)
                        .build()
        );

        sub.setPlan(normalizedPlan);
        sub.setPeriod(period);
        sub.setAutoRenewal(false);

        LocalDateTime base = sub.getActiveUntil();
        if (base == null || base.isBefore(now)) {
            base = now;
        }

        LocalDateTime newUntil;
        switch (period) {
            case "sixMonths":
                newUntil = base.plusMonths(6);
                break;
            case "yearly":
                newUntil = base.plusYears(1);
                break;
            default:
                newUntil = base.plusMonths(1);
                break;
        }
        sub.setActiveUntil(newUntil);
        sub = subscriptionRepository.save(sub);

        // Update profile plan if present
        userProfileRepository.findByUsername(username).ifPresent(profile -> {
            profile.setPlan(normalizedPlan);
            userProfileRepository.save(profile);
        });

        return ResponseEntity.ok(Map.of(
                "username", sub.getUsername(),
                "plan", sub.getPlan(),
                "period", sub.getPeriod(),
                "activeUntil", sub.getActiveUntil()
        ));
    }

    @GetMapping("/admin/subscriptions/summary")
    public ResponseEntity<?> summary(@RequestParam("username") String username) {
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "username required"));
        }
        String trimmed = username.trim();

        Optional<Subscription> subOpt = subscriptionRepository.findByUsername(trimmed);
        if (subOpt.isPresent()) {
            Subscription sub = subOpt.get();
            LocalDateTime grantedAt = sub.getUpdatedAt() != null ? sub.getUpdatedAt() : sub.getCreatedAt();
            return ResponseEntity.ok(Map.of(
                    "username", sub.getUsername(),
                    "plan", sub.getPlan(),
                    "activeUntil", sub.getActiveUntil(),
                    "grantedAt", grantedAt
            ));
        }

        return userProfileRepository.findByUsername(trimmed)
                .<ResponseEntity<?>>map(profile -> ResponseEntity.ok(Map.of(
                        "username", profile.getUsername(),
                        "plan", profile.getPlan(),
                        "activeUntil", null,
                        "grantedAt", profile.getCreatedAt()
                )))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
