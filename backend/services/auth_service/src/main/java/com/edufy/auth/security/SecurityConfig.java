package com.edufy.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
public class SecurityConfig {

    // ================== PASSWORD ENCODER ==================
    @Bean
    public PasswordEncoder passwordEncoder() {
        PasswordEncoder argon2id = new Argon2PasswordEncoder(
                16,
                64,
                4,
                256 * 1024,
                4
        );

        PasswordEncoder legacyBcrypt = new BCryptPasswordEncoder(6);

        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return argon2id.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (encodedPassword == null || encodedPassword.isBlank()) {
                    return false;
                }

                if (encodedPassword.startsWith("$2a$")
                        || encodedPassword.startsWith("$2b$")
                        || encodedPassword.startsWith("$2y$")) {
                    return legacyBcrypt.matches(rawPassword, encodedPassword);
                }

                if (encodedPassword.startsWith("$argon2")) {
                    return argon2id.matches(rawPassword, encodedPassword);
                }

                return false;
            }
        };
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


