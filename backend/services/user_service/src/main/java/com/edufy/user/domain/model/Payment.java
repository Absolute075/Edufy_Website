package com.edufy.user.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true, length = 50)
    private String username;

    @Column(nullable = true, length = 32)
    private String plan; // free | plus | pro | premium

    @Column(nullable = true, length = 32)
    private String period; // monthly | sixMonths | yearly

    @Column(nullable = false)
    private boolean autoRenewal;

    @Column(name = "provider", length = 32, nullable = false)
    private String provider;

    @Column(name = "transaction_id", length = 64, unique = true)
    private String transactionId;

    @Column(name = "bill_id")
    private Long billId;

    @Column(nullable = false)
    private double amount;

    @Column(length = 8, nullable = false)
    private String currency; // e.g. UZS

    @Column(length = 24, nullable = false)
    private String status; // PENDING, PAID, FAILED, CANCELED

    @Column(length = 255)
    private String failureReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(length = 150)
    private String email;

    @Column(length = 32)
    private String phone;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (provider == null || provider.isBlank()) {
            provider = "MANUAL";
        }
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
