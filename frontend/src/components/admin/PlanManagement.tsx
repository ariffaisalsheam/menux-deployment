import React, { useMemo, useState } from 'react';
import { Crown, Users, DollarSign, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { analyticsAPI, userAPI } from '../../services/api';
import { useApi, useApiMutation } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface PlatformAnalyticsData {
  totalUsers: number;
  totalRestaurants: number;
  proSubscriptions: number;
  basicSubscriptions: number;
  monthlyRevenue: number;
  activeUsers: number;
  systemHealth: number;
  totalOrders: number;
  conversionRate: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'RESTAURANT_OWNER' | 'SUPER_ADMIN';
  restaurantName?: string;
  subscriptionPlan?: 'BASIC' | 'PRO';
  status: 'active' | 'inactive';
  joinDate: string;
  lastLogin: string;
}

export const PlanManagement: React.FC = () => {
  const { data: analytics, loading, error, refetch } = useApi<PlatformAnalyticsData>(() => analyticsAPI.getPlatformAnalytics());
  const { data: users = [], loading: usersLoading, error: usersError, refetch: refetchUsers } = useApi<UserData[]>(() => userAPI.getAllUsers());

  const [mutationStatus, setMutationStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const updatePlanMutation = useApiMutation(
    ({ userId, plan }: { userId: number; plan: 'BASIC' | 'PRO' }) => userAPI.updateUserPlan(userId, plan),
    {
      onSuccess: (_data: any) => {
        setMutationStatus({ kind: 'success', message: 'Plan updated successfully.' });
        refetchUsers();
        setTimeout(() => setMutationStatus(null), 2500);
        setPendingUserId(null);
      },
      onError: (errorMessage: string) => {
        setMutationStatus({ kind: 'error', message: errorMessage || 'Failed to update plan' });
        setTimeout(() => setMutationStatus(null), 3500);
        setPendingUserId(null);
      }
    }
  );

  // Subscribers filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'BASIC' | 'PRO'>('all');
  const ownerUsers = useMemo(() => (users ?? []).filter(u => u.role === 'RESTAURANT_OWNER'), [users]);
  const filteredOwnerUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ownerUsers.filter(u => {
      const matchesPlan = planFilter === 'all' || u.subscriptionPlan === planFilter;
      if (!term) return matchesPlan;
      const hay = `${u.fullName || ''} ${u.email || ''} ${u.restaurantName || ''}`.toLowerCase();
      return matchesPlan && hay.includes(term);
    });
  }, [ownerUsers, planFilter, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton lines={2} className="w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LoadingSkeleton lines={6} />
          <LoadingSkeleton lines={6} />
        </div>
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!analytics) {
    return <ErrorDisplay error="Analytics data not available" onRetry={refetch} />;
  }

  const arpu = analytics.proSubscriptions > 0
    ? Math.round((analytics.monthlyRevenue / analytics.proSubscriptions) * 100) / 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground">
            Manage subscription plans, pricing, and subscribers
          </p>
        </div>
      </div>

      {/* Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Basic Plan
            </CardTitle>
            <CardDescription>Free tier with essential features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">৳0</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">✅ Restaurant profile management</p>
                <p className="text-sm">✅ Basic menu management</p>
                <p className="text-sm">✅ Order history (read-only)</p>
                <p className="text-sm">✅ Basic analytics</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary">{analytics.basicSubscriptions.toLocaleString()} Active Users</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Pro Plan
            </CardTitle>
            <CardDescription>Advanced features for growing restaurants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold">৳1,500</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">✅ All Basic features</p>
                <p className="text-sm">✅ Live order management</p>
                <p className="text-sm">✅ AI menu writer</p>
                <p className="text-sm">✅ AI feedback analysis</p>
                <p className="text-sm">✅ Advanced analytics</p>
                <p className="text-sm">✅ Real-time notifications</p>
              </div>
              <div className="text-center">
                <Badge variant="default">{analytics.proSubscriptions.toLocaleString()} Active Users</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Analytics
          </CardTitle>
          <CardDescription>
            Subscription revenue and growth metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">৳{analytics.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.proSubscriptions.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Pro Subscribers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{analytics.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">৳{arpu.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">ARPU</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Management */}
      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>List of restaurant owners and their current plans</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            <div className="relative md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or restaurant"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md bg-background md:w-44"
            >
              <option value="all">All Plans</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
            </select>
          </div>
          {mutationStatus && (
            <div className={`mb-3 border rounded p-3 ${mutationStatus.kind === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {mutationStatus.message}
            </div>
          )}
          {usersError ? (
            <ErrorDisplay error={usersError} onRetry={refetchUsers} />
          ) : usersLoading ? (
            <LoadingSkeleton lines={6} />
          ) : (
            <div className="space-y-3">
              { filteredOwnerUsers
                .map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.fullName}</span>
                      {user.subscriptionPlan && (
                        <Badge variant={user.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
                          {user.subscriptionPlan}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}{user.restaurantName ? ` • ${user.restaurantName}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatePlanMutation.loading && pendingUserId === user.id || user.subscriptionPlan === 'BASIC'}
                      onClick={() => { setPendingUserId(user.id); updatePlanMutation.mutate({ userId: user.id, plan: 'BASIC' }); }}
                    >
                      {pendingUserId === user.id && updatePlanMutation.loading ? 'Updating…' : 'Switch to Basic'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatePlanMutation.loading && pendingUserId === user.id || user.subscriptionPlan === 'PRO'}
                      onClick={() => { setPendingUserId(user.id); updatePlanMutation.mutate({ userId: user.id, plan: 'PRO' }); }}
                    >
                      {pendingUserId === user.id && updatePlanMutation.loading ? 'Updating…' : 'Switch to Pro'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
