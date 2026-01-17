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

export type Montage = {
  id: number;
  instalacja_id: number;
  created_date: string;
  data_montazu: Date;
  gwarancja: number | null;
  liczba_przegladow: number | null;
  split_multisplit: boolean | null;
  devices_split: number[];
  devices_multi_split: number[];
  nr_seryjny_jedn_zew: string | null;
  nr_seryjny_jedn_zew_photo: string | null;
  nr_seryjny_jedn_wew: string | null;
  nr_seryjny_jedn_wew_photo: string | null;
  miejsce_montazu_jedn_zew: string | null;
  miejsce_montazu_jedn_zew_photo: number | null;
  miejsce_montazu_jedn_wew: string | null;
  miejsce_montazu_jedn_wew_photo: number | null;
  sposob_skroplin: string | null;
  miejsce_skroplin: string | null;
  miejsce_i_sposob_montazu_jedn_zew: string | null;
  miejsce_i_sposob_montazu_jedn_zew_photo: number | null;
  miejsce_podlaczenia_elektryki: string | null;
  gaz: string | null;
  gaz_ilosc_dodana: number | null;
  gaz_ilos: number | null;
  temp_zew_montazu: number | null;
  temp_wew_montazu: number | null;
  cisnienie: number | null;
  przegrzanie: number | null;
  temp_chlodzenia: number | null;
  temp_grzania: number | null;
  uwagi: string | null;

  // Nowe pola - Przeprowadzone czynności
  kontrola_stanu_technicznego_jedn_wew: string | null;
  kontrola_stanu_technicznego_jedn_zew: string | null;
  kontrola_stanu_mocowania_agregatu: string | null;
  czyszczenie_filtrow_jedn_wew: string | null;
  czyszczenie_wymiennika_ciepla_jedn_wew: string | null;
  czyszczenie_obudowy_jedn_wew: string | null;
  czyszczenie_tacy_skroplin: string | null;
  kontrola_droznosci_odplywu_skroplin: string | null;
  czyszczenie_obudowy_jedn_zew: string | null;
  czyszczenie_wymiennika_ciepla_jedn_zew: string | null;
  kontrola_szczelnosci_instalacji: string | null;
  kontrola_poprawnosci_dzialania: string | null;

  // Dodatkowe pola
  kontrola_temperatury_nawiewu: string | null;
  diagnostyka_awarii_urzadzen: string | null;
};

type MontageContext = {
  montages: Montage[] | undefined;
  loading: boolean;
  getMontages: (instalacjaId: number) => Promise<Response | undefined>;
};

type Response = {
  montaz_list: Montage[];
};

export const MontageContext = createContext<MontageContext>({
  montages: undefined,
  loading: false,
  getMontages: () => Promise.resolve(undefined),
});

export function MontageProvider({ children }: { children: ReactElement }) {
  const [montages, setMontages] = useState<Montage[]>();
  const {
    result,
    execute: getMontagesRequest,
    loading,
  } = useApi<Response>({
    path: 'montaz_list',
  });
  const getMontages = useCallback(
    async (instalacjaId: number) => {
      return getMontagesRequest({ instalacja_id: instalacjaId });
    },
    [getMontagesRequest],
  );

  useEffect(() => {
    setMontages(
      result?.montaz_list?.sort(
        (a, b) =>
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime(),
      ),
    );
  }, [result]);

  const contextValue: MontageContext = useMemo(
    () => ({
      montages,
      getMontages,
      loading,
    }),
    [montages, getMontages, loading],
  );

  return (
    <MontageContext.Provider value={contextValue}>
      {children}
    </MontageContext.Provider>
  );
}

export default function useMontages() {
  return useContext(MontageContext);
}
