import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../consts/Colors';
import useClients, { Client } from '../providers/ClientsProvider';

interface ClientSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onClientSelect: (client: Client) => void;
  title?: string;
}

function ClientSelectorModal({
  visible,
  onClose,
  onClientSelect,
  title = 'Wybierz klienta',
}: ClientSelectorModalProps) {
  const { clients, getClients, loading } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  useEffect(() => {
    if (visible && getClients) {
      getClients(1, false);
    }
  }, [visible, getClients]);

  useEffect(() => {
    if (!clients) {
      setFilteredClients([]);
      return;
    }

    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client: Client) =>
          client.first_name.toLowerCase().includes(query) ||
          client.last_name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          (client.nazwa_firmy &&
            client.nazwa_firmy.toLowerCase().includes(query)),
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const handleClientSelect = useCallback(
    (client: Client) => {
      onClientSelect(client);
      setSearchQuery('');
      onClose();
    },
    [onClientSelect, onClose],
  );

  const renderClientItem = useCallback(
    ({ item }: { item: Client }) => {
      const clientName = `${item.first_name} ${item.last_name}`;
      const displayName =
        item.nazwa_firmy || clientName || item.email || `Klient ${item.id}`;

      return (
        <TouchableOpacity
          style={styles.clientItem}
          onPress={() => handleClientSelect(item)}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.first_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{displayName}</Text>
            {item.email && (
              <Text style={styles.clientEmail}>{item.email}</Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleClientSelect],
  );

  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {searchQuery ? 'Nie znaleziono klientów' : 'Brak klientów'}
        </Text>
      </View>
    );
  }, [loading, searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Szukaj klienta..."
              placeholderTextColor={Colors.grayText}
            />
          </View>

          <FlatList
            data={filteredClients}
            renderItem={renderClientItem}
            keyExtractor={item => item.id.toString()}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={
              filteredClients.length === 0 ? styles.emptyListContainer : undefined
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  modalCloseButton: {
    fontSize: 24,
    color: Colors.black,
    fontWeight: '300',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  clientItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: Colors.grayText,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.grayText,
  },
  emptyListContainer: {
    flex: 1,
  },
});

export default ClientSelectorModal;

