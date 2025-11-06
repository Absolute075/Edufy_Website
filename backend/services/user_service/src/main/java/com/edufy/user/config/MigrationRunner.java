package com.edufy.user.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class MigrationRunner {

    @Bean
    CommandLineRunner dropLegacyColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE user_profiles DROP COLUMN IF EXISTS location");
            } catch (Exception ignored) {}
        };
    }
}
