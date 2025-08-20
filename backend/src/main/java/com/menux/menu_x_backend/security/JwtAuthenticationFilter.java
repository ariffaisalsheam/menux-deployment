package com.menux.menu_x_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        // Extract JWT token from Authorization header first
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
        } else {
            // Fallback: allow JWT via access_token query param (useful for SSE/EventSource)
            String qpToken = request.getParameter("access_token");
            if (qpToken != null && !qpToken.isBlank()) {
                jwt = qpToken;
            } else {
                logger.debug("No Authorization header or access_token query param found");
            }
        }

        // If we obtained a JWT (from header or query), extract username and optional restaurantId
        if (jwt != null) {
            try {
                username = jwtUtil.extractUsername(jwt);
                logger.debug("Extracted username from JWT: " + username);
                // Best-effort: extract restaurantId claim if present
                try {
                    Long restaurantId = jwtUtil.extractClaim(jwt, claims -> {
                        Object rid = claims.get("restaurantId");
                        if (rid == null) return null;
                        if (rid instanceof Number) return ((Number) rid).longValue();
                        try { return Long.parseLong(rid.toString()); } catch (NumberFormatException e) { return null; }
                    });
                    RestaurantContext.setRestaurantId(restaurantId);
                } catch (Exception ignored) {
                    // Do not fail request on missing/invalid restaurantId claim
                }
            } catch (Exception e) {
                logger.error("Error extracting username from JWT token: " + e.getMessage());
            }
        }

        // Validate token and set authentication
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // First validate token without database call
                if (jwtUtil.isTokenValid(jwt)) {
                    // Extract user details from JWT token to avoid database call
                    UserDetails userDetails = createUserDetailsFromJWT(jwt, username);

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authentication set for user: " + username);
                } else {
                    logger.warn("JWT token validation failed for user: " + username);
                }
            } catch (Exception e) {
                logger.error("Error validating JWT token for username: " + username + ", error: " + e.getMessage());
                // Fallback to database-based authentication if JWT validation fails
                try {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (jwtUtil.validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        logger.debug("Fallback authentication set for user: " + username);
                    }
                } catch (Exception fallbackException) {
                    logger.error("Fallback authentication also failed for username: " + username + ", error: " + fallbackException.getMessage());
                }
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Always clear context to avoid leakage across threads
            RestaurantContext.clear();
        }
    }

    /**
     * Create UserDetails from JWT token without database call
     */
    private UserDetails createUserDetailsFromJWT(String jwt, String username) {
        try {
            // Extract role from JWT
            String role = jwtUtil.extractClaim(jwt, claims -> claims.get("role", String.class));

            // Create a simple UserDetails implementation
            return new org.springframework.security.core.userdetails.User(
                username,
                "", // No password needed for JWT authentication
                true, // enabled
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
        } catch (Exception e) {
            logger.error("Error creating UserDetails from JWT for user: " + username, e);
            throw new RuntimeException("Failed to create UserDetails from JWT", e);
        }
    }
}
