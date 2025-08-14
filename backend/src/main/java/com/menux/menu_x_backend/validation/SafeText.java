package com.menux.menu_x_backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = SafeTextValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeText {
    String message() default "Text contains potentially unsafe content";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    int maxLength() default 1000;
    boolean allowHTML() default false;
}
