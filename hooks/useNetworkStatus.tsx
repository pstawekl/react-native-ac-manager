import { useEffect, useState } from 'react';
import { getNetworkService } from '../services/NetworkService';

/**
 * Hook do monitorowania statusu połączenia sieciowego
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const networkService = getNetworkService();
    
    // Sprawdź początkowy status
    networkService.checkConnection().then(setIsConnected);

    // Subskrybuj zmiany
    const unsubscribe = networkService.onConnectionChange(setIsConnected);

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    isOffline: !isConnected,
  };
}

