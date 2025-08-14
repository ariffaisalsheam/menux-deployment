package com.menux.menu_x_backend.dto.menu;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public class CreateMenuItemRequest {
    
    @NotBlank(message = "Menu item name is required")
    @Size(max = 100, message = "Menu item name must not exceed 100 characters")
    private String name;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price must be a valid monetary amount")
    private BigDecimal price;
    
    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category;
    
    private Boolean isAvailable = true;
    
    private Boolean isVegetarian = false;
    
    private Boolean isSpicy = false;
    
    @Size(max = 200, message = "Image URL must not exceed 200 characters")
    private String imageUrl;
    
    @Size(max = 500, message = "AI description must not exceed 500 characters")
    private String aiDescription;
    
    // Constructors
    public CreateMenuItemRequest() {}
    
    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    
    public Boolean getIsVegetarian() { return isVegetarian; }
    public void setIsVegetarian(Boolean isVegetarian) { this.isVegetarian = isVegetarian; }
    
    public Boolean getIsSpicy() { return isSpicy; }
    public void setIsSpicy(Boolean isSpicy) { this.isSpicy = isSpicy; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getAiDescription() { return aiDescription; }
    public void setAiDescription(String aiDescription) { this.aiDescription = aiDescription; }
}
