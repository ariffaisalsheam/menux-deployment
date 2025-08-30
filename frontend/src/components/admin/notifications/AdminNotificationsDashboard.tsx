import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog'
import { notificationAdminAPI, adminAPI } from '../../../services/api'
import { useApi } from '../../../hooks/useApi'
import { LoadingSkeleton } from '../../common/LoadingSpinner'
import { ErrorDisplay } from '../../common/ErrorDisplay'
import FCMComposer from './FCMComposer'

// Types
interface AdminNotification {
  id: number
  targetUserId?: number
  type: string
  title: string
  body: string
  data?: string
  priority: string
  status: string
  readAt?: string
  createdAt: string
}

interface PageResp<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

interface DeliveryAttempt {
  id: number
  notificationId: number
  channel: string
  status: string
  providerMessageId?: string
  responseCode?: string
  errorMessage?: string
  attemptAt: string
  retryCount: number
}

// Recent Notifications Component
const RecentNotifications: React.FC = () => {
  const [page, setPage] = useState(0)
  const [size] = useState(20)
  const [attemptsOpenFor, setAttemptsOpenFor] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<DeliveryAttempt[] | null>(null)

  const {
    data: pageData,
    loading: listLoading,
    error: listError,
    refetch: refetchList
  } = useApi<PageResp<AdminNotification>>(() => adminAPI.listRecentNotifications(page, size), { immediate: true })

  useEffect(() => {
    refetchList()
  }, [page, size])

  const notifications = pageData?.content || []

  const openAttempts = async (notificationId: number) => {
    setAttemptsOpenFor(notificationId)
    try {
      const data = await notificationAdminAPI.getDeliveryAttempts(notificationId)
      setAttempts(data)
    } catch (e) {
      console.error('Failed to load delivery attempts:', e)
      setAttempts([])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
        <CardDescription>Latest notifications across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {listLoading ? (
          <LoadingSkeleton lines={6} />
        ) : listError ? (
          <ErrorDisplay error={listError} onRetry={refetchList} />
        ) : notifications.length === 0 ? (
          <div className="text-sm text-muted-foreground">No notifications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Body</th>
                  <th className="py-2 pr-3">Target User</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className="border-b hover:bg-accent/30">
                    <td className="py-2 pr-3">{n.id}</td>
                    <td className="py-2 pr-3">{new Date(n.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-3 font-medium">{n.title}</td>
                    <td className="py-2 pr-3 truncate max-w-[320px]">{n.body}</td>
                    <td className="py-2 pr-3">{n.targetUserId ?? '-'}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline">{n.status}</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openAttempts(n.id)}>Delivery</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Delivery Attempts for Notification #{n.id}</DialogTitle>
                          </DialogHeader>
                          {attemptsOpenFor === n.id && attempts && attempts.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left border-b">
                                    <th className="py-2 pr-3">Time</th>
                                    <th className="py-2 pr-3">Channel</th>
                                    <th className="py-2 pr-3">Status</th>
                                    <th className="py-2 pr-3">Provider ID</th>
                                    <th className="py-2 pr-3">Code</th>
                                    <th className="py-2 pr-3">Error</th>
                                    <th className="py-2 pr-3">Retries</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {attempts.map(a => (
                                    <tr key={a.id} className="border-b">
                                      <td className="py-2 pr-3">{new Date(a.attemptAt).toLocaleString()}</td>
                                      <td className="py-2 pr-3">{a.channel}</td>
                                      <td className="py-2 pr-3">{a.status}</td>
                                      <td className="py-2 pr-3">{a.providerMessageId || '-'}</td>
                                      <td className="py-2 pr-3">{a.responseCode || '-'}</td>
                                      <td className="py-2 pr-3">{a.errorMessage || '-'}</td>
                                      <td className="py-2 pr-3">{a.retryCount}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {attemptsOpenFor === n.id && (!attempts || attempts.length === 0) && (
                            <div className="text-sm text-muted-foreground">No delivery attempts found.</div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageData && pageData.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pageData.page + 1} of {pageData.totalPages} • {pageData.totalElements} total
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={!pageData.hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Notification Clearing Component
const NotificationClearingFeature: React.FC = () => {
  const [clearOption, setClearOption] = useState<'7days' | '30days' | 'custom'>('7days')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (clearOption) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (!customStartDate || !customEndDate) {
          throw new Error('Please select both start and end dates for custom range')
        }
        startDate = new Date(customStartDate)
        endDate = new Date(customEndDate)
        if (startDate > endDate) {
          throw new Error('Start date must be before end date')
        }
        break
      default:
        throw new Error('Invalid clear option')
    }

    return {
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0]
    }
  }

  const handleClearNotifications = async () => {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const dateRange = getDateRange()
      const result = await notificationAdminAPI.clearNotifications(dateRange)

      if (result.success) {
        setSuccess(`Successfully cleared ${result.deletedCount} notifications from ${result.dateRange.from} to ${result.dateRange.to}`)
      } else {
        setError('Failed to clear notifications')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to clear notifications')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clear Notifications</CardTitle>
        <CardDescription>Remove notifications from the system by date range</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Clear Options</label>
            <Select value={clearOption} onValueChange={(value: any) => setClearOption(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom date range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {clearOption === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={customStartDate}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded">{success}</div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={loading || (clearOption === 'custom' && (!customStartDate || !customEndDate))}
            >
              {loading ? 'Clearing...' : 'Clear Notifications'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Notification Clearing</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently delete notifications from the selected date range. This cannot be undone.
                <br /><br />
                <strong>Selected range:</strong> {clearOption === 'custom' ? `${customStartDate} to ${customEndDate}` : clearOption === '7days' ? 'Last 7 days' : 'Last 30 days'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearNotifications} className="bg-red-600 hover:bg-red-700">
                Clear Notifications
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// Analytics tab for notification metrics and management
const AnalyticsTab: React.FC = () => {
  const [summary, setSummary] = useState<{ sent: number; delivered: number; failed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const load = async () => {
    setError(null); setLoading(true)
    try {
      const res = await notificationAdminAPI.getAnalyticsSummary({})
      // Only use metrics that have real backend support
      setSummary({
        sent: res.sent,
        delivered: res.delivered,
        failed: res.failed
      })
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
    <div className="space-y-6">
      {/* Delivery & Engagement Metrics */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Delivery & Engagement</h3>
          <div className="flex items-center gap-2">
            {lastUpdated && <span className="text-xs text-muted-foreground">Updated: {lastUpdated}</span>}
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {notAvailable ? (
          <div className="text-sm text-muted-foreground">Analytics API is not available on the server yet.</div>
        ) : summary ? (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-900">Sent</div>
              <div className="text-xl font-bold text-blue-700">{summary.sent}</div>
              <div className="text-xs text-blue-600 mt-1">Total notifications sent</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-900">Delivered</div>
              <div className="text-xl font-bold text-green-700">{summary.delivered}</div>
              <div className="text-xs text-green-600 mt-1">Successfully delivered</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="font-medium text-red-900">Failed</div>
              <div className="text-xl font-bold text-red-700">{summary.failed}</div>
              <div className="text-xs text-red-600 mt-1">Delivery failures</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Loading analytics...</div>
        )}
      </Card>

      {/* Recent Notifications moved here */}
      <RecentNotifications />

      {/* Notification Clearing Feature */}
      <NotificationClearingFeature />
    </div>
  )
}

export const AdminNotificationsDashboard: React.FC = () => {
  const [active, setActive] = useState<'compose' | 'analytics'>('compose')
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Notifications Admin</h1>
      <Tabs value={active} onValueChange={v => setActive(v as any)} className="w-full">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          {active === 'compose' && <FCMComposer />}
        </TabsContent>

        <TabsContent value="analytics">
          {active === 'analytics' && <AnalyticsTab />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminNotificationsDashboard