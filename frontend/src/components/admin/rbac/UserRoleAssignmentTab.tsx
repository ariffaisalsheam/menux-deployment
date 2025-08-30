import React, { useState, useEffect } from 'react'
import { rbacAPI, adminUserAPI, type RbacRole } from '../../../services/api'
import { getFormattedDisplayRole } from '../../../utils/roleUtils'

// Define AdminUserDTO interface for admin users
interface AdminUserDTO {
  id: number
  username: string
  email?: string
  fullName: string
  phoneNumber?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: string[]
  rbacRoles: Array<{
    id: number
    name: string
    description?: string
    permissions: Array<{
      key: string
      description?: string
    }>
  }>
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Badge } from '../../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Checkbox } from '../../ui/checkbox'
import {
  Users,
  UserCog,
  Search,
  Shield
} from 'lucide-react'

interface UserRoleAssignmentTabProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export const UserRoleAssignmentTab: React.FC<UserRoleAssignmentTabProps> = ({ onSuccess, onError }) => {
  const [users, setUsers] = useState<AdminUserDTO[]>([])
  const [roles, setRoles] = useState<RbacRole[]>([])
  const [userRoles, setUserRoles] = useState<Record<number, RbacRole[]>>({}) // Track roles for each user
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Assignment state
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUserDTO | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

  const showSuccess = (message: string) => onSuccess?.(message)
  const showError = (message: string) => onError?.(message)

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, rolesRes] = await Promise.all([
        adminUserAPI.listAdminUsers({ page: 0, size: 1000 }), // Get admin users (SUPER_ADMIN role)
        rbacAPI.listRoles()
      ])

      // Extract admin users from paginated response
      const adminUsers = usersRes.data?.content || []

      setUsers(adminUsers)
      setRoles(rolesRes.data || [])

      // Load RBAC roles for each admin user
      const userRolesMap: Record<number, RbacRole[]> = {}
      for (const user of adminUsers) {
        try {
          const userRolesRes = await rbacAPI.getUserRoles(user.id)
          userRolesMap[user.id] = userRolesRes.data || []
        } catch (error) {
          // If user has no roles or error fetching, set empty array
          userRolesMap[user.id] = []
        }
      }
      setUserRoles(userRolesMap)
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'Failed to load data')
      // Ensure state is reset to empty arrays on error
      setUsers([])
      setRoles([])
      setUserRoles({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = (users || []).filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openAssignmentDialog = (user: AdminUserDTO) => {
    setSelectedUser(user)
    // Get current role IDs for this user
    const currentRoles = userRoles[user.id] || []
    setSelectedRoleIds(currentRoles.map(role => role.id))
    setShowAssignmentDialog(true)
  }

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds(prev => [...prev, roleId])
    } else {
      setSelectedRoleIds(prev => prev.filter(id => id !== roleId))
    }
  }

  const handleUpdateUserRoles = async () => {
    if (!selectedUser) return
    try {
      setLoading(true)
      // Use the admin user API to update roles
      await adminUserAPI.updateUserRoles(selectedUser.id, selectedRoleIds)
      await loadData()
      setShowAssignmentDialog(false)
      setSelectedUser(null)
      showSuccess('User roles updated successfully')
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'Failed to update user roles')
    } finally {
      setLoading(false)
    }
  }

  const getUserRoleNames = (userId: number) => {
    const roles = userRoles[userId] || []
    return roles.map(role => role.name)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin User Role Assignment</h2>
          <p className="text-gray-600">Assign RBAC roles to administrative users</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Admin Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            Manage RBAC role assignments for administrative users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No admin users found matching your search' : 'No admin users found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.email && <div>{user.email}</div>}
                        {user.phoneNumber && <div className="text-gray-500">{user.phoneNumber}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getFormattedDisplayRole(user)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getUserRoleNames(user.id).length > 0 ? (
                          getUserRoleNames(user.id).map((roleName, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {roleName}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            No RBAC roles
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignmentDialog(user)}
                        className="flex items-center gap-2"
                      >
                        <UserCog className="h-4 w-4" />
                        Manage Roles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Assign RBAC roles to {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">User Information</span>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {selectedUser?.fullName}</div>
                <div><strong>Email:</strong> {selectedUser?.email}</div>
                <div><strong>Account Type:</strong> {selectedUser ? getFormattedDisplayRole(selectedUser) : 'Unknown'}</div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Available Roles</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-4 mt-2">
                {(roles || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No roles available</p>
                ) : (
                  (roles || []).map((role) => (
                    <div key={role.id} className="flex items-start space-x-3 mb-3">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={(checked: boolean) => handleRoleToggle(role.id, checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`role-${role.id}`} className="text-sm font-medium cursor-pointer">
                          {role.name}
                        </Label>
                        {role.description && (
                          <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {role.permissions?.length || 0} permissions
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedRoleIds.length > 0 && (
              <div className="border rounded-lg p-3 bg-blue-50">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Selected Roles ({selectedRoleIds.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedRoleIds.map(roleId => {
                    const role = (roles || []).find(r => r.id === roleId)
                    return role ? (
                      <Badge key={roleId} variant="default" className="text-xs">
                        {role.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUserRoles} disabled={loading}>
              Update Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserRoleAssignmentTab
