import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@rneui/themed';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { useEffect, useState } from 'react';
import store from './store';

import 'react-native-gesture-handler';
import RootNavigation from './navigation/RootNavigation';
import { AuthProvider } from './providers/AuthProvider';
import { LicenseProvider } from './providers/LicenseProvider';
import { NotificationsProvider } from './providers/NotificationsProvider';
import { OfferSettingsProvider } from './providers/OfferSettingsProvider';
import { LicenseGuard } from './components/LicenseGuard';
import theme from './theme';
import useLoadFonts from './utils/fontUtils';
// Tymczasowo wyłączone - inicjalizacja bazy w tle
// import { setupDatabase } from './database';
// import { networkService } from './services/NetworkService';
// import { syncService } from './services/SyncService';
// import useAuth from './providers/AuthProvider';

const linking = {
  prefixes: ['ac-manager://'],
  config: {
    screens: {
      Registration: {
        path: 'register',
        parse: {
          token: (token: string) => token,
          email: (email: string) => email,
        },
      },
    },
  },
};

// Komponent do obsługi synchronizacji (wewnątrz AuthProvider)
// Tymczasowo wyłączone
function SyncHandler() {
  // const { token } = useAuth();

  // Automatyczna synchronizacja przy powrocie połączenia
  // useEffect(() => {
  //   if (!token) return;

  //   const unsubscribe = networkService.onConnectionChange(async (isConnected) => {
  //     if (isConnected) {
  //       try {
  //         const { syncService } = await import('./services/SyncService');
  //         await syncService.sync(token);
  //       } catch (error) {
  //         console.error('Błąd automatycznej synchronizacji:', error);
  //       }
  //     }
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [token]);

  return null;
}

function AppContent() {
  const fontsLoaded: boolean = useLoadFonts();

  // Tymczasowo wyłączone - włącz po naprawieniu błędów
  // useEffect(() => {
  //   const initDB = async () => {
  //     try {
  //       const { setupDatabase } = await import('./database');
  //       await setupDatabase();
  //       console.log('Baza danych zainicjalizowana');
  //     } catch (error) {
  //       console.error('Błąd inicjalizacji bazy danych:', error);
  //     }
  //   };
  //   setTimeout(initDB, 1000);
  // }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <ThemeProvider theme={theme}>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <LicenseProvider>
              <OfferSettingsProvider>
                <AuthProvider>
                  <SyncHandler />
                  <NotificationsProvider>
                    <LicenseGuard>
                      <RootNavigation />
                    </LicenseGuard>
                  </NotificationsProvider>
                </AuthProvider>
              </OfferSettingsProvider>
            </LicenseProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
