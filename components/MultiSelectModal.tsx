import { Overlay } from '@rneui/themed';
import React, { useState } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../consts/Colors';
import { IconButton } from './Button';
import CloseIcon from './icons/CloseIcon';

type Option = {
  label: string;
  value: string | number;
};

type MultiSelectModalProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  control: Control<TFieldValues>;
  label?: string;
  options: Option[];
  placeholder?: string;
  customWidth?: string | number;
  isBordered?: boolean;
  isSmall?: boolean;
  customHeight?: number;
  disabled?: boolean;
  noMargin?: boolean;
};

export default function MultiSelectModal<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  options,
  placeholder = 'Wybierz opcje...',
  customWidth,
  isBordered = false,
  isSmall = false,
  customHeight,
  disabled = false,
  noMargin = false,
}: MultiSelectModalProps<TFieldValues, TName>) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<(string | number)[]>(
    [],
  );
  const [initialSelection, setInitialSelection] = useState<(string | number)[]>(
    [],
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => {
        const selectedValues = (value as (string | number)[]) || [];
        const selectedCount = selectedValues.length;

        // Pobierz nazwy wybranych opcji
        const selectedLabels = selectedValues
          .map(val => options.find(opt => opt.value === val)?.label)
          .filter(Boolean)
          .join(', ');

        const displayText =
          selectedCount === 0 ? placeholder : selectedLabels || placeholder;

        const openModal = () => {
          if (disabled) {
            return;
          }
          const currentValues = Array.isArray(selectedValues)
            ? [...selectedValues]
            : [];
          setPendingSelection(currentValues);
          setInitialSelection(currentValues);
          setModalVisible(true);
        };

        const handleOptionToggle = (optionValue: string | number) => {
          setPendingSelection(prev => {
            const isSelected = prev.includes(optionValue);

            if (isSelected) {
              // Usuń opcję
              return prev.filter(val => val !== optionValue);
            }

            // Dodaj opcję
            return [...prev, optionValue];
          });
        };

        const handleSelectAll = () => {
          setPendingSelection(prev =>
            prev.length === options.length ? [] : options.map(opt => opt.value),
          );
        };

        const handleConfirm = () => {
          onChange(pendingSelection);
          setInitialSelection(pendingSelection);
          setModalVisible(false);
        };

        const handleCancel = () => {
          setPendingSelection([...initialSelection]);
          setModalVisible(false);
        };

        return (
          <View
            style={{
              width:
                customWidth !== undefined
                  ? typeof customWidth === 'number'
                    ? customWidth
                    : customWidth
                  : isSmall
                  ? '47%'
                  : '100%',
            }}
          >
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
              style={[
                styles.trigger,
                isBordered ? styles.triggerBordered : styles.triggerUnbordered,
                isSmall ? styles.triggerSmall : styles.triggerDefault,
                disabled && styles.triggerDisabled,
                {
                  minHeight: customHeight || (isSmall ? 34 : 50),
                  marginBottom: noMargin ? 0 : undefined,
                },
              ]}
              onPress={openModal}
              disabled={disabled}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.triggerText,
                  isSmall ? styles.triggerTextSmall : styles.triggerTextDefault,
                  selectedCount === 0
                    ? styles.triggerTextPlaceholder
                    : styles.triggerTextActive,
                ]}
              >
                {displayText}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            <Overlay
              isVisible={modalVisible}
              onBackdropPress={handleCancel}
              overlayStyle={styles.overlay}
              animationType="fade"
              statusBarTranslucent
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Wybierz opcje</Text>
                <IconButton
                  withoutBackground
                  onPress={handleCancel}
                  icon={<CloseIcon color={Colors.black} size={22} />}
                />
              </View>

              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.selectAllText}>
                    {pendingSelection.length === options.length
                      ? 'Odznacz wszystkie'
                      : 'Zaznacz wszystkie'}
                  </Text>
                </TouchableOpacity>

                <ScrollView style={styles.optionsList}>
                  {options.length > 0 ? (
                    options.map((option, index) => {
                      const isSelected = pendingSelection.includes(
                        option.value,
                      );
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.optionItem,
                            isSelected && styles.optionItemSelected,
                          ]}
                          onPress={() => handleOptionToggle(option.value)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextSelected,
                            ]}
                          >
                            {isSelected ? '✓ ' : '○ '}
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.noOptionsContainer}>
                      <Text style={styles.noOptionsText}>
                        Brak dostępnych opcji
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Wybierz</Text>
                </TouchableOpacity>
              </View>
            </Overlay>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Archivo_400Regular',
    marginTop: 0,
    marginBottom: 6,
    color: Colors.black,
    fontSize: 14,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  triggerBordered: {
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  triggerUnbordered: {
    borderWidth: 0,
    borderRadius: 9,
    backgroundColor: Colors.invoiceFormTextContainer,
  },
  triggerSmall: {
    minHeight: 34,
  },
  triggerDefault: {
    minHeight: 50,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    flex: 1,
    marginRight: 8,
  },
  triggerTextSmall: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
  },
  triggerTextDefault: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
  },
  triggerTextPlaceholder: {
    color: Colors.gray,
  },
  triggerTextActive: {
    color: Colors.black,
  },
  arrow: {
    fontSize: 12,
    color: Colors.gray,
    marginLeft: 4,
  },
  overlay: {
    width: '100%',
    height: '100%',
    margin: 0,
    borderRadius: 0,
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  modalContent: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  confirmButton: {
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 16,
  },
  selectAllButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  selectAllText: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.teal,
    textAlign: 'center',
  },
  optionsList: {
    flex: 1,
  },
  noOptionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    color: Colors.gray,
    textAlign: 'center',
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
    minHeight: 50,
  },
  optionItemSelected: {
    backgroundColor: Colors.offerFilterBackground,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
  optionTextSelected: {
    color: Colors.teal,
    fontFamily: 'Archivo_600SemiBold',
  },
});
