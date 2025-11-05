package com.edufy.user.service;

import com.edufy.user.domain.model.LoginAudit;
import com.edufy.user.domain.repository.LoginAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginAuditService {
    private final LoginAuditRepository repo;
    private final IpGeoService ipGeoService;

    public LoginAudit record(String username, String ip, String userAgent) {
        String country = null, city = null;
        try {
            String[] geo = ipGeoService.resolve(ip);
            country = geo[0];
            city = geo[1];
        } catch (Exception ignored) {}
        LoginAudit a = LoginAudit.builder()
                .username(username)
                .ip(ip)
                .country(country)
                .city(city)
                .userAgent(userAgent)
                .build();
        return repo.save(a);
    }
}
