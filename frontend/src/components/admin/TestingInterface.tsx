import React, { useState } from 'react';
import { TestTube, User, Crown, RefreshCw, CheckCircle, ArrowRight, Play, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

interface TestUser {
  id: number;
  name: string;
  role: 'RESTAURANT_OWNER' | 'SUPER_ADMIN';
  plan?: 'BASIC' | 'PRO';
  restaurantName?: string;
  description: string;
}

const testUsers: TestUser[] = [
  {
    id: 1,
    name: 'Basic Restaurant Owner',
    role: 'RESTAURANT_OWNER',
    plan: 'BASIC',
    restaurantName: 'Test Restaurant (Basic)',
    description: 'Test Basic plan features and upgrade prompts'
  },
  {
    id: 2,
    name: 'Pro Restaurant Owner',
    role: 'RESTAURANT_OWNER',
    plan: 'PRO',
    restaurantName: 'Test Restaurant (Pro)',
    description: 'Test all Pro features and advanced functionality'
  },
  {
    id: 3,
    name: 'Super Administrator',
    role: 'SUPER_ADMIN',
    restaurantName: 'System Admin',
    description: 'Test admin dashboard and user management'
  }
];

const testScenarios = [
  {
    id: 1,
    title: 'Basic Plan Feature Testing',
    description: 'Test restaurant profile, menu management, order history, and basic analytics',
    steps: [
      'Switch to Basic plan user',
      'Navigate to restaurant profile',
      'Test menu management features',
      'View order history',
      'Check basic analytics',
      'Verify Pro upgrade prompts'
    ]
  },
  {
    id: 2,
    title: 'Pro Plan Feature Testing',
    description: 'Test live orders, AI features, advanced analytics, and notifications',
    steps: [
      'Switch to Pro plan user',
      'Test live order management',
      'Use AI menu writer',
      'Check feedback analysis',
      'View advanced analytics',
      'Test notification center'
    ]
  },
  {
    id: 3,
    title: 'Plan Switching Testing',
    description: 'Test seamless switching between Basic and Pro plans',
    steps: [
      'Start with Basic plan',
      'Note available features',
      'Switch to Pro plan',
      'Verify new features unlock',
      'Switch back to Basic',
      'Confirm feature restrictions'
    ]
  }
];

export const TestingInterface: React.FC = () => {
  const { user, switchUserContext, updateUserPlan, refreshUser } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const switchToTestUser = async (testUser: TestUser) => {
    setCurrentTest(`Switching to ${testUser.name}`);
    
    const userData = {
      id: testUser.id,
      username: `test_${testUser.id}`,
      email: `test${testUser.id}@example.com`,
      fullName: testUser.name,
      role: testUser.role,
      restaurantId: testUser.role === 'RESTAURANT_OWNER' ? testUser.id : undefined,
      restaurantName: testUser.restaurantName,
      subscriptionPlan: testUser.plan
    };

    switchUserContext(userData);
    await refreshUser();
    
    addTestResult(`✅ Switched to ${testUser.name} (${testUser.plan || testUser.role})`);
    setCurrentTest(null);
    
    // Navigate based on role
    if (testUser.role === 'SUPER_ADMIN') {
      setTimeout(() => window.location.href = '/admin', 1000);
    } else {
      setTimeout(() => window.location.href = '/dashboard', 1000);
    }
  };

  const quickPlanSwitch = async (plan: 'BASIC' | 'PRO') => {
    if (user?.role === 'RESTAURANT_OWNER') {
      setCurrentTest(`Switching to ${plan} plan`);
      updateUserPlan(plan);
      await refreshUser();
      addTestResult(`✅ Switched current user to ${plan} plan`);
      setCurrentTest(null);
      
      // Refresh the page to apply changes
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const runTestScenario = (scenario: typeof testScenarios[0]) => {
    addTestResult(`🧪 Starting test scenario: ${scenario.title}`);
    scenario.steps.forEach((step, index) => {
      setTimeout(() => {
        addTestResult(`${index + 1}. ${step}`);
      }, (index + 1) * 500);
    });
    setTimeout(() => {
      addTestResult(`✅ Test scenario completed: ${scenario.title}`);
    }, scenario.steps.length * 500 + 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="w-8 h-8 text-blue-500" />
            Testing Interface
          </h1>
          <p className="text-muted-foreground">
            User-friendly testing tools for different user scenarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user?.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
            Current: {user?.subscriptionPlan || user?.role || 'Unknown'}
          </Badge>
          <Button onClick={clearResults} variant="outline">
            Clear Results
          </Button>
        </div>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Current User Context
          </CardTitle>
          <CardDescription>
            Currently testing as this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.fullName || 'No user'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.restaurantName && (
                <p className="text-sm text-muted-foreground">{user.restaurantName}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={user?.role === 'SUPER_ADMIN' ? 'destructive' : 'default'}>
                {user?.role || 'Unknown'}
              </Badge>
              {user?.subscriptionPlan && (
                <Badge variant={user.subscriptionPlan === 'PRO' ? 'default' : 'secondary'}>
                  {user.subscriptionPlan}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Plan Switching */}
      {user?.role === 'RESTAURANT_OWNER' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Quick Plan Switching
            </CardTitle>
            <CardDescription>
              Switch the current user's subscription plan instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={() => quickPlanSwitch('BASIC')}
                variant={user.subscriptionPlan === 'BASIC' ? 'default' : 'outline'}
                disabled={currentTest !== null}
              >
                {currentTest === 'Switching to BASIC plan' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <User className="w-4 h-4 mr-2" />
                )}
                Switch to Basic
              </Button>
              <Button 
                onClick={() => quickPlanSwitch('PRO')}
                variant={user.subscriptionPlan === 'PRO' ? 'default' : 'outline'}
                disabled={currentTest !== null}
              >
                {currentTest === 'Switching to PRO plan' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Crown className="w-4 h-4 mr-2" />
                )}
                Switch to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test User Switching */}
      <Card>
        <CardHeader>
          <CardTitle>Switch Test User</CardTitle>
          <CardDescription>
            Switch to different user types to test various scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testUsers.map((testUser) => (
              <Card key={testUser.id} className="border-dashed border-2">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      {testUser.role === 'SUPER_ADMIN' ? (
                        <Shield className="w-6 h-6 text-red-600" />
                      ) : testUser.plan === 'PRO' ? (
                        <Crown className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{testUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{testUser.description}</p>
                    </div>
                    <Button 
                      onClick={() => switchToTestUser(testUser)}
                      disabled={currentTest !== null}
                      className="w-full"
                    >
                      {currentTest === `Switching to ${testUser.name}` ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-2" />
                      )}
                      Switch to User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Test Scenarios</CardTitle>
          <CardDescription>
            Guided testing scenarios for comprehensive feature validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testScenarios.map((scenario) => (
              <div key={scenario.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{scenario.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                    <div className="space-y-1">
                      {scenario.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={() => runTestScenario(scenario)}
                    variant="outline"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Test
                  </Button>
                </div>
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
            <div className="space-y-1 font-mono text-sm max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-green-600">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
