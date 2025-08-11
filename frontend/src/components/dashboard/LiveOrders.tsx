import React from 'react';
import { Crown, Zap, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export const LiveOrders: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  if (!isPro) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="w-8 h-8 text-blue-500" />
              Live Orders
            </h1>
            <p className="text-muted-foreground">
              Real-time order management with Kanban board interface
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        {/* Upgrade Prompt */}
        <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for Live Order Management
            </CardTitle>
            <CardDescription className="text-base">
              Transform your order management with real-time tracking and Kanban board interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Pending Orders</h3>
                    <p className="text-2xl font-bold text-orange-600">8</p>
                    <p className="text-sm text-muted-foreground">Awaiting preparation</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold">In Progress</h3>
                    <p className="text-2xl font-bold text-blue-600">5</p>
                    <p className="text-sm text-muted-foreground">Being prepared</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-blue-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Ready</h3>
                    <p className="text-2xl font-bold text-green-600">3</p>
                    <p className="text-sm text-muted-foreground">Ready for pickup</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">What you'll get:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Real-time order tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Drag-and-drop Kanban board</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Order status notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Kitchen workflow optimization</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Improve efficiency:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Reduce order preparation time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Better customer communication</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Streamlined kitchen operations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Real-time performance insights</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Sample Order Cards */}
            <div>
              <h3 className="font-semibold mb-3">Sample Live Orders:</h3>
              <div className="space-y-3">
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #ORD-123</p>
                        <p className="text-sm text-muted-foreground">Chicken Biryani, Lassi</p>
                        <p className="text-sm text-orange-600">Pending - 2 min ago</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">৳450</p>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order #ORD-124</p>
                        <p className="text-sm text-muted-foreground">Fish Curry, Rice</p>
                        <p className="text-sm text-blue-600">In Progress - 8 min ago</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">৳320</p>
                        <Badge variant="outline" className="text-blue-600 border-blue-300">
                          Cooking
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - ৳1,500/month
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Start your free trial today • Cancel anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pro user content would go here
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-500" />
            Live Orders
          </h1>
          <p className="text-muted-foreground">
            Real-time order management with Kanban board interface
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1 bg-yellow-500">
          <Crown className="w-3 h-3" />
          Pro Active
        </Badge>
      </div>

      {/* Pro Kanban Board would be implemented here */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Live Order Management</p>
            <p className="text-muted-foreground">Kanban board implementation would go here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
