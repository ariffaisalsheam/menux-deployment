import React from 'react';
import { Crown, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

export const PlanManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Management</h1>
          <p className="text-muted-foreground">
            Manage subscription plans and pricing
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
                <Badge variant="secondary">523 Active Users</Badge>
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
                <Badge variant="default">89 Active Users</Badge>
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
              <p className="text-2xl font-bold text-green-600">৳133,500</p>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">89</p>
              <p className="text-sm text-muted-foreground">Pro Subscribers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">17%</p>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">৳1,500</p>
              <p className="text-sm text-muted-foreground">ARPU</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
