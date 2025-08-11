import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  retryText = 'Try Again',
  className = ''
}) => {
  return (
    <Card className={`border-red-200 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center flex-col gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div>
            <h3 className="font-medium text-red-900">Something went wrong</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {retryText}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const InlineError: React.FC<{ error: string; className?: string }> = ({ 
  error, 
  className = '' 
}) => (
  <div className={`flex items-center gap-2 text-red-600 text-sm ${className}`}>
    <AlertCircle className="w-4 h-4" />
    <span>{error}</span>
  </div>
);

export default ErrorDisplay;
