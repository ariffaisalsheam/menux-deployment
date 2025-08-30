-- Assign SUPER_ADMIN_RBAC role to existing SUPER_ADMIN users (idempotent)

-- Create user_rbac_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_rbac_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_urr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_urr_role FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE
);

-- Assign SUPER_ADMIN_RBAC role to all existing SUPER_ADMIN users
INSERT INTO user_rbac_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN rbac_roles r
WHERE u.role = 'SUPER_ADMIN' 
  AND r.name = 'SUPER_ADMIN_RBAC'
  AND NOT EXISTS (
    SELECT 1 FROM user_rbac_roles urr 
    WHERE urr.user_id = u.id AND urr.role_id = r.id
  );
