// eslint-disable @typescript-eslint/ban-types
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
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

    // Nawiguj bezpośrednio w ramach Drawer
    navigation.navigate(screen as any, params);
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
