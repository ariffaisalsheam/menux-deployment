import React, { useState, useEffect } from 'react'
import { adminUserAPI, rbacAPI, type AdminUserDTO, type RbacRole, type CreateAdminUserRequest } from '../../../services/api'
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
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  UserPlus,
  Shield
} from 'lucide-react'
import { PermissionGuard } from '../../../hooks/usePermissions'

interface AdminUsersTabProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ onSuccess, onError }) => {
  const [adminUsers, setAdminUsers] = useState<AdminUserDTO[]>([])
  const [roles, setRoles] = useState<RbacRole[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Create user state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState<CreateAdminUserRequest>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    roleIds: [],
    isActive: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Edit user state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUserDTO | null>(null)
  const [editForm, setEditForm] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    roleIds: [] as number[],
    isActive: true,
    newPassword: '',
    confirmNewPassword: ''
  })

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AdminUserDTO | null>(null)

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, rolesRes] = await Promise.all([
        adminUserAPI.searchAdminUsers(searchTerm),
        rbacAPI.listRoles()
      ])
      setAdminUsers(usersRes.data)
      setRoles(rolesRes.data)
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Failed to load admin users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [searchTerm])

  // Create user
  const handleCreateUser = async () => {
    try {
      if (createForm.password !== createForm.confirmPassword) {
        onError?.('Password confirmation does not match')
        return
      }

      if (createForm.roleIds.length === 0) {
        onError?.('Please select at least one role')
        return
      }

      setLoading(true)
      await adminUserAPI.createAdminUser(createForm)
      
      setShowCreateDialog(false)
      setCreateForm({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        fullName: '',
        phoneNumber: '',
        roleIds: [],
        isActive: true
      })
      
      await loadData()
      onSuccess?.('Admin user created successfully')
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Failed to create admin user')
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setLoading(true)
      await adminUserAPI.deleteAdminUser(userToDelete.id)
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
      await loadData()
      onSuccess?.('Admin user deleted successfully')
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Failed to delete admin user')
    } finally {
      setLoading(false)
    }
  }

  const openDeleteConfirmation = (user: AdminUserDTO) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirmation = () => {
    setDeleteConfirmOpen(false)
    setUserToDelete(null)
  }

  // Edit user functions
  const openEditDialog = (user: AdminUserDTO) => {
    setEditingUser(user)
    setEditForm({
      email: user.email || '',
      fullName: user.fullName,
      phoneNumber: user.phoneNumber || '',
      roleIds: user.rbacRoles.map(role => role.id),
      isActive: user.isActive,
      newPassword: '',
      confirmNewPassword: ''
    })
    setShowEditDialog(true)
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    try {
      if (editForm.newPassword && editForm.newPassword !== editForm.confirmNewPassword) {
        onError?.('Password confirmation does not match')
        return
      }

      setLoading(true)
      const updateData = {
        email: editForm.email,
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
        roleIds: editForm.roleIds,
        isActive: editForm.isActive,
        ...(editForm.newPassword && {
          newPassword: editForm.newPassword,
          confirmNewPassword: editForm.confirmNewPassword
        })
      }

      await adminUserAPI.updateAdminUser(editingUser.id, updateData)

      setShowEditDialog(false)
      setEditingUser(null)
      await loadData()
      onSuccess?.('Admin user updated successfully')
    } catch (error: any) {
      onError?.(error.response?.data?.message || 'Failed to update admin user')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    setCreateForm(prev => ({
      ...prev,
      roleIds: checked 
        ? [...prev.roleIds, roleId]
        : prev.roleIds.filter(id => id !== roleId)
    }))
  }

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
    
    return {
      strength,
      label: labels[strength] || 'Very Weak',
      color: colors[strength] || 'bg-red-500'
    }
  }

  const passwordStrength = getPasswordStrength(createForm.password)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Users</h2>
          <p className="text-gray-600">Manage system administrators and their permissions</p>
        </div>
        <PermissionGuard permission="MANAGE_USERS">
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Create Admin User
          </Button>
        </PermissionGuard>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search admin users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {adminUsers.length} users
        </Badge>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Users
          </CardTitle>
          <CardDescription>
            System administrators with elevated permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No admin users found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No users match your search criteria' : 'Create your first admin user to get started'}
              </p>
              <PermissionGuard permission="MANAGE_USERS">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Admin User
                </Button>
              </PermissionGuard>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user) => (
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
                      <div className="flex flex-wrap gap-1">
                        {user.rbacRoles.map((role) => (
                          <Badge key={role.id} variant="outline" className="text-xs">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {user.permissions.length} permissions
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <PermissionGuard permission="MANAGE_USERS">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => openDeleteConfirmation(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create Admin User
            </DialogTitle>
            <DialogDescription>
              Create a new system administrator with specific roles and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={createForm.username}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="admin_user"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Security</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={createForm.password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter secure password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {createForm.password && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={createForm.confirmPassword}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {createForm.confirmPassword && createForm.password !== createForm.confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Assignment
              </h3>
              <p className="text-sm text-gray-600">Select the roles to assign to this admin user.</p>
              
              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={createForm.roleIds.includes(role.id)}
                      onCheckedChange={(checked: boolean) => handleRoleToggle(role.id, checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`role-${role.id}`} className="text-sm font-medium cursor-pointer">
                        {role.name}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm.key} variant="outline" className="text-xs">
                            {perm.key}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={loading || !createForm.username || !createForm.password || !createForm.fullName || createForm.roleIds.length === 0}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update the details and permissions for {editingUser?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-fullName">Full Name *</Label>
                  <Input
                    id="edit-fullName"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                  <Input
                    id="edit-phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="edit-isActive"
                    checked={editForm.isActive}
                    onCheckedChange={(checked: boolean) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="edit-isActive">Active User</Label>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Change Password (Optional)</h3>
              <p className="text-sm text-gray-600">Leave blank to keep current password</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-newPassword">New Password</Label>
                  <Input
                    id="edit-newPassword"
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="edit-confirmNewPassword"
                    type="password"
                    value={editForm.confirmNewPassword}
                    onChange={(e) => setEditForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>

            {/* Role Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Assignment
              </h3>
              <p className="text-sm text-gray-600">Select the roles to assign to this admin user.</p>

              <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`edit-role-${role.id}`}
                      checked={editForm.roleIds.includes(role.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setEditForm(prev => ({ ...prev, roleIds: [...prev.roleIds, role.id] }))
                        } else {
                          setEditForm(prev => ({ ...prev, roleIds: prev.roleIds.filter(id => id !== role.id) }))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`edit-role-${role.id}`} className="text-sm font-medium cursor-pointer">
                        {role.name}
                      </Label>
                      {role.description && (
                        <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm.key} variant="outline" className="text-xs">
                            {perm.key}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={loading || !editForm.fullName || editForm.roleIds.length === 0}
            >
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the admin user "{userToDelete?.fullName}" (@{userToDelete?.username})?
              <br /><br />
              <strong>This action cannot be undone.</strong> The user will lose access to the system immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteConfirmation}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminUsersTab
