import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import Colors from '../consts/Colors';
import PlusIcon from './icons/PlusIcon';

interface FloatingActionButtonProps {
  onPress: () => void;
  backgroundColor: string; // Wymagany - każdy moduł przekazuje swój kolor przewodni
  right?: number; // Domyślnie: 13
  bottom?: number; // Domyślnie: 35
  size?: number; // Domyślnie: 60
  rightOffset?: number; // Dodatkowe przesunięcie od prawej strony (dodawane do right)
}

function FloatingActionButton({
  onPress,
  backgroundColor,
  right = 13,
  bottom = 15,
  size = 60,
  rightOffset = 0,
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
      <PlusIcon color={Colors.white} size={size * 0.33} />
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
});

export default FloatingActionButton;
