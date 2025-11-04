package com.edufy.user.controller.profile;

import com.edufy.user.integration.SftpUploader;
import com.edufy.user.security.JwtUtil;
import com.edufy.user.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class AvatarController {

    private final ProfileService profileService;
    private final SftpUploader sftpUploader;

    private static final String RESOURCES_BASE = "https://resources.edufyuzbekistan.com/avatars";

    private String getAccessToken(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if ("accessToken".equals(c.getName())) return c.getValue();
        }
        return null;
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file, HttpServletRequest request) throws IOException {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        String username;
        try { username = JwtUtil.extractUsername(token); }
        catch (Exception e) { return ResponseEntity.status(401).body(Map.of("message", "Invalid token")); }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No file uploaded"));
        }
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        // Allow common image types
        if (!ct.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only image files are allowed"));
        }
        String ext = guessExtension(file.getOriginalFilename(), ct);
        long ts = Instant.now().toEpochMilli();
        String filename = username + "-" + ts + "." + ext;

        // Upload directly to Storage via SFTP
        try {
            sftpUploader.upload(file.getInputStream(), filename);
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Upload failed"));
        }

        String avatarUrl = RESOURCES_BASE + "/" + filename;
        profileService.updateAvatarUrl(username, avatarUrl);
        return ResponseEntity.ok(Map.of("message", "Avatar uploaded", "avatarUrl", avatarUrl));
    }

    private String guessExtension(String originalName, String contentType) {
        String ext = null;
        if (originalName != null) {
            String clean = StringUtils.cleanPath(originalName);
            int dot = clean.lastIndexOf('.');
            if (dot > -1 && dot < clean.length() - 1) {
                ext = clean.substring(dot + 1).toLowerCase();
            }
        }
        if (ext == null) {
            if ("image/png".equals(contentType)) ext = "png";
            else if ("image/jpeg".equals(contentType)) ext = "jpg";
            else if ("image/jpg".equals(contentType)) ext = "jpg";
            else if ("image/webp".equals(contentType)) ext = "webp";
            else ext = "jpg";
        }
        return ext;
    }
}
