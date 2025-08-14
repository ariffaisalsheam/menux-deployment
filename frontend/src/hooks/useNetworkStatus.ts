import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  lastOnlineAt: Date | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check connection speed and type
    const checkConnectionQuality = () => {
      // @ts-ignore - navigator.connection is experimental
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        
        // Consider 2g and slow-2g as slow connections
        const slowTypes = ['slow-2g', '2g'];
        setIsSlowConnection(slowTypes.includes(connection.effectiveType));
      }
    };

    // Initial check
    checkConnectionQuality();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', checkConnectionQuality);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', checkConnectionQuality);
      }
    };
  }, []);

  return {
    isOnline,
    isSlowConnection,
    connectionType,
    lastOnlineAt
  };
};

// Hook for detecting when the app comes back online after being offline
export const useOnlineRecovery = (callback: () => void) => {
  const { isOnline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // App just came back online
      setWasOffline(false);
      callback();
    }
  }, [isOnline, wasOffline, callback]);
};

export default useNetworkStatus;
