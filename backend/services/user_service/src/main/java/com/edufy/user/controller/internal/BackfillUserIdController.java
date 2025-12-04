package com.edufy.user.controller.internal;

import com.edufy.user.domain.model.UserProfile;
import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user/internal")
@RequiredArgsConstructor
public class BackfillUserIdController {

    private final ProfileService profileService;

    @Value("${AUTH_SERVICE_URL:http://auth_service:8080}")
    private String authServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/backfill-user-ids")
    public ResponseEntity<?> backfillUserIds() {
        String base = authServiceUrl;
        if (base == null || base.isBlank()) {
            base = "http://auth_service:8080";
        }
        String url = base + "/auth/internal/admin/users/all";

        try {
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            var response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );

            List<Map<String, Object>> users = response.getBody();
            if (users == null) {
                users = List.of();
            }

            int total = 0;
            int created = 0;
            int updated = 0;

            for (Map<String, Object> u : users) {
                Object idObj = u.get("id");
                Object usernameObj = u.get("username");
                if (idObj == null || usernameObj == null) {
                    continue;
                }
                Long userId;
                try {
                    userId = Long.parseLong(idObj.toString());
                } catch (NumberFormatException e) {
                    continue;
                }
                String username = usernameObj.toString();
                total++;

                UserProfile before = profileService.find(username);
                UserProfile after = profileService.getOrCreate(username, userId);
                if (before == null) {
                    created++;
                } else if (before.getUserId() == null && after.getUserId() != null) {
                    updated++;
                }
            }

            return ResponseEntity.ok(Map.of(
                    "totalAuthUsers", total,
                    "profilesCreated", created,
                    "userIdsUpdated", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "message", "backfill failed",
                            "error", e.getClass().getSimpleName()
                    )
            );
        }
    }
}
