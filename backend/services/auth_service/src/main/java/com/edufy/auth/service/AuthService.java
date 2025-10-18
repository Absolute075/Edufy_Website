package com.edufy.auth.service;

import com.edufy.auth.dto.RegisterRequest;
import com.edufy.auth.entity.UserEntity;
import com.edufy.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public String register(RegisterRequest request) {

        // Проверка: email уже зарегистрирован?
        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email is already registered";
        }

        // Хэшируем пароль
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Создаём нового пользователя
        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .password(encodedPassword)
                .role(request.getRole())
                .build();

        // Сохраняем в БД
        userRepository.save(user);

        return "User registered successfully";
    }
}
