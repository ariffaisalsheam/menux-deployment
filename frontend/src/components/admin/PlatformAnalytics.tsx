import React from 'react';
import { BarChart3, TrendingUp, Users, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

import { analyticsAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
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
  // Trend data from backend
  totalUsersChange?: number;
  totalRestaurantsChange?: number;
  proSubscriptionsChange?: number;
  monthlyRevenueChange?: number;
  activeUsersChange?: number;
}

export const PlatformAnalytics: React.FC = () => {
  const { data: analytics, loading, error, refetch } = useApi<PlatformAnalyticsData>(() => analyticsAPI.getPlatformAnalytics());

  if (loading) {
    return <LoadingSkeleton lines={8} />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!analytics) {
    return <ErrorDisplay error="Analytics data not available" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive platform performance metrics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {analytics.totalUsersChange ? `+${analytics.totalUsersChange.toFixed(1)}%` : "+0.0%"}
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Restaurants</p>
                <p className="text-2xl font-bold">{analytics.totalRestaurants.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {analytics.totalRestaurantsChange ? `+${analytics.totalRestaurantsChange.toFixed(1)}%` : "+0.0%"}
                  </span>
                </div>
              </div>
              <Store className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analytics.totalOrders.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+0.0%</span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform Revenue</p>
                <p className="text-2xl font-bold">৳{analytics.monthlyRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {analytics.monthlyRevenueChange ? `+${analytics.monthlyRevenueChange.toFixed(1)}%` : "+0.0%"}
                  </span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Growth</CardTitle>
          <CardDescription>
            Key performance indicators and growth metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">User Growth</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {analytics.totalUsersChange ? `+${analytics.totalUsersChange.toFixed(1)}%` : "+0.0%"}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total registered users</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Restaurant Growth</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {analytics.totalRestaurantsChange ? `+${analytics.totalRestaurantsChange.toFixed(1)}%` : "+0.0%"}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold">{analytics.totalRestaurants.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Active restaurants</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Revenue Growth</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {analytics.monthlyRevenueChange ? `+${analytics.monthlyRevenueChange.toFixed(1)}%` : "+0.0%"}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold">৳{analytics.monthlyRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Monthly recurring revenue</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Conversion Rate</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    {analytics.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold">{analytics.proSubscriptions.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Pro subscribers</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700">
                  {analytics.totalUsersChange ? `+${Math.round(analytics.totalUsers * (analytics.totalUsersChange / 100))}` : "+0"}
                </div>
                <div className="text-sm text-green-600">New users this month</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-700">
                  {analytics.totalRestaurantsChange ? `+${Math.round(analytics.totalRestaurants * (analytics.totalRestaurantsChange / 100))}` : "+0"}
                </div>
                <div className="text-sm text-blue-600">New restaurants this month</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-700">
                  ৳{analytics.monthlyRevenueChange ? Math.round(analytics.monthlyRevenue * (analytics.monthlyRevenueChange / 100)).toLocaleString() : "0"}
                </div>
                <div className="text-sm text-purple-600">Revenue increase this month</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
