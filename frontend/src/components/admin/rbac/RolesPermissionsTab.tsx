import React, { useState, useEffect } from 'react'
import { rbacAPI, type RbacRole, type RbacPermission } from '../../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Badge } from '../../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Checkbox } from '../../ui/checkbox'
import { Textarea } from '../../ui/textarea'
import {
  Shield,
  Key,
  Plus,
  Edit,
  Trash2,
  Settings,
  CheckCircle
} from 'lucide-react'

interface RolesPermissionsTabProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export const RolesPermissionsTab: React.FC<RolesPermissionsTabProps> = ({ onSuccess, onError }) => {
  const [roles, setRoles] = useState<RbacRole[]>([])
  const [permissions, setPermissions] = useState<RbacPermission[]>([])
  const [loading, setLoading] = useState(false)

  // Role management state
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false)
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false)
  const [showDeleteRoleDialog, setShowDeleteRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RbacRole | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')

  // Permission assignment state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  const showSuccess = (message: string) => onSuccess?.(message)
  const showError = (message: string) => onError?.(message)

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesRes, permsRes] = await Promise.all([
        rbacAPI.listRoles(),
        rbacAPI.listPermissions()
      ])
      setRoles(rolesRes.data)
      setPermissions(permsRes.data)
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return
    try {
      setLoading(true)
      await rbacAPI.createRole({ name: newRoleName, description: newRoleDesc })
      await loadData()
      setNewRoleName('')
      setNewRoleDesc('')
      setShowCreateRoleDialog(false)
      showSuccess('Role created successfully')
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole || !newRoleName.trim()) return
    try {
      setLoading(true)
      await rbacAPI.updateRole(selectedRole.id, { name: newRoleName, description: newRoleDesc })
      await loadData()
      setShowEditRoleDialog(false)
      setSelectedRole(null)
      showSuccess('Role updated successfully')
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole) return
    try {
      setLoading(true)
      await rbacAPI.deleteRole(selectedRole.id)
      await loadData()
      setShowDeleteRoleDialog(false)
      setSelectedRole(null)
      showSuccess('Role deleted successfully')
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'Failed to delete role')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) return
    try {
      setLoading(true)
      await rbacAPI.setRolePermissions(selectedRole.id, { permissionKeys: selectedPermissions })
      await loadData()
      setShowPermissionDialog(false)
      setSelectedRole(null)
      showSuccess('Role permissions updated successfully')
    } catch (e: any) {
      showError(e?.response?.data?.message || e?.message || 'Failed to update permissions')
    } finally {
      setLoading(false)
    }
  }

  const openEditRole = (role: RbacRole) => {
    setSelectedRole(role)
    setNewRoleName(role.name)
    setNewRoleDesc(role.description || '')
    setShowEditRoleDialog(true)
  }

  const openDeleteRole = (role: RbacRole) => {
    setSelectedRole(role)
    setShowDeleteRoleDialog(true)
  }

  const openPermissionDialog = (role: RbacRole) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions?.map(p => p.key) || [])
    setShowPermissionDialog(true)
  }

  const handlePermissionToggle = (permissionKey: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionKey])
    } else {
      setSelectedPermissions(prev => prev.filter(key => key !== permissionKey))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-gray-600">Manage roles and assign permissions</p>
        </div>
        <Button onClick={() => setShowCreateRoleDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Roles ({roles.length})
            </CardTitle>
            <CardDescription>
              Manage system roles and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading roles...</div>
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No roles found</p>
                <Button onClick={() => setShowCreateRoleDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Role
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{role.name}</h4>
                        {role.description && (
                          <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {role.permissions?.length || 0} permissions
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPermissionDialog(role)}
                          title="Manage Permissions"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditRole(role)}
                          title="Edit Role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteRole(role)}
                          title="Delete Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-500" />
              System Permissions ({permissions.length})
            </CardTitle>
            <CardDescription>
              Available system permissions (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading permissions...</div>
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No permissions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div key={permission.key} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium text-sm">{permission.key}</div>
                        {permission.description && (
                          <div className="text-xs text-gray-500">{permission.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new role that can be assigned to users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="roleDesc">Description (Optional)</Label>
              <Textarea
                id="roleDesc"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim() || loading}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editRoleName">Role Name</Label>
              <Input
                id="editRoleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="editRoleDesc">Description (Optional)</Label>
              <Textarea
                id="editRoleDesc"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={!newRoleName.trim() || loading}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={showDeleteRoleDialog} onOpenChange={setShowDeleteRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteRoleDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={loading}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Assignment Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Role Permissions</DialogTitle>
            <DialogDescription>
              Assign permissions to "{selectedRole?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4">
              {permissions.map((permission) => (
                <div key={permission.key} className="flex items-start space-x-3 mb-3">
                  <Checkbox
                    id={`perm-${permission.key}`}
                    checked={selectedPermissions.includes(permission.key)}
                    onCheckedChange={(checked: boolean) => handlePermissionToggle(permission.key, checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`perm-${permission.key}`} className="text-sm font-medium cursor-pointer">
                      {permission.key}
                    </Label>
                    {permission.description && (
                      <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRolePermissions} disabled={loading}>
              Update Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RolesPermissionsTab
