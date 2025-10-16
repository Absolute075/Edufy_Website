package com.edufy.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(org.springframework.security.config.annotation.web.builders.HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // CSRF отключаем
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll() // разрешаем все запросы к /auth/**
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults()); // можно убрать или оставить
        return http.build();
    }
}
