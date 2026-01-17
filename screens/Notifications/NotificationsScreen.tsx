/* eslint-disable no-console */
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlatList, Swipeable } from 'react-native-gesture-handler';
import { SubmitButton } from '../../components/Button';
import TrashIcon from '../../components/icons/TrashIcon';
import Colors from '../../consts/Colors';
import { MainParamList } from '../../navigation/types';
import useNotifications, {
  Notification,
} from '../../providers/NotificationsProvider';

function RowRightContent({ onDeletePress }: { onDeletePress: () => void }) {
  const translateX = useRef(new Animated.Value(150)).current;

  const animate = useCallback(
    (toValue: number) => {
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    },
    [translateX],
  );

  useEffect(() => {
    animate(0);
  }, [animate]);

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        styles.notificationDelete,
        { transform: [{ translateX }] },
      ]}
    >
      <TouchableOpacity
        style={styles.swipeDeleteButton}
        onPress={onDeletePress}
        activeOpacity={0.7}
      >
        <TrashIcon color={Colors.white} size={20} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const NotificationRow = memo(
  ({
    notification,
    onDeletePress,
    onCloseAllSwipes,
    registerSwipeRef,
    onNotificationPress,
  }: {
    notification: Notification;
    onDeletePress: (id: number) => void;
    onCloseAllSwipes: () => void;
    registerSwipeRef: (id: number, ref: any) => void;
    onNotificationPress: (notification: Notification) => void;
  }) => {
    const swipeRefCallback = useCallback(
      (ref: any) => {
        if (ref) {
          registerSwipeRef(notification.id, ref);
        }
      },
      [notification.id, registerSwipeRef],
    );

    const renderRightActions = () => {
      return <RowRightContent onDeletePress={handleRightAction} />;
    };

    const handleRightAction = () => {
      onDeletePress(notification.id);
    };

    const handlePress = () => {
      onNotificationPress(notification);
    };

    return (
      <View style={styles.swipeableContainer}>
        <Swipeable
          ref={swipeRefCallback}
          renderRightActions={renderRightActions}
          friction={2}
          rightThreshold={10}
          onSwipeableOpen={direction => {
            if (direction === 'right') {
              handleRightAction();
            }
            onCloseAllSwipes();
          }}
        >
          <TouchableOpacity
            style={[
              styles.notificationCard,
              !notification.is_read && styles.unreadCard,
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text
                  style={[
                    styles.title,
                    !notification.is_read && styles.unreadTitle,
                  ]}
                >
                  {notification.title}
                </Text>
                <Text style={styles.time}>
                  {format(new Date(notification.created_at), 'dd MMM, HH:mm', {
                    locale: pl,
                  })}
                </Text>
              </View>
              <Text style={styles.message} numberOfLines={2}>
                {notification.message}
              </Text>
              {!notification.is_read && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    );
  },
);

function NotificationsScreen() {
  const navigation = useNavigation<DrawerNavigationProp<MainParamList>>();
  const {
    notifications,
    unreadCount,
    loading,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<{ [key: number]: Swipeable | null }>({});

  // Funkcja do zamykania wszystkich swipe elementów
  const closeAllSwipes = useCallback(() => {
    Object.values(swipeableRefs.current).forEach(ref => {
      if (ref) {
        ref.close();
      }
    });
  }, []);

  // Odśwież przy wejściu na ekran
  useFocusEffect(
    useCallback(() => {
      getNotifications();
    }, [getNotifications]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getNotifications();
    setRefreshing(false);
  }, [getNotifications]);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      // Zamknij wszystkie otwarte swipe actions
      closeAllSwipes();

      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Nawigacja do odpowiedniego ekranu na podstawie related_object_type
      try {
        switch (notification.related_object_type) {
          case 'oferta':
            if (notification.related_object_id) {
              navigation.navigate('Offers', {
                screen: 'Overview',
                params: {
                  offerId: notification.related_object_id,
                  mode: 'view',
                  type: 'split',
                  installationId: null,
                  devices: [],
                  surcharges: [],
                },
              } as any);
            }
            break;
          case 'zadanie':
            if (notification.related_object_id) {
              navigation.navigate('Tasks', {
                screen: 'TaskDetails',
                params: {
                  task: { id: notification.related_object_id },
                },
              } as any);
            }
            break;
          case 'faktura':
            navigation.navigate('Invoices');
            break;
          case 'chat':
            navigation.navigate('Chat' as any);
            break;
          default:
            console.log(
              'Unknown notification type:',
              notification.related_object_type,
            );
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    },
    [markAsRead, navigation, closeAllSwipes],
  );

  const handleDelete = useCallback(
    (notificationId: number) => {
      Alert.alert(
        'Usuń powiadomienie',
        'Czy na pewno chcesz usunąć to powiadomienie?',
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Usuń',
            onPress: () => deleteNotification(notificationId),
            style: 'destructive',
          },
        ],
      );
    },
    [deleteNotification],
  );

  // Funkcja do rejestrowania referencji swipe elementów
  const registerSwipeRef = useCallback((id: number, ref: any) => {
    if (ref) {
      swipeableRefs.current[id] = ref;
    }
  }, []);

  const renderNotification = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: Notification }) => {
      return (
        <NotificationRow
          notification={item}
          onDeletePress={handleDelete}
          onCloseAllSwipes={closeAllSwipes}
          registerSwipeRef={registerSwipeRef}
          onNotificationPress={handleNotificationPress}
        />
      );
    },
    [handleNotificationPress, handleDelete, closeAllSwipes, registerSwipeRef],
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Powiadomienia</Text>
        {unreadCount > 0 && (
          <SubmitButton
            title={`Oznacz wszystkie jako przeczytane (${unreadCount})`}
            onPress={markAllAsRead}
            style={styles.markAllButton}
          />
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak powiadomień</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  swipeableContainer: {
    width: '100%',
    marginBottom: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.black,
  },
  markAllButton: {
    backgroundColor: Colors.primary,
    height: 36,
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: Colors.greenWithOpacity,
    borderColor: Colors.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  time: {
    fontSize: 12,
    color: Colors.grayerText,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.grayerText,
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  notificationDelete: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: Colors.red,
  },
  swipeDeleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.grayerText,
  },
});

export default NotificationsScreen;
