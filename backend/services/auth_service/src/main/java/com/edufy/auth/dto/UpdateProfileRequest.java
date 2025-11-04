package com.edufy.auth.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String phone;
    private String location;
    // ISO date string: YYYY-MM-DD
    private String birthDate;
}

