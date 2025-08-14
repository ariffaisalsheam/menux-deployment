package com.menux.menu_x_backend.controller;

import com.menux.menu_x_backend.dto.menu.CreateMenuItemRequest;
import com.menux.menu_x_backend.dto.menu.UpdateMenuItemRequest;
import com.menux.menu_x_backend.dto.menu.ReorderMenuItemsRequest;
import com.menux.menu_x_backend.entity.Menu;
import com.menux.menu_x_backend.entity.MenuItem;
import com.menux.menu_x_backend.entity.Restaurant;
import com.menux.menu_x_backend.entity.User;
import com.menux.menu_x_backend.repository.MenuRepository;
import com.menux.menu_x_backend.repository.MenuItemRepository;
import com.menux.menu_x_backend.repository.RestaurantRepository;
import com.menux.menu_x_backend.repository.UserRepository;
import com.menux.menu_x_backend.service.RestaurantService;
import jakarta.validation.Valid;
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

    @Autowired
    private RestaurantService restaurantService;

    // Public endpoint for viewing menu items (for QR code access)
    @GetMapping("/restaurant/{restaurantId}/items")
    public ResponseEntity<List<MenuItem>> getMenuItems(@PathVariable Long restaurantId) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(restaurantId);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        List<MenuItem> menuItems = menuItemRepository.findByRestaurantIdAndIsAvailableTrueOrdered(restaurantId);
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

        // Prefer context-based restaurantId (from JWT) to avoid extra DB trips and lazy loading
        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<MenuItem> menuItems = menuItemRepository.findByRestaurantIdOrdered(restaurantIdOpt.get());
        return ResponseEntity.ok(menuItems);
    }

    @PostMapping("/manage/items")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItem> createMenuItem(@Valid @RequestBody CreateMenuItemRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Long restaurantId = restaurantIdOpt.get();
        
        // Get or create default menu
        Menu menu = menuRepository.findByRestaurantId(restaurantId)
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    // Minimal Restaurant reference to set foreign key without lazy loading cycles
                    Restaurant r = new Restaurant();
                    r.setId(restaurantId);
                    Menu newMenu = new Menu("Main Menu", r);
                    return menuRepository.save(newMenu);
                });

        // Create MenuItem from DTO
        MenuItem menuItem = new MenuItem();
        menuItem.setName(request.getName());
        menuItem.setDescription(request.getDescription());
        menuItem.setPrice(request.getPrice());
        try {
            menuItem.setCategory(MenuItem.Category.valueOf(request.getCategory().toUpperCase()));
        } catch (IllegalArgumentException e) {
            menuItem.setCategory(MenuItem.Category.MAIN_COURSE); // Default fallback
        }
        menuItem.setIsAvailable(request.getIsAvailable());
        menuItem.setIsVegetarian(request.getIsVegetarian());
        menuItem.setIsSpicy(request.getIsSpicy());
        menuItem.setImageUrl(request.getImageUrl());
        menuItem.setAiDescription(request.getAiDescription());
        // place new item at end of list
        int nextOrder = (int) menuItemRepository.countByRestaurantId(restaurantId) + 1;
        menuItem.setDisplayOrder(nextOrder);
        menuItem.setMenu(menu);

        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        return ResponseEntity.ok(savedMenuItem);
    }

    @PutMapping("/manage/items/{id}")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<MenuItem> updateMenuItem(@PathVariable Long id, @Valid @RequestBody UpdateMenuItemRequest request) {
        Optional<MenuItem> menuItemOpt = menuItemRepository.findById(id);
        if (menuItemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        MenuItem menuItem = menuItemOpt.get();
        
        // Verify ownership using safe restaurant service
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        // Avoid lazy-loading nested relations; fetch owning restaurantId directly
        Long owningRestaurantId = menuItemRepository.findRestaurantIdByMenuItemId(id);
        if (userOpt.isEmpty() || owningRestaurantId == null || !restaurantService.userOwnsRestaurant(userOpt.get().getId(), owningRestaurantId)) {
            return ResponseEntity.status(403).build();
        }
        
        // Update fields
        if (request.getName() != null) {
            menuItem.setName(request.getName());
        }
        if (request.getDescription() != null) {
            menuItem.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            menuItem.setPrice(request.getPrice());
        }
        if (request.getCategory() != null) {
            try {
                menuItem.setCategory(MenuItem.Category.valueOf(request.getCategory().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Keep existing category if invalid
            }
        }
        if (request.getImageUrl() != null) {
            menuItem.setImageUrl(request.getImageUrl());
        }
        if (request.getIsAvailable() != null) {
            menuItem.setIsAvailable(request.getIsAvailable());
        }
        if (request.getIsVegetarian() != null) {
            menuItem.setIsVegetarian(request.getIsVegetarian());
        }
        if (request.getIsSpicy() != null) {
            menuItem.setIsSpicy(request.getIsSpicy());
        }
        if (request.getAiDescription() != null) {
            menuItem.setAiDescription(request.getAiDescription());
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
        
        // Verify ownership using safe restaurant service
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        // Avoid lazy-loading nested relations; fetch owning restaurantId directly
        Long owningRestaurantId = menuItemRepository.findRestaurantIdByMenuItemId(id);
        if (userOpt.isEmpty() || owningRestaurantId == null || !restaurantService.userOwnsRestaurant(userOpt.get().getId(), owningRestaurantId)) {
            return ResponseEntity.status(403).build();
        }
        
        menuItemRepository.delete(menuItem);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/manage/items/reorder")
    @PreAuthorize("hasRole('RESTAURANT_OWNER')")
    public ResponseEntity<Void> reorderMenuItems(@Valid @RequestBody ReorderMenuItemsRequest request) {
        // Get current restaurant
        Optional<Long> restaurantIdOpt = restaurantService.getCurrentUserRestaurantId();
        if (restaurantIdOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Long restaurantId = restaurantIdOpt.get();

        // Verify ownership of every item id
        for (ReorderMenuItemsRequest.ItemOrder io : request.getItems()) {
            Long owningRestaurantId = menuItemRepository.findRestaurantIdByMenuItemId(io.getId());
            if (owningRestaurantId == null || !owningRestaurantId.equals(restaurantId)) {
                return ResponseEntity.status(403).build();
            }
        }

        // Apply new display orders
        Iterable<Long> ids = request.getItems().stream().map(ReorderMenuItemsRequest.ItemOrder::getId).toList();
        List<MenuItem> items = menuItemRepository.findAllById(ids);
        // Map id -> order
        java.util.Map<Long, Integer> orderMap = new java.util.HashMap<>();
        for (ReorderMenuItemsRequest.ItemOrder io : request.getItems()) {
            orderMap.put(io.getId(), io.getDisplayOrder());
        }
        for (MenuItem mi : items) {
            Integer newOrder = orderMap.get(mi.getId());
            if (newOrder != null) {
                mi.setDisplayOrder(newOrder);
            }
        }
        menuItemRepository.saveAll(items);
        return ResponseEntity.ok().build();
    }
}
