/* eslint-disable no-console */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import useApi from '../hooks/useApi';
import useAuth from './AuthProvider';

export type NotificationType =
  | 'montaz_confirmed'
  | 'montaz_rejected'
  | 'montaz_proposed'
  | 'offer_new'
  | 'offer_accepted'
  | 'task_new'
  | 'task_status_changed'
  | 'invoice_new'
  | 'chat_message';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_object_type?: string;
  related_object_id?: number;
  data?: any;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  getNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  expoPushToken: string | null;
}

const NotificationsContext = createContext<NotificationsContextType>(
  {} as NotificationsContextType,
);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const { execute: fetchNotifications } = useApi<{
    notifications: Notification[];
    unread_count: number;
  }>({
    path: 'notifications',
  });

  // Wyłącz autoLogout dla register_push_token - błędy push tokena nie powinny wylogowywać użytkownika
  const { execute: registerToken } = useApi({ 
    path: 'register_push_token',
    autoLogout: false, // Błędy push tokena nie powinny wylogowywać użytkownika
  });
  const { execute: markReadApi } = useApi({ path: 'notification_mark_read' });
  const { execute: deleteApi } = useApi({ path: 'notification_delete' });
  const { execute: markAllReadApi } = useApi({
    path: 'notifications_mark_all_read',
  });

  // Rejestracja device ID (dla identyfikacji urządzenia w backend)
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      console.log('Push notifications work only on physical devices');
      return;
    }

    try {
      // W development build używamy device ID jako identyfikatora
      // Backend może używać tego do wysyłania powiadomień przez Expo Push API
      // jeśli prawdziwy Expo Push Token jest dostępny z innego źródła
      const deviceId = `${Device.modelName || 'Unknown'}_${Platform.OS}_${Date.now()}`;
      
      // Zarejestruj device ID w backend
      await registerToken({
        data: {
          token: deviceId, // Placeholder - w produkcji użyj prawdziwego push token
          device_name: `${Device.modelName || 'Unknown'} (${Platform.OS})`,
        },
      });
      
      setExpoPushToken(deviceId);
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }, [registerToken]);

  // Pobierz powiadomienia
  const getNotifications = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetchNotifications({});
      if (response) {
        setNotifications(
          Array.isArray(response.notifications) ? response.notifications : [],
        );
        setUnreadCount(
          typeof response.unread_count === 'number' ? response.unread_count : 0,
        );
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [token, fetchNotifications]);

  // Oznacz jako przeczytane
  const markAsRead = useCallback(
    async (notificationId: number) => {
      await markReadApi({ data: { notification_id: notificationId } });
      await getNotifications();
    },
    [markReadApi, getNotifications],
  );

  // Oznacz wszystkie jako przeczytane
  const markAllAsRead = useCallback(async () => {
    await markAllReadApi({});
    await getNotifications();
  }, [markAllReadApi, getNotifications]);

  // Usuń powiadomienie
  const deleteNotification = useCallback(
    async (notificationId: number) => {
      await deleteApi({ data: { notification_id: notificationId } });
      await getNotifications();
    },
    [deleteApi, getNotifications],
  );

  // Efekt inicjalizacyjny - rejestracja i pobieranie powiadomień
  useEffect(() => {
    if (user && token) {
      registerForPushNotifications();
      getNotifications();

      // Odśwież powiadomienia co 30 sekund gdy aplikacja jest aktywna
      const interval = setInterval(() => {
        getNotifications();
      }, 30000); // 30 sekund

      return () => {
        clearInterval(interval);
      };
    }
  }, [user, token, registerForPushNotifications, getNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    expoPushToken,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export default function useNotifications() {
  return useContext(NotificationsContext);
}
