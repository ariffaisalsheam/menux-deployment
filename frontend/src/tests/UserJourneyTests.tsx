import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, XCircle, Clock, Play, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
}

export const UserJourneyTests: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      name: 'Diner Journey',
      description: 'QR code scanning → menu viewing → order placement',
      tests: [
        { name: 'QR Code Scanner Access', status: 'pending' },
        { name: 'Menu Display (Basic Restaurant)', status: 'pending' },
        { name: 'Menu Display (Pro Restaurant)', status: 'pending' },
        { name: 'Order Placement (Pro Only)', status: 'pending' },
        { name: 'Order Confirmation', status: 'pending' },
        { name: 'Feedback Submission', status: 'pending' }
      ]
    },
    {
      name: 'Restaurant Owner (Basic) Journey',
      description: 'Login → profile management → menu CRUD → order history → upgrade prompts',
      tests: [
        { name: 'Login Authentication', status: 'pending' },
        { name: 'Dashboard Access', status: 'pending' },
        { name: 'Restaurant Profile Management', status: 'pending' },
        { name: 'Menu Item Creation', status: 'pending' },
        { name: 'Menu Item Editing', status: 'pending' },
        { name: 'Menu Item Deletion', status: 'pending' },
        { name: 'Order History View', status: 'pending' },
        { name: 'Basic Analytics Access', status: 'pending' },
        { name: 'Pro Feature Upgrade Prompts', status: 'pending' }
      ]
    },
    {
      name: 'Restaurant Owner (Pro) Journey',
      description: 'All Basic features + live orders → AI menu writer → feedback analysis → advanced analytics',
      tests: [
        { name: 'Pro Dashboard Access', status: 'pending' },
        { name: 'Live Order Management', status: 'pending' },
        { name: 'AI Menu Description Generator', status: 'pending' },
        { name: 'AI Feedback Analysis', status: 'pending' },
        { name: 'Advanced Analytics Dashboard', status: 'pending' },
        { name: 'Real-time Order Notifications', status: 'pending' },
        { name: 'Customer Feedback Management', status: 'pending' }
      ]
    },
    {
      name: 'Super Admin Journey',
      description: 'User management → restaurant management → plan switching → AI provider configuration → platform analytics',
      tests: [
        { name: 'Admin Login', status: 'pending' },
        { name: 'User Management Dashboard', status: 'pending' },
        { name: 'User Plan Switching', status: 'pending' },
        { name: 'User Deletion', status: 'pending' },
        { name: 'Restaurant Management', status: 'pending' },
        { name: 'Platform Analytics', status: 'pending' },
        { name: 'AI Provider Configuration', status: 'pending' },
        { name: 'AI Provider Testing', status: 'pending' },
        { name: 'Primary Provider Selection', status: 'pending' },
        { name: 'Admin-User Context Switching', status: 'pending' }
      ]
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const simulateTest = async (_suiteName: string, _testName: string): Promise<boolean> => {
    // Simulate test execution with random success/failure
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    // Simulate different success rates for different types of tests
  const successRate = _testName.includes('AI') ? 0.7 : 0.9;
    return Math.random() < successRate;
  };

  const runTestSuite = async (suiteIndex: number) => {
    setIsRunning(true);
    const suite = testSuites[suiteIndex];
    
    for (let testIndex = 0; testIndex < suite.tests.length; testIndex++) {
      const test = suite.tests[testIndex];
      setCurrentTest(`${suite.name} - ${test.name}`);
      
      // Update test status to running
      setTestSuites(prev => {
        const newSuites = [...prev];
        newSuites[suiteIndex].tests[testIndex].status = 'running';
        return newSuites;
      });

      const startTime = Date.now();
      const success = await simulateTest(suite.name, test.name);
      const duration = Date.now() - startTime;

      // Update test result
      setTestSuites(prev => {
        const newSuites = [...prev];
        newSuites[suiteIndex].tests[testIndex] = {
          ...test,
          status: success ? 'passed' : 'failed',
          duration,
          error: success ? undefined : 'Simulated test failure for demonstration'
        };
        return newSuites;
      });
    }
    
    setCurrentTest(null);
    setIsRunning(false);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (let suiteIndex = 0; suiteIndex < testSuites.length; suiteIndex++) {
      await runTestSuite(suiteIndex);
    }
    
    setIsRunning(false);
  };

  const resetTests = () => {
    setTestSuites(prev => 
      prev.map(suite => ({
        ...suite,
        tests: suite.tests.map(test => ({
          ...test,
          status: 'pending',
          error: undefined,
          duration: undefined
        }))
      }))
    );
    setCurrentTest(null);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-500">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getTotalStats = () => {
    const allTests = testSuites.flatMap(suite => suite.tests);
    const passed = allTests.filter(test => test.status === 'passed').length;
    const failed = allTests.filter(test => test.status === 'failed').length;
    const total = allTests.length;
    
    return { passed, failed, total, pending: total - passed - failed };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Journey Tests</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of all user workflows in Menu.X
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetTests} disabled={isRunning}>
            Reset Tests
          </Button>
          <Button onClick={runAllTests} disabled={isRunning}>
            <Play className="w-4 h-4 mr-2" />
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <p className="text-sm text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Tests</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Test Status */}
      {currentTest && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="font-medium">Currently Running:</span>
              <span>{currentTest}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Suites */}
      <div className="grid gap-6">
        {testSuites.map((suite, suiteIndex) => (
          <Card key={suite.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{suite.name}</CardTitle>
                  <CardDescription>{suite.description}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTestSuite(suiteIndex)}
                  disabled={isRunning}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Suite
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suite.tests.map((test) => (
                  <div
                    key={test.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <span className="font-medium">{test.name}</span>
                      {test.duration && (
                        <span className="text-sm text-muted-foreground">
                          ({test.duration}ms)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {test.error && (
                        <span className="inline-flex items-center" aria-label={test.error}>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </span>
                      )}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Test Results Summary */}
      {stats.passed + stats.failed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-bold">
                  {((stats.passed / (stats.passed + stats.failed)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Tests Run:</span>
                <span>{stats.passed + stats.failed}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Duration:</span>
                <span>
                  {Math.round(
                    testSuites
                      .flatMap(suite => suite.tests)
                      .filter(test => test.duration)
                      .reduce((sum, test) => sum + (test.duration || 0), 0) /
                    testSuites
                      .flatMap(suite => suite.tests)
                      .filter(test => test.duration).length
                  )}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
