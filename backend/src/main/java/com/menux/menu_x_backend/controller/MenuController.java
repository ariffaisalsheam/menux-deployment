package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.entity.Menu;
import com.menux.menu_x_backend.entity.MenuItem;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.MenuRepository;
import com.menux.menu_x_backend.repository.MenuItemRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    // Public endpoint for viewing menu items (for QR code access)
    @GetMapping("/restaurant/{restaurantId}/items")
    public ResponseEntity<List<MenuItem>> getMenuItems(@PathVariable Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        List<MenuItem> menuItems = menuItemRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId);
        return ResponseEntity.ok(menuItems);
    }

    // Restaurant owner endpoints
    @GetMapping("/manage/items")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<List<MenuItem>> getMyMenuItems() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
        
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        List<MenuItem> menuItems = menuItemRepository.findByRestaurantId(restaurantOpt.get().getId());
        return ResponseEntity.ok(menuItems);
    }

    @PostMapping("/manage/items")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItem> createMenuItem(@RequestBody MenuItem menuItem) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        Optional<Restaurant> restaurantOpt = restaurantRepository.findByOwnerId(user.getId());
        
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Restaurant restaurant = restaurantOpt.get();
        
        // Get or create default menu
        Menu menu = menuRepository.findByRestaurantId(restaurant.getId())
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    Menu newMenu = new Menu("Main Menu", restaurant);
                    return menuRepository.save(newMenu);
                });
        
        menuItem.setMenu(menu);
        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        return ResponseEntity.ok(savedMenuItem);
    }

    @PutMapping("/manage/items/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @RequestBody MenuItem menuItemUpdate) {
        Optional<MenuItem> menuItemOpt = menuItemRepository.findById(id);
        if (menuItemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        MenuItem menuItem = menuItemOpt.get();
        
        // Verify ownership
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty() || !menuItem.getMenu().getRestaurant().getOwner().getId().equals(userOpt.get().getId())) {
            return ResponseEntity.status(403).build();
        }
        
        // Update fields
        if (menuItemUpdate.getName() != null) {
            menuItem.setName(menuItemUpdate.getName());
        }
        if (menuItemUpdate.getDescription() != null) {
            menuItem.setDescription(menuItemUpdate.getDescription());
        }
        if (menuItemUpdate.getPrice() != null) {
            menuItem.setPrice(menuItemUpdate.getPrice());
        }
        if (menuItemUpdate.getCategory() != null) {
            menuItem.setCategory(menuItemUpdate.getCategory());
        }
        if (menuItemUpdate.getImageUrl() != null) {
            menuItem.setImageUrl(menuItemUpdate.getImageUrl());
        }
        if (menuItemUpdate.getIsAvailable() != null) {
            menuItem.setIsAvailable(menuItemUpdate.getIsAvailable());
        }
        
        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        return ResponseEntity.ok(savedMenuItem);
    }

    @DeleteMapping("/manage/items/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        Optional<MenuItem> menuItemOpt = menuItemRepository.findById(id);
        if (menuItemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        MenuItem menuItem = menuItemOpt.get();
        
        // Verify ownership
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty() || !menuItem.getMenu().getRestaurant().getOwner().getId().equals(userOpt.get().getId())) {
            return ResponseEntity.status(403).build();
        }
        
        menuItemRepository.delete(menuItem);
        return ResponseEntity.noContent().build();
    }
}
