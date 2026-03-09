/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Control, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { ButtonGroup } from '../../components/Button';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import { FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';

type Item = {
  producent: string;
  cost: string | null;
  itemId: number | null;
};

type FormData = {
  discounts: Item[];
};

type DiscountItemProps = {
  control: Control<FormData>;
  index: number;
};

const DiscountItem = memo(function DiscountItem({
  control,
  index,
}: DiscountItemProps) {
  const producent = useWatch({
    control,
    name: `discounts.${index}.producent`,
  });

  return (
    <View style={styles.itemContainer}>
      <View style={styles.producerColumn}>
        <Text style={styles.producerLabel}>{producent}</Text>
      </View>
      <View style={styles.customInputSpacing}>
        <FormInput
          name={`discounts.${index}.cost`}
          control={control}
          label="Rabat (%)"
          textColor="#737373"
          color={Colors.grayBorder}
          isThin
          keyboardType="numeric"
        />
      </View>
    </View>
  );
});

function SettingsDiscountList() {
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const navigation = useNavigation();

  const { result: manufacturersList, execute: fetchManufacturers } = useApi<{
    producers: string[];
  }>({
    path: 'producenci_list',
  });

  const [discounts, setDiscounts] = useState<
    { id: number; producent: string; owner: number; value: number }[]
  >([]);
  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: { discounts: [] },
  });
  const { fields } = useFieldArray<FormData>({
    control,
    name: 'discounts',
  });
  const { execute: addDiscount } = useApi({
    path: 'rabat_add',
  });
  const { execute: editDiscount } = useApi({
    path: 'rabat_edit',
  });
  const { execute: deleteDiscount } = useApi({
    path: 'rabat_delete',
  });
  const { result: discountsList, execute: fetchDiscounts } = useApi<
    { id: number; producent: string; owner: number; value: number }[]
  >({
    path: 'rabat_list',
  });

  const [visible, setVisible] = useState(false);

  const toggleOverlay = useCallback(() => {
    setVisible(prev => !prev);
  }, []);

  // Fetch discounts only once on mount
  useEffect(() => {
    if (fetchDiscounts) {
      fetchDiscounts();
    }
  }, [fetchDiscounts]);

  // Fetch manufacturers only once on mount
  useEffect(() => {
    if (fetchManufacturers && manufacturers.length === 0) {
      fetchManufacturers();
    }
  }, [fetchManufacturers, manufacturers.length]);

  // Po załadowaniu producentów i rabatów zbuduj pełną listę (każdy producent ma jeden wiersz).
  useEffect(() => {
    if (manufacturers.length > 0) {
      const currentDiscounts = discountsList ?? [];
      setDiscounts(currentDiscounts);
      const items: Item[] = manufacturers.map(producent => {
        const existing = currentDiscounts.find(d => d.producent === producent);
        return {
          producent,
          cost: existing ? String(existing.value) : '0',
          itemId: existing ? existing.id : null,
        };
      });
      reset({ discounts: items });
    }
  }, [manufacturers, discountsList, reset]);

  // Load manufacturers only once
  useEffect(() => {
    if (manufacturersList?.producers && manufacturers.length === 0) {
      setManufacturers(manufacturersList.producers);
    }
  }, [manufacturersList, manufacturers.length]);

  const watchedDiscounts = useWatch({
    control,
    name: 'discounts',
  });

  const hasIncompleteNewDiscounts = useMemo(() => {
    if (!watchedDiscounts) return false;
    return watchedDiscounts.some(item => {
      if (!item?.cost) return false;
      return Number.isNaN(parseFloat(item.cost));
    });
  }, [watchedDiscounts]);

  const onSubmit = async (data: FormData) => {
    const currentDiscounts = discounts ?? [];
    const operations: Promise<unknown>[] = [];

    data.discounts.forEach(item => {
      if (!item.producent || item.cost == null) {
        return;
      }
      const value = parseFloat(item.cost);
      if (Number.isNaN(value)) {
        return;
      }

      const existingItem = currentDiscounts.find(
        d => d.producent === item.producent,
      );

      if (existingItem) {
        if (value === existingItem.value) {
          return;
        }
        if (value === 0) {
          operations.push(
            deleteDiscount({ data: { rabat_id: existingItem.id } }),
          );
          return;
        }
        operations.push(
          editDiscount({
            data: {
              rabat_id: existingItem.id,
              producent: item.producent,
              value,
            },
          }),
        );
      } else if (value !== 0) {
        operations.push(
          addDiscount({ data: { producent: item.producent, value } }),
        );
      }
    });

    if (operations.length) {
      await Promise.all(operations);
    }

    toggleOverlay();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {manufacturers.length > 0 && (
          <View style={styles.listWrapper}>
            {fields.length > 0 ? (
              fields.map((field, index) => (
                <DiscountItem control={control} index={index} key={field.id} />
              ))
            ) : (
              <Text style={styles.noDataText}>Brak rabatów.</Text>
            )}
          </View>
        )}
        <ButtonGroup
          cancelTitle="Anuluj"
          submitTitle="Zapisz"
          onCancel={navigation.goBack}
          onSubmitPress={toggleOverlay}
          stretch
          groupStyle={styles.buttonGroup}
          cancelStyle={styles.cancelButton}
          cancelTitleStyle={styles.cancelButtonTitle}
          submitStyle={styles.submitButton}
          submitTitleStyle={styles.submitButtonTitle}
          disabled={hasIncompleteNewDiscounts}
        />
      </ScrollView>

      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={handleSubmit(onSubmit)}
        title="Czy na pewno chcesz wprowadzić zmiany?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 6,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  listWrapper: {
    gap: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.cardShadow,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  producerColumn: {
    width: '50%',
    paddingRight: 8,
  },
  producerLabel: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingTop: 30,
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    height: 48,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 60,
    borderWidth: 1,
    backgroundColor: Colors.transparent,
    borderColor: Colors.borderButton,
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: Colors.green,
    flex: 1,
    minHeight: 48,
    height: 48,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 60,
  },
  submitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
  },
  customInputSpacing: {
    width: '40%',
    paddingTop: 3,
  },
});

export default SettingsDiscountList;
