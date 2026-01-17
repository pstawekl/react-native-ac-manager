import { useCallback, useState } from 'react';
import useApi from './useApi';

export type AvailableDate = {
  date: string;
  day_name: string;
  is_available: boolean;
};

export type MontazProposal = {
  oferta_id: number;
  nazwa_oferty: string;
  proposed_date: string | null;
  proposed_time: string | null;
  klient: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    nazwa_firmy?: string;
    numer_telefonu?: string;
    miasto?: string;
    ulica?: string;
    numer_domu?: string;
  };
  instalacja_id: number | null;
  created_date: string;
};

type AvailableDatesResponse = {
  available_dates: AvailableDate[];
  start_date: string;
  end_date: string;
};

type ProposalsResponse = {
  proposals: MontazProposal[];
  count: number;
};

export default function useMontazDates() {
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [proposals, setProposals] = useState<MontazProposal[]>([]);

  const {
    execute: fetchAvailableDates,
    loading: availableDatesLoading,
    result: availableDatesResult,
  } = useApi<AvailableDatesResponse>({
    path: 'available_montaz_dates',
  });

  const { execute: proposeDateExecute, loading: proposeDateLoading } = useApi({
    path: 'propose_montaz_date',
  });

  const { execute: confirmDateExecute, loading: confirmDateLoading } = useApi({
    path: 'confirm_montaz_date',
  });

  const { execute: rejectDateExecute, loading: rejectDateLoading } = useApi({
    path: 'reject_montaz_date',
  });

  const {
    execute: fetchProposalsExecute,
    loading: proposalsLoading,
    result: proposalsResult,
  } = useApi<ProposalsResponse>({
    path: 'pending_montaz_proposals',
  });

  /**
   * Pobiera dostępne terminy montażu
   */
  const getAvailableDates = useCallback(
    async (
      startDate?: string,
      endDate?: string,
    ): Promise<AvailableDate[] | undefined> => {
      const data: any = {};
      if (startDate) data.start_date = startDate;
      if (endDate) data.end_date = endDate;

      const response = await fetchAvailableDates({ data });
      if (response?.available_dates) {
        setAvailableDates(response.available_dates);
        return response.available_dates;
      }
      return undefined;
    },
    [fetchAvailableDates],
  );

  /**
   * Proponuje termin montażu dla oferty
   */
  const proposeMontazDate = useCallback(
    async (
      ofertaId: number,
      proposedDate: string,
      proposedTime?: string,
    ): Promise<boolean> => {
      const data: any = {
        oferta_id: ofertaId,
        proposed_date: proposedDate,
      };
      if (proposedTime) {
        data.proposed_time = proposedTime;
      }

      const response = await proposeDateExecute({ data });
      return !!response?.success;
    },
    [proposeDateExecute],
  );

  /**
   * Potwierdza zaproponowany termin montażu (dla montera/admina)
   */
  const confirmMontazDate = useCallback(
    async (ofertaId: number): Promise<boolean> => {
      const response = await confirmDateExecute({
        data: { oferta_id: ofertaId },
      });
      return !!response?.success;
    },
    [confirmDateExecute],
  );

  /**
   * Odrzuca zaproponowany termin montażu (dla montera/admina)
   */
  const rejectMontazDate = useCallback(
    async (ofertaId: number, rejectionReason?: string): Promise<boolean> => {
      const data: any = { oferta_id: ofertaId };
      if (rejectionReason) {
        data.rejection_reason = rejectionReason;
      }

      const response = await rejectDateExecute({ data });
      return !!response?.success;
    },
    [rejectDateExecute],
  );

  /**
   * Pobiera listę oczekujących propozycji terminów (dla montera/admina)
   */
  const getPendingProposals = useCallback(async (): Promise<
    MontazProposal[] | undefined
  > => {
    const response = await fetchProposalsExecute({ data: {} });
    if (response?.proposals) {
      setProposals(response.proposals);
      return response.proposals;
    }
    return undefined;
  }, [fetchProposalsExecute]);

  return {
    // Stan
    availableDates,
    proposals,

    // Funkcje
    getAvailableDates,
    proposeMontazDate,
    confirmMontazDate,
    rejectMontazDate,
    getPendingProposals,

    // Loading states
    availableDatesLoading,
    proposeDateLoading,
    confirmDateLoading,
    rejectDateLoading,
    proposalsLoading,
  };
}
