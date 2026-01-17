/* eslint-disable no-console */
import Constants from 'expo-constants';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Conversation, Message } from '../types/chat';
import useAuth from './AuthProvider';

const API_URL: string =
  Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
const API_PATH: string =
  API_URL.length > 0 && API_PORT.length > 0
    ? `${API_URL}:${API_PORT}/api`
    : `${API_URL}/api`;

// WebSocket URL - zmiana z http na ws
const WS_URL = API_URL.replace('http://', 'ws://').replace(
  'https://',
  'wss://',
);
const WS_PATH = API_PORT ? `${WS_URL}:${API_PORT}` : WS_URL;

interface FetchMessagesResponse {
  messages: Message[];
  total: number;
  has_more: boolean;
}

interface ChatContextType {
  conversations: Conversation[];
  unreadCount: number;
  loading: boolean;
  error?: string;
  fetchConversations: () => Promise<void>;
  fetchMessages: (
    conversationId: number,
    limit?: number,
    offset?: number,
  ) => Promise<FetchMessagesResponse>;
  sendMessage: (
    conversationId: number,
    content: string,
  ) => Promise<Message | null>;
  markAsRead: (conversationId: number) => Promise<void>;
  startConversation: (clientId: number) => Promise<Conversation | null>;
  refreshUnreadCount: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

// Helper function to add timeout to fetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export function ChatProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const { token, user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // Sprawdź, czy użytkownik jest w pełni zalogowany
  const isUserAuthenticated = !authLoading && !!token && !!user && !!user.id;

  const fetchConversations = useCallback(async () => {
    if (!token || !user?.id) return;

    setLoading(true);
    setError(undefined);

    try {
      const response = await fetchWithTimeout(`${API_PATH}/conversations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        setError('Nie udało się pobrać konwersacji');
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
      setError('Błąd połączenia');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const fetchMessages = useCallback(
    async (
      conversationId: number,
      limit = 25,
      offset = 0,
    ): Promise<FetchMessagesResponse> => {
      if (!token || !user?.id) {
        return { messages: [], total: 0, has_more: false };
      }

      try {
        const response = await fetchWithTimeout(
          `${API_PATH}/conversations/${conversationId}/messages/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, limit, offset }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          return {
            messages: data.messages || [],
            total: data.total || 0,
            has_more: data.has_more || false,
          };
        }
      } catch (e) {
        console.error('Error fetching messages:', e);
      }

      return { messages: [], total: 0, has_more: false };
    },
    [token, user],
  );

  const sendMessage = useCallback(
    async (
      conversationId: number,
      content: string,
    ): Promise<Message | null> => {
      if (!token || !user?.id) return null;

      try {
        const response = await fetchWithTimeout(
          `${API_PATH}/conversations/${conversationId}/send/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, content }),
          },
        );

        if (response.ok) {
          const message = await response.json();
          // Odśwież listę konwersacji po wysłaniu wiadomości
          await fetchConversations();
          return message;
        }
      } catch (e) {
        console.error('Error sending message:', e);
      }

      return null;
    },
    [token, fetchConversations],
  );

  const markAsRead = useCallback(
    async (conversationId: number) => {
      if (!token || !user?.id) return;

      try {
        const response = await fetchWithTimeout(
          `${API_PATH}/conversations/${conversationId}/mark-read/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          },
        );

        if (response.ok) {
          // Odśwież licznik nieprzeczytanych
          await refreshUnreadCount();
          // Odśwież listę konwersacji
          await fetchConversations();
        }
      } catch (e) {
        console.error('Error marking messages as read:', e);
      }
    },
    [token, user, refreshUnreadCount, fetchConversations],
  );

  const startConversation = useCallback(
    async (clientId: number): Promise<Conversation | null> => {
      if (!token || !user?.id) return null;

      try {
        const response = await fetchWithTimeout(
          `${API_PATH}/conversations/start/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, client_id: clientId }),
          },
        );

        if (response.ok) {
          const conversation = await response.json();
          // Odśwież listę konwersacji
          await fetchConversations();
          return conversation;
        }
      } catch (e) {
        console.error('Error starting conversation:', e);
      }

      return null;
    },
    [token, fetchConversations],
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!token || !user?.id) return;

    try {
      const response = await fetchWithTimeout(
        `${API_PATH}/conversations/unread-count/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (e) {
      console.error('Error fetching unread count:', e);
    }
  }, [token, user]);

  // Automatyczne odświeżanie licznika nieprzeczytanych co 30 sekund
  useEffect(() => {
    if (isUserAuthenticated) {
      refreshUnreadCount();

      const interval = setInterval(() => {
        refreshUnreadCount();
      }, 30000); // 30 sekund

      return () => clearInterval(interval);
    }
  }, [isUserAuthenticated, refreshUnreadCount]);

  // Pobierz konwersacje przy załadowaniu
  useEffect(() => {
    if (isUserAuthenticated) {
      fetchConversations();
    }
  }, [isUserAuthenticated, fetchConversations]);

  const memoedValue = useMemo(
    () => ({
      conversations,
      unreadCount,
      loading,
      error,
      fetchConversations,
      fetchMessages,
      sendMessage,
      markAsRead,
      startConversation,
      refreshUnreadCount,
    }),
    [
      conversations,
      unreadCount,
      loading,
      error,
      fetchConversations,
      fetchMessages,
      sendMessage,
      markAsRead,
      startConversation,
      refreshUnreadCount,
    ],
  );

  return (
    <ChatContext.Provider value={memoedValue}>{children}</ChatContext.Provider>
  );
}

export default function useChat() {
  return useContext(ChatContext);
}
