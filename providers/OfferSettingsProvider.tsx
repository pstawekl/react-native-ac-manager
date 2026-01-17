import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export type RoundingMode = 'none' | 'full' | 'tens' | 'hundreds';

interface OfferSettings {
  roundingMode: RoundingMode;
}

interface OfferSettingsContextType {
  settings: OfferSettings;
  updateRoundingMode: (mode: RoundingMode) => Promise<void>;
  roundAmount: (amount: number) => number;
  loading: boolean;
}

const defaultSettings: OfferSettings = {
  roundingMode: 'none',
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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się załadować ustawień oferty');
    } finally {
      setLoading(false);
    }
  };

  const updateRoundingMode = async (mode: RoundingMode) => {
    try {
      const newSettings = { ...settings, roundingMode: mode };
      setSettings(newSettings);
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(newSettings),
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
    loading,
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
