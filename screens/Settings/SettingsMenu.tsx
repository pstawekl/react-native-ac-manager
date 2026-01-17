import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerActions, RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@rneui/themed';
import ButtonsHeader from '../../components/ButtonsHeader';
import MenuItem from '../../components/MenuItem';
import PermissionGate from '../../components/PermissionGate';
import PercentageSquareIcon from '../../components/icons/PercentageSquareIcon';
import ProfileUserIcon from '../../components/icons/ProfileUserIcon';
import ReceiptIcon from '../../components/icons/ReceiptIcon';
import TextIcon from '../../components/icons/TextIcon';
import UserIcon from '../../components/icons/UserIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import {
  MainParamList,
  SettingsMenuScreenProps,
  SettingsParamList,
} from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';

function SettingsMenu({ navigation }: SettingsMenuScreenProps) {
  const { user, isUserClient } = useAuth();
  const route = useRoute<RouteProp<SettingsParamList, 'Menu'>>();
  const returnTo = route.params?.returnTo;

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleBackPress = useCallback(() => {
    const drawerNavigation =
      navigation.getParent<DrawerNavigationProp<MainParamList>>();

    if (returnTo && drawerNavigation) {
      drawerNavigation.dispatch(
        DrawerActions.jumpTo(returnTo as keyof MainParamList),
      );
      return;
    }

    // Navigate to main dashboard (Home)
    if (drawerNavigation) {
      drawerNavigation.dispatch(DrawerActions.jumpTo('Home'));
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, returnTo]);

  return (
    <View style={styles.container}>
      <ButtonsHeader title="Ustawienia" onBackPress={handleBackPress} />
      <View style={styles.buttons}>
        {user && (
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.initials}>{getInitials(user.name)}</Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}
        <View style={styles.menuItems}>
          <MenuItem
            title={isUserClient() ? 'Dane osobiste' : 'Dane firmy'}
            onPress={() => navigation.navigate('Data')}
            icon={
              <UserIcon
                viewBox="0 0 100 80"
                stroke={8}
                color={Colors.black}
                size={24}
              />
            }
            isFirst
          />
          <PermissionGate permission={Scopes.staff}>
            <MenuItem
              title="Ekipy i pracownicy"
              onPress={() => navigation.navigate('Staff')}
              icon={
                <ProfileUserIcon color={Colors.black} size={24} stroke={2} />
              }
            />
          </PermissionGate>
          <PermissionGate permission={Scopes.invoices}>
            <MenuItem
              title="Ustawienia faktur"
              onPress={() => navigation.navigate('Invoices')}
              icon={
                <ReceiptIcon
                  color={Colors.black}
                  size={24}
                  stroke={8}
                  viewBox="0 0 100 80"
                />
              }
            />
          </PermissionGate>
          <PermissionGate permission={Scopes.offers}>
            <MenuItem
              title="Ustawienia ofert"
              onPress={() => navigation.navigate('Offers')}
              icon={<PercentageSquareIcon color={Colors.black} size={24} />}
            />
          </PermissionGate>
          <PermissionGate permission={Scopes.discounts}>
            <MenuItem
              title="Narzuty i rabaty"
              onPress={() => navigation.navigate('Discounts')}
              icon={<PercentageSquareIcon color={Colors.black} size={24} />}
            />
          </PermissionGate>
          <PermissionGate permission={Scopes.texts}>
            <MenuItem
              title="Szablony tekstów"
              onPress={() => navigation.navigate('Texts')}
              icon={<TextIcon color={Colors.black} size={24} stroke={2} />}
              isLast
            />
          </PermissionGate>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    backgroundColor: Colors.white,
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  buttons: {
    paddingHorizontal: 18,
    paddingTop: 20,
    backgroundColor: Colors.homeScreenBackground,
    height: '100%',
  },
  menuItems: {
    borderRadius: 10,
  },
  header: {
    width: '100%',
    minHeight: 74,
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    color: Colors.black,
  },
  avatar: {
    height: 56,
    width: 56,
    backgroundColor: Colors.settingsAvatarBackground,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  name: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 18,
    color: Colors.black,
  },
  email: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 14,
    color: Colors.black,
  },
  initials: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 20,
    color: Colors.settingsAvatarText,
  },
});

export default SettingsMenu;
