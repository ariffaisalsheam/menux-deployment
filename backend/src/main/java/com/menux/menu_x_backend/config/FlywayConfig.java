package com.menux.menu_x_backend.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("supabase")
@ConditionalOnProperty(name = "app.flyway.repair-on-start", havingValue = "true")
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // First repair to fix checksum mismatches (e.g., V7) safely
            try {
                flyway.repair();
                log.info("Flyway repair executed successfully.");
            } catch (Exception e) {
                log.warn("Flyway repair encountered an issue: {}", e.getMessage());
            }

            // Then run migrations as usual (will validate again and apply pending ones like V10)
            flyway.migrate();
        };
    }
}
