import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Container from '../../components/Container';
import Colors from '../../consts/Colors';
import { ChatParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useChat from '../../providers/ChatProvider';
import useClients from '../../providers/ClientsProvider';

type NavigationProp = StackNavigationProp<ChatParamList, 'ClientSelector'>;

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

function ClientSelectorScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { clients, loading, fetchClients } = useClients();
  const { startConversation } = useChat();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (clients.length === 0) {
      fetchClients();
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client: Client) =>
          client.first_name.toLowerCase().includes(query) ||
          client.last_name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const handleClientSelect = useCallback(
    async (client: Client) => {
      if (starting) return;

      setStarting(true);
      try {
        const conversation = await startConversation(client.id);
        if (conversation) {
          // Określ drugiego uczestnika
          const otherParticipant =
            conversation.participant_1 === user?.id
              ? {
                  name: conversation.participant_2_name,
                  email: conversation.participant_2_email,
                }
              : {
                  name: conversation.participant_1_name,
                  email: conversation.participant_1_email,
                };

          navigation.replace('ChatScreen', {
            conversationId: conversation.id,
            otherParticipantName: otherParticipant.name,
          });
        }
      } catch (error) {
        console.error('Error starting conversation:', error);
      } finally {
        setStarting(false);
      }
    },
    [starting, startConversation, navigation, user]
  );

  const renderClientItem = useCallback(
    ({ item }: { item: Client }) => (
      <TouchableOpacity
        style={styles.clientItem}
        onPress={() => handleClientSelect(item)}
        disabled={starting}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.first_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.clientEmail}>{item.email}</Text>
        </View>
      </TouchableOpacity>
    ),
    [handleClientSelect, starting]
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
    <Container>
      <View style={styles.container}>
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
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            filteredClients.length === 0 ? styles.emptyListContainer : undefined
          }
        />
        {starting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Rozpoczynanie konwersacji...</Text>
          </View>
        )}
      </View>
    </Container>
  );
}

export default ClientSelectorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  searchContainer: {
    padding: 16,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.loadingOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
});

