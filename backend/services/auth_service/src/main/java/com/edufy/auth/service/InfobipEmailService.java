package com.edufy.auth.service;

import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class InfobipEmailService {

    private final String baseUrl;
    private final String apiKey;

    public InfobipEmailService() {
        this.baseUrl = System.getenv("INFOBIP_BASE_URL");
        this.apiKey = System.getenv("INFOBIP_API_KEY");
    }

    public void sendResetCodeEmail(String toEmail, String code) {
        if (baseUrl == null || baseUrl.isBlank() || apiKey == null || apiKey.isBlank()) {
            try {
                System.out.println("[auth_service] Infobip not configured, skipping reset email");
            } catch (Exception ignore) {}
            return;
        }

        try {
            String endpoint = baseUrl.endsWith("/") ? baseUrl + "email/3/send" : baseUrl + "/email/3/send";
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "App " + apiKey);

            String boundary = "----EdufyBoundary" + System.currentTimeMillis();
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);

            String from = System.getenv("INFOBIP_FROM_EMAIL");
            if (from == null || from.isBlank()) {
                from = "Edufy <no-reply@edufyuzbekistan.com>";
            }

            String CRLF = "\r\n";
            StringBuilder body = new StringBuilder();

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"from\"").append(CRLF);
            body.append(CRLF);
            body.append(from).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"to\"").append(CRLF);
            body.append(CRLF);
            body.append(toEmail).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"subject\"").append(CRLF);
            body.append(CRLF);
            body.append("Edufy password reset code").append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"text\"").append(CRLF);
            body.append(CRLF);
            body.append("Your Edufy password reset code is ")
                    .append(code)
                    .append(". It is valid for 15 minutes.")
                    .append(CRLF);

            body.append("--").append(boundary).append("--").append(CRLF);

            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
            }

            int status = conn.getResponseCode();
            try {
                System.out.println("[auth_service] Infobip email status=" + status);
            } catch (Exception ignore) {}
            conn.disconnect();
        } catch (Exception e) {
            try {
                System.out.println("[auth_service] Failed to send reset email via Infobip: " + e.getClass().getSimpleName());
            } catch (Exception ignore) {}
        }
    }

    public void sendVerificationCodeEmail(String toEmail, String code) {
        if (baseUrl == null || baseUrl.isBlank() || apiKey == null || apiKey.isBlank()) {
            try {
                System.out.println("[auth_service] Infobip not configured, skipping verification email");
            } catch (Exception ignore) {}
            return;
        }

        try {
            String endpoint = baseUrl.endsWith("/") ? baseUrl + "email/3/send" : baseUrl + "/email/3/send";
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Authorization", "App " + apiKey);

            String boundary = "----EdufyBoundary" + System.currentTimeMillis();
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);

            String from = System.getenv("INFOBIP_FROM_EMAIL");
            if (from == null || from.isBlank()) {
                from = "Edufy <no-reply@edufyuzbekistan.com>";
            }

            String CRLF = "\r\n";
            StringBuilder body = new StringBuilder();

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"from\"").append(CRLF);
            body.append(CRLF);
            body.append(from).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"to\"").append(CRLF);
            body.append(CRLF);
            body.append(toEmail).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"subject\"").append(CRLF);
            body.append(CRLF);
            body.append("Edufy verification code").append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"text\"").append(CRLF);
            body.append(CRLF);
            body.append("Your Edufy verification code is ")
                    .append(code)
                    .append(". It is valid for 15 minutes.")
                    .append(CRLF);

            body.append("--").append(boundary).append("--").append(CRLF);

            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
            }

            int status = conn.getResponseCode();
            try {
                System.out.println("[auth_service] Infobip verification email status=" + status);
            } catch (Exception ignore) {}
            conn.disconnect();
        } catch (Exception e) {
            try {
                System.out.println("[auth_service] Failed to send verification email via Infobip: " + e.getClass().getSimpleName());
            } catch (Exception ignore) {}
        }
    }
}
