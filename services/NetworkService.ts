// Lazy loading - importujemy tylko gdy potrzebne
// import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetInfoState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
};

/**
 * Prosty EventEmitter dla React Native
 */
class EventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

/**
 * Serwis monitorujący status połączenia sieciowego
 */
class NetworkService extends EventEmitter {
  private isConnected: boolean = false;
  private isInternetReachable: boolean = false;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    super();
    // Nie inicjalizuj od razu - lazy initialization
  }

  /**
   * Inicjalizuje monitorowanie sieci (lazy)
   */
  private async init(): Promise<void> {
    if (this.unsubscribe) {
      return; // Już zainicjalizowane
    }

    try {
      // Dynamiczny import NetInfo
      const NetInfo = (await import('@react-native-community/netinfo')).default;
      
      // Sprawdź początkowy status
      NetInfo.fetch().then((state) => {
        this.updateStatus(state);
      });

      // Subskrybuj zmiany
      this.unsubscribe = NetInfo.addEventListener((state) => {
        const wasConnected = this.isConnected;
        this.updateStatus(state);

        // Emituj event jeśli status się zmienił
        if (wasConnected !== this.isConnected) {
          this.emit('connectionChange', this.isConnected);
        }
      });
    } catch (error) {
      console.error('Błąd inicjalizacji NetworkService:', error);
      // Jeśli NetInfo nie jest dostępny, załóż że jesteśmy offline
      this.isConnected = false;
      this.isInternetReachable = false;
    }
  }

  /**
   * Aktualizuje status połączenia
   */
  private updateStatus(state: NetInfoState): void {
    this.isConnected = state.isConnected ?? false;
    this.isInternetReachable = state.isInternetReachable ?? false;
  }

  /**
   * Sprawdza czy urządzenie jest online
   */
  public async checkConnection(): Promise<boolean> {
    await this.init(); // Upewnij się, że jest zainicjalizowane
    try {
      const NetInfo = (await import('@react-native-community/netinfo')).default;
      const state = await NetInfo.fetch();
      this.updateStatus(state);
      return this.isConnected && this.isInternetReachable;
    } catch (error) {
      console.error('Błąd checkConnection:', error);
      // Jeśli NetInfo nie jest dostępny, załóż że jesteśmy offline
      this.isConnected = false;
      this.isInternetReachable = false;
      return false;
    }
  }

  /**
   * Zwraca aktualny status połączenia
   */
  public getIsConnected(): boolean {
    // Inicjalizuj asynchronicznie w tle (nie blokuj)
    this.init().catch((error) => {
      console.error('Błąd inicjalizacji w getIsConnected:', error);
    });
    return this.isConnected && this.isInternetReachable;
  }

  /**
   * Subskrybuje zmiany statusu połączenia
   */
  public onConnectionChange(
    callback: (isConnected: boolean) => void,
  ): () => void {
    this.on('connectionChange', callback);
    return () => {
      this.off('connectionChange', callback);
    };
  }

  /**
   * Czeka na przywrócenie połączenia
   */
  public async waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isConnected) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.onConnectionChange((isConnected) => {
        if (isConnected) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Zatrzymuje monitorowanie
   */
  public stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.removeAllListeners();
  }
}

// Singleton instance - lazy initialization
let networkServiceInstance: NetworkService | null = null;

export function getNetworkService(): NetworkService {
  if (!networkServiceInstance) {
    networkServiceInstance = new NetworkService();
  }
  return networkServiceInstance;
}

// Dla kompatybilności wstecznej
export const networkService = getNetworkService();

