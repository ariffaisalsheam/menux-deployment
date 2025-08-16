package com.menux.menu_x_backend.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("supabase")
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);
    
    @Value("${app.flyway.repair-on-start:false}")
    private boolean repairOnStart;

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // Conditionally repair to fix checksum mismatches (e.g., V7) safely
            if (repairOnStart) {
                try {
                    flyway.repair();
                    log.info("Flyway repair executed successfully.");
                } catch (Exception e) {
                    log.warn("Flyway repair encountered an issue: {}", e.getMessage());
                }
            } else {
                log.info("Flyway repair disabled (app.flyway.repair-on-start=false). Skipping repair.");
            }

            // Then run migrations as usual (will validate again and apply pending ones like V10)
            flyway.migrate();
        };
    }
}
