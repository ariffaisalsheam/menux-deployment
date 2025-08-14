package com.menux.menu_x_backend.config;

import com.menux.menu_x_backend.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.SecureRandom;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private UserDetailsService userDetailsService;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Use BCrypt with strength 12 for better security (default is 10)
        return new BCryptPasswordEncoder(12, new SecureRandom());
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
    // Use non-deprecated constructor that accepts UserDetailsService directly
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Split allowed origins by comma and trim whitespace
        String[] origins = allowedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }
        // Use allowedOriginPatterns instead of allowedOrigins when allowCredentials is true
        configuration.setAllowedOriginPatterns(Arrays.asList(origins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/menu/public/**").permitAll()
                .requestMatchers("/api/menu/restaurant/**").permitAll()
                .requestMatchers("/api/feedback/public/**").permitAll()
                .requestMatchers("/api/orders/restaurant/**").permitAll()
                
                // Restaurant Owner endpoints
                .requestMatchers("/api/restaurant/**").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/menu/manage/**").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/orders/manage/**").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/feedback/manage/**").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/ai/**").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/tables/**").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/analytics/restaurant").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/analytics/restaurant/basic").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/analytics/restaurant/feedback").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/analytics/restaurant/activity").hasRole("RESTAURANT_OWNER")
                .requestMatchers("/api/qr/**").hasRole("RESTAURANT_OWNER")

                // User profile endpoints (authenticated users)
                .requestMatchers("/api/user/**").authenticated()

                // Super Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/analytics/restaurant/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/public/settings/**").permitAll()
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
