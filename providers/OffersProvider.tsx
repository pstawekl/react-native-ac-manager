import {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useApi from '../hooks/useApi';

export type Device = {
  id: number;
  data: string;
  producent: string;
  typ: string;
  moc_chlodnicza: number;
  moc_grzewcza: number;
  nazwa_modelu: string;
  nazwa_modelu_producenta: string;
  cena_katalogowa_netto: string;
  glosnosc: string;
  klasa_energetyczna_chlodzenie: string;
  klasa_energetyczna_grzanie: string;
  kolor: string;
  nazwa_jedn_wew: string;
  nazwa_jedn_zew: string;
  typ_jedn_wew: string;
  typ_jedn_zew: string;
  sterowanie_wifi: number;
  wielkosc_wew: string;
  wielkosc_zew: string;
  rodzaj: string;
  maks_ilosc_jedn_wew: number;
};

export type Offer = {
  creator: number;
  devices_multi_split: number[];
  devices_split: number[];
  id: number;
  instalacja: number;
  is_accepted: boolean;
  is_template: boolean;
  narzut: number[];
  offer_type: 'split' | 'multi_split';
  rabat: number[];
  nazwa_oferty?: string;
  nazwa?: string; // Pole dla szablonów
  typ?: 'split' | 'multisplit'; // Pole dla szablonów
  narzuty?: number[]; // Pole dla szablonów
  wersja: number;
  created_date: string;
  updated_date: string;
  // Pola systemu rezerwacji terminów montażu
  proposed_montaz_date?: string | null;
  proposed_montaz_time?: string | null;
  montaz_status?: 'none' | 'pending' | 'confirmed' | 'rejected';
  montaz_zadanie?: number | null;
  rejection_reason?: string | null;
};

export type GroupedOffer = {
  nazwa_oferty: string;
  instalacja: number;
  offer_type: 'split' | 'multi_split';
  versions: Offer[];
  isExpanded?: boolean;
};

export type SplitResponse = {
  DevicesSplit: Device[];
};

export type MultiSplitResponse = {
  DevicesMultiSplit: Device[];
};

export type OffersResponse = Offer[];

type OffersContext = {
  devicesSplit: Device[] | null;
  devicesMultisplit: Device[] | null;
  offers: Offer[] | null;
  devicesSplitLoading: boolean;
  devicesMultisplitLoading: boolean;
  offersLoading: boolean;
  getDevicesSplit?: (requestData?: any) => void;
  getDevicesMultisplit?: (requestData?: any) => void;
  getOffers?: () => void;
};

export const OffersContext = createContext<OffersContext>({
  devicesSplit: null,
  devicesMultisplit: null,
  offers: null,
  devicesSplitLoading: false,
  devicesMultisplitLoading: false,
  offersLoading: false,
});

export function OffersProvider({ children }: { children: ReactElement }) {
  const [devicesSplit, setDevicesSplit] = useState<Device[] | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [devicesMultisplit, setDevicesMultisplit] = useState<Device[] | null>(
    null,
  );

  const {
    result: devicesSplitResponse,
    execute: getDevicesSplit,
    loading: devicesSplitLoading,
  } = useApi<SplitResponse>({
    path: 'devices_split',
  });

  const {
    result: devicesMultisplitResponse,
    execute: getDevicesMultisplit,
    loading: devicesMultisplitLoading,
  } = useApi<MultiSplitResponse>({
    path: 'devices_multisplit',
  });

  const {
    result: offersResponse,
    execute: getOffers,
    loading: offersLoading,
  } = useApi<OffersResponse>({
    path: 'oferta_list',
  });

  useEffect(() => {
    if (devicesSplitResponse) {
      setDevicesSplit(devicesSplitResponse?.DevicesSplit);
    }
  }, [devicesSplitResponse]);

  useEffect(() => {
    if (devicesMultisplitResponse) {
      setDevicesMultisplit(devicesMultisplitResponse?.DevicesMultiSplit);
    }
  }, [devicesMultisplitResponse]);

  useEffect(() => {
    if (offersResponse) {
      setOffers(offersResponse);
    }
  }, [offersResponse]);

  const contextValue: OffersContext = useMemo(
    () => ({
      devicesSplit,
      devicesMultisplit,
      offers,
      devicesSplitLoading,
      devicesMultisplitLoading,
      offersLoading,
      getDevicesSplit,
      getDevicesMultisplit,
      getOffers,
    }),
    [
      devicesSplit,
      devicesMultisplit,
      offers,
      devicesSplitLoading,
      devicesMultisplitLoading,
      offersLoading,
      getDevicesSplit,
      getDevicesMultisplit,
      getOffers,
    ],
  );

  return (
    <OffersContext.Provider value={contextValue}>
      {children}
    </OffersContext.Provider>
  );
}

export default function useOffers() {
  return useContext(OffersContext);
}
