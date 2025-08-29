package com.menux.menu_x_backend.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that require a valid PRO subscription
 * This will trigger real-time subscription validation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireProSubscription {
    
    /**
     * Custom error message when subscription validation fails
     */
    String message() default "This feature requires a valid PRO subscription";
    
    /**
     * Whether to allow graceful degradation (return null/empty) instead of throwing exception
     */
    boolean gracefulDegradation() default false;
}
