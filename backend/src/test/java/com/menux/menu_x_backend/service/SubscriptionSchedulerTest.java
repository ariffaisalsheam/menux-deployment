package com.menux.menu_x_backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.profiles.active=test")
@SuppressWarnings("removal")
class SubscriptionSchedulerTest {

    @Autowired
    private SubscriptionScheduler scheduler;

    @MockBean
    private SubscriptionService subscriptionService;

    // Mock security beans required by SecurityConfig
    @MockBean
    private com.menux.menu_x_backend.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Test
    void daily_invokesRunDailyChecks() {
        scheduler.daily();
        verify(subscriptionService, times(1)).runDailyChecks();
    }
}
