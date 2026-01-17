import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import useApi from '../hooks/useApi';

export type Task = {
  id: number;
  start_date: string;
  end_date: string;
  nazwa: string;
  typ: string; // Zmienione na string aby obsługiwać własne typy zadań
  status: 'wykonane' | 'niewykonane' | 'Zaplanowane';
  czy_faktura?: boolean;
  czy_oferta?: boolean;
  grupa?: number | null;
  instalacja_id: number | null;
  notatki?: string;
  instalacja_info?: {
    klient_id: number;
    id: number;
    nazwa_firmy?: string;
    first_name?: string;
    last_name?: string;
    ulica?: string;
    numer_domu?: string;
    mieszkanie?: string;
    kod_pocztowy?: string;
    miasto?: string;
    nip?: string;
    name?: string;
  };
};

type Response = Task[];

type TasksContext = {
  result: Task[] | null;
  loading: boolean;
  execute: (data?: object) => Promise<Response | undefined>;
};

export const TasksContext = createContext<TasksContext>({
  result: null,
  loading: false,
  execute: () => Promise.resolve(undefined),
});

export function TasksProvider({ children }: { children: ReactElement }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  // TODO: Cache'owanie po stronie serwera
  // Endpoint 'zadanie_list' powinien implementować cache'owanie (np. Redis, Memcached)
  // aby przyspieszyć ładowanie danych kalendarza. Cache powinien być invalidowany
  // przy dodaniu/edycji/usunięciu zadania.
  const { result, execute, loading } = useApi<Response>({
    path: 'zadanie_list',
  });

  useEffect(() => {
    if (result) {
      setTasks(result);
    }
  }, [result]);

  // Memoizuj contextValue - execute jest już memoizowane przez useApi
  const contextValue = useMemo(
    () => ({
      result: tasks,
      loading,
      execute,
    }),
    [tasks, loading, execute],
  );

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
}

export default function useTasks() {
  return useContext(TasksContext);
}
