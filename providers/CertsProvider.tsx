import {
  ReactElement,
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import useApi from '../hooks/useApi';

export type Certificate = {
  id: number;
  ac_user: number;
  created_date: string;
  file: string;
  set_date: string;
  name: string;
};

export type Training = {
  id: number;
  ac_user: number;
  created_date: string;
  name: string;
  set_date: string;
  file: string;
};

export type CertificatesResponse = {
  certyficates: Certificate[];
};

export type TrainingsResponse = {
  szkolenia: Training[];
};

type CertsContext = {
  certificates: Certificate[] | null;
  trainings: Training[] | null;
  certificatesLoading: boolean;
  trainingsLoading: boolean;
  getCertificates?: (data?: { monter_id: number }) => void;
  getTrainings?: (data?: { monter_id: number }) => void;
};

export const CertsContext = createContext<CertsContext>({
  certificates: null,
  trainings: null,
  certificatesLoading: false,
  trainingsLoading: false,
});

export function CertsProvider({ children }: { children: ReactElement }) {
  const [certificates, setCertificates] = useState<Certificate[] | null>(null);
  const [trainings, setTrainings] = useState<Training[] | null>(null);

  const {
    result: certificatesResponse,
    execute: getCertificates,
    loading: certificatesLoading,
  } = useApi<CertificatesResponse>({
    path: 'certyfikat_list',
  });

  const {
    result: trainingsResponse,
    execute: getTrainings,
    loading: trainingsLoading,
  } = useApi<TrainingsResponse>({
    path: 'szkolenie_list',
  });

  useEffect(() => {
    if (certificatesResponse) {
      setCertificates(certificatesResponse?.certyficates);
    }
  }, [certificatesResponse]);

  useEffect(() => {
    if (trainingsResponse) {
      setTrainings(trainingsResponse?.szkolenia);
    }
  }, [trainingsResponse]);

  const contextValue: CertsContext = useMemo(
    () => ({
      certificates,
      trainings,
      certificatesLoading,
      trainingsLoading,
      getCertificates,
      getTrainings,
    }),
    [
      certificates,
      trainings,
      certificatesLoading,
      trainingsLoading,
      getCertificates,
      getTrainings,
    ],
  );

  return (
    <CertsContext.Provider value={contextValue}>
      {children}
    </CertsContext.Provider>
  );
}

export default function useCerts() {
  return useContext(CertsContext);
}
