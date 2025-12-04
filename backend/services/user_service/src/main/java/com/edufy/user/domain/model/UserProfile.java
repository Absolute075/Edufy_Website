package com.edufy.user.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {
    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private Long userId; // optional until JWT switches to userId

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(length = 20)
    private String phone;

    private LocalDate birthDate;

    @Column(length = 300)
    private String avatarUrl;

    // Learning preferences
    @Column(length = 64)
    private String certificate; // e.g. IELTS, TOEFL: 110, SAT: 1450, AP: 5, ACT: 30

    @Column(length = 128)
    private String favoriteSubject; // e.g. Data Science, Economics

    @Column(length = 16)
    private String dailyHours; // e.g. 2-3, 10+

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate(){
        LocalDateTime now = LocalDateTime.now(ZONE);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate(){
        updatedAt = LocalDateTime.now(ZONE);
    }
}
