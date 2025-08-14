package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RestaurantServiceTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private RestaurantService restaurantService;

    private User testUser;
    private Restaurant testRestaurant;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testowner");
        testUser.setEmail("test@example.com");
        testUser.setRole(User.Role.RESTAURANT_OWNER);

        testRestaurant = new Restaurant();
        testRestaurant.setId(1L);
        testRestaurant.setName("Test Restaurant");
        // Owner relationship is managed by owner_id foreign key in database
        testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.BASIC);
    }

    @Test
    void getRestaurantByOwnerId_ShouldReturnRestaurant_WhenExists() {
        // Given
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.of(testRestaurant));

        // When
        Optional<Restaurant> result = restaurantService.getRestaurantByOwnerId(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals("Test Restaurant", result.get().getName());
        verify(restaurantRepository).findByOwnerId(1L);
    }

    @Test
    void getRestaurantByOwnerId_ShouldReturnEmpty_WhenNotExists() {
        // Given
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.empty());

        // When
        Optional<Restaurant> result = restaurantService.getRestaurantByOwnerId(1L);

        // Then
        assertFalse(result.isPresent());
        verify(restaurantRepository).findByOwnerId(1L);
    }

    @Test
    void getCurrentUserRestaurant_ShouldReturnRestaurant_WhenUserIsRestaurantOwner() {
        // Given
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testowner");
        when(userRepository.findByUsername("testowner")).thenReturn(Optional.of(testUser));
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.of(testRestaurant));

        // When
        Optional<Restaurant> result = restaurantService.getCurrentUserRestaurant();

        // Then
        assertTrue(result.isPresent());
        assertEquals("Test Restaurant", result.get().getName());
    }

    @Test
    void getCurrentUserRestaurant_ShouldReturnEmpty_WhenUserNotFound() {
        // Given
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("nonexistent");
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // When
        Optional<Restaurant> result = restaurantService.getCurrentUserRestaurant();

        // Then
        assertFalse(result.isPresent());
    }

    @Test
    void getCurrentUserRestaurant_ShouldReturnEmpty_WhenUserIsNotRestaurantOwner() {
        // Given
        testUser.setRole(User.Role.DINER);
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testowner");
        when(userRepository.findByUsername("testowner")).thenReturn(Optional.of(testUser));

        // When
        Optional<Restaurant> result = restaurantService.getCurrentUserRestaurant();

        // Then
        assertFalse(result.isPresent());
        verify(restaurantRepository, never()).findByOwnerId(any());
    }

    @Test
    void currentUserHasRestaurant_ShouldReturnTrue_WhenRestaurantExists() {
        // Given
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testowner");
        when(userRepository.findByUsername("testowner")).thenReturn(Optional.of(testUser));
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.of(testRestaurant));

        // When
        boolean result = restaurantService.currentUserHasRestaurant();

        // Then
        assertTrue(result);
    }

    @Test
    void currentUserHasRestaurant_ShouldReturnFalse_WhenRestaurantNotExists() {
        // Given
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testowner");
        when(userRepository.findByUsername("testowner")).thenReturn(Optional.of(testUser));
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.empty());

        // When
        boolean result = restaurantService.currentUserHasRestaurant();

        // Then
        assertFalse(result);
    }

    @Test
    void isRestaurantPro_ShouldReturnTrue_WhenProSubscription() {
        // Given
        testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.PRO);
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(testRestaurant));

        // When
        boolean result = restaurantService.isRestaurantPro(1L);

        // Then
        assertTrue(result);
    }

    @Test
    void isRestaurantPro_ShouldReturnFalse_WhenBasicSubscription() {
        // Given
        when(restaurantRepository.findById(1L)).thenReturn(Optional.of(testRestaurant));

        // When
        boolean result = restaurantService.isRestaurantPro(1L);

        // Then
        assertFalse(result);
    }
}
