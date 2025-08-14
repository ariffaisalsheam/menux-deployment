import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { isOnline, isSlowConnection, connectionType, lastOnlineAt } = useNetworkStatus();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show offline message after a short delay to avoid flashing
      const timer = setTimeout(() => setShowOfflineMessage(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineMessage(false);
    }
  }, [isOnline]);

  // Don't show anything if online and not showing details
  if (isOnline && !showDetails && !isSlowConnection) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSlowConnection) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff;
    if (isSlowConnection) return Signal;
    return Wifi;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSlowConnection) return 'Slow Connection';
    return 'Online';
  };

  const StatusIcon = getStatusIcon();

  if (!isOnline && showOfflineMessage) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">You're offline</h4>
              <p className="text-sm text-red-700">
                Some features may not work properly. Check your internet connection.
              </p>
              {lastOnlineAt && (
                <p className="text-xs text-red-600 mt-1">
                  Last online: {lastOnlineAt.toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSlowConnection) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg bg-yellow-50 border border-yellow-200 ${className}`}>
        <Signal className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">Slow connection detected</span>
        <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
          {connectionType}
        </Badge>
      </div>
    );
  }

  if (showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
        <span className="text-sm text-gray-600">{getStatusText()}</span>
        {connectionType !== 'unknown' && (
          <Badge variant="outline" className="text-xs">
            {connectionType}
          </Badge>
        )}
      </div>
    );
  }

  return null;
};

// Compact version for headers/status bars
export const CompactNetworkStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  const StatusIcon = isOnline ? Signal : WifiOff;
  const color = isOnline ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <StatusIcon className={`w-4 h-4 ${color}`} />
      <span className={`text-xs ${color}`}>
        {isOnline ? 'Slow' : 'Offline'}
      </span>
    </div>
  );
};

// Hook for components that need to react to network status
export const useNetworkStatusMessage = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const getNetworkMessage = () => {
    if (!isOnline) {
      return {
        type: 'error' as const,
        message: 'You are currently offline. Some features may not work properly.'
      };
    }
    if (isSlowConnection) {
      return {
        type: 'warning' as const,
        message: 'Slow connection detected. Operations may take longer than usual.'
      };
    }
    return null;
  };

  return getNetworkMessage();
};

export default NetworkStatusIndicator;
