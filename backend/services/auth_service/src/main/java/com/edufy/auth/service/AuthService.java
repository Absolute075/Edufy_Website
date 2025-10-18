package com.edufy.auth.service;

import com.edufy.auth.dto.*;
import com.edufy.auth.entity.UserEntity;
import com.edufy.auth.repository.UserRepository;
import com.edufy.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ================== REGISTER ==================
    public AuthResponse register(RegisterRequest request) {
        // Проверка email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return new AuthResponse("❌ Email already registered!");
        }

        // Проверка телефона
        if (userRepository.findByPhone(request.getPhone()).isPresent()) {
            return new AuthResponse("❌ Phone number already registered!");
        }

        // Создаём нового пользователя
        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setBirthDate(request.getBirthDate());
        user.setRole(request.getRole()); // STUDENT / TEACHER
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);

        // Сохраняем пользователя
        userRepository.save(user);

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
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
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
