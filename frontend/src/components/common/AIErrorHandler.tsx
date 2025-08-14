import React from 'react';
import { AlertTriangle, Wifi, RefreshCw, Settings, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface AIErrorHandlerProps {
  error: string;
  onRetry?: () => void;
  onConfigure?: () => void;
  className?: string;
  showConfigButton?: boolean;
}

export const AIErrorHandler: React.FC<AIErrorHandlerProps> = ({
  error,
  onRetry,
  onConfigure,
  className = '',
  showConfigButton = false
}) => {
  // Categorize the error type
  const getErrorType = (errorMessage: string) => {
    const msg = errorMessage.toLowerCase();
    
    if (msg.includes('circuit breaker') || msg.includes('temporarily unavailable')) {
      return 'circuit_breaker';
    }
    if (msg.includes('connection') || msg.includes('network') || msg.includes('timeout')) {
      return 'network';
    }
    if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('authentication')) {
      return 'auth';
    }
    if (msg.includes('quota') || msg.includes('limit') || msg.includes('rate')) {
      return 'quota';
    }
    if (msg.includes('provider') && msg.includes('error')) {
      return 'provider';
    }
    return 'general';
  };

  const errorType = getErrorType(error);

  const getErrorConfig = (type: string) => {
    switch (type) {
      case 'circuit_breaker':
        return {
          icon: Clock,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'Service Temporarily Unavailable',
          description: 'The AI service is temporarily unavailable due to high load or errors. Please try again in a few minutes.',
          showRetry: true,
          retryText: 'Try Again',
          badge: 'Temporary'
        };
      case 'network':
        return {
          icon: Wifi,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Connection Problem',
          description: 'Unable to connect to the AI service. Please check your internet connection.',
          showRetry: true,
          retryText: 'Retry Connection',
          badge: 'Network'
        };
      case 'auth':
        return {
          icon: Settings,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Configuration Issue',
          description: 'There\'s an issue with the AI service configuration. Please contact your administrator.',
          showRetry: false,
          retryText: 'Configure',
          badge: 'Config'
        };
      case 'quota':
        return {
          icon: AlertTriangle,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          title: 'Service Limit Reached',
          description: 'The AI service has reached its usage limit. Please try again later or contact support.',
          showRetry: false,
          retryText: 'Contact Support',
          badge: 'Quota'
        };
      case 'provider':
        return {
          icon: AlertTriangle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          title: 'AI Provider Error',
          description: 'The AI provider encountered an error. This is usually temporary.',
          showRetry: true,
          retryText: 'Try Again',
          badge: 'Provider'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'AI Service Error',
          description: 'An unexpected error occurred with the AI service.',
          showRetry: true,
          retryText: 'Try Again',
          badge: 'Error'
        };
    }
  };

  const config = getErrorConfig(errorType);
  const IconComponent = config.icon;

  return (
    <Card className={`${config.borderColor} ${config.bgColor} ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full bg-white shadow-sm`}>
            <IconComponent className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-gray-900">{config.title}</h3>
              <Badge variant="outline" className="text-xs">
                {config.badge}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {config.description}
            </p>
            <details className="mb-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <p className="text-xs text-gray-500 mt-1 font-mono bg-white p-2 rounded border">
                {error}
              </p>
            </details>
            <div className="flex gap-2">
              {config.showRetry && onRetry && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onRetry}
                  className={`${config.borderColor} hover:${config.bgColor}`}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {config.retryText}
                </Button>
              )}
              {showConfigButton && onConfigure && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onConfigure}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Simplified inline version for smaller spaces
export const InlineAIError: React.FC<{ 
  error: string; 
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className = '' }) => {
  const isTemporary = error.toLowerCase().includes('temporarily') || 
                     error.toLowerCase().includes('circuit breaker');
  
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${
      isTemporary ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-red-50 border-red-200 text-red-800'
    } ${className}`}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm flex-1">{error}</span>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry} className="h-6 px-2">
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

export default AIErrorHandler;
