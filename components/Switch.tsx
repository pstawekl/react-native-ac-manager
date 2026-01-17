import { Switch as RneuiSwitch } from '@rneui/themed';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../consts/Colors';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  title?: string;
  color?: string;
};

export default function Switch({
  value,
  onValueChange,
  title,
  color,
}: SwitchProps) {
  const getBackgroundStyle = () => {
    if (!value) return styles.disabledContainer;
    if (color) return { backgroundColor: color };
    return styles.enabledContainer;
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.container, getBackgroundStyle()]}>
        <RneuiSwitch
          value={value}
          onValueChange={onValueChange}
          trackColor={{
            false: Colors.white,
            true: color || Colors.switchEnabledGreen,
          }}
          thumbColor={value ? Colors.white : Colors.black}
          ios_backgroundColor={Colors.white}
          style={[styles.customSwitch, value && styles.enabledSwitch]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: 40,
    gap: 10,
    paddingHorizontal: 10,
  },
  title: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.black,
    borderRadius: 12,
    width: 40,
    height: 22,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  enabledContainer: {
    backgroundColor: Colors.switchEnabledGreen,
  },
  disabledContainer: {
    backgroundColor: Colors.white,
  },
  customSwitch: {
    width: 30,
    height: 16,
    borderWidth: 1,
    borderColor: Colors.gray,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  enabledSwitch: {
    borderWidth: 0,
  },
});
