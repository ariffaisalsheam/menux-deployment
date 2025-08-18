-- RBAC core tables: roles, permissions, mappings

CREATE TABLE IF NOT EXISTS rbac_roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rbac_permissions (
    key VARCHAR(100) PRIMARY KEY,
    description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS rbac_role_permissions (
    role_id BIGINT NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_id, permission_key),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_rp_perm FOREIGN KEY (permission_key) REFERENCES rbac_permissions(key) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_rbac_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_urr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_urr_role FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_rbac_roles_user ON user_rbac_roles(user_id);
