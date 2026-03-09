// eslint-disable @typescript-eslint/ban-types
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Colors from '../../consts/Colors';
import { MainParamList } from '../../navigation/types';

type CategoryProps = {
  screen: keyof MainParamList;
  title: string;
  iconBackgroundColor: string;
  iconColor: string;
  icon?: (props: { color: string; size: number }) => JSX.Element;
  image?: JSX.Element;
};

function Category({
  screen,
  title,
  iconBackgroundColor,
  iconColor,
  icon,
  image,
  params,
}: CategoryProps & { params?: any }) {
  const navigation = useNavigation<DrawerNavigationProp<MainParamList>>();
  let IconComponent;

  if (icon) {
    IconComponent = icon;
    IconComponent = <IconComponent color={iconColor} size={20} />;
  } else {
    IconComponent = image;
  }

  const handlePress = () => {
    if (screen === 'Home') {
      // Jeśli już jesteśmy na Home, nie rób nic
      return;
    }

    // Resetuj nawigację modułu do początkowego ekranu
    // Dla modułów z nested navigatorami (Clients, Invoices, Tasks, etc.)
    if (screen === 'Clients') {
      // Użyj reset z odpowiednią strukturą dla nested navigatora
      // Pobierz aktualny stan Drawer Navigatora
      const state = navigation.getState();
      const routes = state?.routes || [];

      // Znajdź indeks modułu Clients
      let clientsIndex = routes.findIndex(r => r.name === 'Clients');

      // Jeśli Clients nie istnieje w routes, dodaj go
      if (clientsIndex === -1) {
        clientsIndex = routes.length;
      }

      // Zbuduj nowe routes z zresetowanym stanem Clients
      const newRoutes = routes.map((route, index) => {
        if (route.name === 'Clients') {
          return {
            ...route,
            state: {
              index: 0,
              routes: [{ name: 'List' }],
            },
          };
        }
        return route;
      });

      // Jeśli Clients nie był w routes, dodaj go
      if (clientsIndex >= routes.length) {
        newRoutes.push({
          name: 'Clients',
          key: `Clients-${Date.now()}`,
          params: undefined,
          state: {
            index: 0,
            routes: [{ name: 'List' }],
          },
        });
      }

      navigation.dispatch(
        CommonActions.reset({
          index: clientsIndex,
          routes: newRoutes,
        }),
      );
      return;
    }

    if (screen === 'Invoices' && params?.screen === 'List') {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Invoices',
          params: { screen: 'List' },
          state: {
            routes: [{ name: 'List' as const }],
            index: 0,
          },
        }),
      );
      return;
    }

    if (screen === 'Tasks') {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Tasks',
          params: params || { screen: 'Menu', params: { tab: 'tasks' } },
          state: {
            routes: [{ name: 'Menu' as const, params: { tab: 'tasks' } }],
            index: 0,
          },
        }),
      );
      return;
    }

    if (screen === 'Calendar') {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Calendar',
          params: params || { screen: 'Menu', params: { tab: 'calendar' } },
          state: {
            routes: [{ name: 'Menu' as const, params: { tab: 'calendar' } }],
            index: 0,
          },
        }),
      );
      return;
    }

    if (screen === 'Catalogs') {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Catalogs',
          params: params || { screen: 'Menu', params: { tab: 'Katalogi' } },
          state: {
            routes: [{ name: 'Menu' as const, params: { tab: 'Katalogi' } }],
            index: 0,
          },
        }),
      );
      return;
    }

    // Dla modułów bez nested navigatora (Map, Offers, etc.) - resetuj przez navigate
    // Map nie ma nested navigatora, więc po prostu navigate
    if (screen === 'Map') {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Map',
          params: undefined,
        }),
      );
      return;
    }

    // Dla pozostałych modułów - użyj standardowej nawigacji z resetowaniem
    navigation.dispatch(
      CommonActions.navigate({
        name: screen,
        params,
      }),
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}
      >
        {IconComponent}
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '31%',
    height: 91,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 35,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    color: Colors.text,
    fontFamily: 'Archivo_400Regular',
    textAlign: 'center',
  },
});

export default Category;
