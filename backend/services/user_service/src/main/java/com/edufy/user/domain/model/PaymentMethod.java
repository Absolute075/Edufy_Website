package com.edufy.user.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 32)
    private String provider; // e.g. OSON

    @Column(nullable = false, length = 128)
    private String externalToken; // token or id from payment provider

    @Column(nullable = false, length = 16)
    private String cardBrand; // UZCARD, HUMO, VISA, MASTERCARD, etc.

    @Column(nullable = false, length = 8)
    private String lastDigits; // last 2-4 digits of card number (masked)

    @Column(nullable = true)
    private Integer expiryMonth; // 1-12

    @Column(nullable = true)
    private Integer expiryYear; // full year, e.g. 2027

    @Column(nullable = false)
    private boolean isDefault;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
