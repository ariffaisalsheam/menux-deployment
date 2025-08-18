-- Seed approvals management permission and assign to SUPER_ADMIN_RBAC (idempotent)

INSERT INTO rbac_permissions(key, description)
VALUES ('MANAGE_APPROVALS', 'Manage super admin approval workflows')
ON CONFLICT (key) DO NOTHING;

-- Map to SUPER_ADMIN_RBAC
INSERT INTO rbac_role_permissions(role_id, permission_key)
SELECT r.id, 'MANAGE_APPROVALS'
FROM rbac_roles r
WHERE r.name = 'SUPER_ADMIN_RBAC'
ON CONFLICT DO NOTHING;
