package com.edufy.auth.service;

import com.edufy.auth.dto.*;
import com.edufy.auth.entity.UserEntity;
import com.edufy.auth.repository.UserRepository;
import com.edufy.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // ================== REGISTER ==================
    public AuthResponse register(RegisterRequest request) {
        // Базовая валидация
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return new AuthResponse("❌ Username is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return new AuthResponse("❌ Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return new AuthResponse("❌ Password is required");
        }

        // Проверка email
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse("❌ Email already registered!");
        }
        // Проверка username
        if (userRepository.existsByUsername(request.getUsername())) {
            return new AuthResponse("❌ Username already registered!");
        }

        // Создаём нового пользователя
        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        // Роль: по умолчанию STUDENT, если не передана
        user.setRole(request.getRole() != null ? request.getRole() : UserEntity.Role.STUDENT);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());

        // Сохраняем пользователя с обработкой ошибок БД
        try {
            userRepository.save(user);
        } catch (Exception e) {
            return new AuthResponse("❌ Registration failed: " + e.getClass().getSimpleName());
        }

        return new AuthResponse("✅ User registered successfully!");
    }

    // ================== LOGIN ==================
    public TokenResponse login(LoginRequest request) {
        // Ищем пользователя по email (можно заменить на username, если нужно)
        Optional<UserEntity> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("❌ User not found!");
        }

        UserEntity user = userOpt.get();

        // Проверка пароля
        System.out.println("[DEBUG] Login attempt for: " + user.getEmail());
        System.out.println("[DEBUG] Password from request: " + request.getPassword());
        System.out.println("[DEBUG] Password hash from DB: " + user.getPassword().substring(0, Math.min(60, user.getPassword().length())));
        System.out.println("[DEBUG] PasswordEncoder class: " + passwordEncoder.getClass().getName());
        
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());
        System.out.println("[DEBUG] Password matches: " + matches);
        
        if (!matches) {
            throw new RuntimeException("❌ Invalid password!");
        }

        // Генерация JWT
        String accessToken = jwtService.generateAccessToken(user.getUsername());
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return new TokenResponse(accessToken, refreshToken);
    }

    // ================== REFRESH TOKEN ==================
    public TokenResponse refresh(RefreshRequest request) {
        String username = jwtService.extractUsername(request.getRefreshToken());
        String newAccessToken = jwtService.generateAccessToken(username);
        // Возвращаем новый accessToken, старый refreshToken оставляем
        return new TokenResponse(newAccessToken, request.getRefreshToken());
    }
}
