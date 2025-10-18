package com.edufy.auth.dto;

import com.edufy.auth.entity.UserEntity;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String phone;
    private LocalDate birthDate;
    private UserEntity.Role role;
}
