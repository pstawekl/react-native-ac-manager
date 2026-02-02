import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { Text } from '@rneui/themed';
import Colors from '../consts/Colors';

interface FloatingActionButtonProps {
  onPress: () => void;
  backgroundColor: string; // Wymagany - każdy moduł przekazuje swój kolor przewodni
  right?: number; // Domyślnie: 13
  bottom?: number; // Domyślnie: 35
  size?: number; // Domyślnie: 60
  rightOffset?: number; // Dodatkowe przesunięcie od prawej strony (dodawane do right)
  iconColor?: string;
  iconSize?: number;
}

function FloatingActionButton({
  onPress,
  backgroundColor,
  right = 13,
  bottom = 15,
  size = 60,
  rightOffset = 0,
  iconColor = Colors.white,
  iconSize = 24,
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          right: right + rightOffset,
          bottom,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.fabText, { fontSize: iconSize, color: iconColor }]}>
        +
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fabText: {
    fontSize: 24,
    fontFamily: 'Archivo_400Regular',
  },
});

export default FloatingActionButton;
