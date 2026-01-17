import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  getFocusedRouteNameFromRoute,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import FloatingActionButton from '../components/FloatingActionButton';
import QuickActionsMenu from '../components/QuickActionsMenu';
import BellIcon from '../components/icons/BellIcon';
import HamburgerIcon from '../components/icons/HamburgerIcon';
import HomeIcon from '../components/icons/HomeIcon';
import MessageIcon from '../components/icons/MessageIcon';
import Colors from '../consts/Colors';
import useChat from '../providers/ChatProvider';
import useNotifications from '../providers/NotificationsProvider';
import MenuScreen from '../screens/Menu/MenuScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import ChatNavigation from './ChatNavigation';
import MainNavigation from './MainNavigation';
import { BottomTabParamList } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICON_SIZE = 22; // Zmniejszony rozmiar ikon

const renderHomeIcon = ({ color, size }: { color: string; size: number }) => (
  <HomeIcon color={color} size={ICON_SIZE} viewBox="0 0 20 20" stroke={1} />
);

const renderBellIcon = ({ color, size }: { color: string; size: number }) => (
  <BellIcon color={color} size={ICON_SIZE} viewBox="0 0 24 24" stroke={1} />
);

const renderMessageIcon = ({
  color,
  size,
}: {
  color: string;
  size: number;
}) => (
  <MessageIcon color={color} size={ICON_SIZE} viewBox="0 0 24 24" stroke={1} />
);

const renderMenuIcon = ({ color, size }: { color: string; size: number }) => (
  <HamburgerIcon color={color} size={ICON_SIZE} viewBox="0 0 24 24" />
);

// Pusty komponent dla środkowej zakładki z FAB
function FabPlaceholder() {
  return null;
}

function BottomTabNavigation() {
  const { unreadCount: chatUnreadCount } = useChat();
  const { unreadCount: notificationsUnreadCount } = useNotifications();
  const navigation = useNavigation();
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  // Sprawdź aktualny route, aby ukryć FAB gdy nie jesteśmy na ekranie głównym
  const routeName = useNavigationState(state => {
    const route = state?.routes[state?.index];
    return route?.name;
  });

  const isHomeTab = routeName === 'HomeTab';

  // Sprawdź zagnieżdżony route w MainNavigation (czy jesteśmy na HomeScreen)
  const nestedRouteName = useNavigationState(state => {
    if (state?.routes) {
      const homeTabRoute = state.routes.find(r => r.name === 'HomeTab');
      if (homeTabRoute) {
        return getFocusedRouteNameFromRoute(homeTabRoute as any) || 'Home';
      }
    }
    return null;
  });

  // FAB widoczny tylko gdy jesteśmy na HomeTab I na ekranie Home (nie na innych zagnieżdżonych ekranach)
  const isHomeScreen = isHomeTab && nestedRouteName === 'Home';

  return (
    <>
      {/* Półkoliste zejście wokół FAB - SVG overlay - tylko na ekranie głównym */}
      {isHomeScreen && (
        <View style={styles.tabBarBackground} pointerEvents="box-none">
          <Svg
            width={SCREEN_WIDTH}
            height={75}
            viewBox={`0 0 ${SCREEN_WIDTH} 75`}
            style={styles.backgroundSvg}
          >
            <Path
              d={`M 0 75 L 0 0 L ${SCREEN_WIDTH / 2 - 45} 0 Q ${SCREEN_WIDTH / 2
                } 45 ${SCREEN_WIDTH / 2 + 45
                } 0 L ${SCREEN_WIDTH} 0 L ${SCREEN_WIDTH} 95 Z`}
              fill={Colors.white}
              stroke={Colors.grayBorder}
              strokeWidth={1}
            />
          </Svg>
        </View>
      )}

      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.grayText,
          tabBarActiveBackgroundColor: '#4CBF2426',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={MainNavigation}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: renderHomeIcon,
          }}
        />
        <Tab.Screen
          name="NotificationsTab"
          component={NotificationsScreen}
          options={{
            tabBarLabel: 'Powiadomienia',
            tabBarIcon: renderBellIcon,
            tabBarBadge:
              notificationsUnreadCount > 0
                ? notificationsUnreadCount
                : undefined,
          }}
        />
        <Tab.Screen
          name="ChatTab"
          component={ChatNavigation}
          options={{
            tabBarLabel: 'Czat',
            tabBarIcon: renderMessageIcon,
            tabBarBadge: chatUnreadCount > 0 ? chatUnreadCount : undefined,
          }}
        />
        <Tab.Screen
          name="FabTab"
          component={FabPlaceholder}
          options={{
            tabBarLabel: '',
            tabBarButton: () => null,
          }}
        />
        <Tab.Screen
          name="MenuTab"
          component={MenuScreen}
          options={{
            tabBarLabel: 'Menu',
            tabBarIcon: renderMenuIcon,
          }}
        />
      </Tab.Navigator>

      {/* FAB w środku tab bar - tylko na ekranie głównym */}
      {isHomeScreen && (
        <View style={styles.fabContainer} pointerEvents="box-none">
          <View style={styles.fabWrapper}>
            <FloatingActionButton
              onPress={() => setQuickActionsVisible(true)}
              backgroundColor={Colors.green}
              right={0}
              bottom={0}
              size={60}
            />
          </View>
        </View>
      )}

      {/* Quick Actions Menu */}
      <QuickActionsMenu
        visible={quickActionsVisible}
        onClose={() => setQuickActionsVisible(false)}
        navigation={navigation as any}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 75,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingHorizontal: 10,
    position: 'relative',
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 10,
  },
  tabBarItem: {
    borderRadius: 57,
    marginHorizontal: 4,
    marginVertical: 4,
    paddingVertical: 2,
    height: 52,
  },
  tabBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    zIndex: 0,
    pointerEvents: 'none',
  },
  backgroundSvg: {
    position: 'absolute',
    bottom: 0,
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 25,
    alignItems: 'center',
    justifyContent: 'center',
    height: 75,
    pointerEvents: 'box-none',
    zIndex: 2,
  },
  fabWrapper: {
    position: 'absolute',
    left: '50%',
    marginLeft: -30,
    bottom: 37.5,
    width: 60,
    height: 60,
  },
});

export default BottomTabNavigation;
