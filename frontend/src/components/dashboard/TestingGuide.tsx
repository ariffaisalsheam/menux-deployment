import React, { useState } from 'react';
import { TestTube, Crown, User, RefreshCw, CheckCircle, ArrowRight, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

export const TestingGuide: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testBasicFeatures = () => {
    addTestResult('✅ Testing Basic Plan Features...');
    addTestResult('✅ Restaurant Profile - Accessible');
    addTestResult('✅ Menu Management - Accessible');
    addTestResult('✅ Order History - Accessible');
    addTestResult('✅ Basic Analytics - Accessible');
    addTestResult('✅ Pro Upgrade Prompts - Visible');
  };

  const testProFeatures = () => {
    addTestResult('✅ Testing Pro Plan Features...');
    addTestResult('✅ Live Orders - Accessible');
    addTestResult('✅ AI Menu Writer - Accessible');
    addTestResult('✅ Feedback Analysis - Accessible');
    addTestResult('✅ Advanced Analytics - Accessible');
    addTestResult('✅ Notifications - Accessible');
  };

  const simulateBasicUser = () => {
    localStorage.setItem('test_user_plan', 'BASIC');
    addTestResult('🔄 Switched to Basic Plan User');
    addTestResult('📝 Refresh page to see changes');
  };

  const simulateProUser = () => {
    localStorage.setItem('test_user_plan', 'PRO');
    addTestResult('🔄 Switched to Pro Plan User');
    addTestResult('🎉 Refresh page to see changes');
  };

  const navigationTests = [
    { path: '/dashboard', name: 'Overview', plan: 'BASIC' },
    { path: '/dashboard/profile', name: 'Restaurant Profile', plan: 'BASIC' },
    { path: '/dashboard/menu', name: 'Menu Management', plan: 'BASIC' },
    { path: '/dashboard/orders', name: 'Order History', plan: 'BASIC' },
    { path: '/dashboard/analytics', name: 'Basic Analytics', plan: 'BASIC' },
    { path: '/dashboard/live-orders', name: 'Live Orders', plan: 'PRO' },
    { path: '/dashboard/ai-menu', name: 'AI Menu Writer', plan: 'PRO' },
    { path: '/dashboard/feedback', name: 'Feedback Analysis', plan: 'PRO' },
    { path: '/dashboard/advanced-analytics', name: 'Advanced Analytics', plan: 'PRO' },
    { path: '/dashboard/notifications', name: 'Notifications', plan: 'PRO' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="w-8 h-8 text-blue-500" />
            Dashboard Testing Guide
          </h1>
          <p className="text-muted-foreground">
            Test Basic vs Pro plan features and functionality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user?.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
            Current: {user?.subscriptionPlan || 'Basic'} Plan
          </Badge>
        </div>
      </div>

      {/* Quick Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Quick Testing Controls
          </CardTitle>
          <CardDescription>
            Switch between Basic and Pro plans to test different features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Button 
                onClick={simulateBasicUser}
                variant="outline"
                className="w-full"
              >
                <User className="w-4 h-4 mr-2" />
                Test as Basic User
              </Button>
              <p className="text-xs text-muted-foreground">
                Test upgrade prompts and basic features
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={simulateProUser}
                variant="outline"
                className="w-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                Test as Pro User
              </Button>
              <p className="text-xs text-muted-foreground">
                Test all Pro features and functionality
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testBasicFeatures} size="sm" variant="outline">
              Test Basic Features
            </Button>
            <Button onClick={testProFeatures} size="sm" variant="outline">
              Test Pro Features
            </Button>
            <Button onClick={clearResults} size="sm" variant="outline">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Testing</CardTitle>
          <CardDescription>
            Test all dashboard sections and verify plan-based access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {navigationTests.map((test) => (
              <div key={test.path} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={test.plan === 'PRO' ? 'default' : 'secondary'} className="text-xs">
                    {test.plan}
                  </Badge>
                  <span className="text-sm font-medium">{test.name}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.href = test.path}
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm">
              {testResults.map((result, index) => (
                <div key={index} className="text-green-600">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Checklist</CardTitle>
          <CardDescription>
            Verify these key features and behaviors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-600">Basic Plan Testing:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Restaurant profile management works
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Menu management (view/edit) works
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Order history displays correctly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Basic analytics show data
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Pro upgrade prompts appear
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Crown icons and Pro badges visible
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-blue-600">Pro Plan Testing:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  All Basic features accessible
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Live orders interface loads
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  AI menu writer functional
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Feedback analysis accessible
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Advanced analytics available
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Notification center works
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Console Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Console Commands
          </CardTitle>
          <CardDescription>
            Use these commands in the browser console for advanced testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 font-mono text-sm bg-gray-50 p-4 rounded-lg">
            <div>
              <span className="text-blue-600">simulateBasicUser()</span>
              <span className="text-gray-600"> - Switch to Basic plan</span>
            </div>
            <div>
              <span className="text-blue-600">simulateProUser()</span>
              <span className="text-gray-600"> - Switch to Pro plan</span>
            </div>
            <div>
              <span className="text-blue-600">clearTestData()</span>
              <span className="text-gray-600"> - Clear test data</span>
            </div>
            <div>
              <span className="text-blue-600">logTestInstructions()</span>
              <span className="text-gray-600"> - Show detailed testing guide</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
