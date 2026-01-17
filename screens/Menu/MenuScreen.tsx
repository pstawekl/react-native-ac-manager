import { Text } from '@rneui/themed';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import Separator from '../../components/Separator';
import ArchiveTickIcon from '../../components/icons/ArchiveTickIcon';
import Book2Icon from '../../components/icons/Book2Icon';
import CalendarIcon from '../../components/icons/CalendarIcon';
import FolderOpenIcon from '../../components/icons/FolderOpenIcon';
import HomeIcon from '../../components/icons/HomeIcon';
import ImageIcon from '../../components/icons/ImageIcon';
import LogoutIcon from '../../components/icons/LogoutIcon';
import MapIcon from '../../components/icons/MapIcon';
import MessageIcon from '../../components/icons/MessageIcon';
import ReceiptIcon from '../../components/icons/ReceiptIcon';
import SettingsIcon from '../../components/icons/SettingsIcon';
import TaskListIcon from '../../components/icons/TaskListIcon';
import UserIcon from '../../components/icons/UserIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import { MainParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import usePermission from '../../providers/PermissionProvider';

type MenuItem = {
  label: string;
  icon: React.ComponentType<any>;
  navigateTo: keyof MainParamList;
  params?: any;
  iconProps?: {
    viewBox?: string;
    stroke?: number;
    size?: number;
  };
};

function MenuScreen() {
  const { user, logout } = useAuth();
  const { hasAccess } = usePermission();
  const navigation = useNavigation<DrawerNavigationProp<MainParamList>>();
  const insets = useSafeAreaInsets();

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

  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        label: 'Home',
        icon: HomeIcon,
        navigateTo: 'Home',
        iconProps: { viewBox: '0 0 20 20', stroke: 2 },
      },
    ];

    if (permissions.clients) {
      items.push({
        label: 'Klienci',
        icon: UserIcon,
        navigateTo: 'Clients',
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
    }

    if (permissions.map) {
      items.push({
        label: 'Mapa',
        icon: MapIcon,
        navigateTo: 'Map',
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
    }

    if (permissions.tasks) {
      items.push({
        label: 'Lista zadań',
        icon: TaskListIcon,
        navigateTo: 'Tasks',
        params: { Menu: { tab: 'tasks' } },
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
      items.push({
        label: 'Kalendarz',
        icon: CalendarIcon,
        navigateTo: 'Calendar',
        params: { Menu: { tab: 'calendar' } },
        iconProps: { viewBox: '0 0 24 24', stroke: 1 },
      });
    }

    if (permissions.invoices) {
      items.push({
        label: 'Faktury',
        icon: ReceiptIcon,
        navigateTo: 'Invoices',
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
    }

    if (permissions.offers) {
      items.push({
        label: 'Oferty',
        icon: FolderOpenIcon,
        navigateTo: 'Offers',
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
    }

    if (permissions.catalogs) {
      items.push({
        label: 'Katalogi',
        icon: Book2Icon,
        navigateTo: 'Catalogs',
        params: { Menu: { tab: 'catalogs' } },
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
      items.push({
        label: 'Cenniki',
        icon: Book2Icon,
        navigateTo: 'Prices',
        params: { Menu: { tab: 'prices' } },
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
    }

    if (permissions.viewTrainings) {
      items.push({
        label: 'Certyfikaty',
        icon: ArchiveTickIcon,
        navigateTo: 'Certs',
        iconProps: { viewBox: '0 0 100 80', stroke: 10 },
      });
    }

    if (permissions.gallery) {
      items.push({
        label: 'Galeria',
        icon: ImageIcon,
        navigateTo: 'GalleryStack',
        iconProps: { viewBox: '0 0 22 22', stroke: 1 },
      });
    }

    items.push({
      label: 'Wiadomości',
      icon: MessageIcon,
      navigateTo: 'Chat',
      iconProps: { viewBox: '0 0 24 24', stroke: 2 },
    });

    items.push({
      label: 'Ustawienia',
      icon: SettingsIcon,
      navigateTo: 'Settings',
      iconProps: { viewBox: '0 0 24 24', stroke: 3 },
    });

    return items;
  }, [permissions]);

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.params) {
      navigation.navigate(item.navigateTo, item.params as any);
    } else {
      navigation.navigate(item.navigateTo);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* <LinearGradient
        colors={['#36B130', '#6EDE2F']}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.circles}>
          <Circles color={Colors.white} viewBox="0 0 686 686" size={900} />
        </View>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Avatar
              size={56}
              rounded
              source={user.avatar ? { uri: user.avatar } : {}}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </LinearGradient> */}

      <ScrollView style={styles.menuContainer}>
        <View style={styles.menuContent}>
          {/* <Separator /> */}
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemIcon}>
                  <item.icon
                    color={Colors.black}
                    size={item.iconProps?.size || 20}
                    viewBox={item.iconProps?.viewBox}
                    stroke={item.iconProps?.stroke}
                  />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
              {/* {index === 0 && <Separator />} */}
            </React.Fragment>
          ))}

          <Separator style={styles.logoutSeparator} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={logout}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemIcon}>
              <LogoutIcon
                color={Colors.logout}
                size={20}
                viewBox="0 0 100 80"
                stroke={10}
              />
            </View>
            <Text style={[styles.menuItemLabel, styles.logoutLabel]}>
              Wyloguj się
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    width: '100%',
    minHeight: 140,
    paddingBottom: 20,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  circles: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1,
    elevation: -1,
    overflow: 'visible',
    opacity: 0.45,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    height: 56,
    width: 56,
    backgroundColor: Colors.white,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: Colors.white,
  },
  email: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 14,
    color: Colors.white,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  menuContent: {
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
  },
  menuItemIcon: {
    width: 32,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemLabel: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 16,
    color: Colors.black,
  },
  logoutSeparator: {
    marginVertical: 20,
  },
  logoutLabel: {
    color: Colors.logout,
  },
});

export default MenuScreen;
