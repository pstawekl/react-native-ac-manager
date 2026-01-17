import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Container from '../../components/Container';
import { useLicense } from '../../providers/LicenseProvider';

// Kolory
const COLORS = {
  danger: '#D32F2F',
  darkGray: '#333',
  lightGray: '#F5F5F5',
  mediumGray: '#666',
  lightBlue: '#E3F2FD',
  blue: '#0066CC',
};

export default function LicenseBlockedScreen() {
  const { licenseStatus, deviceId } = useLicense();

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.emoji}>🔒</Text>

        <Text style={styles.title}>Aplikacja Zablokowana</Text>

        <Text style={styles.message}>
          {licenseStatus?.message ||
            'Rozlicz się z programistą, aby móc korzystać z aplikacji.'}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Informacje o licencji</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, styles.infoValueBlocked]}>
              {licenseStatus?.licenseType === 'blocked'
                ? 'Zablokowane'
                : 'Demo wygasło'}
            </Text>
          </View>
          {deviceId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID Urządzenia:</Text>
              <Text style={styles.infoValueSmall}>
                {deviceId.substring(0, 16)}...
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Skontaktuj się z nami</Text>
          <Text style={styles.contactText}>
            📧 Email: jakub.stawski@interactive.net.pl
          </Text>
          <Text style={styles.contactText}>📱 Telefon: +48 518 275 470</Text>
          <Text style={styles.contactText}>
            🌐 Strona: www.interactive.net.pl
          </Text>

          <Text style={styles.contactNote}>
            Podczas kontaktu podaj ID urządzenia wymienione powyżej.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoValueBlocked: {
    color: COLORS.danger,
  },
  infoValueSmall: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontFamily: 'monospace',
  },
  contactBox: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 10,
    lineHeight: 20,
  },
  contactNote: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 18,
  },
});
