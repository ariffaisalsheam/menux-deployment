package com.menux.menu_x_backend.dto.menu;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ReorderMenuItemsRequest {
    @NotEmpty
    private List<ItemOrder> items;

    public List<ItemOrder> getItems() { return items; }
    public void setItems(List<ItemOrder> items) { this.items = items; }

    public static class ItemOrder {
        @NotNull
        private Long id;
        @NotNull
        private Integer displayOrder;

        public ItemOrder() {}
        public ItemOrder(Long id, Integer displayOrder) {
            this.id = id;
            this.displayOrder = displayOrder;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Integer getDisplayOrder() { return displayOrder; }
        public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    }
}
