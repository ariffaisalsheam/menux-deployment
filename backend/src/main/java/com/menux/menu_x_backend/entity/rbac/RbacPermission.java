package com.menux.menu_x_backend.entity.rbac;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@jakarta.persistence.Table(name = "rbac_permissions")
public class RbacPermission {

    @Id
    @Column(name = "key", length = 100, nullable = false, unique = true)
    private String key;

    @Column(length = 255)
    private String description;

    public RbacPermission() {}

    public RbacPermission(String key, String description) {
        this.key = key;
        this.description = description;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
