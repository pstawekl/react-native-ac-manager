import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
// Tymczasowo wyłączone
// import { syncService, type SyncStatus } from '../services/SyncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const { isConnected } = useNetworkStatus();

  // Tymczasowo wyłączone
  // useEffect(() => {
  //   const loadSyncService = async () => {
  //     const { syncService } = await import('../services/SyncService');
  //     const unsubscribe = syncService.onStatusChange(setStatus);
  //     return unsubscribe;
  //   };
  //   loadSyncService();
  // }, []);

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.offlineText}>Offline</Text>
      </View>
    );
  }

  if (status === 'syncing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.syncingText}>Synchronizacja...</Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>✓ Zsynchronizowano</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>✗ Błąd synchronizacji</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  offlineText: {
    color: '#666',
    fontSize: 12,
  },
  syncingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 12,
  },
  successText: {
    color: '#34C759',
    fontSize: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
  },
});

