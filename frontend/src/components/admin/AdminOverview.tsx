import React from 'react';
import { Users, Store, Crown, DollarSign, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const platformStats = {
  totalUsers: 1247,
  totalRestaurants: 523,
  proSubscriptions: 89,
  monthlyRevenue: 133500,
  activeUsers: 892,
  systemHealth: 99.8
};

const recentActivity = [
  { type: 'user_registered', message: 'New restaurant owner registered: Ahmed\'s Kitchen', time: '2 minutes ago' },
  { type: 'plan_upgraded', message: 'Dhaka Delights upgraded to Pro plan', time: '15 minutes ago' },
  { type: 'system_alert', message: 'Server maintenance completed successfully', time: '1 hour ago' },
  { type: 'user_registered', message: 'New restaurant owner registered: Spice Garden', time: '2 hours ago' },
  { type: 'plan_downgraded', message: 'Curry House downgraded to Basic plan', time: '3 hours ago' }
];

const quickActions = [
  { title: 'Create Test User', description: 'Add a new test restaurant owner', action: 'Create User' },
  { title: 'Upgrade Restaurant', description: 'Upgrade a restaurant to Pro plan', action: 'Manage Plans' },
  { title: 'System Backup', description: 'Perform manual system backup', action: 'Run Backup' },
  { title: 'Send Notifications', description: 'Send platform-wide notifications', action: 'Send Message' }
];

export const AdminOverview: React.FC = () => {
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    change?: number;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return `৳${val.toLocaleString()}`;
        case 'percentage': return `${val}%`;
        default: return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
              {change !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{change}%</span>
                  <span className="text-sm text-muted-foreground">vs last month</span>
                </div>
              )}
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
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and system management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            System Healthy
          </Badge>
          <Button>View Reports</Button>
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={platformStats.totalUsers}
          icon={Users}
          change={12.5}
        />
        <StatCard
          title="Restaurants"
          value={platformStats.totalRestaurants}
          icon={Store}
          change={8.2}
        />
        <StatCard
          title="Pro Subscriptions"
          value={platformStats.proSubscriptions}
          icon={Crown}
          change={15.3}
        />
        <StatCard
          title="Monthly Revenue"
          value={platformStats.monthlyRevenue}
          icon={DollarSign}
          format="currency"
          change={22.1}
        />
        <StatCard
          title="Active Users"
          value={platformStats.activeUsers}
          icon={Activity}
          change={5.7}
        />
        <StatCard
          title="System Health"
          value={platformStats.systemHealth}
          icon={TrendingUp}
          format="percentage"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest platform events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {action.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            System Alerts
          </CardTitle>
          <CardDescription>
            Important notifications and system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Scheduled Maintenance</p>
                <p className="text-xs text-muted-foreground">System maintenance scheduled for Sunday 2:00 AM - 4:00 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Activity className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">All Systems Operational</p>
                <p className="text-xs text-muted-foreground">All services are running normally with 99.8% uptime</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
