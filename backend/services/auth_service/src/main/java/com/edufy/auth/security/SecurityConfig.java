package com.edufy.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
public class SecurityConfig {

    // ================== PASSWORD ENCODER ==================
    @Bean
    public PasswordEncoder passwordEncoder() {
        // Используем 6 раундов для совместимости с существующими паролями в БД
        return new BCryptPasswordEncoder(6);
    }


    // ================== SECURITY FILTER CHAIN ==================
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**", "/", "/index.html", "/css/**", "/js/**", "/register", "/login", "/health").permitAll()
                        .anyRequest().permitAll()
                );
        return http.build();
    }

    // ================== CORS ==================
    // CORS configured in CorsConfig.java with proper credentials support
}


