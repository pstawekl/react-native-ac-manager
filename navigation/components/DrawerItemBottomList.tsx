import {
  CommonActions,
  DrawerActions,
  DrawerNavigationState,
  ParamListBase,
  useLinkBuilder,
} from '@react-navigation/native';
import * as React from 'react';

import {
  DrawerDescriptorMap,
  DrawerNavigationHelpers,
} from '@react-navigation/drawer/lib/typescript/src/types';
import { DrawerNavigationOptions } from '@react-navigation/drawer/src/types';
import { StyleSheet, View } from 'react-native';
import LogoutIcon from '../../components/icons/LogoutIcon';
import Colors from '../../consts/Colors';
import useAuth from '../../providers/AuthProvider';
import DrawerItem from './DrawerItem';

type Props = {
  state: DrawerNavigationState<ParamListBase>;
  descriptors: DrawerDescriptorMap;
  navigation: DrawerNavigationHelpers;
  focusedOptions: DrawerNavigationOptions;
  focusedRouteKey: string | undefined;
};

function DrawerItemTopList({
  state,
  descriptors,
  navigation,
  focusedOptions,
  focusedRouteKey,
}: Props) {
  const buildLink = useLinkBuilder();
  const { logout } = useAuth();

  const {
    drawerActiveTintColor,
    drawerActiveBackgroundColor,
    drawerInactiveBackgroundColor,
  } = focusedOptions;

  const drawerLogoutColor = Colors.logout;

  return (
    <View style={styles.container}>
      {
        state.routes.map(route => {
          const focused = route.key === focusedRouteKey;

          const onPress = () => {
            const event = navigation.emit({
              type: 'drawerItemPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              navigation.dispatch({
                ...(focused
                  ? DrawerActions.closeDrawer()
                  : CommonActions.navigate({ name: route.name, merge: true })),
                target: state.key,
              });
            }
          };

          const { title, drawerLabel, drawerIcon, drawerAllowFontScaling } =
            descriptors[route.key].options;

          let label;

          if (drawerLabel !== undefined) {
            label = drawerLabel;
          } else {
            label = title !== undefined ? title : route.name;
          }

          return (
            <DrawerItem
              key={route.key}
              label={label}
              icon={drawerIcon}
              focused={focused}
              activeTintColor={drawerActiveTintColor}
              inactiveTintColor={Colors.black}
              activeBackgroundColor={drawerActiveBackgroundColor}
              inactiveBackgroundColor={drawerInactiveBackgroundColor}
              allowFontScaling={drawerAllowFontScaling}
              to={buildLink(route.name, route.params)}
              onPress={onPress}
            />
          );
        }) as React.ReactNode as React.ReactElement
      }

      <DrawerItem
        key="logout"
        label="Wyloguj się"
        icon={LogoutIcon}
        onPress={() => logout()}
        activeTintColor={drawerLogoutColor}
        inactiveTintColor={drawerLogoutColor}
        activeBackgroundColor={drawerActiveBackgroundColor}
        inactiveBackgroundColor={drawerInactiveBackgroundColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    top: 0,
    marginVertical: 30,
    backgroundColor: Colors.white,
  },
});

export default DrawerItemTopList;
