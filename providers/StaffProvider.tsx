import {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import useApi, { BASE_URL } from '../hooks/useApi';
import useAuth from './AuthProvider';

export type Employee = {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  email: string;
};

export type Team = {
  id: number;
  nazwa: string;
  user_ids: number[];
};

export type EmployeesResponse = {
  [groupName: string]: Employee[];
};

type StaffContext = {
  employees: EmployeesResponse | null;
  teams: Team[] | null;
  employeesLoading: boolean;
  teamsLoading: boolean;
  getEmployees?: () => Promise<EmployeesResponse | undefined>;
  getTeams?: () => void;
  updateEmployeeTeam?: (employeeId: number, newTeamId: number) => Promise<void>;
};

export const StaffContextContext = createContext<StaffContext>({
  employees: null,
  teams: null,
  employeesLoading: false,
  teamsLoading: false,
});

export function StaffProvider({ children }: { children: ReactElement }) {
  const [employees, setEmployees] = useState<EmployeesResponse | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const {
    result: employeesResult,
    execute: getEmployees,
    loading: employeesLoading,
  } = useApi<EmployeesResponse>({
    path: 'monter_list',
  });

  const {
    result: teamsResult,
    execute: getTeams,
    loading: teamsLoading,
  } = useApi<Team[]>({
    path: 'group_list_new',
  });

  useEffect(() => {
    if (employeesResult) {
      setEmployees(employeesResult);
    }
  }, [employeesResult]);

  useEffect(() => {
    if (teamsResult) {
      setTeams(teamsResult);
    }
  }, [teamsResult]);

  // Funkcja do aktualizacji przypisania pracownika do ekipy
  const { token } = useAuth();
  const updateEmployeeTeam = useCallback(
    async (employeeId: number, newTeamId: number) => {
      try {
        const url = `${BASE_URL}update_employee_team/`;
        const payload = { employeeId, newTeamId, token };
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Usunięto odświeżanie list po zapisie do bazy, stan aktualizowany jest lokalnie
      } catch (error) {
        Alert.alert(
          'Błąd',
          'Nie udało się zaktualizować przypisania pracownika do ekipy',
        );
      }
    },
    [token],
  );

  const contextValue: StaffContext = useMemo(
    () => ({
      employees,
      teams,
      getEmployees,
      getTeams,
      employeesLoading,
      teamsLoading,
      updateEmployeeTeam,
    }),
    [
      employees,
      teams,
      getEmployees,
      getTeams,
      employeesLoading,
      teamsLoading,
      updateEmployeeTeam,
    ],
  );

  return (
    <StaffContextContext.Provider value={contextValue}>
      {children}
    </StaffContextContext.Provider>
  );
}

export default function useStaff() {
  return useContext(StaffContextContext);
}
