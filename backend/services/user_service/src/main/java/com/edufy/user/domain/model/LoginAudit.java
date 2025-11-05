package com.edufy.user.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_audit")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(name = "ip", length = 64)
    private String ip;

    @Column(name = "country", length = 80)
    private String country;

    @Column(name = "city", length = 120)
    private String city;

    @Column(name = "user_agent", length = 400)
    private String userAgent;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    void onCreate(){
        if (occurredAt == null) occurredAt = LocalDateTime.now();
    }
}
