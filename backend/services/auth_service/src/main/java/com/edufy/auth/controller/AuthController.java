package com.edufy.auth.controller;

import com.edufy.auth.dto.RegisterRequest;
import com.edufy.auth.dto.LoginRequest;
import com.edufy.auth.dto.RefreshRequest;
import com.edufy.auth.dto.TokenResponse;
import com.edufy.auth.dto.AuthResponse;
import com.edufy.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Регистрация
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if(response.getMessage().startsWith("❌")) {
            // Ошибка регистрации — вернём 400
            return ResponseEntity.badRequest().body(response);
        }
        // Успешная регистрация — 200 OK
        return ResponseEntity.ok(response);
    }

    // Логин
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
        TokenResponse tokenResponse = authService.login(request);
        if(tokenResponse.getAccessToken() == null) {
            return ResponseEntity.badRequest().body(tokenResponse);
        }
        return ResponseEntity.ok(tokenResponse);
    }

    // Обновление токена
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshRequest request) {
        TokenResponse tokenResponse = authService.refresh(request);
        if(tokenResponse.getAccessToken() == null) {
            return ResponseEntity.badRequest().body(tokenResponse);
        }
        return ResponseEntity.ok(tokenResponse);
    }
}
