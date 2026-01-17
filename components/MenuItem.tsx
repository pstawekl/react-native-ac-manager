import { Text } from '@rneui/themed';
import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import Colors from '../consts/Colors';
import Container from './Container';
import ArrowRightIcon from './icons/ArrowRightIcon';

export type SettingsMenuItemProps = {
  title: string;
  onPress: () => void;
  icon: React.ReactElement;
  isOpen?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

function MenuItem({
  title,
  onPress,
  icon,
  isOpen,
  isFirst,
  isLast,
}: SettingsMenuItemProps) {
  // Animowana wartość dla rotacji ikony
  const rotationValue = new Animated.Value(isOpen ? 1 : 0);

  // Animacja rotacji przy zmianie isOpen
  React.useEffect(() => {
    Animated.timing(rotationValue, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotationValue]);

  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
        isFirst && {
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
        isLast && {
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        },
      ]}
      android_ripple={{
        color: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <Container style={styles.menuItemContainer}>
        <Container style={styles.menuIcon}>{icon}</Container>
        <Text style={styles.menuItemText}>{title}</Text>
      </Container>
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <ArrowRightIcon color={Colors.black} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 0,
    margin: 0,
  },
  menuItemContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 8,
    paddingRight: 18,
    gap: 10,
  },
  menuItemText: {
    color: Colors.black,
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
  },
  menuIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.menuIconBackground,
  },
});

export default MenuItem;
