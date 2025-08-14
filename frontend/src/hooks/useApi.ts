import { useState, useEffect, useCallback, useRef } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  const apiFunctionRef = useRef(apiFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const hasExecutedRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiFunctionRef.current();
      setState({ data: result, loading: false, error: null });
      onSuccessRef.current?.(result);
      return result;
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 403) {
          errorMessage = 'Access denied. You do not have permission to perform this action.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (axiosError.response?.status >= 500) {
          errorMessage = 'Unable to connect to server. Please contact support if this issue persists.';
        } else if (!axiosError.response) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
      }

      setState({ data: null, loading: false, error: errorMessage });
      onErrorRef.current?.(errorMessage);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      execute();
    }
  }, [immediate]); // Removed execute from dependencies to prevent infinite loop

  return {
    ...state,
    execute,
    reset,
    refetch: execute
  };
}

export function useApiMutation<T, P = any>(
  apiFunction: (params: P) => Promise<T>,
  options: UseApiOptions = {}
) {
  const { onSuccess, onError } = options;
  const apiFunctionRef = useRef(apiFunction);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const mutate = useCallback(async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiFunctionRef.current(params);
      setState({ data: result, loading: false, error: null });
      onSuccessRef.current?.(result);
      return result;
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 403) {
          errorMessage = 'Access denied. You do not have permission to perform this action.';
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (axiosError.response?.status >= 500) {
          errorMessage = 'Unable to connect to server. Please contact support if this issue persists.';
        } else if (!axiosError.response) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
      }

      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      onErrorRef.current?.(errorMessage);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset
  };
}

// Specialized hooks for common patterns
export function useApiWithRetry<T>(
  apiFunction: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
) {
  const [retryCount, setRetryCount] = useState(0);
  const apiFunctionRef = useRef(apiFunction);

  useEffect(() => {
    apiFunctionRef.current = apiFunction;
  });

  const apiWithRetry = useCallback(async (): Promise<T> => {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await apiFunctionRef.current();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (i < maxRetries) {
          setRetryCount(i + 1);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        }
      }
    }

    throw lastError!;
  }, [maxRetries, retryDelay]);

  const apiState = useApi(apiWithRetry, { immediate: false });

  return {
    ...apiState,
    retryCount,
    retry: apiState.execute
  };
}

export default useApi;
