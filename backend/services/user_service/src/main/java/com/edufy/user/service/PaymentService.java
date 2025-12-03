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

    public Payment recordOsonInit(
            String username,
            String plan,
            String period,
            boolean autoRenewal,
            String transactionId,
            Long billId,
            double amount,
            String currency,
            String email,
            String phone
    ) {
        if (transactionId == null || transactionId.isBlank()) {
            return null;
        }
        Payment p = paymentRepository.findByTransactionId(transactionId).orElseGet(Payment::new);
        p.setUsername(username);
        if (plan != null) p.setPlan(plan.toLowerCase(Locale.ROOT));
        if (period != null) p.setPeriod(period);
        p.setAutoRenewal(autoRenewal);
        p.setTransactionId(transactionId);
        p.setBillId(billId);
        p.setAmount(amount);
        p.setCurrency(currency != null ? currency : "UZS");
        p.setProvider("OSON");
        p.setStatus("PENDING");
        p.setFailureReason(null);
        p.setEmail(email);
        p.setPhone(phone);
        if (p.getCreatedAt() == null) {
            p.setCreatedAt(LocalDateTime.now(ZONE));
        }
        p.setUpdatedAt(LocalDateTime.now(ZONE));
        return paymentRepository.save(p);
    }

    public Payment handleOsonStatus(String transactionId, Long billId, String externalStatus, String failureReason) {
        if ((transactionId == null || transactionId.isBlank()) && billId == null) {
            return null;
        }
        Payment p = null;
        if (transactionId != null && !transactionId.isBlank()) {
            p = paymentRepository.findByTransactionId(transactionId).orElse(null);
        }
        if (p == null && billId != null) {
            p = paymentRepository.findByBillId(billId).orElse(null);
        }
        if (p == null) {
            return null;
        }

        String norm = externalStatus != null ? externalStatus.trim().toUpperCase(Locale.ROOT) : "";
        String newStatus;
        boolean paid = false;
        if ("PAID".equals(norm) || "SUCCESS".equals(norm)) {
            newStatus = "PAID";
            paid = true;
        } else if ("CANCELED".equals(norm) || "CANCELLED".equals(norm)) {
            newStatus = "CANCELED";
        } else if ("EXPIRED".equals(norm)) {
            newStatus = "EXPIRED";
        } else {
            newStatus = "FAILED";
        }

        p.setStatus(newStatus);
        if (failureReason != null && !failureReason.isBlank()) {
            p.setFailureReason(failureReason);
        }
        LocalDateTime now = LocalDateTime.now(ZONE);
        if (paid && p.getPaidAt() == null) {
            p.setPaidAt(now);
            applySuccessfulPaymentToSubscription(p, now);
        }
        p.setUpdatedAt(now);
        return paymentRepository.save(p);
    }

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
