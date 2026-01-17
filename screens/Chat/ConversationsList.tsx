import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import FloatingActionButton from '../../components/FloatingActionButton';
import Colors from '../../consts/Colors';
import { ChatParamList, MainParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useChat from '../../providers/ChatProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import { Conversation } from '../../types/chat';

type NavigationProp = CompositeNavigationProp<
  StackNavigationProp<ChatParamList, 'ConversationsList'>,
  DrawerNavigationProp<MainParamList>
>;

function ConversationsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { conversations, loading, fetchConversations, startConversation } =
    useChat();
  const { user } = useAuth();
  const { clients, getClients } = useClients();

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [startingConversation, setStartingConversation] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    // Tylko admin i monter mogą pobrać listę klientów
    if (
      getClients &&
      (user?.userType === 'admin' || user?.userType === 'monter') &&
      (!clients || clients.length === 0)
    ) {
      getClients().catch(() => {
        // Ignoruj błędy - użytkownik może nie mieć uprawnień
      });
    }
  }, [clients, getClients, user?.userType]);

  useEffect(() => {
    if (!clients) {
      setFilteredClients([]);
      return;
    }

    // Filtruj tylko klientów, którzy mają zarejestrowane konto
    const clientsWithAccount = clients.filter(
      (client: Client) => client.has_account === true,
    );

    if (searchQuery.trim() === '') {
      setFilteredClients(clientsWithAccount);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clientsWithAccount.filter(
        (client: Client) =>
          client.first_name.toLowerCase().includes(query) ||
          client.last_name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query),
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const handleRefresh = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleOpenClientSelector = useCallback(() => {
    setModalVisible(true);
    setSearchQuery('');
  }, []);

  const handleCloseClientSelector = useCallback(() => {
    setModalVisible(false);
    setSearchQuery('');
  }, []);

  const handleClientSelect = useCallback(
    async (client: Client) => {
      if (startingConversation) return;

      setStartingConversation(true);
      try {
        const conversation = await startConversation(client.ac_user);
        if (conversation) {
          setModalVisible(false);

          // Używamy bezpośrednio danych klienta, ponieważ wiemy że to jest nowa konwersacja
          const clientName = `${client.first_name} ${client.last_name}`;

          navigation.navigate('ChatScreen', {
            conversationId: conversation.id,
            otherParticipantName: clientName,
          });
        }
      } catch (error) {
        // Error starting conversation
      } finally {
        setStartingConversation(false);
      }
    },
    [startingConversation, startConversation, navigation],
  );

  const handleConversationPress = useCallback(
    (conversation: Conversation) => {
      if (!user?.id) return;

      // Wybierz uczestnika, który NIE jest obecnym użytkownikiem
      const currentUserId = user.id;
      const isParticipant1 =
        String(conversation.participant_1) === String(currentUserId);

      const otherParticipant = isParticipant1
        ? {
          name: conversation.participant_2_name,
          email: conversation.participant_2_email,
        }
        : {
          name: conversation.participant_1_name,
          email: conversation.participant_1_email,
        };

      navigation.navigate('ChatScreen', {
        conversationId: conversation.id,
        otherParticipantName: otherParticipant.name,
      });
    },
    [navigation, user],
  );

  const renderClientItem = useCallback(
    ({ item }: { item: Client }) => (
      <TouchableOpacity
        style={styles.clientItem}
        onPress={() => handleClientSelect(item)}
        disabled={startingConversation}
      >
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
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
    [handleClientSelect, startingConversation],
  );

  const renderConversationItem = useCallback(
    ({ item }: { item: Conversation }) => {
      const isCurrentUserParticipant1 =
        Number(item.participant_1) === Number(user?.id);
      const otherParticipantName = isCurrentUserParticipant1
        ? item.participant_2_name
        : item.participant_1_name;

      const lastMessage = item.last_message;
      const hasUnread = item.unread_count > 0;

      return (
        <TouchableOpacity
          style={[
            styles.conversationItem,
            hasUnread && styles.conversationItemUnread,
          ]}
          onPress={() => handleConversationPress(item)}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {otherParticipantName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text
                style={[styles.conversationName, hasUnread && styles.textBold]}
              >
                {otherParticipantName}
              </Text>
              {lastMessage && (
                <Text style={styles.conversationTime}>
                  {new Date(lastMessage.created_at).toLocaleDateString(
                    'pl-PL',
                    {
                      day: '2-digit',
                      month: '2-digit',
                    },
                  )}
                </Text>
              )}
            </View>
            <View style={styles.conversationFooter}>
              <Text
                style={[
                  styles.conversationLastMessage,
                  hasUnread && styles.textBold,
                ]}
                numberOfLines={1}
              >
                {lastMessage ? lastMessage.content : 'Brak wiadomości'}
              </Text>
              {hasUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unread_count}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [user, handleConversationPress],
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
        <Text style={styles.emptyStateText}>Brak konwersacji</Text>
        {(user?.userType === 'admin' || user?.userType === 'monter') && (
          <Text style={styles.emptyStateSubtext}>
            Kliknij + aby rozpocząć nową konwersację
          </Text>
        )}
      </View>
    );
  }, [loading, user]);

  return (
    <Container style={{ flex: 1, paddingTop: 20 }}>
      <View style={styles.container}>
        <ButtonsHeader
          onBackPress={() => navigation.goBack()}
        />
        <FlatList
          data={conversations || []}
          renderItem={renderConversationItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
          contentContainerStyle={
            !conversations || conversations.length === 0
              ? styles.emptyListContainer
              : undefined
          }
        />

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={handleCloseClientSelector}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Utwórz nową konwersację</Text>
                <TouchableOpacity onPress={handleCloseClientSelector}>
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
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      {searchQuery
                        ? 'Nie znaleziono klientów'
                        : 'Brak klientów'}
                    </Text>
                  </View>
                }
              />

              {startingConversation && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>
                    Rozpoczynanie konwersacji...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {(user?.userType === 'admin' || user?.userType === 'monter') && (
          <FloatingActionButton
            onPress={handleOpenClientSelector}
            backgroundColor={Colors.blue}
          />
        )}
      </View>
    </Container>
  );
}

export default ConversationsListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  conversationItemUnread: {
    backgroundColor: Colors.greenWithOpacity,
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
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    color: Colors.text,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.grayText,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationLastMessage: {
    flex: 1,
    fontSize: 14,
    color: Colors.grayText,
  },
  textBold: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.grayText,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.grayerText,
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
  },
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalCloseButton: {
    fontSize: 24,
    color: Colors.grayText,
    paddingHorizontal: 10,
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
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
