import { useCallback, useEffect, useState } from 'react';

import useApi from './useApi';

type DiscountProducersResponse = {
  producers: string[];
};

export default function useDiscountProducers() {
  const [producers, setProducers] = useState<string[]>([]);

  const {
    result,
    loading,
    error,
    execute,
  } = useApi<DiscountProducersResponse>({
    path: 'rabat_producenci_list',
  });

  const refresh = useCallback(() => {
    execute({ method: 'GET' });
  }, [execute]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (result?.producers) {
      setProducers(result.producers);
    }
  }, [result]);

  return {
    producers,
    loading,
    error,
    refresh,
  };
}

