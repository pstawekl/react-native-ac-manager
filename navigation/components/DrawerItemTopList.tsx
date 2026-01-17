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
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { IconButton } from '../../components/Button';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import Separator from '../../components/Separator';
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

  const {
    drawerActiveTintColor,
    drawerInactiveTintColor,
    drawerActiveBackgroundColor,
    drawerInactiveBackgroundColor,
  } = focusedOptions;

  return (
    <View style={styles.container}>
      <IconButton
        withoutBackground
        onPress={() => navigation.dispatch(DrawerActions.closeDrawer())}
        icon={<ArrowLeftIcon color={Colors.black} size={24} />}
        style={styles.backButton}
      />
      {
        state.routes.map((route, index) => {
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
                  : CommonActions.reset({
                      index: 0,
                      routes: [{ name: route.name, params: route.params }],
                    })),
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
            <React.Fragment key={route.key}>
              <DrawerItem
                label={label}
                icon={drawerIcon}
                focused={focused}
                activeTintColor={drawerActiveTintColor}
                inactiveTintColor={drawerInactiveTintColor}
                activeBackgroundColor={drawerActiveBackgroundColor}
                inactiveBackgroundColor={drawerInactiveBackgroundColor}
                allowFontScaling={drawerAllowFontScaling}
                to={buildLink(route.name, route.params)}
                onPress={onPress}
              />
              {index === 0 && <Separator />}
            </React.Fragment>
          );
        }) as React.ReactNode as React.ReactElement
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopRightRadius: 35,
    borderTopLeftRadius: 35,
  },
  backButton: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    display: 'flex',
    justifyContent: 'flex-start',
    backgroundColor: Colors.white,
    borderColor: Colors.transparent,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
});

export default DrawerItemTopList;
