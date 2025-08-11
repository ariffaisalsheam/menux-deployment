import React from 'react';
import { Crown, TrendingUp, BarChart3, PieChart, LineChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export const AdvancedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              Advanced Analytics
            </h1>
            <p className="text-muted-foreground">
              Detailed insights and predictive analytics
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        <Card className="border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for Advanced Analytics
            </CardTitle>
            <CardDescription className="text-base">
              Get detailed insights, custom reports, and predictive analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed border-2 border-purple-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Custom Reports</h3>
                    <p className="text-sm text-muted-foreground">Detailed analytics</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-purple-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <PieChart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Customer Insights</h3>
                    <p className="text-sm text-muted-foreground">Behavior analysis</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-purple-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <LineChart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Predictions</h3>
                    <p className="text-sm text-muted-foreground">AI forecasting</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white">
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
            <TrendingUp className="w-8 h-8 text-purple-500" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">
            Detailed insights and predictive analytics
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
            <TrendingUp className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Advanced Analytics Dashboard</p>
            <p className="text-muted-foreground">Detailed analytics implementation would go here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
