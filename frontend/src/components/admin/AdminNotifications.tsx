import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { adminAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

interface AdminNotification {
  id: number;
  targetUserId?: number;
  type: string;
  title: string;
  body: string;
  priority: string;
  status: string;
  createdAt: string;
  readAt?: string;
}

interface PageResp<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

interface DeliveryAttempt {
  id: number;
  notificationId: number;
  channel: string;
  status: string;
  providerMessageId?: string;
  responseCode?: string;
  errorMessage?: string;
  attemptAt: string;
  retryCount: number;
}

export const AdminNotifications: React.FC = () => {
  // Broadcast form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'RESTAURANT_OWNERS' | 'ALL_ACTIVE'>('RESTAURANT_OWNERS');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string>('');
  const [sendErr, setSendErr] = useState<string>('');

  // List recent notifications
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const {
    data: pageData,
    loading: listLoading,
    error: listError,
    refetch: refetchList
  } = useApi<PageResp<AdminNotification>>(() => adminAPI.listRecentNotifications(page, size), { immediate: true });

  useEffect(() => {
    // refetch when pagination changes
    refetchList();
  }, [page, size]);

  const onBroadcast = async () => {
    setSending(true);
    setSendMsg('');
    setSendErr('');
    try {
      if (!title.trim() || !body.trim()) {
        setSendErr('Title and body are required.');
        return;
      }
      const res = await adminAPI.broadcast({ title: title.trim(), body: body.trim(), target });
      if ((res as any)?.success === false) {
        setSendErr((res as any)?.error || 'Broadcast failed');
      } else {
        setSendMsg(`Broadcast queued to ${res.recipients} recipients. Created ${res.created} notifications.`);
        setTitle('');
        setBody('');
        // reload recent list
        refetchList();
      }
    } catch (e: any) {
      setSendErr(e?.message || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  const [attemptsOpenFor, setAttemptsOpenFor] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<DeliveryAttempt[] | null>(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attemptsError, setAttemptsError] = useState<string>('');

  const openAttempts = async (notificationId: number) => {
    setAttemptsOpenFor(notificationId);
    setAttempts(null);
    setAttemptsError('');
    setAttemptsLoading(true);
    try {
      const res = await adminAPI.getDeliveryAttempts(notificationId);
      setAttempts(res);
    } catch (e: any) {
      setAttemptsError(e?.message || 'Failed to load attempts');
    } finally {
      setAttemptsLoading(false);
    }
  };

  const notifications = pageData?.content || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Notifications</h1>
        <p className="text-muted-foreground">Broadcast notifications and view delivery reports</p>
      </div>

      {/* Broadcast Card */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast Notification</CardTitle>
          <CardDescription>Send a notification to a target group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sendMsg && (
            <Badge variant="outline" className="text-green-700 border-green-300">{sendMsg}</Badge>
          )}
          {sendErr && (
            <Badge variant="outline" className="text-red-700 border-red-300">{sendErr}</Badge>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Group</label>
              <Select value={target} onValueChange={(v) => setTarget(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTAURANT_OWNERS">Restaurant Owners</SelectItem>
                  <SelectItem value="ALL_ACTIVE">All Active Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notification body" rows={4} />
          </div>
          <div className="flex justify-end">
            <Button onClick={onBroadcast} disabled={sending}>
              {sending ? 'Sending...' : 'Broadcast'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
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
                              <DialogTitle>Delivery Attempts for #{n.id}</DialogTitle>
                            </DialogHeader>
                            {attemptsOpenFor === n.id && attemptsLoading && <LoadingSkeleton lines={4} />}
                            {attemptsOpenFor === n.id && attemptsError && (
                              <ErrorDisplay error={attemptsError} />
                            )}
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
                            {attemptsOpenFor === n.id && attempts && attempts.length === 0 && (
                              <div className="text-sm text-muted-foreground">No attempts found.</div>
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
    </div>
  );
};

export default AdminNotifications;
