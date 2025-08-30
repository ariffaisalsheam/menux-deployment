import React, { useState, useEffect } from 'react';
import { Users, Store, Crown, DollarSign, TrendingUp, Activity, AlertCircle, Bell, CreditCard, Settings, UserPlus, BarChart3, Shield, Zap, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
// Custom Progress component (inline to avoid import issues)
const Progress = ({ value = 0, className = "" }: { value?: number; className?: string }) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
import { analyticsAPI, adminAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  badge?: string;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'plan_upgraded' | 'plan_downgraded' | 'payment_received' | 'notification_sent' | 'system_alert';
  message: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

interface DashboardCounts {
  pendingPayments: number;
  unreadNotifications: number;
  activeUsers: number;
  systemAlerts: number;
}

interface PlatformAnalytics {
  totalUsers: number;
  totalRestaurants: number;
  proSubscriptions: number;
  basicSubscriptions: number;
  monthlyRevenue: number;
  activeUsers: number;
  systemHealth: number;
  totalOrders: number;
  conversionRate: number;
  // Trend data from backend
  totalUsersChange?: number;
  totalRestaurantsChange?: number;
  proSubscriptionsChange?: number;
  monthlyRevenueChange?: number;
  activeUsersChange?: number;
}

export const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [dashboardCounts, setDashboardCounts] = useState<DashboardCounts>({
    pendingPayments: 0,
    unreadNotifications: 0,
    activeUsers: 0,
    systemAlerts: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isTestPushLoading, setIsTestPushLoading] = useState(false);

  // Fetch platform analytics
  const {
    data: analytics,
    loading,
    error,
    refetch
  } = useApi<PlatformAnalytics>(() => analyticsAPI.getPlatformAnalytics());

  // Load dashboard counts and activity
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load recent notifications for activity feed
      const notifications = await adminAPI.listRecentNotifications(0, 10);
      const activities: RecentActivity[] = notifications.content.map(notif => ({
        id: notif.id.toString(),
        type: notif.type as any,
        message: `${notif.title}: ${notif.body}`,
        timestamp: new Date(notif.createdAt),
        severity: notif.priority === 'HIGH' ? 'error' : notif.priority === 'MEDIUM' ? 'warning' : 'info'
      }));
      setRecentActivity(activities);

      // Update dashboard counts
      setDashboardCounts({
        pendingPayments: 0, // Will be updated when payments API is called
        unreadNotifications: notifications.totalElements,
        activeUsers: analytics?.activeUsers || 0,
        systemAlerts: 1 // Mock system health alert
      });

      // Mock system alerts
      setSystemAlerts([
        {
          id: '1',
          type: 'success',
          title: 'All Systems Operational',
          message: `All services running normally with ${analytics?.systemHealth || 99.8}% uptime`,
          timestamp: new Date(),
          priority: 'low'
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleTestPush = async () => {
    setIsTestPushLoading(true);
    try {
      await adminAPI.sendTestPush({
        title: 'Admin Test Notification',
        body: 'This is a test notification from the admin dashboard',
        data: { source: 'admin_overview' }
      });
      notify('Test notification sent successfully', 'success');
      loadDashboardData(); // Refresh activity
    } catch (error) {
      notify('Failed to send test notification', 'error');
    } finally {
      setIsTestPushLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      action: () => navigate('/admin/users'),
      badge: analytics?.totalUsers.toString()
    },
    {
      id: 'restaurants',
      title: 'Restaurant Management',
      description: 'View and manage restaurants',
      icon: Store,
      action: () => navigate('/admin/restaurants'),
      badge: analytics?.totalRestaurants.toString()
    },
    {
      id: 'payments',
      title: 'Payment Review',
      description: 'Review pending manual payments',
      icon: CreditCard,
      action: () => navigate('/admin/payments'),
      badge: dashboardCounts.pendingPayments > 0 ? dashboardCounts.pendingPayments.toString() : undefined,
      variant: dashboardCounts.pendingPayments > 0 ? 'destructive' : 'outline'
    },
    {
      id: 'notifications',
      title: 'Send Notification',
      description: 'Broadcast platform notifications',
      icon: Bell,
      action: () => navigate('/admin/notifications')
    },
    {
      id: 'settings',
      title: 'Platform Settings',
      description: 'Configure system settings',
      icon: Settings,
      action: () => navigate('/admin/settings')
    },
    {
      id: 'test-push',
      title: 'Test Push',
      description: 'Send test notification',
      icon: Zap,
      action: handleTestPush,
      variant: 'secondary'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={4} />
          ))}
        </div>
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
    value, 
    icon: Icon, 
    trend,
    trendDirection,
    subtitle
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    subtitle?: string;
  }) => {
    const getTrendIcon = () => {
      if (trendDirection === 'up') return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      if (trendDirection === 'down') return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    };

    const getTrendColor = () => {
      if (trendDirection === 'up') return 'text-green-600';
      if (trendDirection === 'down') return 'text-red-600';
      return 'text-blue-600';
    };

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon()}
                  <span className={`text-sm font-medium ${getTrendColor()}`}>
                    {trend}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const QuickActionCard = ({ action }: { action: QuickAction }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <action.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {action.badge && (
              <Badge variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}>
                {action.badge}
              </Badge>
            )}
            <Button size="sm" variant={action.variant || 'outline'} disabled={action.id === 'test-push' && isTestPushLoading}>
              {action.id === 'test-push' && isTestPushLoading ? 'Sending...' : 'Go'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'user_registered': return <UserPlus className="w-4 h-4" />;
        case 'plan_upgraded': return <TrendingUp className="w-4 h-4" />;
        case 'plan_downgraded': return <ArrowDownRight className="w-4 h-4" />;
        case 'payment_received': return <CreditCard className="w-4 h-4" />;
        case 'notification_sent': return <Bell className="w-4 h-4" />;
        case 'system_alert': return <AlertCircle className="w-4 h-4" />;
        default: return <Activity className="w-4 h-4" />;
      }
    };

    const getSeverityColor = () => {
      switch (activity.severity) {
        case 'error': return 'text-red-500';
        case 'warning': return 'text-yellow-500';
        case 'success': return 'text-green-500';
        default: return 'text-blue-500';
      }
    };

    const formatTime = (timestamp: Date) => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    };

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className={`${getSeverityColor()} mt-0.5`}>
          {getActivityIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{activity.message}</p>
          <p className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</p>
        </div>
      </div>
    );
  };

  const SystemAlertItem = ({ alert }: { alert: SystemAlert }) => {
    const getAlertIcon = () => {
      switch (alert.type) {
        case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
        case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
        default: return <Activity className="w-4 h-4 text-blue-500" />;
      }
    };

    const getAlertBg = () => {
      switch (alert.type) {
        case 'error': return 'bg-red-50 border-red-200';
        case 'warning': return 'bg-yellow-50 border-yellow-200';
        case 'success': return 'bg-green-50 border-green-200';
        default: return 'bg-blue-50 border-blue-200';
      }
    };

    return (
      <div className={`flex items-center gap-3 p-3 border rounded-lg ${getAlertBg()}`}>
        {getAlertIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">{alert.title}</p>
          <p className="text-xs text-muted-foreground">{alert.message}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {alert.priority}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and system management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            System Health: {analytics?.systemHealth || 99.8}%
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {analytics?.activeUsers || 0} Active
          </Badge>
          <Button onClick={() => navigate('/admin/analytics')} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          subtitle="Registered users"
          trend={analytics.totalUsersChange ? `+${analytics.totalUsersChange.toFixed(1)}%` : "+0.0%"}
          trendDirection={analytics.totalUsersChange && analytics.totalUsersChange > 0 ? "up" : "down"}
          icon={Users}
        />
        <StatCard
          title="Active Restaurants"
          value={analytics.totalRestaurants.toLocaleString()}
          subtitle="Live restaurants"
          trend={analytics.totalRestaurantsChange ? `+${analytics.totalRestaurantsChange.toFixed(1)}%` : "+0.0%"}
          trendDirection={analytics.totalRestaurantsChange && analytics.totalRestaurantsChange > 0 ? "up" : "down"}
          icon={Store}
        />
        <StatCard
          title="Pro Subscriptions"
          value={analytics.proSubscriptions.toLocaleString()}
          subtitle="Premium accounts"
          trend={analytics.proSubscriptionsChange ? `+${analytics.proSubscriptionsChange.toFixed(1)}%` : "+0.0%"}
          trendDirection={analytics.proSubscriptionsChange && analytics.proSubscriptionsChange > 0 ? "up" : "down"}
          icon={Crown}
        />
        <StatCard
          title="Monthly Revenue"
          value={`৳${analytics.monthlyRevenue.toLocaleString()}`}
          subtitle="This month"
          trend={analytics.monthlyRevenueChange ? `+${analytics.monthlyRevenueChange.toFixed(1)}%` : "+0.0%"}
          trendDirection={analytics.monthlyRevenueChange && analytics.monthlyRevenueChange > 0 ? "up" : "down"}
          icon={DollarSign}
        />
        <StatCard
          title="Active Users"
          value={analytics.activeUsers.toLocaleString()}
          icon={Activity}
          trend={analytics.activeUsersChange ? `+${analytics.activeUsersChange.toFixed(1)}%` : "+0.0%"}
          trendDirection={analytics.activeUsersChange && analytics.activeUsersChange > 0 ? "up" : "down"}
          subtitle="Last 30 days"
        />
        <StatCard
          title="System Health"
          value={`${analytics.systemHealth}%`}
          icon={CheckCircle}
          trend="99.8%"
          trendDirection="neutral"
          subtitle="All services operational"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <QuickActionCard key={action.id} action={action} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest platform events and notifications
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/notifications')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status & Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  System health and important alerts
                </CardDescription>
              </div>
              <Badge variant={analytics?.systemHealth >= 99 ? 'default' : 'destructive'}>
                {analytics?.systemHealth >= 99 ? 'Healthy' : 'Issues Detected'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* System Health Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Health</span>
                  <span className="text-muted-foreground">{analytics?.systemHealth || 99.8}%</span>
                </div>
                <Progress value={analytics?.systemHealth || 99.8} className="h-2" />
              </div>

              {/* System Alerts */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">System Alerts</h4>
                {systemAlerts.map((alert) => (
                  <SystemAlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
