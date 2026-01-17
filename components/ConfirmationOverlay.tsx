import { Button, Overlay, Text } from '@rneui/themed';
import { StyleSheet, View } from 'react-native';

import Colors from '../consts/Colors';
import { IconButton } from './Button';
import CloseIcon from './icons/CloseIcon';

export default function ConfirmationOverlay({
  visible,
  onBackdropPress,
  onSubmit,
  title,
  submitColor,
}: {
  visible: boolean;
  onBackdropPress: () => void;
  onSubmit: () => void;
  title: string;
  submitColor?: string;
}) {
  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
    >
      <View style={styles.overlayHeader}>
        <View style={styles.overlayHeaderButton}>
          <IconButton
            withoutBackground
            onPress={onBackdropPress}
            icon={<CloseIcon color={Colors.black} size={22} />}
          />
        </View>
      </View>
      <View style={styles.contentWrapper}>
        <Text>{title}</Text>
        <View style={styles.buttonsWrapper}>
          <Button
            title="Nie"
            buttonStyle={styles.cancelButton}
            titleStyle={{ color: Colors.white }}
            onPress={onBackdropPress}
          />
          <Button
            title="Tak"
            buttonStyle={[
              styles.continueButton,
              { backgroundColor: submitColor ?? Colors.teal },
            ]}
            titleStyle={{ color: Colors.white }}
            onPress={onSubmit}
          />
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlay: {
    padding: 0,
    width: '95%',
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  overlayHeader: {
    paddingHorizontal: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlayHeaderButton: {
    width: 44,
  },
  continueButton: {
    height: 42,
    width: 120,
    borderRadius: 4,
  },
  cancelButton: {
    height: 42,
    width: 120,
    borderRadius: 4,
    backgroundColor: Colors.grayButtonText,
  },
  buttonsWrapper: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  contentWrapper: {
    alignSelf: 'center',
    padding: 12,
    alignItems: 'center',
    gap: 24,
  },
});
