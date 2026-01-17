import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLicense } from '../../providers/LicenseProvider';
import Container from '../../components/Container';

export default function LicenseStatusScreen() {
  const { licenseStatus, deviceId, refreshing, checkLicense } = useLicense();

  const handleRefresh = async () => {
    try {
      await checkLicense(true, false); // force = true, silent = false (pokazuj stan refreshing)
      Alert.alert('Odświeżono', 'Status licencji został zaktualizowany');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się odświeżyć statusu licencji');
    }
  };

  const getLicenseTypeDisplay = () => {
    switch (licenseStatus?.licenseType) {
      case 'demo':
        return 'Wersja Demo';
      case 'full':
        return 'Pełna Licencja';
      case 'blocked':
        return 'Zablokowane';
      default:
        return 'Nieznany';
    }
  };

  const getLicenseTypeColor = () => {
    switch (licenseStatus?.licenseType) {
      case 'demo':
        return '#FF9800';
      case 'full':
        return '#4CAF50';
      case 'blocked':
        return '#D32F2F';
      default:
        return '#666';
    }
  };

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Status Licencji</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Typ Licencji</Text>
            <View style={[styles.statusBadge, { backgroundColor: getLicenseTypeColor() }]}>
              <Text style={styles.statusBadgeText}>{getLicenseTypeDisplay()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <Text style={styles.rowLabel}>Status:</Text>
            <Text style={[
              styles.rowValue,
              { color: licenseStatus?.isValid ? '#4CAF50' : '#D32F2F' }
            ]}>
              {licenseStatus?.isValid ? 'Aktywna' : 'Nieaktywna'}
            </Text>
          </View>

          {licenseStatus?.licenseType === 'demo' && licenseStatus.daysRemaining !== null && (
            <View style={styles.statusRow}>
              <Text style={styles.rowLabel}>Pozostało dni:</Text>
              <Text style={[
                styles.rowValue,
                { 
                  color: (licenseStatus.daysRemaining ?? 0) <= 1 ? '#D32F2F' : '#FF9800',
                  fontWeight: 'bold'
                }
              ]}>
                {licenseStatus.daysRemaining}
              </Text>
            </View>
          )}

          {licenseStatus?.message && (
            <>
              <View style={styles.divider} />
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{licenseStatus.message}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.deviceCard}>
          <Text style={styles.cardTitle}>Informacje o Urządzeniu</Text>
          {deviceId && (
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>ID Urządzenia:</Text>
              <Text style={styles.deviceValue}>{deviceId.substring(0, 20)}...</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? 'Odświeżanie...' : '🔄 Odśwież Status'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Status licencji jest sprawdzany automatycznie przy każdym uruchomieniu aplikacji i co 6 godzin.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 14,
    color: '#666',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageBox: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  deviceRow: {
    marginBottom: 8,
  },
  deviceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  deviceValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  refreshButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});

