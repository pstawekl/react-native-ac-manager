/* eslint-disable no-console */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

const API_URL: string =
  Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
const API_PATH: string =
  API_URL.length > 0 && API_PORT.length > 0
    ? `${API_URL}:${API_PORT}/api`
    : `${API_URL}/api`;

// Klucze AsyncStorage
const DEVICE_ID_KEY = '@license:device_id';
const LICENSE_STATUS_KEY = '@license:status';
const LAST_CHECK_KEY = '@license:last_check';

// Typy
type LicenseType = 'demo' | 'blocked' | 'full';

interface LicenseStatus {
  licenseType: LicenseType;
  isValid: boolean;
  daysRemaining?: number;
  expiryDate?: string;
  message?: string;
}

interface LicenseContextType {
  licenseStatus: LicenseStatus | null;
  initialLoading: boolean; // Loading przy pierwszym uruchomieniu
  refreshing: boolean; // Odświeżanie w tle
  error?: string;
  deviceId?: string;
  checkLicense: (force?: boolean, silent?: boolean) => Promise<void>;
  isLicenseValid: () => boolean;
  shouldBlockApp: () => boolean;
}

const LicenseContext = createContext<LicenseContextType>(
  {} as LicenseContextType,
);

// Provider
export function LicenseProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(
    null,
  );
  const [deviceId, setDeviceId] = useState<string | undefined>();
  const [initialLoading, setInitialLoading] = useState<boolean>(true); // Tylko przy pierwszym ładowaniu
  const [refreshing, setRefreshing] = useState<boolean>(false); // Odświeżanie w tle
  const [error, setError] = useState<string | undefined>();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isInitialized = useRef<boolean>(false); // Flaga czy już zainicjalizowano

  /**
   * Generuje unikalny ID urządzenia
   */
  const generateDeviceId = useCallback(async (): Promise<string> => {
    try {
      // Próbuj pobrać zapisany device_id
      const savedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (savedDeviceId) {
        return savedDeviceId;
      }

      // Generuj nowy device_id
      let uniqueId: string;

      if (Platform.OS === 'android') {
        // Android - użyj androidId
        uniqueId = Application.androidId || '';
      } else if (Platform.OS === 'ios') {
        // iOS - użyj identifierForVendor
        uniqueId = (await Application.getIosIdForVendorAsync()) || '';
      } else {
        // Web lub inny
        uniqueId = `web-${Date.now().toString()}`;
      }

      // Dodaj dodatkowe informacje
      const deviceModel = Device.modelName || 'Unknown';
      const deviceOS = `${Platform.OS} ${Device.osVersion}`;
      const bundleId = Application.applicationId || '';

      // Pobierz installTime z timeoutem, aby nie blokować startu
      let installTime: Date | number;
      try {
        installTime = await Promise.race([
          Application.getInstallationTimeAsync(),
          new Promise<number>((resolve) =>
            setTimeout(() => resolve(Date.now()), 2000),
          ),
        ]);
      } catch (err) {
        console.warn('Error getting installation time, using fallback:', err);
        installTime = Date.now();
      }

      // Utwórz hash
      const dataToHash = `${uniqueId}-${deviceModel}-${bundleId}-${installTime}`;
      const hashedId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataToHash,
      );

      // Zapisz
      await AsyncStorage.setItem(DEVICE_ID_KEY, hashedId);

      return hashedId;
    } catch (err) {
      console.error('Error generating device ID:', err);
      // Fallback
      const fallbackId = `fallback-${Date.now()}-${Math.random()}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
      return fallbackId;
    }
  }, []);

  /**
   * Helper function to add timeout to fetch
   */
  const fetchWithTimeout = useCallback(
    async (
      url: string,
      options: RequestInit,
      timeout = 10000,
    ): Promise<Response> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    },
    [],
  );

  /**
   * Rejestruje urządzenie w systemie (pierwsze uruchomienie)
   */
  const registerDevice = useCallback(
    async (deviceIdToRegister: string): Promise<LicenseStatus> => {
      try {
        const deviceModel = Device.modelName || 'Unknown';
        const deviceOS = `${Platform.OS} ${Device.osVersion}`;
        const appVersion = Application.nativeApplicationVersion || '1.0.0';

        const response = await fetchWithTimeout(
          `${API_PATH}/license/register/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: deviceIdToRegister,
              device_model: deviceModel,
              device_os: deviceOS,
              app_version: appVersion,
            }),
          },
          10000, // 10 sekund timeout
        );

        if (!response.ok) {
          // Jeśli błąd serwera, spróbuj użyć cache jeśli dostępny
          if (response.status >= 500) {
            const cachedStatus = await AsyncStorage.getItem(LICENSE_STATUS_KEY);
            if (cachedStatus) {
              console.warn('Błąd serwera przy rejestracji, używam cache');
              return JSON.parse(cachedStatus);
            }
          }
          throw new Error('Nie udało się zarejestrować urządzenia');
        }

        const data = await response.json();

        const status: LicenseStatus = {
          licenseType: data.license_type,
          isValid: data.is_valid,
          daysRemaining: data.days_remaining,
          expiryDate: data.expiry_date,
          message: data.message,
        };

        // Zapisz status lokalnie
        await AsyncStorage.setItem(LICENSE_STATUS_KEY, JSON.stringify(status));
        await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());

        return status;
      } catch (err) {
        console.error('Error registering device:', err);

        // Jeśli to timeout lub błąd sieciowy, spróbuj użyć cache
        const isNetworkError =
          err instanceof Error &&
          (err.name === 'AbortError' ||
            err.message.includes('timeout') ||
            err.message.includes('network') ||
            err.message.includes('Failed to fetch'));

        if (isNetworkError) {
          const cachedStatus = await AsyncStorage.getItem(LICENSE_STATUS_KEY);
          if (cachedStatus) {
            console.warn('Błąd sieciowy przy rejestracji, używam cache');
            return JSON.parse(cachedStatus);
          }
        }

        // Jeśli nie ma cache, rzuć błąd
        throw err;
      }
    },
    [fetchWithTimeout],
  );

  /**
   * Sprawdza status licencji na serwerze
   * @param force - wymusza sprawdzenie na serwerze (ignoruje throttling)
   * @param silent - odświeżanie w tle (nie ustawia initialLoading, użytkownik nie widzi loadera)
   */
  const checkLicense = useCallback(
    async (force = false, silent = false): Promise<void> => {
      try {
        // Jeśli to ciche odświeżanie - użyj refreshing
        if (silent) {
          setRefreshing(true);
        } else if (!isInitialized.current) {
          // Tylko pierwsze uruchomienie pokazuje initialLoading
          setInitialLoading(true);
        }

        setError(undefined);

        // Pobierz device_id
        const currentDeviceId = await generateDeviceId();
        setDeviceId(currentDeviceId);

        // Sprawdź czy potrzeba sprawdzić (throttling - max raz na 5 minut, chyba że force=true)
        if (!force) {
          const lastCheckStr = await AsyncStorage.getItem(LAST_CHECK_KEY);
          if (lastCheckStr) {
            const lastCheck = new Date(lastCheckStr);
            const now = new Date();
            const minutesSinceLastCheck =
              (now.getTime() - lastCheck.getTime()) / (1000 * 60);

            if (minutesSinceLastCheck < 5) {
              // Użyj cached status
              const cachedStatus = await AsyncStorage.getItem(
                LICENSE_STATUS_KEY,
              );
              if (cachedStatus) {
                setLicenseStatus(JSON.parse(cachedStatus));
                isInitialized.current = true; // Oznacz jako zainicjalizowane
                setInitialLoading(false);
                setRefreshing(false);
                return;
              }
            }
          }
        }

        // Sprawdź na serwerze
        const response = await fetchWithTimeout(
          `${API_PATH}/license/check/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: currentDeviceId }),
          },
          10000, // 10 sekund timeout
        );

        if (response.status === 404) {
          // Urządzenie nie zarejestrowane - zarejestruj
          const newStatus = await registerDevice(currentDeviceId);
          setLicenseStatus(newStatus);
          isInitialized.current = true; // Oznacz jako zainicjalizowane
          setInitialLoading(false);
          setRefreshing(false);
          return;
        }

        if (!response.ok) {
          // Jeśli błąd sieciowy, użyj cache jeśli dostępny
          if (response.status >= 500 || response.status === 0) {
            const cachedStatus = await AsyncStorage.getItem(LICENSE_STATUS_KEY);
            if (cachedStatus) {
              console.warn('Błąd serwera, używam cache:', response.status);
              setLicenseStatus(JSON.parse(cachedStatus));
              isInitialized.current = true;
              setInitialLoading(false);
              setRefreshing(false);
              return;
            }
          }
          throw new Error('Nie udało się sprawdzić licencji');
        }

        const data = await response.json();

        const status: LicenseStatus = {
          licenseType: data.license_type,
          isValid: data.is_valid,
          daysRemaining: data.days_remaining,
          expiryDate: data.expiry_date,
          message: data.message,
        };

        // Zapisz status lokalnie
        await AsyncStorage.setItem(LICENSE_STATUS_KEY, JSON.stringify(status));
        await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());

        setLicenseStatus(status);
        isInitialized.current = true; // Oznacz jako zainicjalizowane
      } catch (err) {
        console.error('Error checking license:', err);

        // Sprawdź czy to timeout lub błąd sieciowy
        const isNetworkError =
          err instanceof Error &&
          (err.name === 'AbortError' ||
            err.message.includes('timeout') ||
            err.message.includes('network') ||
            err.message.includes('Failed to fetch'));

        // W przypadku błędu, użyj cached status jeśli dostępny
        const cachedStatus = await AsyncStorage.getItem(LICENSE_STATUS_KEY);
        if (cachedStatus) {
          console.warn(
            'Błąd sieciowy przy sprawdzaniu licencji, używam cache',
          );
          setLicenseStatus(JSON.parse(cachedStatus));
          isInitialized.current = true;
          // Nie ustawiaj błędu jeśli mamy cache - aplikacja może działać
        } else {
          // Tylko jeśli nie ma cache, ustaw błąd
          if (isNetworkError) {
            setError(
              'Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.',
            );
          } else {
            setError('Nie udało się sprawdzić licencji');
          }
        }
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [generateDeviceId, registerDevice, fetchWithTimeout],
  );

  /**
   * Sprawdza czy licencja jest ważna
   */
  const isLicenseValid = useCallback((): boolean => {
    return licenseStatus?.isValid ?? false;
  }, [licenseStatus]);

  /**
   * Sprawdza czy aplikacja powinna być zablokowana
   */
  const shouldBlockApp = useCallback((): boolean => {
    if (!licenseStatus) return false;

    return (
      licenseStatus.licenseType === 'blocked' ||
      (licenseStatus.licenseType === 'demo' && !licenseStatus.isValid)
    );
  }, [licenseStatus]);

  // Initial check przy montowaniu - ZAWSZE wymuszaj sprawdzenie przy starcie
  // Dodaj małe opóźnienie, aby nie blokować renderowania
  useEffect(() => {
    if (!isInitialized.current) {
      // Małe opóźnienie, aby pozwolić aplikacji na renderowanie
      const timeoutId = setTimeout(() => {
        checkLicense(true, false); // force = true, silent = false - pokaż loader przy pierwszym uruchomieniu
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pusta tablica - uruchom TYLKO RAZ przy montowaniu

  // Cykliczne sprawdzanie co 5 minut w tle
  useEffect(() => {
    const interval = setInterval(() => {
      checkLicense(false, true); // force = false, silent = true - odświeżaj w tle bez loadera
    }, 5 * 60 * 1000); // 5 minut

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pusta tablica - ustaw interwał TYLKO RAZ

  // Sprawdzanie licencji gdy aplikacja wraca na pierwszy plan (foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Jeśli aplikacja przechodzi z tła (background/inactive) na pierwszy plan (active)
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Wymuś sprawdzenie licencji gdy użytkownik wraca do aplikacji - cicho w tle
        checkLicense(true, true); // force = true, silent = true - sprawdź na serwerze ale w tle
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pusta tablica - ustaw listener TYLKO RAZ

  const value = useMemo(
    () => ({
      licenseStatus,
      initialLoading,
      refreshing,
      error,
      deviceId,
      checkLicense,
      isLicenseValid,
      shouldBlockApp,
    }),
    [
      licenseStatus,
      initialLoading,
      refreshing,
      error,
      deviceId,
      checkLicense,
      isLicenseValid,
      shouldBlockApp,
    ],
  );

  return (
    <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>
  );
}

// Hook
export function useLicense(): LicenseContextType {
  return useContext(LicenseContext);
}
