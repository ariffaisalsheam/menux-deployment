import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Eye, QrCode, Users, Menu, Crown, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

interface BasicAnalyticsData {
  totalViews: { current: number; change: number };
  qrScans: { current: number; change: number };
  uniqueVisitors: { current: number; change: number };
  menuItems: { current: number; change: number };
  mostViewedItems: Array<{
    menuItemId: number;
    itemName: string;
    category: string;
    viewCount: number;
    price: number;
  }>;
  dailyViews: Array<{
    date: string;
    views: number;
    scans: number;
  }>;
  recentUpdates: Array<{
    itemName: string;
    action: string;
    timestamp: string;
    category: string;
  }>;
  viewDistribution: {
    hourlyData: Array<{
      hour: number;
      views: number;
    }>;
    peakHour: string;
    peakViews: number;
  };
}

export const BasicAnalytics: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  // Fetch basic analytics data for non-Pro users
  const today = new Date().toISOString().split('T')[0];
  const nowLabel = new Date().toLocaleString();
  const {
    data: analytics,
    loading,
    error,
    refetch
  } = useApi<BasicAnalyticsData>(() => analyticsAPI.getBasicAnalytics(undefined, today));

  // Prepare hourly distribution data for the chart (fill 0-23 hours)
  const hourlyBarData = useMemo(() => {
    const base = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: 0 }));
    const byHour = new Map<number, number>();
    const hourly = analytics?.viewDistribution?.hourlyData ?? [];
    hourly.forEach((d) => {
      byHour.set(d.hour, Number(d.views) || 0);
    });
    return base.map((b) => ({ hour: `${b.hour}:00`, views: byHour.get(b.hour) ?? 0 }));
  }, [analytics?.viewDistribution]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <LoadingSkeleton lines={1} className="w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={3} />
          ))}
        </div>
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!analytics) {
    return <ErrorDisplay error="Analytics data not available" onRetry={refetch} />;
  }

  const StatCard = ({
    title,
    icon: Icon,
    current,
    change,
    format = 'number'
  }: {
    title: string;
    icon: React.ElementType;
    current: number;
    change: number;
    format?: 'number' | 'currency' | 'rating';
  }) => {
    const isPositive = change > 0;
    const formatValue = (value: number) => {
      switch (format) {
        case 'currency': return `৳${value.toLocaleString()}`;
        case 'rating': return value.toFixed(1);
        default: return value.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formatValue(current)}</p>
              <div className="flex items-center gap-1 mt-1">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(change)}%
                </span>
                <span className="text-sm text-muted-foreground">vs last month</span>
              </div>
            </div>
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Basic insights into your restaurant's performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPro ? 'default' : 'secondary'}>
            {user?.subscriptionPlan || 'Basic'} Plan
          </Badge>
        </div>
      </div>

      {/* Advanced Analytics Promotion for Basic Users */}
      {!isPro && (
        <Card className="border-purple-300 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              Upgrade to Pro for Advanced Analytics
            </CardTitle>
            <CardDescription>
              Get detailed insights, custom reports, and AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Advanced charts, customer behavior analysis, and predictive insights
                </p>
              </div>
              <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Menu Views"
          icon={Eye}
          current={analytics.totalViews.current}
          change={analytics.totalViews.change}
        />
        <StatCard
          title="QR Code Scans"
          icon={QrCode}
          current={analytics.qrScans.current}
          change={analytics.qrScans.change}
        />
        <StatCard
          title="Unique Visitors"
          icon={Users}
          current={analytics.uniqueVisitors.current}
          change={analytics.uniqueVisitors.change}
        />
        <StatCard
          title="Menu Items"
          icon={Menu}
          current={analytics.menuItems.current}
          change={analytics.menuItems.change}
        />
      </div>

      {/* Most Viewed Items */}
      <Card>
        <CardHeader>
          <CardTitle>Most Viewed Menu Items</CardTitle>
          <CardDescription>
            Items customers are most interested in this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.mostViewedItems && analytics.mostViewedItems.length > 0 ? (
              analytics.mostViewedItems
                .slice(0, 10)
                .map((item, index) => (
                  <div key={item.menuItemId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">{item.category} • ৳{item.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.viewCount} views</p>
                      <p className="text-sm text-muted-foreground">This month</p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">No views yet. Customer views will populate this list.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Views Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Menu Views</CardTitle>
          <CardDescription>
            Menu views and QR scans for the past 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Views" />
                <Line type="monotone" dataKey="scans" stroke="#10b981" strokeWidth={2} name="QR Scans" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Menu Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Menu Updates</CardTitle>
          <CardDescription>
            Latest changes to your menu items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentUpdates && analytics.recentUpdates.length > 0 ? (
              analytics.recentUpdates.map((update, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">{update.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {update.action} in {update.category} • {new Date(update.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent updates. Menu changes will appear here.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Distribution by Hour (Today) */}
      <Card>
        <CardHeader>
          <CardTitle>View Distribution by Hour</CardTitle>
          <CardDescription>
            When customers view your menu throughout the day — Today ({today}) • Now: {nowLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Peak viewing time: {analytics.viewDistribution?.peakHour || '—'}</span>
              <Badge variant="secondary">{analytics.viewDistribution?.peakViews ?? 0} views</Badge>
            </div>

            {hourlyBarData.some(d => d.views > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyBarData}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value} views`, 'Views']} />
                    <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-muted-foreground">No view data yet</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
