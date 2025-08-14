package com.menux.menu_x_backend.service;

import com.menux.menu_x_backend.dto.auth.AuthResponse;
import com.menux.menu_x_backend.dto.auth.LoginRequest;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private Restaurant testRestaurant;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testowner");
        testUser.setEmail("test@example.com");
        testUser.setFullName("Test Owner");
        testUser.setRole(User.Role.RESTAURANT_OWNER);

        testRestaurant = new Restaurant();
        testRestaurant.setId(1L);
        testRestaurant.setName("Test Restaurant");
        // Owner relationship is managed by owner_id foreign key in database
        testRestaurant.setSubscriptionPlan(Restaurant.SubscriptionPlan.BASIC);

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testowner");
        loginRequest.setPassword("password123");
    }

    @Test
    void login_ShouldReturnAuthResponse_WhenUserHasRestaurant() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.of(testRestaurant));
        when(jwtUtil.generateToken(eq(testUser), any())).thenReturn("mock-jwt-token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals(1L, response.getId());
        assertEquals("testowner", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test Owner", response.getFullName());
        assertEquals(User.Role.RESTAURANT_OWNER, response.getRole());
        assertEquals(1L, response.getRestaurantId());
        assertEquals("Test Restaurant", response.getRestaurantName());
        assertEquals(Restaurant.SubscriptionPlan.BASIC, response.getSubscriptionPlan());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(restaurantRepository).findByOwnerId(1L);
        verify(jwtUtil).generateToken(eq(testUser), any());
    }

    @Test
    void login_ShouldReturnAuthResponse_WhenUserHasNoRestaurant() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.empty());
        when(jwtUtil.generateToken(eq(testUser), any())).thenReturn("mock-jwt-token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals(1L, response.getId());
        assertEquals("testowner", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test Owner", response.getFullName());
        assertEquals(User.Role.RESTAURANT_OWNER, response.getRole());
        assertNull(response.getRestaurantId());
        assertNull(response.getRestaurantName());
        assertNull(response.getSubscriptionPlan());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(restaurantRepository).findByOwnerId(1L);
        verify(jwtUtil).generateToken(eq(testUser), any());
    }

    @Test
    void login_ShouldReturnAuthResponse_WhenUserIsNotRestaurantOwner() {
        // Given
        testUser.setRole(User.Role.DINER);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(jwtUtil.generateToken(eq(testUser), any())).thenReturn("mock-jwt-token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals(1L, response.getId());
        assertEquals("testowner", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test Owner", response.getFullName());
        assertEquals(User.Role.DINER, response.getRole());
        assertNull(response.getRestaurantId());
        assertNull(response.getRestaurantName());
        assertNull(response.getSubscriptionPlan());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(restaurantRepository, never()).findByOwnerId(any());
        verify(jwtUtil).generateToken(eq(testUser), any());
    }

    @Test
    void login_ShouldNotCauseInfiniteLoop_WhenCalledMultipleTimes() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(testUser);
        when(restaurantRepository.findByOwnerId(1L)).thenReturn(Optional.of(testRestaurant));
        when(jwtUtil.generateToken(eq(testUser), any())).thenReturn("mock-jwt-token");

        // When - Call login multiple times to ensure no infinite loop
        for (int i = 0; i < 5; i++) {
            AuthResponse response = authService.login(loginRequest);
            assertNotNull(response);
            assertEquals("Test Restaurant", response.getRestaurantName());
        }

        // Then - Verify that repository methods were called the expected number of times
        verify(authenticationManager, times(5)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(restaurantRepository, times(5)).findByOwnerId(1L);
        verify(jwtUtil, times(5)).generateToken(eq(testUser), any());
    }
}
