package com.edufy.user.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_stats")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WeeklyStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    // ISO week key like 2025-45
    @Column(nullable = false, length = 8)
    private String weekKey;

    @Column(nullable = false)
    private int mon;
    @Column(nullable = false)
    private int tue;
    @Column(nullable = false)
    private int wed;
    @Column(nullable = false)
    private int thu;
    @Column(nullable = false)
    private int fri;
    @Column(nullable = false)
    private int sat;
    @Column(nullable = false)
    private int sun;

    @Column(nullable = false)
    private int totalMinutes;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate(){
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate(){
        updatedAt = LocalDateTime.now();
    }
}
