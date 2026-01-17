import {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import useApi from '../hooks/useApi';

export type Client = {
  ac_user: number;
  id: number;
  url: string;
  email: string;
  kod_pocztowy: string;
  first_name: string;
  last_name: string;
  nazwa_firmy: string;
  longitude: string | null;
  latitude: string | null;
  numer_telefonu: string | null;
  miasto: string | null;
  nip: string | null;
  rodzaj_klienta: string | null;
  mieszkanie: string | null;
  ulica: string | null;
  numer_domu: string | null;
  client_status: string | null;
  lista_klientow: number | null;
  has_account: boolean;
};

type ClientsContext = {
  clients: Client[] | undefined;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  getClients: (
    page?: number,
    append?: boolean,
  ) => Promise<Response | undefined>;
  resetClients: () => void;
};

type Response = {
  klient_list: Client[];
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

export const ClientsContext = createContext<ClientsContext>({
  clients: undefined,
  loading: false,
  loadingMore: false,
  hasMore: false,
  currentPage: 1,
  getClients: () => Promise.resolve(undefined),
  resetClients: () => {
    // Placeholder - zostanie zastąpione przez rzeczywistą funkcję
  },
});

export function ClientsProvider({ children }: { children: ReactElement }) {
  const [clients, setClients] = useState<Client[]>();
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const {
    result,
    execute: executeGetClients,
    loading,
  } = useApi<Response>({
    path: 'klient_list',
  });

  // Funkcja do resetowania listy (np. przy wyszukiwaniu)
  const resetClients = useCallback(() => {
    setClients(undefined);
    setCurrentPage(1);
    setHasMore(false);
  }, []);

  // Funkcja do pobierania klientów z paginacją
  const getClients = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) {
        // Pierwsza strona - resetuj listę
        setClients(undefined);
        setCurrentPage(1);
        setHasMore(false);
      } else if (append) {
        // Ładowanie kolejnej strony
        setLoadingMore(true);
      }

      const response = await executeGetClients({
        data: {
          page,
          page_size: 20,
        },
      });

      return response;
    },
    [executeGetClients],
  );

  useEffect(() => {
    if (result) {
      // Sortowanie jest teraz wykonywane po stronie serwera
      // Klienci przychodzą już posortowani
      if (result.pagination) {
        // Paginacja jest obsługiwana
        const newClients = result.klient_list || [];

        if (result.pagination.page === 1) {
          // Pierwsza strona - zastąp listę
          setClients(newClients);
        } else {
          // Kolejna strona - dodaj do istniejącej listy
          setClients(prevClients => [...(prevClients || []), ...newClients]);
        }

        setCurrentPage(result.pagination.page);
        setHasMore(result.pagination.has_next);
        setLoadingMore(false);
      } else {
        // Fallback dla starych endpointów bez paginacji
        setClients(result.klient_list);
        setHasMore(false);
      }
    }
  }, [result]);

  const contextValue: ClientsContext = useMemo(
    () => ({
      clients,
      getClients,
      loading,
      loadingMore,
      hasMore,
      currentPage,
      resetClients,
    }),
    [
      clients,
      getClients,
      loading,
      loadingMore,
      hasMore,
      currentPage,
      resetClients,
    ],
  );

  return (
    <ClientsContext.Provider value={contextValue}>
      {children}
    </ClientsContext.Provider>
  );
}

export default function useClients() {
  return useContext(ClientsContext);
}
