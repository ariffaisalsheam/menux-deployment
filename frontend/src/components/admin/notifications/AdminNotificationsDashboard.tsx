import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Card } from '../../ui/card'
import { Button } from '../../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Input } from '../../ui/input'
import { notificationAdminAPI } from '../../../services/api'
import FCMComposer from './FCMComposer'
import AdminNotifications from '../AdminNotifications'

// Minimal scaffold tabs for Templates, Segments, Campaigns, Analytics

const TemplatesTab: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{ id: number; name: string; channel: 'push' | 'email' | 'in_app'; title?: string; body: string; variables?: string[]; enabled: boolean; updatedAt?: string }>>([])
  const [notAvailable, setNotAvailable] = useState(false)
  // Create form state
  const [tName, setTName] = useState('')
  const [tChannel, setTChannel] = useState<'push' | 'email' | 'in_app'>('push')
  const [tTitle, setTTitle] = useState('')
  const [tBody, setTBody] = useState('')
  const [tVars, setTVars] = useState('')
  const [tEnabled, setTEnabled] = useState(true)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await notificationAdminAPI.listTemplates()
      setItems(res)
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404 || status === 501) {
        setNotAvailable(true)
        setError(null)
      } else {
        setError(e?.message || 'Failed to load templates')
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const onCreate = async () => {
    if (notAvailable) return
    const name = tName.trim()
    const body = tBody.trim()
    if (!name || !body) { setError('Name and Body are required'); return }
    try {
      setLoading(true)
      const variables = tVars.split(',').map(s => s.trim()).filter(Boolean)
      await notificationAdminAPI.createTemplate({
        name,
        channel: tChannel,
        title: tTitle.trim() || undefined,
        body,
        variables: variables.length ? variables : undefined,
        enabled: tEnabled,
      })
      setTName(''); setTTitle(''); setTBody(''); setTVars(''); setTEnabled(true)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Create Template</h3>
          <div className="flex gap-2">
            <Button onClick={load} variant="secondary" disabled={loading}>Refresh</Button>
            <Button onClick={onCreate} disabled={notAvailable || loading || !tName.trim() || !tBody.trim()}>Create</Button>
          </div>
        </div>
        {notAvailable && <div className="text-xs text-muted-foreground">Templates admin API is not available on the server yet.</div>}
        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Name" value={tName} onChange={e => setTName(e.target.value)} disabled={notAvailable} />
          <div className="flex gap-2 items-center">
            <label className="text-sm text-muted-foreground">Channel</label>
            <select className="border rounded px-2 py-1 text-sm" value={tChannel} onChange={e => setTChannel(e.target.value as any)} disabled={notAvailable}>
              <option value="push">push</option>
              <option value="email">email</option>
              <option value="in_app">in_app</option>
            </select>
          </div>
          <Input placeholder="Title (optional)" value={tTitle} onChange={e => setTTitle(e.target.value)} disabled={notAvailable} />
          <Input placeholder="Variables (comma separated)" value={tVars} onChange={e => setTVars(e.target.value)} disabled={notAvailable} />
          <Input placeholder="Body" value={tBody} onChange={e => setTBody(e.target.value)} disabled={notAvailable} />
          <div className="flex items-center gap-2">
            <input id="tpl-enabled" type="checkbox" checked={tEnabled} onChange={e => setTEnabled(e.target.checked)} disabled={notAvailable} />
            <label htmlFor="tpl-enabled" className="text-sm">Enabled</label>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Templates</h3>
          <Button onClick={load} variant="secondary" disabled={loading}>Refresh</Button>
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {notAvailable ? (
          <div className="text-sm text-muted-foreground mt-1">
            Templates admin API is not available on the server yet. This tab will be enabled after backend rollout.
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.channel}</TableCell>
                <TableCell>{t.enabled ? 'Yes' : 'No'}</TableCell>
                <TableCell>{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '-'}</TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" disabled>Edit</Button>
                  <Button size="sm" variant="destructive" disabled>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
        {(!loading && !notAvailable && items.length === 0) && <div className="text-sm text-muted-foreground mt-2">No templates yet.</div>}
      </Card>
    </div>
  )
}

const SegmentsTab: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{ id: number; name: string; description?: string; filters: Record<string, any>; estimatedCount?: number; updatedAt?: string }>>([])
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [notAvailable, setNotAvailable] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await notificationAdminAPI.listSegments()
      setItems(res)
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404 || status === 501) {
        setNotAvailable(true)
        setError(null)
      } else {
        setError(e?.message || 'Failed to load segments')
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const onCreate = async () => {
    if (notAvailable || !newName.trim()) return
    try {
      setLoading(true)
      await notificationAdminAPI.createSegment({ name: newName.trim(), description: newDesc.trim() || undefined, filters: {} })
      setNewName(''); setNewDesc('')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create segment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Create Segment</h3>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <Input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} disabled={notAvailable} />
          <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} disabled={notAvailable} />
          <Button onClick={onCreate} disabled={notAvailable || loading || !newName.trim()}>Create</Button>
        </div>
        <p className="text-xs text-muted-foreground">Scaffold: filters editor coming later.</p>
        <p className="text-xs text-muted-foreground">Next: go to Campaigns tab to create a campaign using this segment and a template.</p>
        {notAvailable && (
          <div className="text-xs text-muted-foreground">Segments admin API is not available on the server yet.</div>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Segments</h3>
          <Button onClick={load} variant="secondary" disabled={loading}>Refresh</Button>
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {notAvailable ? (
          <div className="text-sm text-muted-foreground">Segments admin API is not available on the server yet.</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Est. Count</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.description || '-'}</TableCell>
                <TableCell>{s.estimatedCount ?? '-'}</TableCell>
                <TableCell>{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
        {(!loading && !notAvailable && items.length === 0) && <div className="text-sm text-muted-foreground mt-2">No segments yet.</div>}
      </Card>
    </div>
  )
}

const CampaignsTab: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Array<{ id: number; name: string; status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED'; scheduleAt?: string | null }>>([])
  const [notAvailable, setNotAvailable] = useState(false)
  // Create form state
  const [cName, setCName] = useState('')
  const [templates, setTemplates] = useState<Array<{ id: number; name: string }>>([])
  const [segments, setSegments] = useState<Array<{ id: number; name: string }>>([])
  const [templateId, setTemplateId] = useState<number | ''>('')
  const [segmentId, setSegmentId] = useState<number | ''>('')
  const [scheduleAt, setScheduleAt] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await notificationAdminAPI.listCampaigns()
      setItems(res)
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404 || status === 501) {
        setNotAvailable(true)
        setError(null)
      } else {
        setError(e?.message || 'Failed to load campaigns')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadRefs = async () => {
    try {
      const [tpls, segs] = await Promise.all([
        notificationAdminAPI.listTemplates(),
        notificationAdminAPI.listSegments(),
      ])
      setTemplates(tpls.map((t: any) => ({ id: t.id, name: t.name })))
      setSegments(segs.map((s: any) => ({ id: s.id, name: s.name })))
    } catch (_) {
      // ignore
    }
  }

  useEffect(() => { load(); loadRefs() }, [])

  const onCreate = async () => {
    if (notAvailable) return
    const name = cName.trim()
    if (!name || !templateId || !segmentId) { setError('Name, Template and Segment are required'); return }
    try {
      setLoading(true)
      await notificationAdminAPI.createCampaign({
        name,
        templateId: Number(templateId),
        segmentId: Number(segmentId),
        scheduleAt: scheduleAt.trim() || undefined,
      })
      setCName(''); setTemplateId(''); setSegmentId(''); setScheduleAt('')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Create Campaign</h3>
          <div className="flex gap-2">
            <Button onClick={load} variant="secondary" disabled={loading}>Refresh</Button>
            <Button onClick={onCreate} disabled={notAvailable || loading || !cName.trim() || !templateId || !segmentId}>Create</Button>
          </div>
        </div>
        {notAvailable && <div className="text-xs text-muted-foreground">Campaigns admin API is not available on the server yet.</div>}
        <div className="grid md:grid-cols-2 gap-3">
          <Input placeholder="Name" value={cName} onChange={e => setCName(e.target.value)} disabled={notAvailable} />
          <div className="flex gap-2 items-center">
            <label className="text-sm text-muted-foreground">Template</label>
            <select className="border rounded px-2 py-1 text-sm" value={templateId} onChange={e => setTemplateId(e.target.value ? Number(e.target.value) : '')} disabled={notAvailable}>
              <option value="">Select</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-muted-foreground">Segment</label>
            <select className="border rounded px-2 py-1 text-sm" value={segmentId} onChange={e => setSegmentId(e.target.value ? Number(e.target.value) : '')} disabled={notAvailable}>
              <option value="">Select</option>
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input placeholder="ScheduleAt (YYYY-MM-DDTHH:mm:ss) optional" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} disabled={notAvailable} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Campaigns</h3>
          <Button onClick={load} variant="secondary" disabled={loading}>Refresh</Button>
        </div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {notAvailable ? (
          <div className="text-sm text-muted-foreground">Campaigns admin API is not available on the server yet.</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Schedule</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.status}</TableCell>
                <TableCell>{c.scheduleAt ? new Date(c.scheduleAt).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
        {(!loading && !notAvailable && items.length === 0) && <div className="text-sm text-muted-foreground mt-2">No campaigns yet.</div>}
      </Card>
    </div>
  )
}

const AnalyticsTab: React.FC = () => {
  const [summary, setSummary] = useState<{ sent: number; delivered: number; failed: number; opened?: number; clicked?: number; unsubscribed?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const load = async () => {
    setError(null); setLoading(true)
    try {
      const res = await notificationAdminAPI.getAnalyticsSummary({})
      setSummary(res)
      setLastUpdated(new Date().toLocaleString())
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404 || status === 501) {
        setNotAvailable(true)
        setError(null)
      } else {
        setError(e?.message || 'Failed to load analytics')
      }
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Delivery & Engagement</h3>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-xs text-muted-foreground">Updated: {lastUpdated}</span>}
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
        </div>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {notAvailable ? (
        <div className="text-sm text-muted-foreground">Analytics API is not available on the server yet.</div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded border"><div className="text-muted-foreground">Sent</div><div className="text-xl font-semibold">{summary.sent}</div></div>
          <div className="p-3 rounded border"><div className="text-muted-foreground">Delivered</div><div className="text-xl font-semibold">{summary.delivered}</div></div>
          <div className="p-3 rounded border"><div className="text-muted-foreground">Failed</div><div className="text-xl font-semibold">{summary.failed}</div></div>
          {summary.opened !== undefined && <div className="p-3 rounded border"><div className="text-muted-foreground">Opened</div><div className="text-xl font-semibold">{summary.opened}</div></div>}
          {summary.clicked !== undefined && <div className="p-3 rounded border"><div className="text-muted-foreground">Clicked</div><div className="text-xl font-semibold">{summary.clicked}</div></div>}
          {summary.unsubscribed !== undefined && <div className="p-3 rounded border"><div className="text-muted-foreground">Unsubscribed</div><div className="text-xl font-semibold">{summary.unsubscribed}</div></div>}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No data yet.</div>
      )}
    </Card>
  )
}

export const AdminNotificationsDashboard: React.FC = () => {
  const [active, setActive] = useState<'operations' | 'compose' | 'templates' | 'segments' | 'campaigns' | 'analytics'>('operations')
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Notifications Admin</h1>
      <Tabs value={active} onValueChange={v => setActive(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          {active === 'operations' && <AdminNotifications />}
        </TabsContent>

        <TabsContent value="templates">
          {active === 'templates' && <TemplatesTab />}
        </TabsContent>

        <TabsContent value="compose">
          {active === 'compose' && <FCMComposer />}
        </TabsContent>

        <TabsContent value="segments">
          {active === 'segments' && <SegmentsTab />}
        </TabsContent>

        <TabsContent value="campaigns">
          {active === 'campaigns' && <CampaignsTab />}
        </TabsContent>

        <TabsContent value="analytics">
          {active === 'analytics' && <AnalyticsTab />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminNotificationsDashboard
