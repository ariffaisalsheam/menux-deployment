package com.menux.menu_x_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
public class MenuXBackendApplication {

	public static void main(String[] args) {
		// Set JVM default timezone from env var, fallback to UTC
		String tz = System.getenv().getOrDefault("APP_TIME_ZONE", "UTC");
		TimeZone.setDefault(TimeZone.getTimeZone(tz));
		SpringApplication.run(MenuXBackendApplication.class, args);
	}

}
