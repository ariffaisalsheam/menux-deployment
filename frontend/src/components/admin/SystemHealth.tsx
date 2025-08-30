import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { 
  Activity, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { adminAPI } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

interface SystemHealthStatus {
  overallHealth: number;
  databaseHealthy: boolean;
  apiHealthy: boolean;
  errorRateHealthy: boolean;
  serviceHealthy: boolean;
  timestamp: string;
}

export default function SystemHealth() {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { notify } = useToast();

  const loadSystemHealth = async () => {
    try {
      const response = await adminAPI.getSystemHealth();
      setHealthStatus(response);
    } catch (error) {
      console.error('Failed to load system health:', error);
      notify('Failed to load system health data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSystemHealth();
  };

  useEffect(() => {
    loadSystemHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getHealthIcon = (isHealthy: boolean) => {
    return isHealthy ? CheckCircle : XCircle;
  };

  const getOverallHealthStatus = (health: number) => {
    if (health >= 95) return { status: 'Excellent', color: 'bg-green-500', variant: 'default' as const };
    if (health >= 85) return { status: 'Good', color: 'bg-blue-500', variant: 'secondary' as const };
    if (health >= 70) return { status: 'Warning', color: 'bg-yellow-500', variant: 'outline' as const };
    return { status: 'Critical', color: 'bg-red-500', variant: 'destructive' as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!healthStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load System Health</h2>
          <p className="text-muted-foreground mb-4">Failed to retrieve system health data</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallHealthStatus(healthStatus.overallHealth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Overall System Health
              </CardTitle>
              <CardDescription>
                Comprehensive system health score based on all monitored metrics
              </CardDescription>
            </div>
            <Badge variant={overallStatus.variant}>
              {overallStatus.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {healthStatus.overallHealth.toFixed(1)}%
              </span>
              <div className="text-sm text-muted-foreground">
                System Health Score
              </div>
            </div>
            <Progress 
              value={healthStatus.overallHealth} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Database Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className={`w-5 h-5 ${getHealthColor(healthStatus.databaseHealthy)}`} />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {React.createElement(getHealthIcon(healthStatus.databaseHealthy), {
                  className: `w-4 h-4 ${getHealthColor(healthStatus.databaseHealthy)}`
                })}
                <span className="font-medium">
                  {healthStatus.databaseHealthy ? 'Healthy' : 'Issues Detected'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {healthStatus.databaseHealthy 
                ? 'Database connectivity and response times are optimal'
                : 'Database experiencing connectivity or performance issues'
              }
            </p>
          </CardContent>
        </Card>

        {/* API Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className={`w-5 h-5 ${getHealthColor(healthStatus.apiHealthy)}`} />
              API Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {React.createElement(getHealthIcon(healthStatus.apiHealthy), {
                  className: `w-4 h-4 ${getHealthColor(healthStatus.apiHealthy)}`
                })}
                <span className="font-medium">
                  {healthStatus.apiHealthy ? 'Healthy' : 'Issues Detected'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {healthStatus.apiHealthy 
                ? 'API response times are within acceptable limits'
                : 'API services experiencing slow response times'
              }
            </p>
          </CardContent>
        </Card>

        {/* Error Rate Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className={`w-5 h-5 ${getHealthColor(healthStatus.errorRateHealthy)}`} />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {React.createElement(getHealthIcon(healthStatus.errorRateHealthy), {
                  className: `w-4 h-4 ${getHealthColor(healthStatus.errorRateHealthy)}`
                })}
                <span className="font-medium">
                  {healthStatus.errorRateHealthy ? 'Normal' : 'Elevated'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {healthStatus.errorRateHealthy 
                ? 'Error rates are within normal parameters'
                : 'Higher than normal error rates detected'
              }
            </p>
          </CardContent>
        </Card>

        {/* Service Availability */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className={`w-5 h-5 ${getHealthColor(healthStatus.serviceHealthy)}`} />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {React.createElement(getHealthIcon(healthStatus.serviceHealthy), {
                  className: `w-4 h-4 ${getHealthColor(healthStatus.serviceHealthy)}`
                })}
                <span className="font-medium">
                  {healthStatus.serviceHealthy ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {healthStatus.serviceHealthy 
                ? 'All core services are operational'
                : 'Some core services are experiencing issues'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Additional system metrics and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Last Health Check</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(healthStatus.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Monitoring Frequency</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time (30 second intervals)
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Health Score Calculation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Weighted average of all metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
