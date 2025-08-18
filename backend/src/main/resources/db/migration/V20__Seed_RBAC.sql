-- Seed default RBAC permissions and roles (safe re-run)

-- Permissions
INSERT INTO rbac_permissions(key, description) VALUES
  ('MANAGE_USERS', 'Manage platform users'),
  ('MANAGE_RESTAURANTS', 'Manage restaurants and settings'),
  ('VIEW_AUDIT_LOGS', 'View audit logs'),
  ('MANAGE_SUBSCRIPTIONS', 'Manage subscriptions and billing'),
  ('MANAGE_RBAC', 'Manage roles and permissions')
ON CONFLICT (key) DO NOTHING;

-- Roles
INSERT INTO rbac_roles(name, description) VALUES
  ('SUPER_ADMIN_RBAC', 'RBAC role with full administrative permissions'),
  ('RESTAURANT_OWNER_RBAC', 'RBAC role for restaurant owners')
ON CONFLICT (name) DO NOTHING;

-- Map permissions to roles
-- SUPER_ADMIN_RBAC gets all default permissions
INSERT INTO rbac_role_permissions(role_id, permission_key)
SELECT r.id, p.key
FROM rbac_roles r CROSS JOIN rbac_permissions p
WHERE r.name = 'SUPER_ADMIN_RBAC'
ON CONFLICT DO NOTHING;

-- RESTAURANT_OWNER_RBAC gets a minimal subset
INSERT INTO rbac_role_permissions(role_id, permission_key)
SELECT r.id, p.key
FROM rbac_roles r
JOIN rbac_permissions p ON p.key IN ('MANAGE_RESTAURANTS')
WHERE r.name = 'RESTAURANT_OWNER_RBAC'
ON CONFLICT DO NOTHING;
