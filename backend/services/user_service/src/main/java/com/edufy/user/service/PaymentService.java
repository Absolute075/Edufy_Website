package com.edufy.user.service;

import com.edufy.user.domain.model.Payment;
import com.edufy.user.domain.model.Subscription;
import com.edufy.user.domain.repository.PaymentRepository;
import com.edufy.user.domain.repository.SubscriptionRepository;
import com.edufy.user.domain.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserProfileRepository userProfileRepository;

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private void applySuccessfulPaymentToSubscription(Payment payment, LocalDateTime now) {
        String username = payment.getUsername();
        if (username == null || username.isBlank()) {
            return;
        }
        String plan = payment.getPlan();
        String period = payment.getPeriod();
        boolean autoRenewal = payment.isAutoRenewal();

        Subscription sub = subscriptionRepository.findByUsername(username)
                .orElseGet(() -> Subscription.builder()
                        .username(username)
                        .plan(plan)
                        .period(period)
                        .autoRenewal(autoRenewal)
                        .activeUntil(now)
                        .build());

        if (plan != null) sub.setPlan(plan);
        if (period != null) sub.setPeriod(period);
        sub.setAutoRenewal(autoRenewal);

        LocalDateTime base = sub.getActiveUntil();
        if (base == null || base.isBefore(now)) {
            base = now;
        }
        LocalDateTime newUntil = base;
        String per = period != null ? period : "monthly";
        switch (per) {
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
        subscriptionRepository.save(sub);

        if (plan != null) {
            userProfileRepository.findByUsername(username).ifPresent(profile -> {
                profile.setPlan(plan.toLowerCase(Locale.ROOT));
                userProfileRepository.save(profile);
            });
        }
    }

    public List<Payment> getPaymentsForUser(String username) {
        if (username == null || username.isBlank()) {
            return Collections.emptyList();
        }
        return paymentRepository.findByUsernameOrderByCreatedAtDesc(username);
    }
}
