/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Control, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import FloatingActionButton from '../../components/FloatingActionButton';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import { Dropdown, FormInput } from '../../components/Input';
import CloseIcon from '../../components/icons/CloseIcon';
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
  onDeletePress: () => void;
  manufacturers: string[];
  usedManufacturers: string[];
};

const DiscountItem = memo(function DiscountItem({
  control,
  index,
  onDeletePress,
  manufacturers,
  usedManufacturers,
}: DiscountItemProps) {
  const selectedProducent = useWatch({
    control,
    name: `discounts.${index}.producent`,
  });

  // Filter manufacturers: exclude those already used in other fields
  // but include the currently selected one (if any)
  const availableManufacturers = useMemo(() => {
    return manufacturers.filter(
      m => !usedManufacturers.includes(m) || m === selectedProducent,
    );
  }, [manufacturers, usedManufacturers, selectedProducent]);

  const dropdownOptions = useMemo(
    () =>
      availableManufacturers.map(item => ({
        label: item,
        value: item,
      })),
    [availableManufacturers],
  );

  return (
    <View style={styles.itemContainer}>
      <View style={styles.customDropdownWrapper}>
        <Dropdown
          name={`discounts.${index}.producent`}
          control={control}
          label="Producent"
          options={dropdownOptions}
          customWidth="60%"
          isBordered
          isThin
        />
        <View style={styles.customInputSpacing}>
          <FormInput
            name={`discounts.${index}.cost`}
            control={control}
            label="Rabat (%)"
            textColor="#737373"
            color={Colors.grayBorder}
            isThin
            keyboardType="numeric"
            rules={{
              required: 'Rabat jest wymagany',
              pattern: {
                value: /^\d+(\.\d+)?$/,
                message: 'Wprowadź poprawną liczbę',
              },
            }}
          />
        </View>
      </View>
      <Pressable onPress={onDeletePress}>
        <CloseIcon color={Colors.black} />
      </Pressable>
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
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const { control, handleSubmit } = useForm<FormData>();
  const { fields, append, remove } = useFieldArray<FormData>({
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
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  // Track if discounts have been loaded to prevent duplicates
  const discountsLoadedRef = useRef(false);
  const loadedDiscountIdsRef = useRef<Set<number>>(new Set());

  const toggleOverlay = useCallback(() => {
    setVisible(prev => !prev);
  }, []);

  // Fetch discounts only once on mount
  useEffect(() => {
    if (fetchDiscounts && !discountsLoadedRef.current) {
      discountsLoadedRef.current = true;
      fetchDiscounts();
    }
  }, [fetchDiscounts]);

  // Fetch manufacturers only once on mount
  useEffect(() => {
    if (fetchManufacturers && manufacturers.length === 0) {
      fetchManufacturers();
    }
  }, [fetchManufacturers, manufacturers.length]);

  // Load discounts into form only once, preventing duplicates
  useEffect(() => {
    if (discountsList && discountsList.length > 0) {
      // Check if we've already loaded these discounts
      const newDiscounts = discountsList.filter(
        discount => !loadedDiscountIdsRef.current.has(discount.id),
      );

      if (newDiscounts.length > 0) {
        // Add only new discounts that haven't been loaded
        const itemsToAdd: Item[] = [];
        newDiscounts.forEach(item => {
          if (!loadedDiscountIdsRef.current.has(item.id)) {
            itemsToAdd.push({
              producent: item.producent,
              cost: String(item.value),
              itemId: item.id,
            });
            loadedDiscountIdsRef.current.add(item.id);
          }
        });

        // Add all items at once
        itemsToAdd.forEach(item => {
          append(item);
        });

        setDiscounts(prev => {
          const existingIds = new Set(prev.map(d => d.id));
          const uniqueNewDiscounts = newDiscounts.filter(
            d => !existingIds.has(d.id),
          );
          return [...prev, ...uniqueNewDiscounts];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountsList]);

  // Load manufacturers only once
  useEffect(() => {
    if (manufacturersList?.producers && manufacturers.length === 0) {
      setManufacturers(manufacturersList.producers);
    }
  }, [manufacturersList, manufacturers.length]);

  // Watch all discount fields to track which manufacturers are used
  const watchedDiscounts = useWatch({
    control,
    name: 'discounts',
  });

  // Check if there are incomplete new discounts (without itemId)
  const hasIncompleteNewDiscounts = useMemo(() => {
    if (!watchedDiscounts) return false;
    return watchedDiscounts.some(item => {
      // Check if it's a new discount (no itemId)
      if (item?.itemId !== null && item?.itemId !== undefined) {
        return false;
      }
      // Check if producent or cost is missing
      const hasProducent = item?.producent && item.producent.trim() !== '';
      const hasCost =
        item?.cost &&
        item.cost.trim() !== '' &&
        !Number.isNaN(parseFloat(item.cost));
      return !hasProducent || !hasCost;
    });
  }, [watchedDiscounts]);

  // Calculate used manufacturers (excluding the current index for each item)
  // Also include manufacturers that already have discounts in the database
  const getUsedManufacturers = useCallback(
    (currentIndex: number) => {
      const usedInForm: string[] = [];
      if (watchedDiscounts) {
        watchedDiscounts.forEach((item, idx) => {
          if (idx !== currentIndex && item?.producent) {
            usedInForm.push(item.producent);
          }
        });
      }

      // Also include manufacturers from existing discounts (that are not being edited)
      const existingManufacturers: string[] = [];
      if (discounts.length > 0) {
        discounts.forEach(discount => {
          // Check if this discount is being edited in the current field
          const isBeingEdited =
            watchedDiscounts?.[currentIndex]?.itemId === discount.id;
          if (!isBeingEdited && !usedInForm.includes(discount.producent)) {
            existingManufacturers.push(discount.producent);
          }
        });
      }

      return [...usedInForm, ...existingManufacturers];
    },
    [watchedDiscounts, discounts],
  );

  const onSubmit = async (data: FormData) => {
    if (removedIds.length !== 0) {
      removedIds.forEach(itemId => {
        deleteDiscount({ data: { rabat_id: itemId } });
      });
    }

    data.discounts.forEach(item => {
      // Validate required fields
      if (!item.producent || !item.cost) {
        return;
      }

      const existingItem = discounts
        ? discounts.find(s => s.id === item.itemId)
        : null;

      if (!item.itemId) {
        // Adding new discount
        const value = parseFloat(item.cost);
        if (Number.isNaN(value)) {
          return;
        }
        addDiscount({ data: { producent: item.producent, value } });
      }
      if (
        existingItem &&
        (existingItem.producent !== item.producent ||
          String(existingItem.value) !== item.cost)
      ) {
        // Editing existing discount
        const value = parseFloat(item.cost);
        if (Number.isNaN(value)) {
          return;
        }
        editDiscount({
          data: {
            rabat_id: item.itemId,
            producent: item.producent,
            value,
          },
        });
      }
    });

    toggleOverlay();
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader
        onBackPress={navigation.goBack}
      />

      <ScrollView style={styles.scrollContainer}>
        {manufacturers.length > 0 && (
          <View style={{ gap: -18 }}>
            {fields.length > 0 ? (
              fields.map((field, index) => {
                const handleDelete = () => {
                  if (field.itemId) {
                    setRemovedIds(prev => [...prev, field.itemId!]);
                    loadedDiscountIdsRef.current.delete(field.itemId);
                  }
                  remove(index);
                };
                return (
                  <DiscountItem
                    control={control}
                    index={index}
                    key={field.id}
                    onDeletePress={handleDelete}
                    manufacturers={manufacturers}
                    usedManufacturers={getUsedManufacturers(index)}
                  />
                );
              })
            ) : (
              <Text style={styles.noDataText}>Brak rabatów.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <ButtonGroup
          cancelTitle="Anuluj"
          submitTitle="Akceptuj"
          onCancel={navigation.goBack}
          onSubmitPress={toggleOverlay}
          disabled={hasIncompleteNewDiscounts}
        />
      </View>
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={handleSubmit(onSubmit)}
        title="Czy na pewno chcesz wprowadzić zmiany ?"
      />

      <FloatingActionButton
        onPress={() => append({ producent: '', cost: null, itemId: null })}
        backgroundColor={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 6,
  },
  itemContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    marginBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  noDataText: {
    textAlign: 'center',
  },
  customInputSpacing: {
    width: '40%',
    paddingTop: 3,
  },
  customDropdownWrapper: {
    width: '80%',
    flexDirection: 'row',
  },
});

export default SettingsDiscountList;
