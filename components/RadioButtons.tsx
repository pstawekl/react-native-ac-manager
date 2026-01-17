import { CheckBox, CheckBoxProps } from '@rneui/themed';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import Colors from '../consts/Colors';

type Option = {
  value: string | boolean;
  label: string;
};

function RadioButtons({
  value,
  options,
  onChange,
  iconRight = false,
  textStyle,
  checkedColor,
  uncheckedColor,
  size = 16,
  name,
  control,
  disabled,
}: {
  options: Option[];
  value?: Option['value'];
  onChange?: (value: Option['value']) => void;
  iconRight?: CheckBoxProps['iconRight'];
  textStyle?: CheckBoxProps['textStyle'];
  checkedColor?: CheckBoxProps['checkedColor'];
  uncheckedColor?: CheckBoxProps['uncheckedColor'];
  size?: CheckBoxProps['size'];
  name?: string;
  control?: Control<any>;
  disabled?: boolean;
}) {
  const checkboxProps = {
    iconRight,
    checkedIcon: 'dot-circle-o',
    uncheckedIcon: 'circle-o',
    textStyle: textStyle || styles.text,
    checkedColor: checkedColor || Colors.black,
    uncheckedColor: uncheckedColor || Colors.black,
    size,
    containerStyle: styles.container,
    wrapperStyle: iconRight ? styles.wrapper : undefined,
  };

  return (
    <View>
      {name ? (
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange: onFormChange, value: formValue } }) => (
            <View style={styles.optionContainer}>
              {options.map((option: Option) => (
                <CheckBox
                  key={`${option.value}-${option.label}`}
                  checked={formValue === option.value}
                  onPress={() => {
                    if (options.length === 1) {
                      // Dla pojedynczej opcji, przełącz wartość między wartością opcji a false
                      onFormChange(
                        formValue === option.value ? false : option.value,
                      );
                    } else {
                      onFormChange(option.value);
                    }
                  }}
                  /* eslint-disable-next-line react/jsx-props-no-spreading */
                  {...checkboxProps}
                  title={option.label}
                  disabled={disabled}
                />
              ))}
            </View>
          )}
        />
      ) : (
        <View style={styles.optionContainer}>
          {options.map((option: Option) => (
            <CheckBox
              key={`${option.value}-${option.label}`}
              checked={value === option.value}
              onPress={() => onChange && onChange(option.value)}
              /* eslint-disable-next-line react/jsx-props-no-spreading */
              {...checkboxProps}
              title={option.label}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
  },
  wrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
    color: Colors.black,
  },
  optionContainer: { marginBottom: 20 },
});

export default RadioButtons;
