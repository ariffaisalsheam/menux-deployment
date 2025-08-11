import React from 'react';
import {
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Star,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: string;
  isPro?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  isPro = false 
}) => {
  return (
    <Card className={isPro ? 'border-yellow-200 bg-yellow-50/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          {isPro && <Crown className="h-3 w-3 text-yellow-500" />}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend && (
            <span className="text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

interface RestaurantAnalytics {
  revenue: { current: number; previous: number; change: number };
  orders: { current: number; previous: number; change: number };
  customers: { current: number; previous: number; change: number };
  rating: { current: number; previous: number; change: number };
  liveOrders: number;
  topSellingItems: Array<{ name: string; orders: number; revenue: number }>;
  weeklyTrends: Array<{ period: string; revenue: number; orders: number; change: number }>;
}

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  // Fetch real analytics data
  const {
    data: analytics,
    loading,
    error,
    refetch
  } = useApi<RestaurantAnalytics>(() => analyticsAPI.getRestaurantAnalytics());

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <LoadingSkeleton lines={2} className="w-64" />
          <LoadingSkeleton lines={1} className="w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={4} />
          ))}
        </div>
        {isPro && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <LoadingSkeleton key={i} lines={4} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!analytics) {
    return <ErrorDisplay error="Analytics data not available" onRetry={refetch} />;
  }

  // Format the data for display
  const stats = [
    {
      title: 'Total Orders',
      value: Math.round(analytics.orders.current).toLocaleString(),
      description: 'from last month',
      icon: ShoppingCart,
      trend: analytics.orders.change > 0 ? `+${analytics.orders.change.toFixed(1)}%` : `${analytics.orders.change.toFixed(1)}%`
    },
    {
      title: 'Revenue',
      value: `৳${Math.round(analytics.revenue.current).toLocaleString()}`,
      description: 'from last month',
      icon: DollarSign,
      trend: analytics.revenue.change > 0 ? `+${analytics.revenue.change.toFixed(1)}%` : `${analytics.revenue.change.toFixed(1)}%`
    },
    {
      title: 'Customers',
      value: Math.round(analytics.customers.current).toLocaleString(),
      description: 'active customers',
      icon: Users,
      trend: analytics.customers.change > 0 ? `+${analytics.customers.change.toFixed(1)}%` : `${analytics.customers.change.toFixed(1)}%`
    },
    {
      title: 'Avg. Rating',
      value: analytics.rating.current.toFixed(1),
      description: 'from reviews',
      icon: Star,
      trend: analytics.rating.change > 0 ? `+${analytics.rating.change.toFixed(1)}%` : `${analytics.rating.change.toFixed(1)}%`
    }
  ];

  const proStats = [
    {
      title: 'Live Orders',
      value: analytics.liveOrders.toString(),
      description: 'orders in progress',
      icon: Clock,
      isPro: true
    },
    {
      title: 'AI Insights',
      value: '94%',
      description: 'positive sentiment',
      icon: TrendingUp,
      isPro: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Owner'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your restaurant today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={isPro ? 'default' : 'secondary'}
            className={isPro ? 'bg-yellow-500 text-white' : ''}
          >
            {isPro ? (
              <><Crown className="w-3 h-3 mr-1" /> Pro Plan</>
            ) : (
              'Basic Plan'
            )}
          </Badge>
        </div>
      </div>

      {/* Basic Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Pro Stats */}
      {isPro && (
        <>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Pro Analytics</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {proStats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        </>
      )}

      {/* Upgrade Prompt for Basic Users */}
      {!isPro && (
        <Card className="border-dashed border-2 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Unlock Pro Features
            </CardTitle>
            <CardDescription>
              Get access to live order management, AI-powered insights, and advanced analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-white rounded-lg">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold">Live Orders</h3>
                <p className="text-sm text-muted-foreground">Real-time order tracking</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold">AI Analytics</h3>
                <p className="text-sm text-muted-foreground">Smart business insights</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold">Feedback AI</h3>
                <p className="text-sm text-muted-foreground">Sentiment analysis</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Upgrade to Pro - ৳1,500/month
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New order received</p>
                <p className="text-xs text-muted-foreground">Order #1234 - ৳850</p>
              </div>
              <span className="text-xs text-muted-foreground">2 min ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Menu item updated</p>
                <p className="text-xs text-muted-foreground">Chicken Biryani price changed</p>
              </div>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Customer feedback</p>
                <p className="text-xs text-muted-foreground">5-star review received</p>
              </div>
              <span className="text-xs text-muted-foreground">3 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
