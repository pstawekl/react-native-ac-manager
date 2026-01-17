import { Text } from '@rneui/themed';
import React from 'react';
import { Control } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { IconButton, SubmitButton } from '../../components/Button';

import { Dropdown, FormInput } from '../../components/Input';
import MultiSelectModal from '../../components/MultiSelectModal';
import PlusIcon from '../../components/icons/PlusIcon';
import Colors from '../../consts/Colors';
import { Device } from '../../providers/OffersProvider';
import { RootState } from '../../store';
import { setSplitFilters } from '../../store/filtersSlice';
import { ToolFormData } from './AddToolForm';

interface FilterField {
  id: string;
  name: string;
  label: string;
  options: { label: string; value: string | number }[];
  zIndex?: number;
  isRange?: boolean; // Nowe pole dla filtrów z zakresem
}

const FILTER_ORDER: Record<string, number> = {
  type: 0,
  manufacturer: 1,
  heatPower: 2,
  coolPower: 3,
  color: 4,
  wifi: 5,
};

const sortFiltersByInitialOrder = (filters: FilterField[]) =>
  [...filters].sort((a, b) => {
    const orderA = FILTER_ORDER[a.name] ?? Number.MAX_SAFE_INTEGER;
    const orderB = FILTER_ORDER[b.name] ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

const styles = StyleSheet.create({
  toolInnerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  fieldAdder: {
    zIndex: 9,
    gap: 10,
    width: '100%',
    backgroundColor: Colors.transparent,
  },
  fieldAdderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,
    backgroundColor: Colors.offerFilterBackground,
    borderRadius: 4,
  },
  filterTextStyle: {
    left: 15,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  formWrapper: {
    zIndex: 10,
  },
  fieldRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  buttonStyle: {
    backgroundColor: Colors.offerFilterAddButton,
    width: 45,
    height: 45,
    borderRadius: 4,
  },
  deleteFilterButton: {
    backgroundColor: Colors.offerFilterRemoveButton,
    width: 45,
    height: 45,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 0,
  },
  deleteFilterButtonText: {
    color: Colors.offerFilterRemoveButtonText,
    fontWeight: 'bold',
    fontSize: 18,
  },
  searchButton: {
    marginTop: 16,
    width: '100%',
  },
  rangeFilterContainer: {
    width: '85%',
  },
  rangeFilterLabel: {
    fontFamily: 'Archivo_400Regular',
    marginTop: 0,
    color: Colors.black,
    fontSize: 14,
  },
  rangeInputsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  rangeInputWrapper: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
});

type ToolList = {
  id: string;
  name: string;
  label: string;
  options: { label: string; value: string | number }[];
  zIndex?: number;
  isRange?: boolean;
}[];

// Komponent dla pojedynczego filtra
function FilterItem({
  field,
  control,
  onRemove,
}: {
  field: FilterField;
  control: Control<ToolFormData>;
  onRemove: (id: string) => void;
}) {
  const isManufacturerFilter = field.name === 'manufacturer';
  const isRangeFilter = field.isRange;
  // Zakomentowane - filtr nie jest używany
  // const isSizeFilter = field.name === 'size';

  const renderFilterInput = () => {
    if (isManufacturerFilter) {
      return (
        <MultiSelectModal
          name={field.name as any}
          control={control}
          label={field.label}
          options={field.options}
          customWidth="85%"
          isSmall
          isBordered
          customHeight={44}
          placeholder="Wybierz producentów..."
        />
      );
    }

    if (isRangeFilter) {
      // Filtr z zakresem (od-do) - renderujemy dwa inputy w jednym wierszu
      return (
        <View style={styles.rangeFilterContainer}>
          <Text style={styles.rangeFilterLabel}>{field.label}</Text>
          <View style={styles.rangeInputsContainer}>
            <View style={styles.rangeInputWrapper}>
              <FormInput
                name={`${field.name}From` as any}
                control={control}
                label="Od"
                customPercentWidth={100}
                noPadding
                keyboardType="numeric"
                placeholder="Od..."
              />
            </View>
            <View style={styles.rangeInputWrapper}>
              <FormInput
                name={`${field.name}To` as any}
                control={control}
                label="Do"
                customPercentWidth={100}
                noPadding
                keyboardType="numeric"
                placeholder="Do..."
              />
            </View>
          </View>
        </View>
      );
    }

    // Zakomentowane - filtr nie jest używany
    // if (isSizeFilter) {
    //   return (
    //     <FormInput
    //       name={field.name as any}
    //       control={control}
    //       label={field.label}
    //       customPercentWidth={85}
    //       noPadding
    //       keyboardType="numeric"
    //       placeholder="Wpisz wielkość..."
    //     />
    //   );
    // }

    return (
      <Dropdown
        name={field.name as any}
        control={control}
        label={field.label}
        options={field.options}
        customWidth="85%"
        dropDownDirection="BOTTOM"
        isSmall
        isBordered
        zIndex={field.zIndex}
        customHeight={44}
      />
    );
  };

  return (
    <View style={styles.fieldRow}>
      {renderFilterInput()}
      <Pressable
        style={({ pressed }) => [
          styles.deleteFilterButton,
          pressed && { opacity: 0.7 },
          // Dla zwykłych filtrów dodajemy marginBottom, dla range filtrów nie
          !isRangeFilter && { marginBottom: 20 },
          isRangeFilter && { marginBottom: 27 },
        ]}
        onPress={() => {
          onRemove(field.id);
        }}
      >
        <Text style={styles.deleteFilterButtonText}>-</Text>
      </Pressable>
    </View>
  );
}

// Komponent dla przycisków dodawania filtrów
function FilterAddButton({
  item,
  onAdd,
}: {
  item: FilterField;
  onAdd: (name: string) => void;
}) {
  return (
    <View style={styles.fieldAdderRow}>
      <Text style={styles.filterTextStyle}>{item.label}</Text>
      <IconButton
        withoutBackground
        style={styles.buttonStyle}
        onPress={() => {
          onAdd(item.name);
        }}
        icon={<PlusIcon color={Colors.offerFilterAddButtonText} size={22} />}
      />
    </View>
  );
}

function SplitToolBlock({
  control,
  devices = [], // Default to empty array
  resetField,
  onFilter,
  submitButtonStyle,
}: {
  control: Control<ToolFormData>;
  devices: Device[];
  resetField: (name: keyof ToolFormData) => void;
  onFilter: () => void;
  submitButtonStyle: any;
}) {
  // Redux
  const dispatch = useDispatch();
  const reduxFilters = useSelector((state: RootState) => state.filters.split);

  // Replace local state with Redux state for filters
  const formFields = useSelector(
    (state: RootState) => state.filters.split.formFields || [], // Default to empty array
  );
  const filtersList = useSelector(
    (state: RootState) => state.filters.split.filtersList || [], // Default to empty array
  );
  const [dropdownIndex, setDropdownIndex] = React.useState(20);

  React.useEffect(() => {
    if (!devices.length) {
      console.log('No devices - returning early');
      return;
    }

    setDropdownIndex(20);

    // Only initialize filtersList if it's empty AND formFields is also empty
    // (first time only, not when user added all filters)
    if (filtersList.length === 0 && formFields.length === 0) {
      const initialFiltersList: FilterField[] = [
        {
          id: 'type',
          name: 'type',
          label: 'Typ urządzenia',
          options: Array.from(new Set(devices.map(item => item.typ))).map(
            item => ({
              label: item,
              value: item,
            }),
          ),
        },
        {
          id: 'manufacturer',
          name: 'manufacturer',
          label: 'Producent urządzenia',
          options: Array.from(new Set(devices.map(item => item.producent)))
            .sort((a, b) => a.localeCompare(b))
            .map(item => ({
              label: item,
              value: item,
            })),
        },
        {
          id: 'heatPower',
          name: 'heatPower',
          label: 'Moc grzewcza urządzenia',
          options: [],
          isRange: true, // To jest filtr z zakresem (od-do)
        },
        {
          id: 'coolPower',
          name: 'coolPower',
          label: 'Moc chłodnicza urządzenia',
          options: [],
          isRange: true, // To jest filtr z zakresem (od-do)
        },
        {
          id: 'color',
          name: 'color',
          label: 'Kolor',
          options: Array.from(new Set(devices.map(item => item.kolor))).map(
            item => ({
              label: item,
              value: item,
            }),
          ),
        },
        {
          id: 'wifi',
          name: 'wifi',
          label: 'Sterowanie wifi',
          options: [
            { label: 'Nie', value: 0 },
            { label: 'Tak', value: 1 },
          ],
        },
      ];
      dispatch(
        setSplitFilters({
          formFields: [], // Start with empty formFields
          filtersList: sortFiltersByInitialOrder(initialFiltersList),
        }),
      );
    }
  }, [devices, dispatch, filtersList.length, formFields.length]);

  // Explicitly type parameters in map and filter functions
  const onAddField = (name: string) => {
    const selectedField = filtersList.find(
      (item: FilterField) => item.name === name,
    );
    if (!selectedField) return;

    // Generate fresh options based on all devices
    let freshOptions: { label: string; value: string | number }[] = [];

    switch (name) {
      case 'type':
        freshOptions = Array.from(new Set(devices.map(item => item.typ))).map(
          item => ({ label: item, value: item }),
        );
        break;
      case 'manufacturer':
        freshOptions = Array.from(new Set(devices.map(item => item.producent)))
          .sort((a, b) => a.localeCompare(b))
          .map(item => ({ label: item, value: item }));
        break;
      case 'heatPower':
      case 'coolPower':
        freshOptions = [];
        break;
      case 'color':
        freshOptions = Array.from(new Set(devices.map(item => item.kolor))).map(
          item => ({ label: item, value: item }),
        );
        break;
      case 'wifi':
        freshOptions = [
          { label: 'Nie', value: 0 },
          { label: 'Tak', value: 1 },
        ];
        break;
      default:
        freshOptions = selectedField.options;
    }

    const uniqueId = `${selectedField.name}_${Date.now()}`;
    const updatedFiltersList = sortFiltersByInitialOrder(
      filtersList.filter((item: FilterField) => item.name !== name),
    );

    dispatch(
      setSplitFilters({
        formFields: [
          ...formFields,
          {
            id: uniqueId,
            name: selectedField.name,
            label: selectedField.label,
            options: freshOptions,
            zIndex: dropdownIndex,
            isRange: selectedField.isRange, // Przekazujemy flagę isRange
          },
        ],
        filtersList: updatedFiltersList,
      }),
    );
  };

  const onRemoveField = (id: string) => {
    const removedField = formFields.find((item: FilterField) => item.id === id);
    if (!removedField) return;

    const filtersListWithoutRemoved = filtersList.filter(
      (item: FilterField) => item.name !== removedField.name,
    );

    const updatedFiltersList = sortFiltersByInitialOrder([
      ...filtersListWithoutRemoved,
      {
        id: removedField.name,
        name: removedField.name,
        label: removedField.label,
        options: removedField.options,
        isRange: removedField.isRange, // Przekazujemy flagę isRange
      },
    ]);

    dispatch(
      setSplitFilters({
        formFields: formFields.filter((item: FilterField) => item.id !== id),
        filtersList: updatedFiltersList,
      }),
    );

    // Resetuj pola dla filtra z zakresem
    if (removedField.isRange) {
      resetField(`${removedField.name}From` as keyof ToolFormData);
      resetField(`${removedField.name}To` as keyof ToolFormData);
    } else {
      resetField(removedField.name as keyof ToolFormData);
    }
  };

  return (
    <View style={styles.toolInnerContainer}>
      <View style={styles.formWrapper}>
        {formFields.map((field: FilterField) => (
          <FilterItem
            key={field.id}
            field={field}
            control={control}
            onRemove={id => {
              onRemoveField(id);
            }}
          />
        ))}
      </View>
      <View style={styles.fieldAdder}>
        {filtersList.map((item: FilterField) => (
          <FilterAddButton
            key={item.id}
            item={item}
            onAdd={name => {
              onAddField(name);
            }}
          />
        ))}
      </View>
      <View style={styles.searchButton}>
        <SubmitButton
          title="Wyszukaj"
          style={submitButtonStyle}
          onPress={onFilter} // Use the onFilter prop passed from AddToolForm
        />
      </View>
    </View>
  );
}

export default SplitToolBlock;
