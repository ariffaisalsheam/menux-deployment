import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert'
import AdminUsersTab from './AdminUsersTab'
import RolesPermissionsTab from './RolesPermissionsTab'
import UserRoleAssignmentTab from './UserRoleAssignmentTab'
import RBACSystemGuide from './RBACSystemGuide'
import { PermissionGuard } from '../../../hooks/usePermissions'
import {
  Shield,
  Users,
  UserCog,
  BookOpen,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

export const RBACDashboard: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setError(null)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const showError = (message: string) => {
    setError(message)
    setSuccessMessage(null)
  }



  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RBAC Management</h1>
                <p className="text-sm text-gray-600">Role-Based Access Control System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      <div className="px-6 py-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 pb-6">
        <Tabs defaultValue="admin-users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="admin-users" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Admin Users
            </TabsTrigger>
            <TabsTrigger value="roles-permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="user-assignment" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Assignment
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              System Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin-users">
            <PermissionGuard
              permission="MANAGE_USERS"
              fallback={
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
                      <p className="text-gray-600 max-w-md">
                        You need the <code className="bg-gray-100 px-2 py-1 rounded text-sm">MANAGE_USERS</code> permission
                        to access the Admin Users management interface.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Contact your system administrator to request access.
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <AdminUsersTab
                onSuccess={showSuccess}
                onError={showError}
              />
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="roles-permissions">
            <RolesPermissionsTab
              onSuccess={showSuccess}
              onError={showError}
            />
          </TabsContent>

          <TabsContent value="user-assignment">
            <PermissionGuard
              permission="MANAGE_USERS"
              fallback={
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
                      <p className="text-gray-600 max-w-md">
                        You need the <code className="bg-gray-100 px-2 py-1 rounded text-sm">MANAGE_USERS</code> permission
                        to access the Admin Users management interface.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Contact your system administrator to request access.
                      </p>
                    </div>
                  </div>
                </div>
              }
            >
              <UserRoleAssignmentTab
                onSuccess={showSuccess}
                onError={showError}
              />
            </PermissionGuard>
          </TabsContent>

          <TabsContent value="guide">
            <RBACSystemGuide />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default RBACDashboard
