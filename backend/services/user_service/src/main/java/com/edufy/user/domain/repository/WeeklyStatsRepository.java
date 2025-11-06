package com.edufy.user.domain.repository;

import com.edufy.user.domain.model.WeeklyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WeeklyStatsRepository extends JpaRepository<WeeklyStats, Long> {
    Optional<WeeklyStats> findByUsernameAndWeekKey(String username, String weekKey);
}
