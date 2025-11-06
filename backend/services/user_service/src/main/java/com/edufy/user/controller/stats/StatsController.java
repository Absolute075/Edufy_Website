package com.edufy.user.controller.stats;

import com.edufy.user.security.JwtUtil;
import com.edufy.user.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/user/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    private String getAccessToken(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7).trim();
            if (!token.isEmpty()) return token;
        }
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("accessToken".equals(c.getName())) return c.getValue();
            }
        }
        return null;
    }

    @PostMapping("/ping")
    public ResponseEntity<?> ping(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        String token = getAccessToken(request);
        if (token == null || token.isBlank()) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));
        String username;
        try { username = JwtUtil.extractUsername(token); } catch (Exception e) { return ResponseEntity.status(401).body(Map.of("message","Invalid token")); }
        long seconds = 60;
        try { Object v = payload.get("seconds"); if (v != null) seconds = Long.parseLong(String.valueOf(v)); } catch (Exception ignored) {}
        if (seconds <= 0) seconds = 60;
        var ws = statsService.addSeconds(username, seconds);
        return ResponseEntity.ok(Map.of("message","ok"));
    }

    @GetMapping("/weekly-time")
    public ResponseEntity<?> weekly(HttpServletRequest request) {
        // Используем текущую неделю в TZ=GMT+5
        var now = ZonedDateTime.now(ZONE).toLocalDate();
        String key = StatsService.isoWeekKey(now);
        String token = getAccessToken(request);
        String username = null;
        if (token != null && !token.isBlank()) {
            try { username = JwtUtil.extractUsername(token); } catch (Exception ignored) {}
        }
        var ws = (username != null) ? statsService.getWeek(username, key) : null;
        Map<String,Object> body = new LinkedHashMap<>();
        if (ws == null) {
            body.put("labels", new String[]{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"});
            body.put("minutes", new int[]{0,0,0,0,0,0,0});
            body.put("total", 0);
            body.put("weekKey", key);
        } else {
            body.put("labels", new String[]{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"});
            body.put("minutes", new int[]{ws.getMon(), ws.getTue(), ws.getWed(), ws.getThu(), ws.getFri(), ws.getSat(), ws.getSun()});
            body.put("total", ws.getTotalMinutes());
            body.put("weekKey", key);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping("/monthly-weeks")
    public ResponseEntity<?> monthly() {
        // Простая заглушка: вернём нули; реал агрегация может быть добавлена позже
        return ResponseEntity.ok(Map.of(
                "weeks", new int[]{0,0,0,0},
                "total", 0
        ));
    }
}
