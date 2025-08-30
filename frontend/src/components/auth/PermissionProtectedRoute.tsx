import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, RefreshCw } from 'lucide-react'

interface PermissionProtectedRouteProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallbackComponent?: React.ReactNode
}

export default function PermissionProtectedRoute({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallbackComponent
}: PermissionProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permissionsLoading, reload } = usePermissions()
  const location = useLocation()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshPermissions = async () => {
    setRefreshing(true)
    try {
      // Trigger a permission reload
      await reload()
      // Force a page refresh to ensure all components get the new permissions
      window.location.reload()
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (authLoading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check permissions
  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
  } else {
    hasAccess = true // No permissions specified, allow access
  }

  if (!hasAccess) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }

    // Default access denied page
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Shield className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription className="text-base">
              You don't have the required permissions to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Required permission{permissions.length > 1 ? 's' : ''}:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {permission && (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {permission}
                  </code>
                )}
                {permissions.map(perm => (
                  <code key={perm} className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {perm}
                  </code>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Contact your system administrator to request access.
              </p>
              <div className="mt-4">
                <Button
                  onClick={handleRefreshPermissions}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {refreshing ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Permissions
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Try refreshing if you were recently granted access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
