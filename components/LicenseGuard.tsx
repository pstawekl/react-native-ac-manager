import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLicense } from '../providers/LicenseProvider';

interface LicenseGuardProps {
  children: ReactNode;
}

// Kolory
const COLORS = {
  white: '#FFFFFF',
  danger: '#D32F2F',
  darkGray: '#333',
  lightGray: '#F5F5F5',
  mediumGray: '#666',
};

/**
 * Komponent który sprawdza licencję i decyduje co wyświetlić
 */
export function LicenseGuard({ children }: LicenseGuardProps) {
  const { licenseStatus, initialLoading, shouldBlockApp } = useLicense();

  // Loading state - TYLKO przy pierwszym ładowaniu!
  // Odświeżanie w tle (refreshing) NIE pokazuje loadera
  if (initialLoading || !licenseStatus) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  // Zablokowana aplikacja
  if (shouldBlockApp()) {
    return (
      <View style={styles.blockedContainer}>
        <Text style={styles.blockedEmoji}>🔒</Text>
        <Text style={styles.blockedTitle}>Aplikacja zablokowana</Text>
        <Text style={styles.blockedMessage}>
          {licenseStatus.message ||
            'Rozlicz się z programistą, aby móc korzystać z aplikacji'}
        </Text>
        <View style={styles.contactContainer}>
          <Text style={styles.contactLabel}>Kontakt:</Text>
          <Text style={styles.contactInfo}>
            Email: jakub.stawski@interactive.net.pl
          </Text>
          <Text style={styles.contactInfo}>Tel: +48 518 275 470</Text>
        </View>
      </View>
    );
  }

  // Tryb demo lub pełna licencja - pokazuj normalną aplikację bez banerka
  return children as JSX.Element;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  blockedEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  blockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  blockedMessage: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  contactContainer: {
    backgroundColor: COLORS.lightGray,
    padding: 20,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  contactInfo: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 8,
  },
});

export default LicenseGuard;
