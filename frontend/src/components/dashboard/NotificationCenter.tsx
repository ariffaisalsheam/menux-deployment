import React from 'react';
import { Crown, Bell, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-500" />
              Notification Center
            </h1>
            <p className="text-muted-foreground">
              Real-time alerts and notifications
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for Real-time Notifications
            </CardTitle>
            <CardDescription className="text-base">
              Stay updated with instant alerts and smart notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium">New Order Alert</p>
                      <p className="text-sm text-muted-foreground">Order #ORD-123 received</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Order Completed</p>
                      <p className="text-sm text-muted-foreground">Order #ORD-122 ready for pickup</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Low Stock Alert</p>
                      <p className="text-sm text-muted-foreground">Chicken Biryani ingredients running low</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - ৳1,500/month
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-8 h-8 text-blue-500" />
            Notification Center
          </h1>
          <p className="text-muted-foreground">
            Real-time alerts and notifications
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Crown className="w-3 h-3" />
          Pro Active
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Notification Center</p>
            <p className="text-muted-foreground">Real-time notifications would be implemented here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
