-- Seed missing admin permissions and assign to SUPER_ADMIN_RBAC (idempotent)

-- Add missing permissions that are used in the frontend but not seeded
INSERT INTO rbac_permissions(key, description) VALUES
  ('MANAGE_NOTIFICATIONS', 'Manage notification templates, campaigns, and broadcasts'),
  ('MANAGE_PAYMENTS', 'Manage manual payments and billing'),
  ('MANAGE_SYSTEM', 'Manage system settings and AI configuration'),
  ('VIEW_ANALYTICS', 'View platform analytics and reports')
ON CONFLICT (key) DO NOTHING;

-- Map all missing permissions to SUPER_ADMIN_RBAC
INSERT INTO rbac_role_permissions(role_id, permission_key)
SELECT r.id, p.key
FROM rbac_roles r
CROSS JOIN rbac_permissions p
WHERE r.name = 'SUPER_ADMIN_RBAC'
  AND p.key IN ('MANAGE_NOTIFICATIONS', 'MANAGE_PAYMENTS', 'MANAGE_SYSTEM', 'VIEW_ANALYTICS')
  AND NOT EXISTS (
    SELECT 1 FROM rbac_role_permissions rrp 
    WHERE rrp.role_id = r.id AND rrp.permission_key = p.key
  );
