package com.edufy.auth.controller;

import com.edufy.auth.entity.UserEntity;
import com.edufy.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public String register(@RequestBody UserEntity user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return "Username already exists!";
        }
        userRepository.save(user);
        return "User registered successfully!";
    }
}
