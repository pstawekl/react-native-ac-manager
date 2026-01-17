import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
  DrawerDescriptorMap,
  DrawerNavigationHelpers,
} from '@react-navigation/drawer/lib/typescript/src/types';
import { DrawerNavigationState, ParamListBase } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import Separator from '../../components/Separator';
import Colors from '../../consts/Colors';
import DrawerHeader from './DrawerHeader';
import DrawerItemBottomList from './DrawerItemBottomList';
import DrawerItemTopList from './DrawerItemTopList';

type CustomDrawerContentProps = {
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

function CustomDrawerContent({
  state,
  navigation,
  descriptors,
}: CustomDrawerContentProps) {
  const focusedRoute = state.routes[state.index] ?? false;
  const focusedDescriptor = descriptors[focusedRoute.key] ?? false;
  const focusedOptions = focusedDescriptor.options ?? false;

  const contentContainerStyle: StyleProp<ViewStyle> | undefined = {
    paddingTop: 0,
    paddingStart: 0,
    paddingEnd: 0,
    flex: 1,
  };

  return (
    <DrawerContentScrollView contentContainerStyle={contentContainerStyle}>
      <LinearGradient
        colors={['#36B130', '#6EDE2F']}
        style={styles.linearGradient}
      >
        <DrawerHeader />

        <View style={styles.viewContainer}>
          <DrawerItemTopList
            {...{
              navigation,
              descriptors,
              state,
            }}
            focusedRouteKey={focusedRoute.key}
            focusedOptions={focusedOptions}
          />

          <Separator />

          <DrawerItemBottomList
            {...{
              navigation,
              descriptors,
              state: {
                ...state,
                routes: [],
              },
            }}
            focusedRouteKey={focusedRoute.key}
            focusedOptions={focusedOptions}
          />
        </View>
      </LinearGradient>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: -1,
  },
  viewContainer: {
    backgroundColor: Colors.white,
    width: '100%',
    bottom: 0,
    borderTopRightRadius: 35,
    borderTopLeftRadius: 35,
  },
});

export default CustomDrawerContent;
