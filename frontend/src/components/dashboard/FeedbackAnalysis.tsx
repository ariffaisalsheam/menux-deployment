import React from 'react';
import { Crown, MessageSquare, Frown, Meh, Smile } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export const FeedbackAnalysis: React.FC = () => {
  const { user } = useAuth();
  const isPro = user?.subscriptionPlan === 'PRO';

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-green-500" />
              Feedback Analysis
            </h1>
            <p className="text-muted-foreground">
              AI-powered sentiment analysis and customer insights
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Crown className="w-3 h-3" />
            Pro Feature
          </Badge>
        </div>

        <Card className="border-green-300 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Crown className="h-6 w-6 text-yellow-500" />
              Upgrade to Pro for AI Feedback Analysis
            </CardTitle>
            <CardDescription className="text-base">
              Understand customer sentiment and get actionable insights from reviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-dashed border-2 border-green-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Smile className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Positive</h3>
                    <p className="text-2xl font-bold text-green-600">78%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-green-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Meh className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Neutral</h3>
                    <p className="text-2xl font-bold text-yellow-600">15%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed border-2 border-green-300">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Frown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Negative</h3>
                    <p className="text-2xl font-bold text-red-600">7%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t">
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white">
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
            <MessageSquare className="w-8 h-8 text-green-500" />
            Feedback Analysis
          </h1>
          <p className="text-muted-foreground">
            AI-powered sentiment analysis and customer insights
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
            <MessageSquare className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">AI Feedback Analysis</p>
            <p className="text-muted-foreground">Advanced sentiment analysis would be implemented here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
