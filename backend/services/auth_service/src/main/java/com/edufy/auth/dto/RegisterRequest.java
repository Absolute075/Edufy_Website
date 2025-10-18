package com.edufy.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    private String username;
    private String email;
    private String phoneNumber;
    private String dateOfBirth;
    private String password;
    private String role; // STUDENT или TEACHER
}
