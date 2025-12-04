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
    private final InfobipEmailService infobipEmailService;

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
        
        System.out.println("[DEBUG REGISTER] Original password: " + request.getPassword());
        System.out.println("[DEBUG REGISTER] PasswordEncoder class: " + passwordEncoder.getClass().getName());
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        System.out.println("[DEBUG REGISTER] Hashed password: " + hashedPassword);
        
        user.setPassword(hashedPassword);
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setPublicId(generateUniquePublicId());

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
        String dbPassword = user.getPassword();
        if (dbPassword == null) {
            System.out.println("[DEBUG] Password hash from DB is NULL");
        } else {
            System.out.println("[DEBUG] Password hash from DB: " + dbPassword.substring(0, Math.min(60, dbPassword.length())));
        }
        System.out.println("[DEBUG] PasswordEncoder class: " + passwordEncoder.getClass().getName());

        boolean matches = dbPassword != null && passwordEncoder.matches(request.getPassword(), dbPassword);
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

    // ================== FORGOT PASSWORD (SEND CODE) ==================
    public AuthResponse forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return new AuthResponse("❌ Email is required");
        }

        String email = request.getEmail().trim();
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);

        // Всегда возвращаем одинаковый ответ, чтобы не раскрывать, существует ли email
        String genericOk = "✅ If this email exists, we have sent a reset code.";

        if (userOpt.isEmpty()) {
            return new AuthResponse(genericOk);
        }

        try {
            UserEntity user = userOpt.get();

            // Генерация 6-значного кода
            int raw = (int) (Math.random() * 1_000_000);
            String code = String.format("%06d", raw);

            user.setResetCode(code);
            user.setResetCodeExpiresAt(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            infobipEmailService.sendResetCodeEmail(user.getEmail(), code);
        } catch (Exception e) {
            // Не раскрываем детали, только логируем на сервере
            System.out.println("[auth_service] forgotPassword error: " + e.getClass().getSimpleName());
        }

        return new AuthResponse(genericOk);
    }

    // ================== RESET PASSWORD (BY CODE) ==================
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        if (request == null
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getCode() == null || request.getCode().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return new AuthResponse("❌ Email, code and new password are required");
        }

        if (request.getNewPassword().length() < 8) {
            return new AuthResponse("❌ Password must be at least 8 characters long");
        }

        Optional<UserEntity> userOpt = userRepository.findByEmail(request.getEmail().trim());
        if (userOpt.isEmpty()) {
            return new AuthResponse("❌ Invalid or expired reset code");
        }

        UserEntity user = userOpt.get();
        if (user.getResetCode() == null || user.getResetCodeExpiresAt() == null) {
            return new AuthResponse("❌ Invalid or expired reset code");
        }

        if (!user.getResetCode().equals(request.getCode())) {
            return new AuthResponse("❌ Invalid or expired reset code");
        }

        if (user.getResetCodeExpiresAt().isBefore(LocalDateTime.now())) {
            return new AuthResponse("❌ Invalid or expired reset code");
        }

        try {
            String hashed = passwordEncoder.encode(request.getNewPassword());
            user.setPassword(hashed);
            user.setResetCode(null);
            user.setResetCodeExpiresAt(null);
            userRepository.save(user);
        } catch (Exception e) {
            System.out.println("[auth_service] resetPassword error: " + e.getClass().getSimpleName());
            return new AuthResponse("❌ Failed to reset password");
        }

        return new AuthResponse("✅ Password has been reset successfully");
    }

    private String generateUniquePublicId() {
        String candidate;
        do {
            long n = (long) (Math.random() * 1_000_000_000_000L);
            candidate = String.format("%012d", n);
        } while (userRepository.existsByPublicId(candidate));
        return candidate;
    }

    public void ensurePublicId(UserEntity user) {
        if (user == null) return;
        String current = user.getPublicId();
        if (current != null && !current.isBlank()) return;
        user.setPublicId(generateUniquePublicId());
        userRepository.save(user);
    }
}
