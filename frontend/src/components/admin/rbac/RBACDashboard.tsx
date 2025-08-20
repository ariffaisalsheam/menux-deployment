import React, { useEffect, useMemo, useState } from 'react'
import { rbacAPI, type RbacRole, type RbacPermission } from '../../../services/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'

export const RBACDashboard: React.FC = () => {
  const [roles, setRoles] = useState<RbacRole[]>([])
  const [permissions, setPermissions] = useState<RbacPermission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create role state
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')

  // Permissions tab state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedPerms, setSelectedPerms] = useState<Record<string, boolean>>({})

  // User Role Assignment state
  const [userIdInput, setUserIdInput] = useState('')
  const [assignRoleId, setAssignRoleId] = useState<string>('')

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [r, p] = await Promise.all([
        rbacAPI.listRoles(),
        rbacAPI.listPermissions()
      ])
      setRoles(r)
      setPermissions(p)
    } catch (e: any) {
      setError(e?.message || 'Failed to load RBAC data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const selectedRole = useMemo(() => roles.find(r => String(r.id) === selectedRoleId) || null, [roles, selectedRoleId])

  useEffect(() => {
    if (selectedRole) {
      const map: Record<string, boolean> = {}
      selectedRole.permissions.forEach(k => { map[k] = true })
      setSelectedPerms(map)
    } else {
      setSelectedPerms({})
    }
  }, [selectedRole])

  const onCreateRole = async () => {
    if (!newRoleName.trim()) return
    try {
      setLoading(true)
      await rbacAPI.createRole({ name: newRoleName.trim(), description: newRoleDesc.trim() || undefined })
      setNewRoleName('')
      setNewRoleDesc('')
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const onDeleteRole = async (id: number) => {
    if (!confirm('Delete this role?')) return
    try {
      setLoading(true)
      await rbacAPI.deleteRole(id)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete role')
    } finally {
      setLoading(false)
    }
  }

  const togglePerm = (key: string) => {
    setSelectedPerms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const onSaveRolePermissions = async () => {
    if (!selectedRole) return
    const keys = Object.keys(selectedPerms).filter(k => selectedPerms[k])
    try {
      setLoading(true)
      await rbacAPI.setRolePermissions(selectedRole.id, keys)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to save permissions')
    } finally {
      setLoading(false)
    }
  }

  const onAssignRole = async () => {
    const uid = parseInt(userIdInput)
    const rid = parseInt(assignRoleId)
    if (!uid || !rid) return
    try {
      setLoading(true)
      await rbacAPI.assignRoleToUser(uid, rid)
      alert('Role assigned')
    } catch (e: any) {
      setError(e?.message || 'Failed to assign role')
    } finally {
      setLoading(false)
    }
  }

  const onRevokeRole = async () => {
    const uid = parseInt(userIdInput)
    const rid = parseInt(assignRoleId)
    if (!uid || !rid) return
    try {
      setLoading(true)
      await rbacAPI.revokeRoleFromUser(uid, rid)
      alert('Role revoked')
    } catch (e: any) {
      setError(e?.message || 'Failed to revoke role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">RBAC Management</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-3">
              <h2 className="font-semibold">Create Role</h2>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="roleName">Name</Label>
                  <Input id="roleName" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. SUPPORT_AGENT" />
                </div>
                <div>
                  <Label htmlFor="roleDesc">Description</Label>
                  <Input id="roleDesc" value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} placeholder="Optional" />
                </div>
                <Button onClick={onCreateRole} disabled={loading || !newRoleName.trim()}>Create Role</Button>
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-2">Existing Roles</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.description || '-'}</TableCell>
                      <TableCell>{r.permissions?.length || 0}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => onDeleteRole(r.id)} disabled={loading}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <Label>Role</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button onClick={onSaveRolePermissions} disabled={!selectedRole || loading}>Save Permissions</Button>
              </div>
            </div>

            {selectedRole ? (
              <div className="grid md:grid-cols-3 gap-2 mt-4">
                {permissions.map(p => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!selectedPerms[p.key]} onChange={() => togglePerm(p.key)} />
                    <span className="font-mono">{p.key}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Select a role to edit permissions.</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="user-roles">
          <Card className="p-4 space-y-3">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input id="userId" value={userIdInput} onChange={e => setUserIdInput(e.target.value)} placeholder="e.g. 42" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={assignRoleId} onValueChange={setAssignRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={onAssignRole} disabled={loading || !userIdInput || !assignRoleId}>Assign</Button>
                <Button variant="secondary" onClick={onRevokeRole} disabled={loading || !userIdInput || !assignRoleId}>Revoke</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Tip: Use the User Management page to find user IDs.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RBACDashboard
