import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Alert, AlertDescription } from '../../ui/alert'
import {
  Shield,
  Users,
  Key,
  CheckCircle,
  Info,
  AlertTriangle,
  UserPlus,
  Settings
} from 'lucide-react'

export const RBACSystemGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>
            Get started with RBAC management in 3 simple steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">1. Create Admin Users</h3>
              <p className="text-sm text-gray-600">Add new administrators with username and password</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">2. Assign Roles</h3>
              <p className="text-sm text-gray-600">Give users appropriate roles with the right permissions</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">3. Manage Access</h3>
              <p className="text-sm text-gray-600">Monitor and update permissions as needed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-500" />
            Available Permissions
          </CardTitle>
          <CardDescription>
            System permissions you can assign to roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Management
                </h4>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs mr-1">MANAGE_USERS</Badge>
                  <p className="text-xs text-gray-600 mt-1">Create, edit, and delete admin users</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  RBAC Management
                </h4>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs mr-1">MANAGE_RBAC</Badge>
                  <p className="text-xs text-gray-600 mt-1">Manage roles and permissions</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-purple-600 mb-2">System Administration</h4>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs mr-1">VIEW_AUDIT_LOGS</Badge>
                  <Badge variant="outline" className="text-xs mr-1">MANAGE_SUBSCRIPTIONS</Badge>
                  <Badge variant="outline" className="text-xs">MANAGE_APPROVALS</Badge>
                  <p className="text-xs text-gray-600 mt-1">System monitoring and management</p>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-orange-600 mb-2">Restaurant Management</h4>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs mr-1">MANAGE_RESTAURANTS</Badge>
                  <p className="text-xs text-gray-600 mt-1">Manage restaurant accounts and settings</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Common Tasks
          </CardTitle>
          <CardDescription>
            Step-by-step guides for typical RBAC operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Creating a New Admin User</h4>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. Go to the <strong>Admin Users</strong> tab</li>
                <li>2. Click <strong>Create Admin User</strong></li>
                <li>3. Fill in username, password, and contact details</li>
                <li>4. Assign appropriate roles</li>
                <li>5. Click <strong>Create User</strong></li>
              </ol>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Creating a Custom Role</h4>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. Go to the <strong>Roles & Permissions</strong> tab</li>
                <li>2. Click <strong>Create Role</strong></li>
                <li>3. Enter role name and description</li>
                <li>4. Select the permissions this role should have</li>
                <li>5. Save the role</li>
              </ol>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Assigning Roles to Users</h4>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. Go to the <strong>User Assignment</strong> tab</li>
                <li>2. Search for the user you want to modify</li>
                <li>3. Select the roles to assign</li>
                <li>4. Click <strong>Update Roles</strong></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Important Security Notes
          </CardTitle>
          <CardDescription>
            Key points to remember when managing access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Permissions:</strong> Be careful with <code>MANAGE_RBAC</code> and <code>MANAGE_USERS</code> permissions.
              These grant significant system control and should only be assigned to trusted administrators.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Best Practices
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Use descriptive role names</li>
                <li>• Give users only the permissions they need</li>
                <li>• Review permissions regularly</li>
                <li>• Remove access when users leave</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Avoid These Mistakes
              </h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Don't share admin accounts</li>
                <li>• Don't give excessive permissions</li>
                <li>• Don't create roles for individual users</li>
                <li>• Don't ignore security warnings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RBACSystemGuide
