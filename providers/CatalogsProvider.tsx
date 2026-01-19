import {
  ReactElement,
  createContext,
  useMemo,
  useState,
  useContext,
  useEffect,
} from 'react';

import useApi from '../hooks/useApi';

export type Catalog = {
  ac_user: number;
  created_date: string;
  file: string;
  id: number;
  is_active: boolean;
  name: string;
  od?: string; // Data ważności od (format: YYYY-MM-DD lub podobny)
};

export type PriceListItem = {
  ac_user: number;
  file: string;
  created_date: string;
  is_active: boolean;
  name: string;
  id: number;
};

export type Flyer = {
  ac_user: number;
  name: string;
  id: number;
  file: string;
  cteated_date: string;
  is_active: boolean;
};

type CatalogsResponse = {
  katalogi: Catalog[];
};

type PriceListResponse = {
  cenniki: PriceListItem[];
};

type FlyersResponse = {
  ulotki: Flyer[];
};

type CatalogsContext = {
  catalogs: Catalog[] | null;
  priceList: PriceListItem[] | null;
  flyers: Flyer[] | null;
  loadingCatalogs: boolean;
  loadingPriceList: boolean;
  loadingFlyers: boolean;
  getCatalogs?: (data?: { monter_id: number }) => void;
  getPriceList?: (data?: { monter_id: number }) => void;
  getFlyers?: (data?: { monter_id: number }) => void;
};

export const CatalogsContext = createContext<CatalogsContext>({
  catalogs: null,
  priceList: null,
  flyers: null,
  loadingCatalogs: false,
  loadingPriceList: false,
  loadingFlyers: false,
});

export function CatalogsProvider({ children }: { children: ReactElement }) {
  const [catalogs, setCatalogs] = useState<Catalog[] | null>(null);
  const [priceList, setPriceList] = useState<PriceListItem[] | null>(null);
  const [flyers, setFlyers] = useState<Flyer[] | null>(null);

  const [, setError] = useState<string | null>(null);

  const {
    result: catalogsResponse,
    execute: getCatalogs,
    loading: loadingCatalogs,
  } = useApi<CatalogsResponse>({
    path: 'katalog_list',
  });

  const {
    result: priceListsResponse,
    execute: getPriceList,
    loading: loadingPriceList,
  } = useApi<PriceListResponse>({
    path: 'cennik_list',
  });

  const {
    result: flyersResponse,
    execute: getFlyers,
    loading: loadingFlyers,
  } = useApi<FlyersResponse>({
    path: 'ulotka_list',
  });

  useEffect(() => {
    if (catalogsResponse) {
      setCatalogs(catalogsResponse.katalogi);
    }
  }, [catalogsResponse]);

  useEffect(() => {
    if (priceListsResponse) {
      setPriceList(priceListsResponse.cenniki);
    }
  }, [priceListsResponse]);

  useEffect(() => {
    if (flyersResponse) {
      setFlyers(flyersResponse.ulotki);
    }
  }, [flyersResponse]);

  const contextValue = useMemo(
    () => ({
      catalogs,
      priceList,
      flyers,
      loadingCatalogs,
      loadingPriceList,
      loadingFlyers,
      getCatalogs,
      getPriceList,
      getFlyers,
    }),
    [
      catalogs,
      priceList,
      flyers,
      loadingCatalogs,
      loadingPriceList,
      loadingFlyers,
      getCatalogs,
      getPriceList,
      getFlyers,
    ],
  );

  return (
    <CatalogsContext.Provider value={contextValue}>
      {children}
    </CatalogsContext.Provider>
  );
}

export default function useCatalogs() {
  return useContext(CatalogsContext);
}
