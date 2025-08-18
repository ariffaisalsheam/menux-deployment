import React, { useEffect, useState } from 'react'
import { adminSubscriptionAPI, restaurantAPI, type RestaurantSubscriptionDTO, type RestaurantSubscriptionEventDTO } from '../../services/api'

import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Textarea } from '../ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useToast } from '../../contexts/ToastContext'

interface SubscriptionDetailViewProps {
  restaurantId: number;
}

export const SubscriptionDetailView: React.FC<SubscriptionDetailViewProps> = ({ restaurantId }) => {

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [sub, setSub] = useState<RestaurantSubscriptionDTO | null>(null)
  const [events, setEvents] = useState<RestaurantSubscriptionEventDTO[]>([])

  // Restaurant full details
  interface AdminRestaurantDetails {
    id: number
    name?: string
    ownerName?: string
    subscriptionPlan?: 'BASIC' | 'PRO'
    address?: string
    phone?: string
    email?: string
  }
  const [restaurant, setRestaurant] = useState<AdminRestaurantDetails | null>(null)

  // UX: last updated timestamp
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  // Event History filtering/paging
  const [eventQuery, setEventQuery] = useState<string>('')
  const [eventPage, setEventPage] = useState<number>(1)
  const [eventPageSize, setEventPageSize] = useState<number>(10)

  const [grantDays, setGrantDays] = useState<string>('')
  const [grantBusy, setGrantBusy] = useState<boolean>(false)
  const [trialBusy, setTrialBusy] = useState<boolean>(false)
  const [debugBusy, setDebugBusy] = useState<boolean>(false)

  // New admin actions state
  const [setTrialDaysStr, setSetTrialDaysStr] = useState<string>('')
  const [setPaidDaysStr, setSetPaidDaysStr] = useState<string>('')
  const [setTrialDirectBusy, setSetTrialDirectBusy] = useState<boolean>(false)
  const [setPaidDirectBusy, setSetPaidDirectBusy] = useState<boolean>(false)
  const [suspendOpen, setSuspendOpen] = useState<boolean>(false)
  const [suspendReason, setSuspendReason] = useState<string>('')
  const [suspendBusy, setSuspendBusy] = useState<boolean>(false)
  const [unsuspendBusy, setUnsuspendBusy] = useState<boolean>(false)
  // Optimistic UI for suspend toggle
  const [optimisticSuspended, setOptimisticSuspended] = useState<null | boolean>(null)

  // Toasts
  const { success, error: toastError, info } = useToast()

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const askConfirm = (text: string, action: () => Promise<void>) => {
    setConfirmText(text)
    setConfirmAction(() => action)
    setConfirmOpen(true)
  }

  const isTrialEligible = (s?: RestaurantSubscriptionDTO | null) => {
    if (!s) return false
    if (s.status === 'TRIALING' || s.status === 'ACTIVE') return false
    if (s.trialEndAt) return false
    return true
  }

  const onConfirm = async () => {
    if (!confirmAction) return
    setConfirmSubmitting(true)
    try {
      await confirmAction()
    } finally {
      setConfirmSubmitting(false)
      setConfirmOpen(false)
      setConfirmAction(null)
      setConfirmText('')
    }
  }

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const loadAll = async () => {
    if (!restaurantId || isNaN(restaurantId)) return
    setLoading(true)
    setError('')
    try {
      const [s, ev, r] = await Promise.all([
        adminSubscriptionAPI.get(restaurantId),
        adminSubscriptionAPI.getEvents(restaurantId),
        restaurantAPI.getRestaurantById(restaurantId),
      ])
      setSub(s)
      setEvents(ev)
      setRestaurant(r)
      setLastUpdatedAt(new Date())
      // Clear optimistic marker after authoritative reload
      setOptimisticSuspended(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load subscription')
      toastError(e?.message || 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId])

  const onGrant = async () => {
    const days = parseInt(grantDays, 10)
    if (!days || isNaN(days) || days <= 0) {
      setError('Enter a valid number of days (> 0)')
      toastError('Enter a valid number of days (> 0)')
      return
    }
    setGrantBusy(true)
    setError('')
    try {
      const s = await adminSubscriptionAPI.grant(restaurantId, days)
      setSub(s)
      setGrantDays('')
      // refresh events
      const ev = await adminSubscriptionAPI.getEvents(restaurantId)
      setEvents(ev)
      setLastUpdatedAt(new Date())
      success(`Granted ${days} paid day${days === 1 ? '' : 's'}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to grant days')
      toastError(e?.message || 'Failed to grant days')
    } finally {
      setGrantBusy(false)
    }
  }

  const onStartTrial = async () => {
    setTrialBusy(true)
    setError('')
    try {
      const s = await adminSubscriptionAPI.startTrial(restaurantId)
      setSub(s)
      const ev = await adminSubscriptionAPI.getEvents(restaurantId)
      setEvents(ev)
      setLastUpdatedAt(new Date())
      success('Trial started')
    } catch (e: any) {
      setError(e?.message || 'Unable to start trial')
      toastError(e?.message || 'Unable to start trial')
    } finally {
      setTrialBusy(false)
    }
  }

  const onDebugDaily = async () => {
    setDebugBusy(true)
    setError('')
    try {
      info('Running daily lifecycle checks…')
      await adminSubscriptionAPI.debugRunDaily()
      await loadAll()
      success('Daily lifecycle checks completed')
    } catch (e: any) {
      setError(e?.message || 'Debug run failed')
      toastError(e?.message || 'Debug run failed')
    } finally {
      setDebugBusy(false)
    }
  }

  const onSetTrialDays = async () => {
    const days = parseInt(setTrialDaysStr, 10)
    if (!days || isNaN(days) || days <= 0) {
      setError('Enter a valid trial days number (> 0)')
      toastError('Enter a valid trial days number (> 0)')
      return
    }
    setSetTrialDirectBusy(true)
    setError('')
    try {
      const s = await adminSubscriptionAPI.setTrialDays(restaurantId, days)
      setSub(s)
      setSetTrialDaysStr('')
      const ev = await adminSubscriptionAPI.getEvents(restaurantId)
      setEvents(ev)
      setLastUpdatedAt(new Date())
      success(`Trial set to ${days} day${days === 1 ? '' : 's'}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to set trial days')
      toastError(e?.message || 'Failed to set trial days')
    } finally {
      setSetTrialDirectBusy(false)
    }
  }

  const onSetPaidDays = async () => {
    const days = parseInt(setPaidDaysStr, 10)
    if (!days || isNaN(days) || days <= 0) {
      setError('Enter a valid paid days number (> 0)')
      toastError('Enter a valid paid days number (> 0)')
      return
    }
    setSetPaidDirectBusy(true)
    setError('')
    try {
      const s = await adminSubscriptionAPI.setPaidDays(restaurantId, days)
      setSub(s)
      setSetPaidDaysStr('')
      const ev = await adminSubscriptionAPI.getEvents(restaurantId)
      setEvents(ev)
      setLastUpdatedAt(new Date())
      success(`Paid days set to ${days}`)
    } catch (e: any) {
      setError(e?.message || 'Failed to set paid days')
      toastError(e?.message || 'Failed to set paid days')
    } finally {
      setSetPaidDirectBusy(false)
    }
  }

  const onSuspend = async () => {
    setSuspendBusy(true)
    setError('')
    try {
      const updated = await adminSubscriptionAPI.suspend(restaurantId, suspendReason)
      // Immediate UI update from API response
      setSub(updated)
      setSuspendReason('')
      setSuspendOpen(false)
      setLastUpdatedAt(new Date())
      setOptimisticSuspended(true)
      success('Subscription suspended')
      // Background refresh to ensure events/status are in sync and bypass any caches
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to suspend account')
      toastError(e?.message || 'Failed to suspend account')
    } finally {
      setSuspendBusy(false)
    }
  }

  const onUnsuspend = async () => {
    setUnsuspendBusy(true)
    setError('')
    try {
      const updated = await adminSubscriptionAPI.unsuspend(restaurantId)
      // Immediate UI update from API response
      setSub(updated)
      setLastUpdatedAt(new Date())
      setOptimisticSuspended(false)
      success('Subscription unsuspended')
      // Background refresh to ensure events/status are in sync
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to unsuspend account')
      toastError(e?.message || 'Failed to unsuspend account')
    } finally {
      setUnsuspendBusy(false)
    }
  }

  const latestStateEvent = React.useMemo(() => {
    const candidates = events.filter(ev => {
      const t = (ev.eventType || '').toUpperCase()
      return t.includes('SUSPEND') || t.includes('UNSUSPEND') || t.includes('ACTIVAT')
    })
    if (candidates.length === 0) return null
    return candidates.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  }, [events])

  const suspendedByEvents = React.useMemo(() => {
    if (!latestStateEvent) return false
    const t = (latestStateEvent.eventType || '').toUpperCase()
    if (t.includes('UNSUSPEND') || t.includes('ACTIVAT')) return false
    if (t.includes('SUSPEND')) return true
    return false
  }, [latestStateEvent])
  const isSuspended =
    optimisticSuspended !== null
      ? optimisticSuspended
      : (sub?.status === 'SUSPENDED') || suspendedByEvents

  // Pretty print suspended reason from JSON metadata if present (latest SUSPENDED event)
  const suspendedReasonText = React.useMemo(() => {
    if (!isSuspended) return null
    // find the most recent true SUSPEND (not UNSUSPEND)
    const suspendedEvent = events
      .filter(ev => {
        const t = (ev.eventType || '').toUpperCase()
        return t.includes('SUSPEND') && !t.includes('UNSUSPEND')
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    const meta = suspendedEvent?.metadata
    if (!meta) return null
    try {
      const obj = JSON.parse(meta as string)
      if (obj && typeof obj.reason === 'string' && obj.reason.trim().length > 0) {
        return obj.reason as string
      }
    } catch {}
    return meta
  }, [events, isSuspended])

  // Derive display status for badge, prioritizing suspended state
  const displayStatus = isSuspended ? 'SUSPENDED' : (sub?.status ?? 'N/A')
  const statusBadgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
    displayStatus === 'ACTIVE' ? 'default'
    : displayStatus === 'TRIALING' ? 'secondary'
    : displayStatus === 'SUSPENDED' ? 'destructive'
    : 'outline'

  // One-click safety: compute whether actions are allowed
  const grantDaysNum = parseInt(grantDays, 10)
  const canGrant = !grantBusy && !confirmOpen && !isNaN(grantDaysNum) && grantDaysNum > 0

  const setTrialDaysNum = parseInt(setTrialDaysStr, 10)
  const canSetTrial = !setTrialDirectBusy && !confirmOpen && !isNaN(setTrialDaysNum) && setTrialDaysNum > 0

  const setPaidDaysNum = parseInt(setPaidDaysStr, 10)
  const canSetPaid = !setPaidDirectBusy && !confirmOpen && !isNaN(setPaidDaysNum) && setPaidDaysNum > 0

  const canStartTrial = !trialBusy && !confirmOpen && isTrialEligible(sub)

  const canToggleSuspend = !confirmOpen && !suspendBusy && !suspendOpen
  const canActivate = !confirmOpen && !unsuspendBusy

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Restaurant Subscription</h1>
              <Badge variant={statusBadgeVariant}>{displayStatus}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">Restaurant ID: {restaurantId}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={loadAll} disabled={loading || confirmOpen}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh subscription and events</TooltipContent>
          </Tooltip>
          {lastUpdatedAt && (
            <span className="text-xs text-muted-foreground ml-1">Last updated: {lastUpdatedAt?.toLocaleTimeString()}</span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" onClick={() => askConfirm('Run daily lifecycle checks now?', onDebugDaily)} disabled={debugBusy || confirmOpen}>
                {debugBusy ? 'Running…' : 'Run Daily'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Run daily lifecycle checks (debug)</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Separator className="my-1" />

      {error && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <Tabs defaultValue="overview" className="mt-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Details</CardTitle>
              <CardDescription>Basic information about the restaurant</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !restaurant ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : !restaurant ? (
                <div className="text-sm text-muted-foreground">No details available.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium">{restaurant?.name ?? '—'}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Plan</div>
                    <div className="font-medium">{restaurant?.subscriptionPlan ?? '—'}</div>
                  </div>
                  {restaurant?.ownerName && (
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Owner</div>
                      <div className="font-medium">{restaurant?.ownerName}</div>
                    </div>
                  )}
                  {restaurant?.address && (
                    <div className="rounded-lg border p-3 sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Address</div>
                      <div className="font-medium">{restaurant?.address}</div>
                    </div>
                  )}
                  {restaurant?.phone && (
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="font-medium">{restaurant?.phone}</div>
                    </div>
                  )}
                  {restaurant?.email && (
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="font-medium">{restaurant?.email}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Current subscription state</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && !sub ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <div className="space-y-3 text-sm">
                  {isSuspended && (
                    <div className="mb-1 p-3 rounded border border-red-300 bg-red-50 text-red-700">
                      <div className="font-medium">Suspended</div>
                      {suspendedReasonText && (
                        <div className="text-xs mt-1"><span className="font-medium">Reason:</span> {suspendedReasonText}</div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {typeof sub?.trialDaysRemaining === 'number' && (sub?.trialDaysRemaining ?? -1) >= 0 && (
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Trial days remaining</div>
                        <div className="text-lg font-semibold">{sub?.trialDaysRemaining}</div>
                      </div>
                    )}
                    {typeof sub?.paidDaysRemaining === 'number' && (sub?.paidDaysRemaining ?? -1) >= 0 && (
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Paid days remaining</div>
                        <div className="text-lg font-semibold">{sub?.paidDaysRemaining}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {isTrialEligible(sub) && (
            <Card>
              <CardHeader>
                <CardTitle>Start Trial</CardTitle>
                <CardDescription>Start a trial for this restaurant if eligible.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button onClick={() => askConfirm('Start trial for this restaurant?', onStartTrial)} disabled={!canStartTrial}>
                        {trialBusy ? 'Starting…' : 'Start Trial'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Start a trial period</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grant Paid Days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="grant-days">Days</Label>
                  <Input id="grant-days" type="number" inputMode="numeric" placeholder="e.g. 7" value={grantDays} onChange={(e) => setGrantDays(e.target.value)} />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button onClick={() => askConfirm(`Grant ${grantDays || 0} paid days?`, onGrant)} disabled={!canGrant}>
                        {grantBusy ? 'Granting…' : 'Grant'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Grant additional paid days</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Set Trial Days</CardTitle>
                <CardDescription>Overwrite trial to start today and end after N days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="set-trial-days">Days</Label>
                  <Input id="set-trial-days" type="number" inputMode="numeric" placeholder="e.g. 14" value={setTrialDaysStr} onChange={(e) => setSetTrialDaysStr(e.target.value)} />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button onClick={() => askConfirm(`Set trial to ${setTrialDaysStr || 0} days from today?`, onSetTrialDays)} disabled={!canSetTrial}>
                        {setTrialDirectBusy ? 'Applying…' : 'Apply'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Set exact trial duration</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Set Paid Days</CardTitle>
                <CardDescription>Overwrite paid period to start today and end after N days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="set-paid-days">Days</Label>
                  <Input id="set-paid-days" type="number" inputMode="numeric" placeholder="e.g. 30" value={setPaidDaysStr} onChange={(e) => setSetPaidDaysStr(e.target.value)} />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button onClick={() => askConfirm(`Set paid period to ${setPaidDaysStr || 0} days from today?`, onSetPaidDays)} disabled={!canSetPaid}>
                        {setPaidDirectBusy ? 'Applying…' : 'Apply'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Set exact paid period duration</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suspend / Activate Account</CardTitle>
                <CardDescription>Toggle subscription access based on current state.</CardDescription>
              </CardHeader>
              <CardContent>
                {isSuspended ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => askConfirm('Activate this subscription?', onUnsuspend)}
                        disabled={!canActivate}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {unsuspendBusy ? 'Activating…' : 'Activate'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Re-enable access and resume lifecycle</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="destructive" onClick={() => setSuspendOpen(true)} disabled={!canToggleSuspend}>Suspend</Button>
                    </TooltipTrigger>
                    <TooltipContent>Suspend subscription and downgrade</TooltipContent>
                  </Tooltip>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Unsuspend card removed: use single toggle button above */}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event History</CardTitle>
              <CardDescription>Latest subscription events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 md:flex-1 min-w-0">
                  <Label htmlFor="event-filter" className="text-xs text-muted-foreground">Filter</Label>
                  <Input
                    id="event-filter"
                    placeholder="Type to filter by type or metadata…"
                    value={eventQuery}
                    onChange={(e) => { setEventQuery(e.target.value); setEventPage(1); }}
                    className="h-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Per page</span>
                  <Select
                    value={String(eventPageSize)}
                    onValueChange={(v) => { setEventPageSize(parseInt(v, 10)); setEventPage(1); }}
                  >
                    <SelectTrigger className="h-9 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading && events.length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : events.length === 0 ? (
                <div className="text-sm text-muted-foreground">No events.</div>
              ) : (
                <>
                  {(() => {
                    const q = eventQuery.trim().toLowerCase()
                    const filtered = q
                      ? events.filter(ev =>
                          ev.eventType.toLowerCase().includes(q) || (ev.metadata ? ev.metadata.toLowerCase().includes(q) : false)
                        )
                      : events
                    const total = filtered.length
                    const totalPages = Math.max(1, Math.ceil(total / eventPageSize))
                    const currentPage = Math.min(eventPage, totalPages)
                    const start = (currentPage - 1) * eventPageSize
                    const end = Math.min(start + eventPageSize, total)
                    const pageItems = filtered.slice(start, end)
                    return (
                      <>
                        <div className="text-xs text-muted-foreground mb-2">Showing {total === 0 ? 0 : start + 1}–{end} of {total}</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead className="hidden sm:table-cell">Metadata</TableHead>
                              <TableHead className="text-right">Timestamp</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pageItems.map((ev, idx) => (
                              <TableRow key={`${ev.id}-${idx}`}>
                                <TableCell className="font-medium">{ev.eventType}</TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">{ev.metadata || '—'}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{ev.createdAt ? formatDateTime(ev.createdAt) : '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex items-center justify-between pt-3">
                          <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setEventPage(p => Math.max(1, p - 1))}>Previous</Button>
                          <div className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</div>
                          <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setEventPage(p => p + 1)}>Next</Button>
                        </div>
                      </>
                    )
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>{confirmText}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirmSubmitting}>Cancel</Button>
            <Button variant="default" onClick={onConfirm} disabled={confirmSubmitting}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend modal */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Subscription</DialogTitle>
            <DialogDescription>This immediately ends access and downgrades the account to BASIC.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend-reason" className="text-sm text-muted-foreground">Reason (optional)</Label>
            <Textarea id="suspend-reason" rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Reason for suspension" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={onSuspend} disabled={suspendBusy}>
              {suspendBusy ? 'Suspending…' : 'Suspend Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}