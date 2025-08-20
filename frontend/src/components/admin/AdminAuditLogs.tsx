import React, { useEffect, useMemo, useState } from 'react'
import { auditAPI, type AuditLogDto } from '../../services/api'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

export const AdminAuditLogs: React.FC = () => {
  const [filters, setFilters] = useState<{ actorId?: string; action?: string; resourceType?: string; from?: string; to?: string }>({})
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [data, setData] = useState<{ content: AuditLogDto[]; page: number; size: number; totalElements: number; totalPages: number; hasNext: boolean } | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<AuditLogDto | null>(null)
  const totalPages = useMemo(() => data?.totalPages ?? 0, [data])

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

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <Card className="p-4 space-y-3">
        <div className="grid md:grid-cols-5 gap-3">
          <div>
            <Label htmlFor="actorId">Actor ID</Label>
            <Input id="actorId" value={filters.actorId || ''} onChange={e => setFilters(f => ({ ...f, actorId: e.target.value }))} placeholder="e.g. 42" />
          </div>
          <div>
            <Label htmlFor="action">Action</Label>
            <Input id="action" value={filters.action || ''} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))} placeholder="e.g. NOTIFY_BROADCAST" />
          </div>
          <div>
            <Label htmlFor="resourceType">Resource</Label>
            <Input id="resourceType" value={filters.resourceType || ''} onChange={e => setFilters(f => ({ ...f, resourceType: e.target.value }))} placeholder="e.g. NOTIFICATION" />
          </div>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={filters.from || ''} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={filters.to || ''} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onApply} disabled={loading}>Apply</Button>
          <Button variant="secondary" onClick={onClear} disabled={loading}>Clear</Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">{data ? `${data.totalElements} results` : ''}</div>
          <div className="flex items-center gap-2">
            <Label htmlFor="size" className="text-xs">Page Size</Label>
            <Input id="size" type="number" className="w-20" min={5} max={100} value={size} onChange={e => setSize(Math.max(5, Math.min(100, parseInt(e.target.value) || 20)))} />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Resource ID</TableHead>
              <TableHead>At</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.content?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.actorUsername || row.actorId || '-'}</TableCell>
                <TableCell className="font-mono text-xs">{row.action}</TableCell>
                <TableCell>{row.resourceType}</TableCell>
                <TableCell>{row.resourceId || '-'}</TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => setSelected(row)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-4">
          <Button variant="secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={loading || page === 0}>Prev</Button>
          <div className="text-sm">Page {page + 1} / {Math.max(1, totalPages)}</div>
          <Button variant="secondary" onClick={() => setPage(p => (data?.hasNext ? p + 1 : p))} disabled={loading || !data?.hasNext}>Next</Button>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Actor:</strong> {selected.actorUsername || selected.actorId || '-'}</div>
                <div><strong>Action:</strong> {selected.action}</div>
                <div><strong>Resource:</strong> {selected.resourceType}</div>
                <div><strong>Resource ID:</strong> {selected.resourceId || '-'}</div>
                <div><strong>IP:</strong> {selected.ip || '-'}</div>
                <div><strong>User Agent:</strong> {selected.userAgent || '-'}</div>
                <div className="col-span-2"><strong>At:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
              </div>
              {selected.metadata && (
                <div>
                  <div className="text-sm font-semibold mb-1">Metadata</div>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-80">{JSON.stringify(selected.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminAuditLogs
