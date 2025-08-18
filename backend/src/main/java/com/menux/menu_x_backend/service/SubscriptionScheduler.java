package com.menux.menu_x_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SubscriptionScheduler {

    @Autowired
    private SubscriptionService subscriptionService;

    // Run daily at 03:10
    @Scheduled(cron = "0 10 3 * * *")
    @Transactional
    public void daily() {
        subscriptionService.runDailyChecks();
    }
}
