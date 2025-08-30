import React, { useEffect, useMemo, useState } from 'react'
import { auditAPI, type AuditLogDto } from '../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Search, Filter, Eye, RefreshCw, AlertTriangle, Shield, Trash2, Trash } from 'lucide-react'
import { PermissionGuard } from '../../hooks/usePermissions'

export const AdminAuditLogs: React.FC = () => {
  const [filters, setFilters] = useState<{
    actorId?: string;
    action?: string;
    resourceType?: string;
    from?: string;
    to?: string;
    search?: string;
  }>({})
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [data, setData] = useState<{ content: AuditLogDto[]; page: number; size: number; totalElements: number; totalPages: number; hasNext: boolean } | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const [selected, setSelected] = useState<AuditLogDto | null>(null)
  const totalPages = useMemo(() => data?.totalPages ?? 0, [data])

  // Deletion state
  const [deletingLog, setDeletingLog] = useState<AuditLogDto | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [showClearCriteriaDialog, setShowClearCriteriaDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Common action types for dropdown
  const commonActions = [
    'USER_LOGIN', 'USER_LOGOUT', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
    'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE', 'PERMISSION_ASSIGN', 'PERMISSION_REVOKE',
    'RESTAURANT_CREATE', 'RESTAURANT_UPDATE', 'RESTAURANT_DELETE',
    'SUBSCRIPTION_CHANGE', 'PAYMENT_PROCESS', 'NOTIFICATION_SEND'
  ]

  // Common resource types for dropdown
  const commonResourceTypes = [
    'USER', 'ROLE', 'PERMISSION', 'RESTAURANT', 'SUBSCRIPTION', 'PAYMENT', 'NOTIFICATION'
  ]

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await auditAPI.list({
        actorId: filters.actorId ? parseInt(filters.actorId) : undefined,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        size,
      })
      setData(res)
    } catch (e: any) {
      setError(e?.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    load()
  }, [page, size, filters.actorId, filters.action, filters.resourceType, filters.from, filters.to])

  // Deletion handlers
  const handleDeleteLog = (log: AuditLogDto) => {
    setDeletingLog(log)
    setShowDeleteDialog(true)
  }

  const confirmDeleteLog = async () => {
    if (!deletingLog) return

    setDeleteLoading(true)
    try {
      await auditAPI.deleteLog(deletingLog.id)
      setShowDeleteDialog(false)
      setDeletingLog(null)
      await load() // Reload data
    } catch (error) {
      console.error('Failed to delete audit log:', error)
      setError('Failed to delete audit log')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleClearAllLogs = () => {
    setShowClearAllDialog(true)
  }

  const confirmClearAllLogs = async () => {
    setDeleteLoading(true)
    try {
      await auditAPI.clearAllLogs()
      setShowClearAllDialog(false)
      await load() // Reload data
    } catch (error) {
      console.error('Failed to clear all logs:', error)
      setError('Failed to clear all logs')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleClearByCriteria = () => {
    setShowClearCriteriaDialog(true)
  }

  const confirmClearByCriteria = async () => {
    setDeleteLoading(true)
    try {
      await auditAPI.clearLogsByCriteria({
        actorId: filters.actorId ? parseInt(filters.actorId) : undefined,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      })
      setShowClearCriteriaDialog(false)
      await load() // Reload data
    } catch (error) {
      console.error('Failed to clear logs by criteria:', error)
      setError('Failed to clear logs by criteria')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Filter data locally for search functionality
  const filteredData = useMemo(() => {
    if (!data?.content || !filters.search) return data?.content || []

    const searchTerm = filters.search.toLowerCase()
    return data.content.filter(log =>
      log.action.toLowerCase().includes(searchTerm) ||
      log.resourceType.toLowerCase().includes(searchTerm) ||
      log.actorUsername?.toLowerCase().includes(searchTerm) ||
      log.resourceId?.toLowerCase().includes(searchTerm) ||
      log.ip?.toLowerCase().includes(searchTerm)
    )
  }, [data?.content, filters.search])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size])

  const onApply = async () => {
    setPage(0)
    await load()
  }

  const onClear = () => {
    setFilters({})
    setPage(0)
  }

  const formatActionType = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800'
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <PermissionGuard
      permission="VIEW_AUDIT_LOGS"
      fallback={
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
                  <p className="text-gray-600 max-w-md">
                    You need the <code className="bg-gray-100 px-2 py-1 rounded text-sm">VIEW_AUDIT_LOGS</code> permission
                    to access the audit logs interface.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Contact your system administrator to request access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">Monitor system activities and user actions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => load()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleClearByCriteria}
              disabled={loading || deleteLoading}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filtered
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllLogs}
              disabled={loading || deleteLoading}
              className="flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Clear All Logs
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Quick Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              Search & Filter
            </CardTitle>
            <CardDescription>
              Search through audit logs and apply filters to find specific activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by action, resource, user, IP address..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="action">Action Type</Label>
                    <Select value={filters.action || ''} onValueChange={(value) => setFilters(f => ({ ...f, action: value || undefined }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All actions</SelectItem>
                        {commonActions.map(action => (
                          <SelectItem key={action} value={action}>{formatActionType(action)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resourceType">Resource Type</Label>
                    <Select value={filters.resourceType || ''} onValueChange={(value) => setFilters(f => ({ ...f, resourceType: value || undefined }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All resources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All resources</SelectItem>
                        {commonResourceTypes.map(resource => (
                          <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="from">From Date</Label>
                    <Input
                      id="from"
                      type="date"
                      value={filters.from || ''}
                      onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to">To Date</Label>
                    <Input
                      id="to"
                      type="date"
                      value={filters.to || ''}
                      onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={onApply} disabled={loading} className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={onClear} disabled={loading}>
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Audit Logs
                </CardTitle>
                <CardDescription>
                  {data ? `Showing ${filteredData.length} of ${data.totalElements} total entries` : 'Loading audit logs...'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="size" className="text-sm">Show</Label>
                <Select value={size.toString()} onValueChange={(value) => setSize(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">per page</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Loading audit logs...
                </div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No audit logs found</p>
                <p className="text-gray-400 text-sm">
                  {filters.search || filters.action || filters.resourceType || filters.from || filters.to
                    ? 'Try adjusting your search criteria or filters'
                    : 'No audit logs have been recorded yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="w-20">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm text-gray-600">
                          #{row.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {row.actorUsername || `User ${row.actorId}` || 'System'}
                            </span>
                            {row.ip && (
                              <span className="text-xs text-gray-500">{row.ip}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getActionBadgeColor(row.action)}`}>
                            {formatActionType(row.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row.resourceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.resourceId || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(row.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(row)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteLog(row)}
                              disabled={deleteLoading}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page + 1} of {totalPages} • {data.totalElements} total entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || loading}
                    onClick={() => setPage(0)}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || loading}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                    {page + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => setPage(totalPages - 1)}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Log Detail Dialog */}
        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Audit Log Details #{selected?.id}
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Action Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Action:</span>
                        <Badge className={`text-xs ${getActionBadgeColor(selected.action)}`}>
                          {formatActionType(selected.action)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Resource:</span>
                        <Badge variant="outline" className="text-xs">
                          {selected.resourceType}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Target ID:</span>
                        <span className="text-sm font-mono">{selected.resourceId || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">User & Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">User:</span>
                        <span className="text-sm font-medium">
                          {selected.actorUsername || `User ${selected.actorId}` || 'System'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">IP Address:</span>
                        <span className="text-sm font-mono">{selected.ip || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Timestamp:</span>
                        <span className="text-sm">{new Date(selected.createdAt).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* User Agent */}
                {selected.userAgent && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">User Agent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 break-all">{selected.userAgent}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Metadata */}
                {selected.metadata && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Additional Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-80 border">
                        {JSON.stringify(selected.metadata, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Single Log Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Audit Log</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete audit log #{deletingLog?.id}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteLog}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear All Logs Confirmation */}
        <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Audit Logs</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete ALL audit logs? This will permanently remove all audit trail data and cannot be undone.
                This is a destructive action that should only be performed with extreme caution.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmClearAllLogs}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? 'Clearing...' : 'Clear All Logs'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Logs by Criteria Confirmation */}
        <AlertDialog open={showClearCriteriaDialog} onOpenChange={setShowClearCriteriaDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Filtered Audit Logs</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all audit logs matching the current filter criteria? This action cannot be undone.
                {(filters.action || filters.resourceType || filters.actorId || filters.from || filters.to) ? (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                    <strong>Current filters:</strong>
                    {filters.action && <div>Action: {filters.action}</div>}
                    {filters.resourceType && <div>Resource: {filters.resourceType}</div>}
                    {filters.actorId && <div>Actor ID: {filters.actorId}</div>}
                    {filters.from && <div>From: {filters.from}</div>}
                    {filters.to && <div>To: {filters.to}</div>}
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-sm">
                    <strong>Warning:</strong> No filters are currently applied. This will delete ALL audit logs.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmClearByCriteria}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? 'Clearing...' : 'Clear Filtered Logs'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}

export default AdminAuditLogs
