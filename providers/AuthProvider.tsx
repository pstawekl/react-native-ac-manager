/* eslint-disable no-console */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { USER_TOKEN } from '../consts/Async';
import { AuthParamList } from '../navigation/types';

const API_URL: string =
  Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
const API_PATH: string =
  API_URL.length > 0 && API_PORT.length > 0
    ? `${API_URL}:${API_PORT}/api`
    : `${API_URL}/api`;

interface User {
  avatar?: string;
  email: string;
  name: string;
  userType: 'admin' | 'monter' | 'klient';

  ac_user: number;
  id: number;
  kod_pocztowy: string;
  miasto: string;
  nazwa_firmy: string;
  nip: string;
  numer_telefonu: string;
  rodzaj_klienta: 'firma';
  typ_klienta: 'aktualny';
  ulica: string;

  latitude?: number;
  longitude?: number;
}

interface AuthContextType {
  token?: string;
  user?: User;
  loading: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  logoutWithRedirect: () => Promise<void>;
  isUserAssembler: () => boolean;
  isUserAdmin: () => boolean;
  isUserClient: () => boolean;
}

export interface RegistrationData {
  rodzaj_klienta: string;
  nazwa_firmy?: string;
  nip?: string;
  first_name: string;
  last_name: string;
  ulica: string;
  numer_domu?: string;
  mieszkanie?: string;
  kod_pocztowy: string;
  miasto: string;
  email: string;
  numer_telefonu: string;
  password: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Export the provider as we need to wrap the entire app with it
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [user, setUser] = useState<User | undefined>();
  const [token, setToken] = useState<string | undefined>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<StackNavigationProp<AuthParamList>>();
  const isLoggingIn = React.useRef<boolean>(false);

  const initialize = useCallback(async () => {
    const userToken = await AsyncStorage.getItem(USER_TOKEN);
    // TODO: api refactor
    const userFromStorage = await AsyncStorage.getItem('user');

    setToken(userToken ?? undefined);
    setUser(userFromStorage ? JSON.parse(userFromStorage) : undefined);
    setLoading(false);
  }, []);

  const logoutWithRedirect = useCallback(async () => {
    setUser(undefined);
    setToken(undefined);

    await AsyncStorage.removeItem(USER_TOKEN);
    await AsyncStorage.removeItem('user');

    // Przekierowanie do ekranu logowania
    // Użyj setTimeout aby upewnić się, że nawigacja jest gotowa
    try {
      setTimeout(() => {
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } catch (navError) {
          console.warn('Navigation error in logoutWithRedirect:', navError);
          // Nawigacja nie jest jeszcze gotowa - RootNavigation automatycznie
          // pokaże AuthNavigation gdy user będzie undefined
        }
      }, 100);
    } catch (error) {
      console.warn('Error in logoutWithRedirect:', error);
      // Nawigacja nie jest jeszcze gotowa - RootNavigation automatycznie
      // pokaże AuthNavigation gdy user będzie undefined
    }
  }, [navigation]);

  const getUserDetails = useCallback(
    async (savedToken: string): Promise<User | undefined> => {
      setLoading(true);

      try {
        // Dodaj timeout dla fetch (30 sekund)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response: Response;
        try {
          response = await fetch(`${API_PATH}/data/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: savedToken,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          // Sprawdź czy to timeout
          if (fetchError.name === 'AbortError' || controller.signal.aborted) {
            console.log('getUserDetails: Request timeout - keeping cached data');
            setError('Żądanie przekroczyło limit czasu. Używam danych z pamięci.');
            setLoading(false);
            return undefined; // Nie wylogowuj przy timeout
          }
          throw fetchError; // Rzuć dalej dla innych błędów
        }

        // Sprawdź odpowiedź JSON nawet jeśli status nie jest OK
        let responseData: any;
        try {
          responseData = await response.json();
        } catch {
          // Jeśli nie można sparsować JSON, użyj pustego obiektu
          responseData = {};
        }

        // Sprawdź błędy związane z tokenem w odpowiedzi
        const errorMessage = responseData?.error?.toLowerCase() || '';
        
        // TYLKO wyloguj jeśli to JEDNOZNACZNIE błąd tokenu (nie 401/403 z innych powodów)
        // Sprawdź czy error message JEDNOZNACZNIE mówi o nieprawidłowym tokenie
        const isExplicitTokenError = 
          errorMessage.includes('invalid token') ||
          errorMessage.includes('wrong token') ||
          errorMessage.includes('user not found') ||
          (response.status === 401 && errorMessage.includes('token')) ||
          (response.status === 403 && errorMessage.includes('token'));

        // UWAGA: Jeśli status 401/403 ale NIE ma komunikatu o tokenie, NIE wylogowuj
        // Może być problem z siecią/proxy na Bluestacks
        if (isExplicitTokenError) {
          console.log('getUserDetails: Explicit token error detected, logging out');
          
          // Wyczyść dane użytkownika
          setUser(undefined);
          setToken(undefined);
          await AsyncStorage.removeItem(USER_TOKEN);
          await AsyncStorage.removeItem('user');
          
          // Przekieruj do logowania (z opóźnieniem, aby nawigacja była gotowa)
          setTimeout(() => {
            logoutWithRedirect();
          }, 100);
          
          setLoading(false);
          return undefined;
        } else if (response.status === 401 || response.status === 403) {
          // Status 401/403 ale BEZ komunikatu o tokenie - może być problem z siecią
          console.log('getUserDetails: 401/403 but no explicit token error - keeping user logged in');
          setLoading(false);
          return undefined; // Nie wylogowuj
        }

        // Sprawdź czy odpowiedź zawiera ważne dane użytkownika
        // Uwaga: id może być 0, więc sprawdzamy !== undefined i !== null
        if (!response.ok) {
          // Inne błędy (np. 500) - nie wylogowuj, może być problem serwera
          console.log('getUserDetails: Response not OK but not token error, keeping cached data');
          setLoading(false);
          return undefined;
        }

        if (!responseData || responseData.id === undefined || responseData.id === null) {
          console.log('getUserDetails: No valid user data (missing id), keeping cached data');
          // Brak ważnych danych - nie wylogowuj, użyj cache
          setLoading(false);
          return undefined;
        }

        console.log('getUserDetails: Valid user data received, id:', responseData.id);
        
        // Zbuduj obiekt User z odpowiedzi API
        // API zwraca first_name i last_name, ale User interface wymaga name
        const userData: User = {
          ...responseData,
          name: responseData.first_name && responseData.last_name
            ? `${responseData.first_name} ${responseData.last_name}`
            : responseData.first_name || responseData.last_name || responseData.email || '',
          userType: responseData.user_type || 'klient',
        };
        
        console.log('getUserDetails: Converted user data:', JSON.stringify(userData, null, 2));
        setLoading(false);
        return userData;
      } catch (e: any) {
        console.error('Error in getUserDetails:', e);
        
        // Sprawdź czy to błąd sieciowy lub timeout
        const isNetworkError = 
          e instanceof TypeError || 
          e.name === 'AbortError' ||
          e.message?.includes('Network') || 
          e.message?.includes('fetch') || 
          e.message?.includes('Failed to fetch') ||
          e.message?.includes('Network request failed') ||
          e.message?.includes('aborted') ||
          e.message?.includes('timeout');
        
        if (isNetworkError) {
          // Błąd sieciowy/timeout - nie wylogowuj, użyj danych z cache
          console.log('getUserDetails: Network/timeout error - keeping cached user data for offline mode');
          setError('Brak połączenia z internetem lub żądanie przekroczyło limit czasu. Używam danych z pamięci.');
          setLoading(false);
          return undefined; // Zwróć undefined, ale nie wylogowuj
        }
        
        // Inne błędy - również nie wylogowuj automatycznie
        // Może być problem z serwerem, ale token może być ważny
        console.log('getUserDetails: Other error - keeping cached user data');
        setError('Wystąpił błąd podczas weryfikacji sesji. Używam danych z pamięci.');
        setLoading(false);
        return undefined;
      }
    },
    [logoutWithRedirect],
  );

  // Initial loading of the app
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initial load user data
  useEffect(() => {
    // Nie wywołuj getUserDetails jeśli właśnie logujemy się (zapobiega podwójnemu wywołaniu)
    if (token && !isLoggingIn.current) {
      const verifyToken = async () => {
        try {
          // Sprawdź status sieci przed weryfikacją
          const { getNetworkService } = await import('../services/NetworkService');
          const networkService = getNetworkService();
          const isOnline = await networkService.checkConnection();
          
          if (isOnline) {
            // Online - zweryfikuj token przez API
            const userData = await getUserDetails(token);
            
            if (userData && (userData.id !== undefined && userData.id !== null)) {
              console.log('useEffect: Valid user data from API, id:', userData.id);
              setUser(userData);
              // Zaktualizuj cache z nowymi danymi
              await AsyncStorage.setItem('user', JSON.stringify(userData));
            } else {
              // Brak danych z API - sprawdź czy mamy cache
              console.log('useEffect: No valid data from API, checking cache');
              
              const cachedUser = await AsyncStorage.getItem('user');
              if (cachedUser) {
                try {
                  const parsedUser = JSON.parse(cachedUser);
                  if (parsedUser && (parsedUser.id !== undefined && parsedUser.id !== null)) {
                    console.log('useEffect: Using cached user data, id:', parsedUser.id);
                    setUser(parsedUser);
                    // Nie wylogowuj - używamy cache, może być problem z siecią
                  } else {
                    console.log('useEffect: Cached user data invalid, but keeping user logged in with token');
                    
                    // Nie wylogowuj - może być problem z parsowaniem, ale token jest ważny
                    // Spróbuj użyć podstawowych danych z tokenu
                    const basicUser = await AsyncStorage.getItem('user');
                    if (basicUser) {
                      try {
                        const basic = JSON.parse(basicUser);
                        if (basic && basic.email) {
                          setUser(basic as User);
                        }
                      } catch {
                        // Ignoruj błąd parsowania
                      }
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing cached user:', parseError);
                  // Nie wylogowuj - może być problem z parsowaniem, ale token jest ważny
                  console.log('useEffect: Parse error, but keeping user logged in with token');
                }
              } else {
                console.log('useEffect: No cached user data, but keeping user logged in with token');
                // Nie wylogowuj - może być problem z siecią, ale token jest ważny
                // Użytkownik może działać offline
              }
            }
          } else {
            // Offline - użyj danych z AsyncStorage
            const cachedUser = await AsyncStorage.getItem('user');
            
            if (cachedUser) {
              try {
                const parsedUser = JSON.parse(cachedUser);
                // Sprawdź czy user ma wymagane pola
                if (parsedUser && (parsedUser.id !== undefined && parsedUser.id !== null)) {
                  console.log('useEffect: Using cached user data for offline mode, id:', parsedUser.id);
                  setUser(parsedUser);
                } else {
                  console.log('useEffect: Cached user data invalid (missing id)');
                  setUser(undefined);
                }
              } catch (parseError) {
                console.error('Error parsing cached user:', parseError);
                setUser(undefined);
              }
            } else {
              console.log('useEffect: No cached user data available for offline mode');
              setUser(undefined);
            }
          }
        } catch (error) {
          console.error('Error in token verification:', error);
          
          // W przypadku błędu, spróbuj użyć danych z cache
          // NIE wylogowuj użytkownika - może być problem z siecią, ale token jest ważny
          try {
            const cachedUser = await AsyncStorage.getItem('user');
            if (cachedUser) {
              const parsedUser = JSON.parse(cachedUser);
              if (parsedUser && (parsedUser.id !== undefined && parsedUser.id !== null)) {
                console.log('useEffect: Error occurred, using cached user data as fallback');
                setUser(parsedUser);
              } else {
                // Nie wylogowuj - może być problem z parsowaniem, ale token jest ważny
                console.log('useEffect: Cache parse error, but keeping user logged in with token');
                // Spróbuj użyć podstawowych danych
                if (parsedUser && parsedUser.email) {
                  setUser(parsedUser as User);
                }
              }
            } else {
              // Nie wylogowuj - może być problem z siecią, ale token jest ważny
              console.log('useEffect: No cache, but keeping user logged in with token');
              // Użytkownik może działać offline
            }
          } catch (cacheError) {
            console.error('Error loading cached user:', cacheError);
            // Nie wylogowuj - może być problem z cache, ale token jest ważny
            console.log('useEffect: Cache error, but keeping user logged in with token');
          }
        }
      };
      
      verifyToken();
    } else {
      console.log('useEffect: No token, clearing user');
      // Jeśli nie ma tokenu, upewnij się że user jest undefined
      setUser(undefined);
    }
  }, [getUserDetails, token]);

  const login = useCallback(async (email: string, password: string) => {
    isLoggingIn.current = true;
    try {
      const response = await fetch(`${API_PATH}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const json = await response.json();

      if (response.status === 400) {
        let errorText = json.error;

        if (errorText === 'Invalid email or password.') {
          errorText = 'Nieprawidłowy e-mail lub hasło.';
        }

        setError(errorText);
        isLoggingIn.current = false;
      } else {
        // @ToDo - Remove or refactor after API change
        const userData: User = {
          email,
          avatar: json.avatar,
          name: `${json.first_name} ${json.last_name}`,
          userType: json.user_type,

          ac_user: 0,
          id: 0,
          kod_pocztowy: '',
          miasto: '',
          nazwa_firmy: '',
          nip: '',
          numer_telefonu: '',
          rodzaj_klienta: 'firma',
          typ_klienta: 'aktualny',
          ulica: '',
        };

        // TODO: ask for an api change
        await AsyncStorage.setItem('user', JSON.stringify(userData));

        setError(undefined);
        setToken(json.token);
        setUser(userData);

        await AsyncStorage.setItem(USER_TOKEN, json.token);

        // Po udanym logowaniu, pobierz pełne dane użytkownika z API
        // To zastąpi podstawowe dane ustawione powyżej
        try {
          const fullUserData = await getUserDetails(json.token);
          if (fullUserData && (fullUserData.id !== undefined && fullUserData.id !== null)) {
            setUser(fullUserData);
            await AsyncStorage.setItem('user', JSON.stringify(fullUserData));
          }
        } catch (error) {
          console.error('Error fetching user details after login:', error);
          // Nie blokuj logowania jeśli nie udało się pobrać pełnych danych
          // Użytkownik jest już zalogowany z podstawowymi danymi
        } finally {
          isLoggingIn.current = false;
        }
      }
    } catch (e) {
      isLoggingIn.current = false;
      if (e instanceof Error) {
        Alert.alert(
          'Błąd podczas logowania: ',
          e.message || 'Wystąpił błąd podczas logowania.',
        );
      }
      setError('Wystąpił błąd podczas logowania.');
    }
  }, [getUserDetails]);

  const register = useCallback(
    async (data: RegistrationData) => {
      setLoading(true);

      try {
        setLoading(true);

        // Pobierz token zaproszenia z AsyncStorage jeśli istnieje
        const invitationToken = await AsyncStorage.getItem('invitation_token');
        

        // Mapowanie nazw pól z formularza na format backendu
        const requestBody: any = {
          rodzaj_klienta: data.rodzaj_klienta,
          first_name: data.first_name,
          last_name: data.last_name,
          street: data.ulica,
          numer_domu: data.numer_domu,
          mieszkanie: data.mieszkanie,
          code: data.kod_pocztowy,
          city: data.miasto,
          email: data.email,
          phone: data.numer_telefonu,
          password: data.password,
        };

        // Dodaj pola dla firm
        if (data.rodzaj_klienta === 'firma') {
          requestBody.nazwa_firmy = data.nazwa_firmy;
          requestBody.nip = data.nip;
        }

        if (invitationToken) {
          requestBody.invitation_token = invitationToken;
        }

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${API_PATH}/register/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);
        const json = await response.json();
        console.log('Response body:', json);

        if (response.status === 400 || response.status === 401) {
          // Błąd walidacji lub nieprawidłowy token
          const errorMessage =
            json.error || 'Wystąpił błąd podczas rejestracji.';
          Alert.alert('Błąd podczas rejestracji', errorMessage);
          setError(errorMessage);
          return;
        }

        // Sukces - rejestracja zakończona (status 200 lub 201)
        if (response.status === 200 || response.status === 201) {
          // Usuń token zaproszenia po udanej rejestracji
          if (invitationToken) {
            await AsyncStorage.removeItem('invitation_token');
          }

          // Pokaż komunikat o sukcesie
          const successMessage =
            json.message ||
            'Rejestracja zakończona pomyślnie. Możesz się teraz zalogować.';

          Alert.alert(
            'Rejestracja zakończona',
            successMessage,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Przekieruj do ekranu logowania
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                },
              },
            ],
            { cancelable: false },
          );

          setError(undefined);
        }
      } catch (e) {
        if (e instanceof Error) {
          Alert.alert(
            'Błąd podczas rejestracji: ',
            e.message || 'Wystąpił błąd podczas rejestracji.',
          );
        }
        setError('Wystąpił błąd podczas rejestracji.');
      } finally {
        setLoading(false);
      }
    },
    [navigation],
  );

  const logout = useCallback(async () => {
    setUser(undefined);
    setToken(undefined);

    await AsyncStorage.removeItem(USER_TOKEN);
    await AsyncStorage.removeItem('user');
  }, []);

  const isUserAssembler = useCallback(
    () => user?.userType === 'monter',
    [user],
  );
  const isUserAdmin = useCallback(() => user?.userType === 'admin', [user]);
  const isUserClient = useCallback(() => user?.userType === 'klient', [user]);

  const memoedValue = useMemo(
    () => ({
      token,
      user,
      loading,
      error,
      login,
      register,
      logout,
      logoutWithRedirect,
      isUserAssembler,
      isUserAdmin,
      isUserClient,
    }),
    [
      token,
      user,
      loading,
      error,
      login,
      register,
      logout,
      logoutWithRedirect,
      isUserAssembler,
      isUserAdmin,
      isUserClient,
    ],
  );

  return (
    <AuthContext.Provider value={memoedValue}>{children}</AuthContext.Provider>
  );
}

export default function useAuth() {
  return useContext(AuthContext);
}
