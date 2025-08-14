-- Create menu_views table for tracking menu and item views
CREATE TABLE menu_views (
    id BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    menu_item_id BIGINT,
    visitor_ip VARCHAR(45),
    user_agent VARCHAR(255),
    table_number VARCHAR(50),
    view_type VARCHAR(20) NOT NULL CHECK (view_type IN ('MENU_SCAN', 'ITEM_VIEW', 'CATEGORY_VIEW')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_menu_views_restaurant 
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_menu_views_menu_item 
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_menu_views_restaurant_id ON menu_views(restaurant_id);
CREATE INDEX idx_menu_views_created_at ON menu_views(created_at);
CREATE INDEX idx_menu_views_view_type ON menu_views(view_type);
CREATE INDEX idx_menu_views_restaurant_created ON menu_views(restaurant_id, created_at);
CREATE INDEX idx_menu_views_restaurant_type ON menu_views(restaurant_id, view_type);
CREATE INDEX idx_menu_views_menu_item ON menu_views(menu_item_id);
CREATE INDEX idx_menu_views_visitor_ip ON menu_views(visitor_ip);
