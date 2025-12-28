package com.edufy.auth.service;

import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Service
public class InfobipEmailService {

    private final String baseUrl;
    private final String apiKey;

    public InfobipEmailService() {
        String rawBaseUrl = System.getenv("INFOBIP_BASE_URL");
        if (rawBaseUrl != null && !rawBaseUrl.isBlank()) {
            String trimmed = rawBaseUrl.trim();
            if (!(trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
                trimmed = "https://" + trimmed;
            }
            this.baseUrl = trimmed;
        } else {
            this.baseUrl = rawBaseUrl;
        }
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

            String logoUrl = "https://resources.edufyuzbekistan.com/storage/images/favicon.png";
            String subject = "Edufy password reset code";
            String text = "Your Edufy password reset code is " + code + ". It is valid for 15 minutes. "
                    + "If you didn't request this, you can ignore this email.";
            String html = "<!doctype html><html><body style=\"margin:0;padding:0;background:#0b0b10;font-family:Arial,sans-serif;color:#ffffff;\">"
                    + "<div style=\"max-width:520px;margin:0 auto;padding:28px 18px;\">"
                    + "<div style=\"text-align:center;margin-bottom:18px;\">"
                    + "<img src=\"" + logoUrl + "\" width=\"72\" height=\"72\" alt=\"Edufy\" style=\"border-radius:16px;display:inline-block;\"/>"
                    + "</div>"
                    + "<div style=\"background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:20px;\">"
                    + "<h2 style=\"margin:0 0 8px 0;font-size:18px;line-height:1.3;\">Reset your password</h2>"
                    + "<p style=\"margin:0 0 16px 0;color:rgba(255,255,255,0.78);font-size:14px;line-height:1.5;\">Use this code to reset your Edufy password. It expires in <b>15 minutes</b>.</p>"
                    + "<div style=\"text-align:center;margin:14px 0 16px 0;\">"
                    + "<div style=\"display:inline-block;background:#ffffff;color:#111827;border-radius:14px;padding:14px 18px;font-size:22px;letter-spacing:6px;font-weight:700;\">" + code + "</div>"
                    + "</div>"
                    + "<p style=\"margin:0;color:rgba(255,255,255,0.65);font-size:12px;line-height:1.5;\">If you didn't request a password reset, you can ignore this email.</p>"
                    + "</div>"
                    + "<p style=\"margin:14px 0 0 0;text-align:center;color:rgba(255,255,255,0.45);font-size:11px;\">Edufy Uzbekistan</p>"
                    + "</div></body></html>";

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
            body.append(subject).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"text\"").append(CRLF);
            body.append(CRLF);
            body.append(text).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"html\"").append(CRLF);
            body.append(CRLF);
            body.append(html).append(CRLF);

            body.append("--").append(boundary).append("--").append(CRLF);

            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
            }

            int status = conn.getResponseCode();
            try {
                System.out.println("[auth_service] Infobip email status=" + status);
            } catch (Exception ignore) {}

            try {
                InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
                if (is != null) {
                    String bodyResp = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    System.out.println("[auth_service] Infobip email response=" + bodyResp);
                }
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

            String logoUrl = "https://resources.edufyuzbekistan.com/storage/images/favicon.png";
            String subject = "Your Edufy verification code";
            String text = "Your Edufy verification code is " + code + ". It is valid for 15 minutes. "
                    + "If you didn't create an Edufy account, you can ignore this email.";
            String html = "<!doctype html><html><body style=\"margin:0;padding:0;background:#0b0b10;font-family:Arial,sans-serif;color:#ffffff;\">"
                    + "<div style=\"max-width:520px;margin:0 auto;padding:28px 18px;\">"
                    + "<div style=\"text-align:center;margin-bottom:18px;\">"
                    + "<img src=\"" + logoUrl + "\" width=\"72\" height=\"72\" alt=\"Edufy\" style=\"border-radius:16px;display:inline-block;\"/>"
                    + "</div>"
                    + "<div style=\"background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:20px;\">"
                    + "<h2 style=\"margin:0 0 8px 0;font-size:18px;line-height:1.3;\">Verify your email</h2>"
                    + "<p style=\"margin:0 0 16px 0;color:rgba(255,255,255,0.78);font-size:14px;line-height:1.5;\">Enter this code in Edufy to finish creating your account. It expires in <b>15 minutes</b>.</p>"
                    + "<div style=\"text-align:center;margin:14px 0 16px 0;\">"
                    + "<div style=\"display:inline-block;background:#ffffff;color:#111827;border-radius:14px;padding:14px 18px;font-size:22px;letter-spacing:6px;font-weight:700;\">" + code + "</div>"
                    + "</div>"
                    + "<p style=\"margin:0;color:rgba(255,255,255,0.65);font-size:12px;line-height:1.5;\">If you didn't create an account, you can ignore this email.</p>"
                    + "</div>"
                    + "<p style=\"margin:14px 0 0 0;text-align:center;color:rgba(255,255,255,0.45);font-size:11px;\">Edufy Uzbekistan</p>"
                    + "</div></body></html>";

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
            body.append(subject).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"text\"").append(CRLF);
            body.append(CRLF);
            body.append(text).append(CRLF);

            body.append("--").append(boundary).append(CRLF);
            body.append("Content-Disposition: form-data; name=\"html\"").append(CRLF);
            body.append(CRLF);
            body.append(html).append(CRLF);

            body.append("--").append(boundary).append("--").append(CRLF);

            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
            }

            int status = conn.getResponseCode();
            try {
                System.out.println("[auth_service] Infobip verification email status=" + status);
            } catch (Exception ignore) {}

            try {
                InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
                if (is != null) {
                    String bodyResp = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    System.out.println("[auth_service] Infobip verification email response=" + bodyResp);
                }
            } catch (Exception ignore) {}
            conn.disconnect();
        } catch (Exception e) {
            try {
                System.out.println("[auth_service] Failed to send verification email via Infobip: " + e.getClass().getSimpleName());
            } catch (Exception ignore) {}
        }
    }
}
