package com.edufy.auth.dto;

import com.edufy.auth.entity.UserEntity;
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private UserEntity.Role role;
}
