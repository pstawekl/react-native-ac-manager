import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import Colors from '../../consts/Colors';
import { ChatParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useChat from '../../providers/ChatProvider';
import { Message } from '../../types/chat';

type ChatScreenRouteProp = RouteProp<ChatParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = StackNavigationProp<
  ChatParamList,
  'ChatScreen'
>;

function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { conversationId, otherParticipantName } = route.params || {
    conversationId: 0,
    otherParticipantName: '',
  };

  const { fetchMessages, sendMessage, markAsRead } = useChat();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }

      try {
        const response = await fetchMessages(
          conversationId,
          25,
          reset ? 0 : offset,
        );

        if (reset) {
          // Pierwsze załadowanie - ustaw wiadomości
          setMessages(response.messages);
          setOffset(25);
        } else {
          // Ładowanie więcej - dodaj na początek (starsze wiadomości)
          setMessages(prev => [...response.messages, ...prev]);
          setOffset(prev => prev + 25);
        }

        setHasMore(response.has_more);

        // Oznacz wiadomości jako przeczytane
        if (reset) {
          await markAsRead(conversationId);
        }
      } catch (error) {
        // Error loading messages
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [conversationId, fetchMessages, markAsRead, offset],
  );

  const loadMoreMessages = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    loadMessages(false);
  }, [loadingMore, hasMore, loadMessages]);

  useEffect(() => {
    loadMessages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // Tylko przy zmianie conversationId, loadMessages jest stabilne

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const message = await sendMessage(conversationId, inputText.trim());
      if (message) {
        setMessages(prev => [...prev, message]);
        setInputText('');

        // Przewiń do najnowszej wiadomości (offset 0 z inverted)
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      }
    } catch (error) {
      // Error sending message
    } finally {
      setSending(false);
    }
  }, [inputText, sending, conversationId, sendMessage]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isOwnMessage = item.sender === user?.id;

      return (
        <View
          style={[
            styles.messageContainer,
            isOwnMessage
              ? styles.ownMessageContainer
              : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isOwnMessage
                ? styles.ownMessageBubble
                : styles.otherMessageBubble,
            ]}
          >
            {!isOwnMessage && (
              <Text style={styles.senderName}>{item.sender_name}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              ]}
            >
              {new Date(item.created_at).toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      );
    },
    [user],
  );

  if (loading && messages.length === 0) {
    return (
      <View style={styles.wrapper}>
        <ButtonsHeader
          title={otherParticipantName || 'Czat'}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ButtonsHeader
        title={otherParticipantName || 'Czat'}
        onBackPress={() => navigation.goBack()}
      />
      <Container style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()} // Odwróć kolejność dla inverted
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.messagesList}
          inverted // Najnowsze wiadomości na dole
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingMoreText}>Ładowanie...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Brak wiadomości</Text>
                <Text style={styles.emptyStateSubtext}>
                  Wyślij pierwszą wiadomość
                </Text>
              </View>
            ) : null
          }
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Napisz wiadomość..."
            placeholderTextColor={Colors.grayText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Wyślij</Text>
            )}
          </TouchableOpacity>
        </View>
      </Container>
    </View>
  );
}

export default ChatScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  ownMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: Colors.gray,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Colors.white,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.grayText,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 15,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    height: 47,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.grayText,
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: Colors.grayText,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.grayerText,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.grayText,
  },
});
