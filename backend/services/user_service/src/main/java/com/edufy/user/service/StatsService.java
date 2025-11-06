package com.edufy.user.service;

import com.edufy.user.domain.model.WeeklyStats;
import com.edufy.user.domain.repository.WeeklyStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;

@Service
@RequiredArgsConstructor
public class StatsService {
    private final WeeklyStatsRepository weeklyRepo;

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent"); // GMT+5

    public static String isoWeekKey(LocalDate date) {
        var w = java.time.temporal.WeekFields.ISO;
        int week = date.get(w.weekOfWeekBasedYear());
        int year = date.get(w.weekBasedYear());
        return String.format("%d-%02d", year, week);
    }

    public WeeklyStats addSeconds(String username, long seconds) {
        if (seconds <= 0) return null;
        LocalDate nowLocal = LocalDate.now(ZONE);
        String key = isoWeekKey(nowLocal);
        WeeklyStats ws = weeklyRepo.findByUsernameAndWeekKey(username, key)
                .orElseGet(() -> WeeklyStats.builder()
                        .username(username)
                        .weekKey(key)
                        .mon(0).tue(0).wed(0).thu(0).fri(0).sat(0).sun(0)
                        .totalMinutes(0)
                        .build());
        int addMinutes = (int) Math.max(1, seconds / 60); // округление до минут, минимум 1
        DayOfWeek dow = ZonedDateTime.now(ZONE).getDayOfWeek(); // MON..SUN
        switch (dow) {
            case MONDAY -> ws.setMon(ws.getMon() + addMinutes);
            case TUESDAY -> ws.setTue(ws.getTue() + addMinutes);
            case WEDNESDAY -> ws.setWed(ws.getWed() + addMinutes);
            case THURSDAY -> ws.setThu(ws.getThu() + addMinutes);
            case FRIDAY -> ws.setFri(ws.getFri() + addMinutes);
            case SATURDAY -> ws.setSat(ws.getSat() + addMinutes);
            case SUNDAY -> ws.setSun(ws.getSun() + addMinutes);
        }
        ws.setTotalMinutes(ws.getTotalMinutes() + addMinutes);
        return weeklyRepo.save(ws);
    }

    public WeeklyStats getWeek(String username, String weekKey) {
        if (username == null || weekKey == null) return null;
        return weeklyRepo.findByUsernameAndWeekKey(username, weekKey).orElse(null);
    }
}
