// Utility functions for handling retries and error recovery

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const defaultRetryCondition = (error: any): boolean => {
  // Retry on network errors, 5xx errors, or specific AI service errors
  return (
    !error.response || // Network error
    error.response.status >= 500 || // Server errors
    error.response.status === 503 || // Service unavailable
    error.isRetryable === true || // Explicitly marked as retryable
    (error.message && error.message.toLowerCase().includes('temporarily unavailable'))
  );
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    retryCondition = defaultRetryCondition,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or if retry condition fails
      if (attempt === maxAttempts || !retryCondition(error)) {
        throw error;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Calculate delay for next attempt
      let nextDelay = delay;
      if (backoff === 'exponential') {
        nextDelay = delay * Math.pow(2, attempt - 1);
      } else if (backoff === 'linear') {
        nextDelay = delay * attempt;
      }

      // Add some jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * nextDelay;
      nextDelay += jitter;

      await new Promise(resolve => setTimeout(resolve, nextDelay));
    }
  }

  throw lastError;
};

// Specialized retry for AI operations
export const withAIRetry = async <T>(
  operation: () => Promise<T>,
  onRetry?: (attempt: number, error: any) => void
): Promise<T> => {
  return withRetry(operation, {
    maxAttempts: 3,
    delay: 2000,
    backoff: 'exponential',
    retryCondition: (error) => {
      // Retry on circuit breaker, temporary unavailability, or network issues
      const message = error.message?.toLowerCase() || '';
      return (
        message.includes('circuit breaker') ||
        message.includes('temporarily unavailable') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        error.response?.status === 503 ||
        !error.response
      );
    },
    onRetry
  });
};

// Hook for managing retry state in components
export const useRetryableOperation = () => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<any>(null);

  const executeWithRetry = async <T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);
    setLastError(null);

    try {
      const result = await withRetry(operation, {
        ...options,
        onRetry: (attempt, error) => {
          setRetryCount(attempt);
          setLastError(error);
          options?.onRetry?.(attempt, error);
        }
      });
      return result;
    } catch (error) {
      setLastError(error);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  };

  const reset = () => {
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
  };

  return {
    isRetrying,
    retryCount,
    lastError,
    executeWithRetry,
    reset
  };
};

// Debounce utility for preventing rapid retries
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Circuit breaker pattern for preventing cascading failures
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  threshold: number;
  timeout: number;

  constructor(
    threshold = 5,
    timeout = 60000 // 1 minute
  ) {
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

// Export React import for the hook
import React from 'react';
