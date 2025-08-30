import React, { useState, useEffect, useCallback } from 'react'
import { permissionAPI } from '../services/api'

interface PermissionState {
  permissions: Set<string>
  isAdmin: boolean
  isSuperAdmin: boolean
  loading: boolean
  error: string | null
}

export const usePermissions = () => {
  const [state, setState] = useState<PermissionState>({
    permissions: new Set(),
    isAdmin: false,
    isSuperAdmin: false,
    loading: true,
    error: null
  })

  const loadPermissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const [permissionsRes, adminStatusRes] = await Promise.all([
        permissionAPI.getCurrentUserPermissions(),
        permissionAPI.getAdminStatus()
      ])

      setState({
        permissions: new Set(permissionsRes.data),
        isAdmin: adminStatusRes.data.isAdmin,
        isSuperAdmin: adminStatusRes.data.isSuperAdmin,
        loading: false,
        error: null
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Failed to load permissions'
      }))
    }
  }, [])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  const hasPermission = useCallback((permission: string): boolean => {
    return state.permissions.has(permission)
  }, [state.permissions])

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => state.permissions.has(permission))
  }, [state.permissions])

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => state.permissions.has(permission))
  }, [state.permissions])

  const checkPermission = useCallback(async (permission: string): Promise<boolean> => {
    try {
      const response = await permissionAPI.checkPermission(permission)
      return response.data
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }, [])

  const checkPermissions = useCallback(async (permissions: string[]): Promise<Record<string, boolean>> => {
    try {
      const response = await permissionAPI.checkPermissions(permissions)
      return response.data
    } catch (error) {
      console.error('Error checking permissions:', error)
      return permissions.reduce((acc, perm) => ({ ...acc, [perm]: false }), {})
    }
  }, [])

  return {
    ...state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    checkPermissions,
    reload: loadPermissions
  }
}

// Permission-based component wrapper
interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions()

  if (loading) {
    return React.createElement('div', { className: 'animate-pulse bg-gray-200 h-8 w-24 rounded' })
  }

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
  } else {
    hasAccess = true // No permissions specified, allow access
  }

  return hasAccess ? React.createElement(React.Fragment, {}, children) : React.createElement(React.Fragment, {}, fallback)
}

// Hook for checking if user can manage another user
export const useCanManageUser = (userId?: number) => {
  const [canManage, setCanManage] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!userId) {
      setCanManage(false)
      return
    }

    const checkAccess = async () => {
      try {
        setLoading(true)
        const response = await permissionAPI.canManageUser(userId)
        setCanManage(response.data)
      } catch (error) {
        setCanManage(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [userId])

  return { canManage, loading }
}

export default usePermissions
