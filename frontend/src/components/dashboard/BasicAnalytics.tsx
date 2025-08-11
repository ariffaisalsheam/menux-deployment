import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Star, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LoadingSkeleton } from '../common/LoadingSpinner';
import { ErrorDisplay } from '../common/ErrorDisplay';

interface AnalyticsData {
  revenue: { current: number; previous: number; change: number };
  orders: { current: number; previous: number; change: number };
  customers: { current: number; previous: number; change: number };
  rating: { current: number; previous: number; change: number };
  topSellingItems: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  weeklyTrends: Array<{
    period: string;
    revenue: number;
    orders: number;
    change: number;
  }>;
}

export const BasicAnalytics: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  // Fetch analytics data
  const {
    data: analytics,
    loading,
    error,
    refetch
  } = useApi<AnalyticsData>(() => analyticsAPI.getRestaurantAnalytics());

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
          title="Total Revenue"
          icon={DollarSign}
          current={analytics.revenue.current}
          change={analytics.revenue.change}
          format="currency"
        />
        <StatCard
          title="Total Orders"
          icon={ShoppingCart}
          current={analytics.orders.current}
          change={analytics.orders.change}
        />
        <StatCard
          title="Customers"
          icon={Users}
          current={analytics.customers.current}
          change={analytics.customers.change}
        />
        <StatCard
          title="Average Rating"
          icon={Star}
          current={analytics.rating.current}
          change={analytics.rating.change}
          format="rating"
        />
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items</CardTitle>
          <CardDescription>
            Your most popular menu items this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topSellingItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">৳{item.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>
            Revenue and order trends over the past 4 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.weeklyTrends.map((trend) => (
              <div key={trend.period} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">{trend.period}</p>
                  <p className="text-sm text-muted-foreground">{trend.orders} orders</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">৳{trend.revenue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 justify-center">
                    {trend.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm ${trend.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(trend.change)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simple Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Daily revenue for the past 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground">Basic chart visualization</p>
              {!isPro && (
                <p className="text-sm text-muted-foreground mt-2">
                  Upgrade to Pro for interactive charts and detailed analytics
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
