/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { MaterialIcons } from '@expo/vector-icons';
import { Input, InputProps, Text } from '@rneui/themed';
import { useRef, useState } from 'react';
import { Control, Controller, FieldError } from 'react-hook-form';
import { FieldPathValue } from 'react-hook-form/dist/types';
import { FieldValues } from 'react-hook-form/dist/types/fields';
import { FieldPath, Path } from 'react-hook-form/dist/types/path/eager';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ColorPicker } from 'react-native-color-picker';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';

import Colors from '../consts/Colors';

type FormInputProps<T extends FieldValues> = Omit<InputProps, 'ref'> & {
  name: Path<T>;
  control: Control<T, undefined>;
  label: string;
  isSmall?: boolean;
  isThin?: boolean;
  isBordered?: boolean;
  customPercentWidth?: number;
  required?: boolean;
  noPadding?: boolean;
  grayBackground?: boolean;
  error?: FieldError;
  textColor?: string;
  color?: string;
  rules?: object;
  isMarginBottom?: boolean;
};

type TextAreaProps<T extends FieldValues> = Omit<InputProps, 'onChange'> & {
  name: Path<T>;
  control: Control<T, undefined>;
  noBorder?: boolean;
  noPadding?: boolean;
  textColor?: string;
  bold?: boolean;
  labelColor?: string;
  borderColor?: string;
  fontSize?: number;
  labelFontSize?: number;
  backgroundColor?: string;
  height?: number;
};

type DropdownProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: Path<TFieldValues>;
  control: Control<TFieldValues, undefined>;
  options: ItemType<FieldPathValue<TFieldValues, TName>>[];
  label?: string;
  isSmall?: boolean;
  isThin?: boolean;
  isBordered?: boolean;
  onChange?: (value: any) => void;
  zIndex?: number;
  customWidth?: string | number;
  customHeight?: number;
  dropDownDirection?: 'AUTO' | 'TOP' | 'BOTTOM' | 'DEFAULT';
  disabled?: boolean;
  grayBackground?: boolean;
  borderColor?: string;
  containerStyle?: object;
  textStyle?: object;
  placeholderStyle?: object;
  isMarginBottom?: boolean;
};

type FormColorPickerProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T, undefined>;
  label: string;
};

const styles = StyleSheet.create({
  colorPickerIcon: {
    borderRadius: 50,
    width: 24,
    height: 24,
  },
  colorPickerLabel: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 14,
    marginBottom: 6,
    color: Colors.black,
  },
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Colors.border,
  },
  colorPickerText: {
    marginLeft: 10,
    color: Colors.black,
    fontFamily: 'Archivo_400Regular',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.blackHalfOpacity,
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 10,
  },
  colorPicker: {
    height: 300,
    width: 300,
  },
  cancelButton: {
    textAlign: 'center',
    marginTop: 10,
    color: Colors.red,
    fontFamily: 'Archivo_400Regular',
  },
});

export function FormInput<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  name,
  control,
  label,
  customPercentWidth,
  error,
  textColor,
  color,
  rules,
  isThin = false,
  isSmall = false,
  isBordered = false,
  required = false,
  grayBackground = false,
  noPadding = false,
  isMarginBottom = true,
  ...props
}: FormInputProps<T>) {
  let width = '100%';
  if (isSmall) {
    width = '50%';
  } else if (customPercentWidth) {
    width = `${customPercentWidth}%`;
  }

  // TODO: implement active logic in settings (narzuty rabaty)
  const [active, setActive] = useState<boolean>(false);

  // Computed styles
  let borderRadius = 4;
  if (!isBordered && grayBackground) {
    borderRadius = 10;
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={rules || { required }}
      render={({ field: { onChange, value } }) => (
        <Input
          /* eslint-disable-next-line react/jsx-props-no-spreading */
          {...props}
          label={label}
          /* eslint-disable-next-line react-native/no-inline-styles */
          inputStyle={{
            fontFamily: 'Archivo_400Regular',
            borderWidth: isBordered || !grayBackground ? 1 : 0,
            color: textColor || Colors.black,
            borderColor: color || Colors.borderInput,
            borderRadius: 10,
            height: isThin ? 34 : 54,
            minHeight: isThin ? 34 : 40,
            paddingHorizontal: 12,
            fontSize: 14,
            backgroundColor:
              grayBackground && !isBordered
                ? Colors.invoiceFormTextContainer
                : Colors.white,
            marginBottom: isMarginBottom ? 6 : 0,
          }}
          /* eslint-disable-next-line react-native/no-inline-styles */
          inputContainerStyle={{
            borderBottomWidth: 0,
          }}
          /* eslint-disable-next-line react-native/no-inline-styles */
          containerStyle={{
            paddingHorizontal: noPadding ? 0 : 8,
            width,
            ...(isBordered === false && !grayBackground
              ? {
                shadowColor: Colors.black,
                shadowOffset: {
                  width: 0,
                  height: 1,
                },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }
              : {}),
          }}
          /* eslint-disable-next-line react-native/no-inline-styles */
          labelStyle={{
            fontFamily: 'Archivo_600SemiBold',
            marginTop: 0,
            marginBottom: 6,
            color: props.disabled ? Colors.gray : textColor || Colors.black,
            fontSize: 10,
            letterSpacing: 0.3,
            fontWeight: 'normal',
          }}
          value={value != null ? String(value) : ''}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onChangeText={(text: string) =>
            onChange(text as FieldPathValue<T, TName>)
          }
          errorMessage={error?.message}
        />
      )}
    />
  );
}

export function Textarea<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  label,
  name,
  control,
  noBorder,
  noPadding,
  textColor,
  bold,
  labelColor,
  borderColor,
  fontSize,
  labelFontSize,
  backgroundColor,
  height,
  ...props
}: TextAreaProps<T>) {
  const [isActive, setActive] = useState<boolean>(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <Input
          label={label}
          /* eslint-disable-next-line react-native/no-inline-styles */
          inputStyle={{
            borderWidth: noBorder ? 0 : 1,
            color: props.disabled
              ? Colors.gray
              : textColor || (isActive ? Colors.black : '#737373'),
            borderColor:
              borderColor || (isActive ? Colors.black : Colors.grayBorder),
            borderRadius: 6,
            height: height ?? 136,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontFamily: bold ? 'Archivo_600SemiBold' : 'Archivo_400Regular',
            fontSize: fontSize || 16,
            lineHeight: 24,
            backgroundColor:
              backgroundColor || (isActive ? Colors.white : '#FAFAFA'),
          }}
          /* eslint-disable-next-line react-native/no-inline-styles */
          labelStyle={{
            fontFamily: 'Archivo_400Regular',
            marginTop: 0,
            marginBottom: 5,
            color: props.disabled
              ? Colors.gray
              : labelColor || (isActive ? Colors.black : '#737373'),
            fontSize: labelFontSize || 12,
            letterSpacing: 0.3,
          }}
          /* eslint-disable-next-line react-native/no-inline-styles */
          inputContainerStyle={{
            borderBottomWidth: 0,
          }}
          /* eslint-disable-next-line react-native/no-inline-styles */
          containerStyle={{
            paddingHorizontal: noPadding ? 0 : 10,
          }}
          multiline
          numberOfLines={4}
          value={value != null ? String(value) : ''}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onChangeText={(text: string) =>
            onChange(text as FieldPathValue<T, TName>)
          }
          disabled={props.disabled}
        />
      )}
    />
  );
}

export function Dropdown<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  options,
  label,
  isBordered,
  isSmall,
  isThin,
  customWidth,
  customHeight,
  dropDownDirection,
  name,
  control,
  onChange,
  zIndex = 1,
  grayBackground,
  borderColor,
  containerStyle,
  textStyle,
  placeholderStyle,
  isMarginBottom = true,
  ...props
}: DropdownProps<TFieldValues, TName>) {
  const [open, setOpen] = useState(false);
  const isUpdatingRef = useRef(false);

  return (
    <View
      /* eslint-disable-next-line react-native/no-inline-styles */
      style={{
        width: customWidth || (isSmall ? '47%' : '100%'),
        zIndex,
      }}
    >
      {label && (
        <Text
          /* eslint-disable-next-line react-native/no-inline-styles */
          style={{
            fontFamily: 'Poppins_400Regular',
            marginTop: 0,
            marginBottom: 4,
            color: props.disabled ? Colors.gray : '#111',
            fontSize: 12,
            letterSpacing: 0,
          }}
        >
          {label}
        </Text>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const handleValueChange = (newValue: any) => {
            if (isUpdatingRef.current) return;
            // Akceptuj również puste stringi i 0 jako prawidłowe wartości
            if (newValue !== field.value) {
              isUpdatingRef.current = true;
              if (typeof field.onChange === 'function') {
                field.onChange(newValue);
              }
              if (onChange && typeof onChange === 'function') {
                onChange(newValue);
              }
              // Reset flag after state update
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 50);
            }
          };

          const handleSetValue = (callback: any) => {
            // DropDownPicker używa setValue jako funkcji settera (podobnie jak useState)
            // callback może być wartością lub funkcją (prevValue) => newValue
            if (isUpdatingRef.current) return;

            let newValue: any;
            if (typeof callback === 'function') {
              newValue = callback(field.value);
            } else {
              newValue = callback;
            }

            // Wywołaj handleValueChange tylko jeśli wartość się zmieniła (porównanie z undefined/null/'' uwzględnione)
            if (newValue !== field.value) {
              handleValueChange(newValue);
            }
          };

          try {
            const picker = (
              <DropDownPicker<FieldPathValue<TFieldValues, TName>>
                key={`${name}-${field.value ?? 'null'}`}
                disabled={props.disabled}
                dropDownDirection={dropDownDirection}
                /* eslint-disable-next-line react-native/no-inline-styles */
                style={{
                  borderWidth: grayBackground ? 0 : 1,
                  borderColor: borderColor || '#E8E8E8',
                  borderRadius: 8,
                  backgroundColor: grayBackground ? '#F4F4F4' : Colors.white,
                  minHeight: customHeight || (isThin ? 34 : 44),
                  marginBottom: isMarginBottom ? 12 : 0,
                  ...containerStyle,
                }}
                /* eslint-disable-next-line react-native/no-inline-styles */
                textStyle={{
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 14,
                  color: '#111',
                  ...textStyle,
                }}
                /* eslint-disable-next-line react-native/no-inline-styles */
                placeholderStyle={{
                  color: '#ADADAD',
                  ...placeholderStyle,
                }}
                /* eslint-disable-next-line react-native/no-inline-styles */
                dropDownContainerStyle={{
                  borderWidth: isBordered ? 1 : 0,
                  borderTopWidth: 1,
                  borderTopColor: Colors.divider,
                  backgroundColor: isBordered
                    ? Colors.white
                    : Colors.invoiceFormTextContainer,
                }}
                itemKey="value"
                open={open}
                value={field.value ?? null}
                setValue={handleSetValue}
                items={options}
                setOpen={setOpen}
                setItems={() => {
                  // Nie używamy setItems, bo options są kontrolowane z zewnątrz
                }}
                onChangeValue={handleValueChange}
                placeholder={field.value ? undefined : 'Wybierz...'}
                listMode="MODAL"
                modalAnimationType="slide"
                closeAfterSelecting
                closeOnBackPressed
              />
            );
            return picker;
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error(String(error));
            console.warn('[Dropdown] ERROR creating DropDownPicker', {
              name,
              message: err.message,
            });
            throw err;
          }
        }}
      />
    </View>
  );
}

export function FormColorPicker<T extends FieldValues>({
  name,
  control,
  label,
}: FormColorPickerProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <View>
          <Text style={styles.colorPickerLabel}>{label}</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[
              styles.colorPickerButton,
              { backgroundColor: Colors.white },
            ]}
          >
            {value ? (
              <View
                style={[
                  styles.colorPickerIcon,
                  {
                    backgroundColor: value,
                  },
                ]}
              />
            ) : (
              <MaterialIcons
                name="add-circle-outline"
                size={24}
                color="black"
              />
            )}
            <Text style={styles.colorPickerText}>
              {value || 'Kliknij, aby dodać kolor'}
            </Text>
          </TouchableOpacity>

          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <ColorPicker
                  onColorSelected={color => {
                    onChange(color as FieldPathValue<T, Path<T>>);
                    setModalVisible(false);
                  }}
                  style={styles.colorPicker}
                />
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButton}>Anuluj</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}
    />
  );
}
