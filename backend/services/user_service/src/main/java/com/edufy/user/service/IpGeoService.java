package com.edufy.user.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IpGeoService {
    private static class GeoCacheEntry {
        String country;
        String city;
        long expiresAt;
    }

    private final Map<String, GeoCacheEntry> cache = new ConcurrentHashMap<>();

    public String[] resolve(String ip) {
        if (ip == null || ip.isBlank()) return new String[]{null, null};
        long now = Instant.now().toEpochMilli();
        GeoCacheEntry cached = cache.get(ip);
        if (cached != null && cached.expiresAt > now) {
            return new String[]{cached.country, cached.city};
        }
        String country = null, city = null;
        try {
            URL url = new URL("https://ipapi.co/" + ip + "/json/");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(2000);
            conn.setRequestMethod("GET");
            int code = conn.getResponseCode();
            if (code == 200) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    String json = sb.toString();
                    country = extract(json, "country_name");
                    city = extract(json, "city");
                }
            }
        } catch (Exception ignored) {}
        GeoCacheEntry e = new GeoCacheEntry();
        e.country = country;
        e.city = city;
        e.expiresAt = now + 24L * 60 * 60 * 1000; // 24h
        cache.put(ip, e);
        return new String[]{country, city};
    }

    private String extract(String json, String key) {
        // very tiny extractor: "key":"value"
        try {
            String needle = "\"" + key + "\"";
            int i = json.indexOf(needle);
            if (i == -1) return null;
            int colon = json.indexOf(':', i);
            if (colon == -1) return null;
            int startQuote = json.indexOf('"', colon + 1);
            if (startQuote == -1) return null;
            int endQuote = json.indexOf('"', startQuote + 1);
            if (endQuote == -1) return null;
            return json.substring(startQuote + 1, endQuote);
        } catch (Exception e) { return null; }
    }
}
