/* eslint-disable no-console */
import Constants from 'expo-constants';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import useAuth from '../providers/AuthProvider';
// Tymczasowo wyłączone - lazy loading
// import { networkService } from '../services/NetworkService';
// import { syncQueue } from '../services/SyncQueue';
// import { TABLES } from '../database/schema';

const API_URL: string =
  Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
const API_PATH: string =
  API_URL.length > 0 && API_PORT.length > 0
    ? `${API_URL}:${API_PORT}/api/`
    : `${API_URL}/api/`;

export const BASE_URL = API_PATH;
export const ASSETS_BASE_URL = API_URL;

type useApiParams = {
  path: string;
  authorized?: boolean;
  autoLogout?: boolean;
  offlineEnabled?: boolean; // Nowy parametr dla obsługi offline
};

// Tymczasowo wyłączone - włącz po naprawieniu błędów
// const PATH_TO_REPOSITORY_MAP: Record<string, { table: string; repoName: string }> = {};
// async function getRepositoryForPath(path: string): Promise<{ table: string; repo: any } | null> {
//   return null;
// }

type HttpMethod = 'GET' | 'POST';

type ExecuteOptions<TRequest> = {
  data?: TRequest;
  method?: HttpMethod;
  queryParams?: Record<string, string | number | boolean | undefined>;
};

export default function useApi<
  TResponse extends object = object,
  TRequest extends object = object,
>({ path, authorized = true, autoLogout = true, offlineEnabled = true }: useApiParams) {
  const [result, setResult] = useState<TResponse>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const { token, logoutWithRedirect } = useAuth();

  const addApiToken = useCallback(
    (data: TRequest) => {
      if (data instanceof FormData) {
        data.append('token', token ?? '');
        return data;
      }
      return {
        ...data,
        token,
      };
    },
    [token],
  );

  // Helper to build query string from params
  const buildQueryString = (
    params?: Record<string, string | number | boolean | undefined>,
  ) => {
    if (!params) return '';
    const esc = encodeURIComponent;
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${esc(k)}=${esc(String(v))}`)
      .join('&');
    return query ? `?${query}` : '';
  };

  /**
   * Pobiera dane z lokalnej bazy danych (fallback offline)
   */
  const getFromLocalDB = useCallback(async (): Promise<TResponse | undefined> => {
    // Tymczasowo wyłączone
    return undefined;
    // const mapping = await getRepositoryForPath(path);
    // if (!mapping || !mapping.repo) {
    //   return undefined;
    // }
    // try {
    //   const { getDatabase } = await import('../database/db');
    //   getDatabase();
    // } catch (error) {
    //   return undefined;
    // }
    // try {
    //   const localData = await mapping.repo.findAll();
    //   
    //   // Przekształć dane do formatu oczekiwanego przez aplikację
    //   if (path === 'klient_list') {
    //     return {
    //       klient_list: localData.map((item: any) => ({
    //         ac_user: item._server_id || item.id,
    //         id: item._server_id || item.id,
    //         url: item.url || '',
    //         email: item.email || '',
    //         kod_pocztowy: item.kod_pocztowy || '',
    //         first_name: item.first_name || '',
    //         last_name: item.last_name || '',
    //         nazwa_firmy: item.nazwa_firmy || '',
    //         longitude: item.longitude?.toString() || null,
    //         latitude: item.latitude?.toString() || null,
    //         numer_telefonu: item.numer_telefonu || null,
    //         miasto: item.miasto || null,
    //         nip: item.nip || null,
    //         rodzaj_klienta: item.rodzaj_klienta || null,
    //         mieszkanie: item.mieszkanie || null,
    //         ulica: item.ulica || null,
    //         numer_domu: item.numer_domu || null,
    //         client_status: item.client_status || null,
    //         lista_klientow: item.lista_klientow || null,
    //         has_account: item.has_account === 1 || item.has_account === true,
    //       })),
    //     } as TResponse;
    //   }
    //
    //   return localData as TResponse;
    // } catch (error: any) {
    //   console.error('Błąd pobierania z lokalnej bazy:', error);
    //   return undefined;
    // }
  }, [path]);

  const execute = useCallback(
    async (
      options: ExecuteOptions<TRequest> = {},
    ): Promise<TResponse | undefined> => {
      setLoading(true);
      const { data = {} as TRequest, method = 'POST', queryParams } = options;

      // Tymczasowo wyłączone - zawsze online
      // const { networkService } = await import('../services/NetworkService');
      // const isOnline = networkService.getIsConnected();
      const isOnline = true; // Tymczasowo zawsze online

      // Jeśli offline i włączona obsługa offline
      if (!isOnline && offlineEnabled) {
        if (method === 'GET') {
          // Pobierz z lokalnej bazy
          const localResult = await getFromLocalDB();
          if (localResult) {
            setResult(localResult);
            setLoading(false);
            return localResult;
          }
        } else {
          // POST - zapisz do lokalnej bazy i kolejki sync
          // Tymczasowo wyłączone
          // const mapping = await getRepositoryForPath(path);
          // if (mapping && mapping.repo) { ... }
          setLoading(false);
          return data as TResponse;
        }
      }

      // Utwórz AbortController dla timeoutu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 sekund (2 minuty) - zwiększony limit dla load balancera

      try {
        let url = `${BASE_URL + path}/`;
        if (method === 'GET' && queryParams) {
          url += buildQueryString(queryParams);
        }
        const requestHeaders: { [key: string]: string } = {
          Accept: 'application/json',
        };
        let body: any;
        if (method === 'POST') {
          const bodyData = authorized ? addApiToken(data) : data;

          if (bodyData instanceof FormData) {
            // NIE ustawiaj Content-Type dla FormData!
            body = bodyData;
          } else {
            requestHeaders['Content-Type'] = 'application/json';
            body = JSON.stringify(bodyData);
          }
        }
        if (method === 'GET') {
          // For GET, do not send body
          if (authorized && token) {
            // Add token as query param if not already present
            url += `${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(
              token,
            )}`;
          }
        }
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          signal: controller.signal, // Dodaj signal dla timeoutu
          ...(method === 'POST' ? { body } : {}),
        });

        // Wyczyść timeout jeśli odpowiedź przyszła przed timeoutem
        clearTimeout(timeoutId);

        if (response.status === 500) {
          const text = await response.text();
          // Spróbuj sparsować jako JSON
          try {
            const errorJson = JSON.parse(text);
            Alert.alert('Błąd', errorJson.error || 'Wystąpił błąd serwera');
            return errorJson;
          } catch {
            Alert.alert('Błąd', 'Wystąpił błąd serwera');
            return undefined;
          }
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          Alert.alert('Błąd', 'Serwer zwrócił nieprawidłową odpowiedź');
          return undefined;
        }

        // Check for other error status codes
        if (!response.ok) {
          const json = await response.json();

          // Check if it's an authentication error
          // TYLKO wyloguj jeśli to JEDNOZNACZNIE błąd tokenu AUTORYZACYJNEGO (nie push tokena)
          const errorMessage = (json.error as string)?.toLowerCase() || '';
          
          // Lista endpointów, które NIE powinny wylogowywać użytkownika przy błędach tokenu
          // (np. push notifications, rejestracja tokenów, itp.)
          const nonCriticalPaths = [
            'register_push_token',
            'push_token',
            'notification',
            'register',
          ];
          const isNonCriticalPath = nonCriticalPaths.some(nonCritical => 
            path.toLowerCase().includes(nonCritical.toLowerCase())
          );
          
          // Sprawdź czy to błąd tokenu AUTORYZACYJNEGO (nie push tokena)
          // "invalid token" w kontekście push tokena NIE powinien wylogowywać użytkownika
          const isAuthTokenError = 
            (errorMessage.includes('invalid token') && !isNonCriticalPath) ||
            (errorMessage.includes('wrong token') && !isNonCriticalPath) ||
            errorMessage.includes('user not found') ||
            (response.status === 401 && errorMessage.includes('token') && !isNonCriticalPath) ||
            (response.status === 403 && errorMessage.includes('token') && !isNonCriticalPath);

          if (isAuthTokenError) {
            // TYLKO wyloguj jeśli to JEDNOZNACZNIE błąd tokenu AUTORYZACYJNEGO
            if (autoLogout && logoutWithRedirect) {
              Alert.alert(
                'Błąd autoryzacji',
                'Twoja sesja wygasła. Zaloguj się ponownie.',
              );
              logoutWithRedirect();
              return undefined;
            }

            Alert.alert(
              'Błąd autoryzacji',
              'Twoja sesja wygasła. Zaloguj się ponownie.',
            );
            return undefined;
          } else if (response.status === 401 || response.status === 403) {
            // Status 401/403 ale BEZ komunikatu o tokenie - może być problem z siecią/proxy
            // NIE wylogowuj - może być problem z siecią na Bluestacks
            // Zwróć błąd, ale nie wylogowuj
            return json as TResponse;
          }

          // Zwróć obiekt błędu zamiast undefined, żeby komponent mógł obsłużyć błąd
          return json as TResponse;
        }

        const json = await response.json();

        // Tymczasowo wyłączone - cache do lokalnej bazy
        // if (method === 'GET' && offlineEnabled) { ... }

        setResult(json);
        return json;
      } catch (e: any) {
        // Wyczyść timeout w przypadku błędu
        clearTimeout(timeoutId);

        // Sprawdź czy błąd jest związany z timeoutem
        if (e.name === 'AbortError' || e.message?.includes('aborted')) {
          setError('Timeout - żądanie przekroczyło limit czasu');
          Alert.alert(
            'Timeout',
            'Żądanie przekroczyło limit czasu. Spróbuj ponownie.',
          );
        } else {
          setError(e?.toString());
          
          // Tymczasowo wyłączone - obsługa offline
          // if (offlineEnabled && (e.message?.includes('Network') || e.message?.includes('fetch'))) { ... }
        }
      } finally {
        setLoading(false);
      }
      return undefined;
    },
    [addApiToken, authorized, path, token, autoLogout, logoutWithRedirect, offlineEnabled, getFromLocalDB],
  );

  return useMemo(
    () => ({
      result,
      loading,
      error,
      execute,
    }),
    [error, execute, loading, result],
  );
}
