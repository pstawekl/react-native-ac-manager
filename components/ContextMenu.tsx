import { Overlay, Text } from '@rneui/themed';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import Colors from '../consts/Colors';
import { IconButton } from './Button';
import CloseIcon from './icons/CloseIcon';

type ContextMenuOption = {
  title: string;
  icon: React.ReactElement;
  onPress: () => void;
  color?: string;
};

type ContextMenuProps = {
  visible: boolean;
  onBackdropPress: () => void;
  options: ContextMenuOption[];
  title?: string;
};

export default function ContextMenu({
  visible,
  onBackdropPress,
  options,
  title,
}: ContextMenuProps) {
  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>
          <IconButton
            withoutBackground
            onPress={onBackdropPress}
            icon={<CloseIcon color={Colors.black} size={22} />}
          />
        </View>

        <View>
          {options.map((option, index) => (
            <IconButton
              key={`${option.title}-${option.onPress.toString().slice(0, 10)}`}
              title={option.title}
              onPress={option.onPress}
              icon={option.icon}
              titleStyle={[
                styles.optionTitle,
                {
                  color: option.color || Colors.black,
                },
              ]}
              withoutBackground
            />
          ))}
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlay: {
    padding: 10,
    width: '80%',
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 16,
    marginLeft: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 14,
    marginLeft: 12,
  },
});
