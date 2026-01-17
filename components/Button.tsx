import { StringOmit } from '@rneui/base/dist/helpers';
import { Button, ButtonProps, Text } from '@rneui/themed';
import { ReactElement } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';

import Colors from '../consts/Colors';

type CancelButtonProps = {
  title: string;
  onPress: () => void;
  color?: StringOmit<'primary' | 'secondary' | 'success' | 'error' | 'warning'>;
  style?: ButtonProps['buttonStyle'];
  titleStyle?: ButtonProps['titleStyle'];
};

type SubmitButtonProps = CancelButtonProps & {
  loading?: boolean;
  disabled?: boolean;
};

type ButtonGroupProps = {
  cancelTitle: string;
  submitTitle: string;
  onCancel: () => void;
  onSubmitPress: () => void;
  cancelColor?: StringOmit<
    'primary' | 'secondary' | 'success' | 'error' | 'warning'
  >;
  submitColor?: StringOmit<
    'primary' | 'secondary' | 'success' | 'error' | 'warning'
  >;
  cancelStyle?: ButtonProps['buttonStyle'];
  submitStyle?: ButtonProps['buttonStyle'];
  cancelTitleStyle?: ButtonProps['titleStyle'];
  submitTitleStyle?: ButtonProps['titleStyle'];
  stretch?: boolean;
  loading?: boolean;
  disabled?: boolean;
  groupStyle?: ButtonProps['containerStyle'];
};

type LinkButtonProps = {
  text: string;
  title: string;
  onPress: () => void;
};

export function CancelButton({
  title,
  onPress,
  color,
  style,
  titleStyle,
}: CancelButtonProps) {
  return (
    <Button
      title={title}
      buttonStyle={style || styles.cancelButton}
      titleStyle={titleStyle || styles.statusButtonTitle}
      containerStyle={styles.shadowContainer}
      onPress={onPress}
      color={color}
    />
  );
}

export function StatusButton({
  title,
  onPress,
  color,
  style,
  titleStyle,
}: CancelButtonProps) {
  return (
    <Button
      title={title}
      buttonStyle={style || styles.statusButton}
      titleStyle={titleStyle || styles.cancelButtonTitle}
      containerStyle={styles.shadowContainer}
      onPress={onPress}
      color={color}
    />
  );
}

export function SubmitButton({
  title,
  onPress,
  color,
  loading,
  style,
  titleStyle,
  disabled,
}: SubmitButtonProps) {
  return (
    <Button
      title={title}
      buttonStyle={style || styles.submitButton}
      titleStyle={titleStyle || styles.submitButtonTitle}
      containerStyle={styles.shadowContainer}
      onPress={onPress}
      color={color}
      loading={loading}
      disabled={disabled}
    />
  );
}

export function ButtonGroup({
  cancelTitle,
  submitTitle,
  onCancel,
  onSubmitPress,
  cancelColor,
  submitColor,
  cancelStyle,
  submitStyle,
  cancelTitleStyle,
  submitTitleStyle,
  stretch = true,
  loading = false,
  disabled = false,
  groupStyle,
}: ButtonGroupProps) {
  return (
    <View style={groupStyle || styles.group}>
      <View style={stretch ? styles.groupButtonContainer : undefined}>
        <CancelButton
          title={cancelTitle}
          onPress={onCancel}
          color={cancelColor}
          style={cancelStyle}
          titleStyle={cancelTitleStyle}
        />
      </View>
      <View style={stretch ? styles.groupButtonContainer : undefined}>
        <SubmitButton
          title={submitTitle}
          onPress={onSubmitPress}
          color={submitColor}
          style={submitStyle}
          titleStyle={submitTitleStyle}
          loading={loading}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

export function LinkButton({ text, title, onPress }: LinkButtonProps) {
  return (
    <View style={styles.flexContainer}>
      {text ? <Text style={styles.linkButtonText}>{text}</Text> : null}
      <Button
        title={title}
        type="clear"
        titleStyle={styles.linkButtonTitle}
        buttonStyle={styles.linkButton}
        onPress={onPress}
      />
    </View>
  );
}

export function IconButton({
  icon,
  title,
  onPress,
  titleStyle,
  withoutBackground = false,
  style,
  disabled = false,
}: {
  icon: ReactElement;
  title?: string;
  onPress?: (event: GestureResponderEvent) => void;
  titleStyle?: ButtonProps['titleStyle'];
  withoutBackground?: boolean;
  style?: ButtonProps['buttonStyle'];
  disabled?: boolean;
}) {
  return (
    <View>
      <Button
        title={title}
        icon={
          <View
            style={
              withoutBackground
                ? styles.iconContainerWithoutBackground
                : styles.iconContainer
            }
          >
            {icon}
          </View>
        }
        titleStyle={titleStyle || styles.iconButtonTitle}
        buttonStyle={style || styles.iconButton}
        containerStyle={styles.iconButtonContainer}
        onPress={onPress}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    width: '100%',
    height: 34,
    borderRadius: 4,
    backgroundColor: Colors.gray,
    padding: 0,
  },
  statusButton: {
    width: 56,
    height: 22,
    borderRadius: 5,
    backgroundColor: Colors.lightRed,
    padding: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonTitle: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Archivo_400Regular',
    lineHeight: 12,
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    height: 34,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    padding: 0,
  },
  iconButton: {
    display: 'flex',
    justifyContent: 'flex-start',
    backgroundColor: Colors.transparent,
    borderColor: Colors.transparent,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  cancelButtonTitle: {
    color: Colors.grayButtonText,
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
  },
  submitButtonTitle: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
  },
  linkButtonText: {
    color: Colors.black,
    fontSize: 13,
  },
  linkButtonTitle: {
    color: Colors.primary,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  iconButtonTitle: {
    marginLeft: 7,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.3,
    color: Colors.text,
  },
  shadowContainer: {
    backgroundColor: Colors.transparent,
    shadowColor: Colors.cardShadow,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: -1, height: 7 },
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 41,
    height: 41,
    backgroundColor: Colors.green,
    borderRadius: 41,
  },
  iconContainerWithoutBackground: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 41,
    height: 41,
    borderRadius: 41,
  },
  group: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
  },
  groupButtonContainer: {
    flex: 1,
  },
  iconButtonContainer: {
    marginVertical: 8,
  },
  linkButton: { padding: 0 },
});
