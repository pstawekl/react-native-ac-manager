import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Alert } from 'react-native';

import useApi from '../hooks/useApi';

export type RoundingMode = 'none' | 'full' | 'tens' | 'hundreds';

export type WorkScheduleItem = {
  id?: number;
  weekday: number;
  start_time: string | null;
  end_time: string | null;
};

export type OfferSettingsResponse = {
  id?: number;
  company_user?: number;
  montaz_buffer_days: number;
  reservation_system_enabled?: boolean;
  review_reminders_enabled?: boolean;
  work_schedules: WorkScheduleItem[];
};

interface OfferSettings {
  roundingMode: RoundingMode;
  montazBufferDays: number;
  reservationSystemEnabled: boolean;
  reviewRemindersEnabled: boolean;
  workSchedules: WorkScheduleItem[];
}

interface OfferSettingsContextType {
  settings: OfferSettings;
  updateRoundingMode: (mode: RoundingMode) => Promise<void>;
  roundAmount: (amount: number) => number;
  loading: boolean;
  fetchOfferSettingsFromApi: () => Promise<void>;
  updateOfferSettingsApi: (
    montazBufferDays: number,
    workSchedules: WorkScheduleItem[],
    reservationSystemEnabled?: boolean,
    reviewRemindersEnabled?: boolean,
  ) => Promise<void>;
}

const defaultWorkSchedules: WorkScheduleItem[] = [
  ...Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    start_time: weekday < 5 ? '08:00' : null,
    end_time: weekday < 5 ? '16:00' : null,
  })),
];

const defaultSettings: OfferSettings = {
  roundingMode: 'none',
  montazBufferDays: 0,
  reservationSystemEnabled: true,
  reviewRemindersEnabled: true,
  workSchedules: defaultWorkSchedules,
};

const OfferSettingsContext = createContext<
  OfferSettingsContextType | undefined
>(undefined);

const SETTINGS_STORAGE_KEY = 'offer_settings';

export function OfferSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<OfferSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const { execute: fetchApi, loading: apiLoading } =
    useApi<OfferSettingsResponse>({
      path: 'offer_settings',
    });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          roundingMode: parsed.roundingMode ?? prev.roundingMode,
        }));
      }
      const apiData = await fetchApi({ method: 'GET' });
      if (
        apiData?.montaz_buffer_days !== undefined &&
        apiData?.work_schedules
      ) {
        setSettings(prev => ({
          ...prev,
          montazBufferDays: apiData.montaz_buffer_days,
          reservationSystemEnabled: apiData.reservation_system_enabled ?? true,
          reviewRemindersEnabled: apiData.review_reminders_enabled ?? true,
          workSchedules: (apiData.work_schedules as WorkScheduleItem[]).map(
            ws => ({
              id: ws.id,
              weekday: ws.weekday,
              start_time: ws.start_time ?? null,
              end_time: ws.end_time ?? null,
            }),
          ),
        }));
      }
    } catch {
      // Brak tokena lub błąd sieci – zostają domyślne wartości (bez alertu przy starcie)
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferSettingsFromApi = useCallback(async () => {
    try {
      const apiData = await fetchApi({ method: 'GET' });
      if (
        apiData?.montaz_buffer_days !== undefined &&
        apiData?.work_schedules
      ) {
        setSettings(prev => ({
          ...prev,
          montazBufferDays: apiData.montaz_buffer_days,
          reservationSystemEnabled: apiData.reservation_system_enabled ?? true,
          reviewRemindersEnabled: apiData.review_reminders_enabled ?? true,
          workSchedules: (apiData.work_schedules as WorkScheduleItem[]).map(
            ws => ({
              id: ws.id,
              weekday: ws.weekday,
              start_time: ws.start_time ?? null,
              end_time: ws.end_time ?? null,
            }),
          ),
        }));
      }
    } catch {
      // Silent or toast
    }
  }, [fetchApi]);

  const updateOfferSettingsApi = useCallback(
    async (
      montazBufferDays: number,
      workSchedules: WorkScheduleItem[],
      reservationSystemEnabled?: boolean,
      reviewRemindersEnabled?: boolean,
    ): Promise<void> => {
      const payload: Record<string, unknown> = {
        montaz_buffer_days: montazBufferDays,
        work_schedules: workSchedules.map(ws => ({
          weekday: ws.weekday,
          start_time: ws.start_time,
          end_time: ws.end_time,
        })),
      };
      if (reservationSystemEnabled !== undefined) {
        payload.reservation_system_enabled = reservationSystemEnabled;
      }
      if (reviewRemindersEnabled !== undefined) {
        payload.review_reminders_enabled = reviewRemindersEnabled;
      }
      if (__DEV__) {
        console.warn(
          'offer_settings POST payload keys:',
          Object.keys(payload),
          {
            reservation_system_enabled: payload.reservation_system_enabled,
            review_reminders_enabled: payload.review_reminders_enabled,
          },
        );
      }
      const result = await fetchApi({ method: 'POST', data: payload });
      if (result?.error) {
        if (__DEV__) {
          console.warn(
            'offer_settings POST error:',
            result.error,
            result.details ?? '',
          );
        }
        throw new Error(result.error as string);
      }
      const isSuccessShape =
        result &&
        typeof (result as { montaz_buffer_days?: unknown })
          .montaz_buffer_days === 'number';
      if (result && !isSuccessShape) {
        if (__DEV__) {
          console.warn('offer_settings POST: unexpected response', result);
        }
        throw new Error(
          (result as { error?: string }).error ??
          'Nie udało się zapisać ustawień.',
        );
      }
      if (result) {
        setSettings(prev => ({
          ...prev,
          montazBufferDays: result.montaz_buffer_days ?? montazBufferDays,
          reservationSystemEnabled:
            result.reservation_system_enabled ?? prev.reservationSystemEnabled,
          reviewRemindersEnabled:
            result.review_reminders_enabled ?? prev.reviewRemindersEnabled,
          workSchedules:
            (result.work_schedules as WorkScheduleItem[])?.map(ws => ({
              id: ws.id,
              weekday: ws.weekday,
              start_time: ws.start_time ?? null,
              end_time: ws.end_time ?? null,
            })) ?? prev.workSchedules,
        }));
      }
    },
    [fetchApi],
  );

  const updateRoundingMode = async (mode: RoundingMode) => {
    try {
      const newSettings = { ...settings, roundingMode: mode };
      setSettings(newSettings);
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ roundingMode: mode }),
      );
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać ustawień oferty');
      throw error;
    }
  };

  const roundAmount = (amount: number): number => {
    switch (settings.roundingMode) {
      case 'full':
        return Math.ceil(amount);
      case 'tens':
        return Math.ceil(amount / 10) * 10;
      case 'hundreds':
        return Math.ceil(amount / 100) * 100;
      case 'none':
      default:
        return amount;
    }
  };

  const value: OfferSettingsContextType = {
    settings,
    updateRoundingMode,
    roundAmount,
    loading: loading || apiLoading,
    fetchOfferSettingsFromApi,
    updateOfferSettingsApi,
  };

  return (
    <OfferSettingsContext.Provider value={value}>
      {children}
    </OfferSettingsContext.Provider>
  );
}

export function useOfferSettings() {
  const context = useContext(OfferSettingsContext);
  if (context === undefined) {
    throw new Error(
      'useOfferSettings must be used within an OfferSettingsProvider',
    );
  }
  return context;
}
