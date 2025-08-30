import type { AdminUserDTO } from '../services/api'

/**
 * Determines the primary display role for a user based on their RBAC role assignments
 * @param user - The user object with role and rbacRoles
 * @returns The role name to display in the UI
 */
export function getPrimaryDisplayRole(user: AdminUserDTO): string {
  // If user has RBAC roles, use the first non-system role as display role
  if (user.rbacRoles && user.rbacRoles.length > 0) {
    // Prioritize non-system roles (exclude SUPER_ADMIN_RBAC)
    const primaryRole = user.rbacRoles.find(role => role.name !== 'SUPER_ADMIN_RBAC')
    
    if (primaryRole) {
      return primaryRole.name
    }
    
    // If only system roles, use the first one
    return user.rbacRoles[0].name
  }
  
  // Fall back to base role if no RBAC roles
  return user.role || 'Unknown'
}

/**
 * Formats a role name for display (converts underscores to spaces and capitalizes)
 * @param roleName - The role name to format
 * @returns Formatted role name
 */
export function formatRoleName(roleName: string): string {
  return roleName
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Gets the display role with formatting
 * @param user - The user object
 * @returns Formatted display role name
 */
export function getFormattedDisplayRole(user: AdminUserDTO): string {
  const primaryRole = getPrimaryDisplayRole(user)
  return formatRoleName(primaryRole)
}
