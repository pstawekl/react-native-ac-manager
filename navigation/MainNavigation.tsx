/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-unused-styles */
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerNavigationOptions } from '@react-navigation/drawer/src/types';
import type { HeaderTitleProps } from '@react-navigation/elements';
import {
  DrawerActions,
  getFocusedRouteNameFromRoute,
  useNavigation,
} from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/Home/HomeScreen';
import MapScreen from '../screens/Map/MapScreen';

import CustomDrawerContent from './components/CustomDrawerContent';
import HeaderBackground from './components/HeaderBackground';

import CalendarIcon from '../components/icons/CalendarIcon';
import ImageIcon from '../components/icons/ImageIcon';
import MessageIcon from '../components/icons/MessageIcon';
import SettingsIcon from '../components/icons/SettingsIcon';
import UserIcon from '../components/icons/UserIcon';

import Colors from '../consts/Colors';
import Styles from '../consts/Styles';
import { MainParamList } from './types';

import { IconButton } from '../components/Button';
import NotificationBadge from '../components/NotificationBadge';
import ArchiveTickIcon from '../components/icons/ArchiveTickIcon';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import Book2Icon from '../components/icons/Book2Icon';
import FolderOpenIcon from '../components/icons/FolderOpenIcon';
import HamburgerIcon from '../components/icons/HamburgerIcon';
import HomeIcon from '../components/icons/HomeIcon';
import MapIcon from '../components/icons/MapIcon';
import ReceiptIcon from '../components/icons/ReceiptIcon';
import TaskListIcon from '../components/icons/TaskListIcon';
import { Scopes } from '../consts/Permissions';
import useChat from '../providers/ChatProvider';
import usePermission from '../providers/PermissionProvider';
import CatalogsNavigation from './CatalogsNavigation';
import CertificationsNavigation from './CertificationsNavigation';
import ChatNavigation from './ChatNavigation';
import ClientsNavigation from './ClientsNavigation';
import GalleryNavigation from './GalleryNavigation';
import InvoicesNavigation from './InvoicesNavigation';
import OffersNavigation from './OffersNavigation';
import SettingsNavigation from './SettingsNavigation';
import TasksNavigation from './TasksNavigation';
import HomeButton from './components/HomeButton';

const Main = createDrawerNavigator<MainParamList>();

function homeRedirect() {
  return <HomeButton />;
}

function HeaderTitle({ style }: HeaderTitleProps) {
  return <View style={styles.headerTitle} />;
}

function HeaderLeft() {
  const navigation = useNavigation();

  return (
    <IconButton
      withoutBackground
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      icon={<HamburgerIcon color={Colors.white} />}
      style={{
        marginLeft: 0,
        width: 'auto',
        padding: 0,
        backgroundColor: Colors.transparent,
      }}
    />
  );
}

function HeaderLeftWithBack() {
  const navigation = useNavigation();

  return (
    <IconButton
      withoutBackground
      onPress={() => navigation.dispatch(DrawerActions.closeDrawer())}
      icon={<ArrowLeftIcon color={Colors.white} />}
    />
  );
}

function HeaderRightNotifications() {
  const navigation = useNavigation<DrawerNavigationProp<MainParamList>>();
  const { unreadCount } = useChat();

  return (
    <View style={{ position: 'relative' }}>
      <IconButton
        withoutBackground
        onPress={() =>
          navigation.navigate('Chat', { screen: 'ConversationsList' })
        }
        icon={<MessageIcon color={Colors.white} size={24} />}
        style={{
          marginRight: 0,
          padding: 0,
          backgroundColor: Colors.transparent,
          width: 40,
        }}
      />
      {unreadCount > 0 && (
        <NotificationBadge count={unreadCount} size="small" />
      )}
    </View>
  );
}

function HeaderRightNotificationsOnly() {
  return <HeaderRightNotifications />;
}

function HeaderRightSettings({ origin }: { origin: keyof MainParamList }) {
  const navigation = useNavigation<DrawerNavigationProp<MainParamList>>();

  return (
    <IconButton
      withoutBackground
      onPress={() =>
        navigation.navigate('Settings', {
          screen: 'Menu',
          params: { returnTo: origin },
        })
      }
      icon={<SettingsIcon color={Colors.white} />}
      style={{
        marginRight: 0,
        padding: 0,
        backgroundColor: Colors.transparent,
        width: 40,
      }}
    />
  );
}

function HeaderRightWithNotifications({
  origin,
}: {
  origin: keyof MainParamList;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <HeaderRightNotifications />
      <HeaderRightSettings origin={origin} />
    </View>
  );
}

// In case anyone would like to add the back arrow at navbar (it only goes back to the main screen)
// function SubpageHeaderTitle({
//   title,
//   style,
// }: HeaderTitleProps & { title: string }) {
//   const navigation = useNavigation();

//   return (
//     <View style={{ width: 200, position: 'relative' }}>
//       <Animated.Text style={[style, { width: 200 }]}>{title}</Animated.Text>
//       <View style={styles.subpageHeaderBackArrow}>
//         <IconButton
//           withoutBackground
//           onPress={() => navigation.goBack()}
//           icon={<ArrowLeftIcon color={Colors.white} />}
//         />
//       </View>
//     </View>
//   );
// }

function MainNavigation() {
  const insets = useSafeAreaInsets();
  const { hasAccess } = usePermission();

  const routeOptions: DrawerNavigationOptions = {
    drawerActiveTintColor: Colors.primary,
    drawerActiveBackgroundColor: 'transparent',
    drawerInactiveBackgroundColor: 'transparent',
  };

  const HomeHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#36B130', '#6EDE2F']}
        circleColor="#59F36A"
      />
    ),
    [],
  );

  const ClientsHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#4CBE24', '#E5FF45']}
        circleColor="#A2EF07"
      />
    ),
    [],
  );

  const MapHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#EABA10', '#FFE500']}
        circleColor="#FFE500"
      />
    ),
    [],
  );

  const TasksHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#FF0C01', '#FFBB01']}
        circleColor="#FE8101"
      />
    ),
    [],
  );

  const InvoicesHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#07CE07', '#62E860']}
        circleColor="#4FE24D"
      />
    ),
    [],
  );

  const OffersHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#0A8686', '#38BEBF']}
        circleColor="#38BEBF"
      />
    ),
    [],
  );

  const CatalogsHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#7B17B1', '#B179D1']}
        circleColor="#7C18B2"
      />
    ),
    [],
  );

  const CertificationsHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#CF0C79', '#DE57A2']}
        circleColor="#D00D7A"
      />
    ),
    [],
  );

  const GalleryHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#1345AE', '#2B83D2']}
        circleColor="#1446AF"
      />
    ),
    [],
  );

  const SettingsHeaderBackground = useCallback(
    () => (
      <HeaderBackground
        gradient={['#36B130', '#6EDE2F']}
        circleColor="#A2EF07"
      />
    ),
    [],
  );

  const permissions = useMemo(
    () => ({
      clients: hasAccess(Scopes.clients),
      map: hasAccess(Scopes.map),
      tasks: hasAccess(Scopes.viewTasks),
      invoices: hasAccess(Scopes.viewInvoices),
      offers: hasAccess(Scopes.viewOffers),
      catalogs: hasAccess(Scopes.viewCatalogs),
      viewTrainings: hasAccess(Scopes.viewTrainings),
      gallery: hasAccess(Scopes.gallery),
    }),
    [hasAccess],
  );

  return (
    <Main.Navigator
      initialRouteName="Home"
      screenOptions={{
        ...routeOptions,
        drawerType: 'front',
        headerStyle: {
          height: insets.top + Styles.headerHeight,
        },
        headerTitleStyle: Styles.headerTitleStyle,
        headerTintColor: Styles.headerTintColor,
        headerLeftContainerStyle: Styles.headerLeftContainerStyle,
        headerRightContainerStyle: Styles.headerRightContainerStyle,
        drawerStyle: {
          width: '100%',
        },
        swipeEdgeWidth: 50,
        headerLeft: HeaderLeftWithBack,
      }}
      drawerContent={CustomDrawerContent}
    >
      <Main.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerLabel: 'Home',
          headerTitle: HeaderTitle,
          drawerIcon: HomeIcon,
          headerBackground: HomeHeaderBackground,
          headerLeft: HeaderLeft,
          headerRight: HeaderRightNotificationsOnly,
          headerShown: false,
        }}
        navigationKey="Home"
      />
      {permissions.clients && (
        <Main.Screen
          name="Clients"
          component={ClientsNavigation}
          options={{
            headerShown: false,
            headerTitle: 'Klienci',
            drawerLabel: 'Klienci',
            drawerIcon: () => (
              <UserIcon
                color={Colors.black}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerBackground: HomeHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: () => (
              <HeaderRightWithNotifications origin="Clients" />
            ),
          }}
        />
      )}
      {permissions.map && (
        <Main.Screen
          name="Map"
          component={MapScreen}
          options={{
            headerTitle: 'Mapa',
            drawerLabel: 'Mapa',
            drawerIcon: () => (
              <MapIcon
                color={Colors.black}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerShown: false,
            // headerBackground: MapHeaderBackground,
            // headerLeft: HeaderLeft,
            // headerStyle: {
            //   height: insets.top + Styles.headerWithSubNavigationHeight,
            // },
            // headerRight: () => <HeaderRightWithNotifications origin="Map" />,
          }}
        />
      )}
      {permissions.tasks && (
        <Main.Screen
          name="Tasks"
          component={TasksNavigation}
          initialParams={{
            Menu: {
              tab: 'tasks',
            },
          }}
          options={{
            headerTitle: 'Lista zadań',
            drawerLabel: 'Lista zadań',
            drawerIcon: () => (
              <TaskListIcon
                color={Colors.black}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerBackground: TasksHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: () => <HeaderRightWithNotifications origin="Tasks" />,
            headerShown: false,
          }}
        />
      )}
      {permissions.tasks && (
        <Main.Screen
          name="Calendar"
          component={TasksNavigation}
          initialParams={{
            Menu: {
              tab: 'calendar',
            },
          }}
          options={{
            headerTitle: 'Kalendarz',
            drawerLabel: 'Kalendarz',
            drawerIcon: () => (
              <CalendarIcon
                color={Colors.black}
                size={20}
                viewBox="0 0 24 24"
                stroke={1}
              />
            ),
            headerBackground: TasksHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: () => (
              <HeaderRightWithNotifications origin="Calendar" />
            ),
            headerShown: false,
          }}
        />
      )}
      {permissions.invoices && (
        <Main.Screen
          name="Invoices"
          component={InvoicesNavigation}
          options={{
            headerTitle: 'Faktury',
            drawerLabel: 'Faktury',
            drawerIcon: () => (
              <ReceiptIcon
                color={Colors.black}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerBackground: HomeHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: () => (
              <HeaderRightWithNotifications origin="Invoices" />
            ),
            headerShown: false,
          }}
        />
      )}
      {permissions.offers && (
        <Main.Screen
          name="Offers"
          component={OffersNavigation}
          options={{
            headerTitle: 'Oferty',
            drawerLabel: 'Oferty',
            headerShown: false,
            drawerIcon: () => (
              <FolderOpenIcon
                color={Colors.black}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerBackground: OffersHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: () => <HeaderRightWithNotifications origin="Offers" />,
          }}
        />
      )}
      {permissions.catalogs && (
        <Main.Screen
          name="Catalogs"
          component={CatalogsNavigation}
          initialParams={{
            Menu: {
              tab: 'catalogs',
            },
          }}
          options={{
            headerTitle: 'Katalogi',
            drawerLabel: 'Katalogi',
            drawerIcon: () => (
              <Book2Icon
                color={Colors.black}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerBackground: CatalogsHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: () => (
              <HeaderRightWithNotifications origin="Catalogs" />
            ),
            headerShown: false,
          }}
        />
      )}
      {permissions.catalogs && (
        <Main.Screen
          name="Prices"
          component={CatalogsNavigation}
          initialParams={{
            Menu: {
              tab: 'prices',
            },
          }}
          options={{
            headerTitle: 'Cenniki',
            drawerLabel: 'Cenniki',
            drawerIcon: () => (
              <Book2Icon
                color={Colors.black}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerBackground: CatalogsHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: HeaderRightNotificationsOnly,
            headerShown: false,
          }}
        />
      )}
      {permissions.viewTrainings && (
        <Main.Screen
          name="Certs"
          component={CertificationsNavigation}
          options={{
            headerTitle: 'Certyfikaty',
            drawerLabel: 'Certyfikaty',
            drawerIcon: () => (
              <ArchiveTickIcon
                color={Colors.black}
                size={24}
                viewBox="0 0 100 80"
                stroke={10}
              />
            ),
            headerBackground: CertificationsHeaderBackground,
            headerStyle: {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            },
            headerLeft: HeaderLeft,
            headerRight: HeaderRightNotifications,
            headerShown: false,
          }}
        />
      )}
      {permissions.gallery && (
        <Main.Screen
          name="GalleryStack"
          component={GalleryNavigation}
          options={({ route }) => {
            const childRoute = getFocusedRouteNameFromRoute(route) ?? 'Gallery';

            // Ustaw tytuł na podstawie aktualnego ekranu
            let headerTitle = 'Galeria';
            if (childRoute === 'Edit') {
              headerTitle = 'Edycja';
            } else if (childRoute === 'AddPhoto') {
              headerTitle = 'Dodaj zdjęcie';
            }

            return {
              headerShown: false,
              headerTitle,
              drawerLabel: 'Galeria',
              drawerIcon: () => (
                <ImageIcon
                  color={Colors.black}
                  size={20}
                  viewBox="0 0 22 22"
                  stroke={1}
                />
              ),
              headerStyle: {
                height: insets.top + Styles.headerWithSubNavigationHeight,
              },
              headerLeft: HeaderLeft,
              headerTitleStyle: Styles.headerTitleStyle,
              headerBackground: GalleryHeaderBackground,
              headerRight: HeaderRightNotificationsOnly,
            };
          }}
        />
      )}
      <Main.Screen
        name="Chat"
        component={ChatNavigation}
        options={{
          headerTitle: 'Wiadomości',
          drawerLabel: 'Wiadomości',
          drawerIcon: () => (
            <MessageIcon
              color={Colors.black}
              size={20}
              viewBox="0 0 24 24"
              stroke={2}
            />
          ),
          headerBackground: HomeHeaderBackground,
          headerStyle: {
            height: insets.top + Styles.headerWithSubNavigationHeight,
          },
          headerLeft: HeaderLeft,
          headerRight: () => <HeaderRightSettings origin="Chat" />,
          headerShown: false,
        }}
      />
      <Main.Screen
        name="Settings"
        component={SettingsNavigation}
        options={{
          headerTitle: 'Ustawienia',
          drawerLabel: 'Ustawienia',
          drawerIcon: () => (
            <SettingsIcon
              color={Colors.black}
              size={20}
              viewBox="0 0 24 24"
              stroke={3}
            />
          ),
          headerStyle:
            (styles.headerStyle,
            {
              height: insets.top + Styles.headerWithSubNavigationHeight,
            }),
          headerLeft: HeaderLeft,
          headerBackground: SettingsHeaderBackground,
          headerRight: HeaderRightNotificationsOnly,
          headerShown: false,
        }}
      />
    </Main.Navigator>
  );
}

export default MainNavigation;

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerImage: { width: 30, height: 30 },
  headerText: { marginLeft: 10, marginTop: 2 },
  headerStyle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // subpageHeaderBackArrow: { position: 'absolute', left: -63, top: 20 },
});
