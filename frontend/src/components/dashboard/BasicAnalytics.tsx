import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Star, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

interface AnalyticsData {
  revenue: { current: number; previous: number; change: number };
  orders: { current: number; previous: number; change: number };
  customers: { current: number; previous: number; change: number };
  rating: { current: number; previous: number; change: number };
}

const mockAnalytics: AnalyticsData = {
  revenue: { current: 45231, previous: 41650, change: 8.6 },
  orders: { current: 1234, previous: 1102, change: 12.0 },
  customers: { current: 573, previous: 498, change: 15.1 },
  rating: { current: 4.8, previous: 4.6, change: 4.3 }
};

const topSellingItems = [
  { name: 'Chicken Biryani', orders: 156, revenue: 54600 },
  { name: 'Beef Bhuna', orders: 89, revenue: 40050 },
  { name: 'Fish Curry', orders: 67, revenue: 18760 },
  { name: 'Vegetable Samosa', orders: 234, revenue: 18720 },
  { name: 'Mutton Curry', orders: 45, revenue: 22500 }
];

const recentTrends = [
  { period: 'This Week', revenue: 12500, orders: 89, change: 15.2 },
  { period: 'Last Week', revenue: 10800, orders: 77, change: -2.1 },
  { period: '2 Weeks Ago', revenue: 11000, orders: 79, change: 8.5 },
  { period: '3 Weeks Ago', revenue: 10150, orders: 72, change: 3.2 }
];

export const BasicAnalytics: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

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
    previous: number;
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
          current={mockAnalytics.revenue.current}
          previous={mockAnalytics.revenue.previous}
          change={mockAnalytics.revenue.change}
          format="currency"
        />
        <StatCard
          title="Total Orders"
          icon={ShoppingCart}
          current={mockAnalytics.orders.current}
          previous={mockAnalytics.orders.previous}
          change={mockAnalytics.orders.change}
        />
        <StatCard
          title="Customers"
          icon={Users}
          current={mockAnalytics.customers.current}
          previous={mockAnalytics.customers.previous}
          change={mockAnalytics.customers.change}
        />
        <StatCard
          title="Average Rating"
          icon={Star}
          current={mockAnalytics.rating.current}
          previous={mockAnalytics.rating.previous}
          change={mockAnalytics.rating.change}
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
            {topSellingItems.map((item, index) => (
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
            {recentTrends.map((trend) => (
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
