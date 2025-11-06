package com.edufy.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;

import java.util.Map;

@Service
public class OAuthService {

    @Value("${GOOGLE_CLIENT_ID:${google.clientId:}}")
    private String googleClientId;

    @Value("${GOOGLE_CLIENT_SECRET:${google.clientSecret:}}")
    private String googleClientSecret;

    @Value("${GOOGLE_REDIRECT_URI:${google.redirectUri:https://access.edufyuzbekistan.com/auth/oauth/google/callback}}")
    private String googleRedirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getAuthorizeUrl(String state, String nonce) {
        String base = "https://accounts.google.com/o/oauth2/v2/auth";
        String scope = "openid%20email%20profile";
        return base + "?client_id=" + googleClientId +
                "&redirect_uri=" + googleRedirectUri +
                "&response_type=code" +
                "&scope=" + scope +
                "&access_type=offline" +
                "&prompt=consent" +
                "&state=" + state +
                "&nonce=" + nonce;
    }

    public Map<String, Object> exchangeCodeForTokens(String code) {
        String url = "https://oauth2.googleapis.com/token";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code", code);
        form.add("client_id", googleClientId);
        form.add("client_secret", googleClientSecret);
        form.add("redirect_uri", googleRedirectUri);
        form.add("grant_type", "authorization_code");
        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(form, headers);
        ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                url, HttpMethod.POST, req, new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        return resp.getBody();
    }

    public Map<String, Object> getUserInfo(String accessToken) {
        String url = "https://openidconnect.googleapis.com/v1/userinfo";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> req = new HttpEntity<>(headers);
        ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                url, HttpMethod.GET, req, new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        if (!resp.getStatusCode().is2xxSuccessful()) {
            return Map.of();
        }
        return resp.getBody();
    }
}
