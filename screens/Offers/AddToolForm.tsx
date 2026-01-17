import { Divider, Text } from '@rneui/themed';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import DeviceComparisonSheet from '../../components/DeviceComparisonSheet';
import ChevronVertical from '../../components/icons/ChevronVertical';
import Colors from '../../consts/Colors';
import { OfferAddToolFormScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useOffers, {
  Device,
  SplitResponse,
} from '../../providers/OffersProvider';
import MultisplitToolBlock from './MultisplitToolBlock';
import SplitToolBlock from './SplitToolBlock';

export type Tool = {
  fieldAdder: string | null;
  size: string | null;
  volume: string | null;
  heatPowerFrom: number | null;
  heatPowerTo: number | null;
  coolPowerFrom: number | null;
  coolPowerTo: number | null;
  color: string | null;
  type: string | null;
  manufacturer: string | string[] | null;
  wifi: number | null;
  units_num: number | null;
  aggregate: string | null;
};

export type GroupedDevices = Device[];

export type ToolFormData = Tool;

function AddToolForm({ navigation, route }: OfferAddToolFormScreenProps) {
  const { type, installationId, offerName, isTemplate } = route.params;
  const { user, token } = useAuth();
  const { control, handleSubmit, resetField, setValue } = useForm<ToolFormData>(
    {
      defaultValues: {
        manufacturer: [],
      },
    },
  );
  const [devicesList, setDevicesList] = useState<Device[]>();
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [filteredDevices, setFilteredDevices] = useState<GroupedDevices>();
  const [groupedDevices, setGroupedDevices] = useState<
    Record<string, Device[]>
  >({});
  const [groupedByModel, setGroupedByModel] = useState<
    Record<string, Record<string, Device[]>>
  >({});
  const [expandedManufacturers, setExpandedManufacturers] = useState<
    Record<string, boolean>
  >({});
  const scrollViewRef = useRef<ScrollView | null>(null);
  const {
    devicesSplit,
    devicesMultisplit,
    getDevicesSplit,
    getDevicesMultisplit,
  } = useOffers();
  const [unitsMax, setUnitsMax] = useState<number | null>(null);
  const [aggregateId, setAggregateId] = useState<number | null>(null);
  const [multipleAggregateDevices, setMultipleAggregateDevices] = useState<
    number[] | null
  >(null);
  // Stan dla urządzeń wybranych w MultisplitToolBlock
  const [multisplitSelectedDevices, setMultisplitSelectedDevices] = useState<
    number[]
  >([]);
  const [filters, setFilters] = useState<ToolFormData>({
    fieldAdder: null,
    size: null,
    volume: null,
    heatPowerFrom: null,
    heatPowerTo: null,
    coolPowerFrom: null,
    coolPowerTo: null,
    color: null,
    type: null,
    manufacturer: null,
    wifi: null,
    units_num: null,
    aggregate: null,
  });
  // Stan dla porównywarki urządzeń
  const [comparisonDevices, setComparisonDevices] = useState<Device[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  useEffect(() => {
    if (getDevicesSplit && type === 'split') {
      getDevicesSplit();
    }
    if (getDevicesMultisplit && type === 'multi_split') {
      getDevicesMultisplit();
    }
  }, [getDevicesSplit, getDevicesMultisplit, type]);

  useEffect(() => {
    if (devicesSplit && type === 'split') {
      setDevicesList(devicesSplit);
    }
    if (devicesMultisplit && type === 'multi_split') {
      setDevicesList(devicesMultisplit);
    }
  }, [devicesSplit, devicesMultisplit, type]);

  // Inicjalizuj stany rozwinięcia gdy zmieni się groupedByModel
  useEffect(() => {
    if (Object.keys(groupedByModel).length > 0) {
      // Inicjalizuj producentów jako rozwiniętych
      const newExpandedManufacturers: Record<string, boolean> = {};
      Object.keys(groupedByModel).forEach(manufacturer => {
        if (!(manufacturer in expandedManufacturers)) {
          newExpandedManufacturers[manufacturer] = true;
        }
      });

      if (Object.keys(newExpandedManufacturers).length > 0) {
        setExpandedManufacturers(prev => ({
          ...prev,
          ...newExpandedManufacturers,
        }));
      }
    }
  }, [groupedByModel, expandedManufacturers]);

  const toggleManufacturer = (manufacturer: string) => {
    setExpandedManufacturers(prev => ({
      ...prev,
      [manufacturer]: !prev[manufacturer],
    }));
  };

  const prepareFilters = (
    filtersToApply: Record<string, any>,
  ): Record<string, any> => {
    const preparedFilters: Record<string, any> = {};

    Object.entries(filtersToApply).forEach(([key, value]) => {
      // Pomiń pola, które nie są filtrami
      if (key === 'fieldAdder' || key === 'units_num' || key === 'aggregate') {
        return;
      }

      // Pomiń puste wartości
      if (!value) {
        return;
      }

      // Pomiń puste tablice
      if (Array.isArray(value) && value.length === 0) {
        return;
      }

      // Sprawdź czy klucz zawiera timestamp (np. manufacturer_1234567890)
      // Ale zachowaj pełną nazwę pola łącznie z From/To
      let fieldName = key;

      // Jeśli klucz zawiera underscore i ostatnia część to liczba (timestamp),
      // usuń timestamp, ale zachowaj resztę nazwy pola (w tym From/To)
      const parts = key.split('_');
      const lastPart = parts[parts.length - 1];

      if (parts.length > 1 && !Number.isNaN(Number(lastPart))) {
        // Ostatnia część to liczba (timestamp), więc usuń ją
        fieldName = parts.slice(0, -1).join('_');
      }

      // Dodaj wartość do obiektu wynikowego
      preparedFilters[fieldName] = value;
    });

    return preparedFilters;
  };

  const applyFilters = async (filtersToApply: ToolFormData) => {
    try {
      const preparedFilters = prepareFilters(filtersToApply);

      console.log('=== FILTERS DEBUG ===');
      console.log('Raw filtersToApply:', filtersToApply);
      console.log('Prepared filters:', preparedFilters);
      console.log('====================');

      if (!getDevicesSplit) {
        return;
      }

      const response = (await getDevicesSplit({
        method: 'POST',
        data: {
          token,
          filters: preparedFilters,
        },
      })) as SplitResponse | undefined;

      console.log('=== RESPONSE DEBUG ===');
      console.log('Response received:', response ? 'YES' : 'NO');
      if (response && 'DevicesSplit' in response) {
        console.log('Devices count:', response.DevicesSplit?.length || 0);
      }
      console.log('======================');

      if (response && 'DevicesSplit' in response && response.DevicesSplit) {
        setFilteredDevices(response.DevicesSplit); // Aktualizacja listy urządzeń

        // Grupowanie urządzeń po producencie
        const grouped: Record<string, Device[]> = {};
        response.DevicesSplit.forEach((device: Device) => {
          if (!grouped[device.producent]) grouped[device.producent] = [];
          grouped[device.producent].push(device);
        });
        setGroupedDevices(grouped);

        // Grupowanie urządzeń po producencie i modelu
        const groupedByModelData: Record<string, Record<string, Device[]>> = {};
        response.DevicesSplit.forEach((device: Device) => {
          if (!groupedByModelData[device.producent]) {
            groupedByModelData[device.producent] = {};
          }
          if (!groupedByModelData[device.producent][device.nazwa_modelu]) {
            groupedByModelData[device.producent][device.nazwa_modelu] = [];
          }
          groupedByModelData[device.producent][device.nazwa_modelu].push(
            device,
          );
        });
        setGroupedByModel(groupedByModelData);
        setIsFiltersOpen(false);

        // Przewiń do góry po wyszukaniu
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        Alert.alert('Błąd', 'Brak danych w odpowiedzi serwera');
      }
    } catch (error) {
      console.log('=== ERROR DEBUG ===');
      console.log('Error:', error);
      console.log('===================');
      Alert.alert('Błąd', 'Nie udało się pobrać urządzeń');
    }
  };

  const onSubmit = () => {
    if (type === 'split') {
      navigation.navigate('AddSurchargeForm', {
        type,
        installationId,
        devices: selectedDevices,
        offerName,
        isTemplate,
      });
    }
    if (type === 'multi_split') {
      // Dla MultiSplit używamy urządzeń z MultisplitToolBlock
      if (multisplitSelectedDevices.length === 0) {
        Alert.alert('Błąd', 'Wybierz co najmniej jedno urządzenie');
        return;
      }
      navigation.navigate('AddSurchargeForm', {
        type,
        installationId,
        devices: multisplitSelectedDevices,
        offerName,
        isTemplate,
      });
    }
  };

  const onAddAnotherAggregate = () => {
    if (aggregateId && selectedDevices.length) {
      if (multipleAggregateDevices && multipleAggregateDevices.length > 0) {
        setMultipleAggregateDevices([
          ...multipleAggregateDevices,
          aggregateId,
          ...selectedDevices,
        ]);
        setUnitsMax(null);
        setAggregateId(null);
        setSelectedDevices([]);
        setFilteredDevices([]);
        resetField('units_num');
        resetField('aggregate');
      } else {
        setMultipleAggregateDevices([aggregateId, ...selectedDevices]);
        setUnitsMax(null);
        setAggregateId(null);
        setSelectedDevices([]);
        setFilteredDevices([]);
        resetField('units_num');
        resetField('aggregate');
      }
    }
  };

  // Funkcje porównywarki urządzeń
  const toggleDeviceComparison = (device: Device) => {
    setComparisonDevices(prev => {
      const exists = prev.find(d => d.id === device.id);
      if (exists) {
        console.log('Removing device from comparison:', device.id);
        return prev.filter(d => d.id !== device.id);
      }
      console.log('Adding device to comparison:', device.id);
      const newList = [...prev, device];
      console.log('Total devices in comparison:', newList.length);
      return newList;
    });
  };

  const isInComparison = (deviceId: number) => {
    return comparisonDevices.some(d => d.id === deviceId);
  };

  const openComparison = () => {
    setIsComparisonOpen(true);
  };

  const closeComparison = () => {
    setIsComparisonOpen(false);
  };

  const addComparedDeviceToOffer = (deviceId: number) => {
    console.log('=== ADD TO OFFER ===');
    console.log('Device ID:', deviceId);
    console.log('Already in offer:', selectedDevices.includes(deviceId));
    if (!selectedDevices.includes(deviceId)) {
      setSelectedDevices([...selectedDevices, deviceId]);
      console.log('Added to offer!');
    }
    console.log('===================');
  };

  const removeFromComparison = (deviceId: number) => {
    console.log('Removing device from comparison:', deviceId);
    setComparisonDevices(prev => prev.filter(d => d.id !== deviceId));
  };

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ButtonsHeader onBackPress={navigation.goBack} title="Oferta" />
        {devicesList && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContainer}
            nestedScrollEnabled
          >
            <View style={styles.toolContainer}>
              {type === 'split' && (
                <Pressable
                  style={({ pressed }) => [
                    styles.toolContainerFilters,
                    pressed && styles.toolContainerFiltersPressed,
                  ]}
                  onPress={() => setIsFiltersOpen(!isFiltersOpen)}
                >
                  <Text style={styles.filterText}>Filtry</Text>
                  <ChevronVertical color={Colors.black} isUp={isFiltersOpen} />
                </Pressable>
              )}
              {type === 'split' && isFiltersOpen && (
                <SplitToolBlock
                  devices={devicesSplit || []} // Pełna lista urządzeń
                  control={control}
                  resetField={resetField}
                  onFilter={handleSubmit(applyFilters)}
                  submitButtonStyle={styles.submitButton}
                />
              )}
              {type === 'multi_split' && (
                <MultisplitToolBlock
                  devices={devicesList || []}
                  control={control}
                  resetField={resetField}
                  setValue={setValue}
                  onDevicesChange={setMultisplitSelectedDevices}
                  scrollViewRef={scrollViewRef}
                />
              )}
            </View>
            {/* Lista urządzeń tylko dla Split - dla MultiSplit używamy formularza w MultisplitToolBlock */}
            {type === 'split' && filteredDevices && (
              <View style={styles.devicesList}>
                {filteredDevices.length === 0 && (
                  <Text>Nie znaleziono urządzeń o podanych parametrach</Text>
                )}
                {Object.entries(groupedByModel).map(
                  ([manufacturer, models]) => {
                    const isManufacturerExpanded =
                      expandedManufacturers[manufacturer] ?? true;

                    return (
                      <View key={manufacturer}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.manufacturerHeader,
                            pressed && styles.manufacturerHeaderPressed,
                          ]}
                          onPress={() => toggleManufacturer(manufacturer)}
                        >
                          <Text style={styles.manufacturerText}>
                            {manufacturer}
                          </Text>
                          <ChevronVertical
                            color={Colors.black}
                            isUp={isManufacturerExpanded}
                          />
                        </Pressable>
                        <Divider style={styles.divider} />
                        {isManufacturerExpanded && (
                          <View style={styles.modelsContainer}>
                            {Object.entries(models).map(
                              ([modelName, devices]) => {
                                return (
                                  <View
                                    key={`${manufacturer}-${modelName}`}
                                    style={styles.modelContainer}
                                  >
                                    <View style={styles.modelHeader}>
                                      <Text style={styles.modelText}>
                                        {modelName}
                                      </Text>
                                    </View>
                                    <View style={styles.devicesList}>
                                      {devices.map(item => (
                                        <View
                                          style={styles.deviceRow}
                                          key={item.id}
                                        >
                                          <View>
                                            <View
                                              style={styles.deviceTextBlock}
                                            >
                                              <Text style={styles.deviceText}>
                                                {`${item.moc_chlodnicza}/${item.moc_grzewcza} kW`}
                                              </Text>
                                            </View>
                                            <View
                                              style={styles.deviceTextBlock}
                                            >
                                              <Text
                                                style={styles.deviceText}
                                              >{`${item.cena_katalogowa_netto} zł`}</Text>
                                            </View>
                                          </View>
                                          <View style={styles.deviceActions}>
                                            <TouchableOpacity
                                              style={[
                                                styles.compareButton,
                                                isInComparison(item.id) &&
                                                styles.compareButtonActive,
                                              ]}
                                              onPress={() =>
                                                toggleDeviceComparison(item)
                                              }
                                            >
                                              <Text
                                                style={[
                                                  styles.compareButtonText,
                                                  isInComparison(item.id) &&
                                                  styles.compareButtonTextActive,
                                                ]}
                                              >
                                                {isInComparison(item.id)
                                                  ? '✓'
                                                  : 'Porównaj'}
                                              </Text>
                                            </TouchableOpacity>
                                            {selectedDevices?.includes(
                                              item.id,
                                            ) ? (
                                              <TouchableOpacity
                                                style={styles.removeButton}
                                                onPress={() =>
                                                  setSelectedDevices([
                                                    ...selectedDevices.filter(
                                                      id => id !== item.id,
                                                    ),
                                                  ])
                                                }
                                              >
                                                <Text
                                                  style={
                                                    styles.removeButtonText
                                                  }
                                                >
                                                  Usuń
                                                </Text>
                                              </TouchableOpacity>
                                            ) : (
                                              <TouchableOpacity
                                                style={styles.addButton}
                                                onPress={() =>
                                                  setSelectedDevices([
                                                    ...selectedDevices,
                                                    item.id,
                                                  ])
                                                }
                                              >
                                                <Text
                                                  style={styles.addButtonText}
                                                >
                                                  Dodaj
                                                </Text>
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                );
                              },
                            )}
                          </View>
                        )}
                      </View>
                    );
                  },
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* Floating bar dla porównywarki */}
        {type === 'split' && comparisonDevices.length > 0 && (
          <View style={styles.comparisonFloatingBarContainer}>
            <TouchableOpacity
              style={styles.comparisonFloatingBar}
              onPress={openComparison}
            >
              <Text style={styles.comparisonFloatingText}>
                Porównaj ({comparisonDevices.length}{' '}
                {comparisonDevices.length === 1
                  ? 'urządzenie'
                  : comparisonDevices.length < 5
                    ? 'urządzenia'
                    : 'urządzeń'}
                )
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <SubmitButton
            disabled={
              type === 'split'
                ? selectedDevices.length === 0
                : multisplitSelectedDevices.length === 0
            }
            title="Przejdź dalej"
            style={styles.submitButton}
            onPress={onSubmit}
          />
        </View>

        {/* Porównywarka urządzeń */}
        {type === 'split' && (
          <DeviceComparisonSheet
            isVisible={isComparisonOpen}
            devices={comparisonDevices}
            onClose={closeComparison}
            onAddToOffer={addComparedDeviceToOffer}
            onRemoveFromComparison={removeFromComparison}
            isDeviceInOffer={deviceId => selectedDevices.includes(deviceId)}
          />
        )}
      </Container>
    </LinearGradient>
  );
}

export default AddToolForm;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    marginVertical: 30,
    gap: 12,
  },
  submitButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.teal,
    padding: 0,
  },
  toolContainer: {
    backgroundColor: Colors.transparent,
    marginBottom: 24,
    borderRadius: 4,
  },
  toolContainerFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  toolContainerFiltersPressed: {
    backgroundColor: Colors.offerFilterBackground,
  },
  deviceRow: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.deviceBackground,
    borderRadius: 4,
    gap: 8,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  deviceTextBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compareButton: {
    width: 88,
    height: 45,
    borderRadius: 4,
    backgroundColor: Colors.teal,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.teal,
  },
  compareButtonActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  compareButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '400',
  },
  compareButtonTextActive: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 88,
    height: 45,
    borderRadius: 4,
    backgroundColor: Colors.offerFilterAddButton,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.offerFilterAddButtonText,
    fontSize: 14,
    fontWeight: '400',
  },
  removeButton: {
    width: 88,
    height: 45,
    borderRadius: 4,
    backgroundColor: Colors.offerFilterRemoveButton,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: Colors.offerFilterRemoveButtonText,
    fontSize: 14,
    fontWeight: '400',
  },
  comparisonFloatingBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  comparisonFloatingBar: {
    backgroundColor: Colors.teal,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonFloatingText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    textAlign: 'center',
  },
  modelsContainer: {
    gap: 16,
  },
  modelContainer: {
    gap: 8,
  },
  devicesList: {
    gap: 12,
  },
  deviceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 8,
  },
  manufacturerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  manufacturerHeaderPressed: {
    backgroundColor: Colors.offerFilterBackground,
  },
  manufacturerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 8,
    height: 2,
    color: Colors.gray,
    marginBottom: 10,
  },
  filterText: {
    fontSize: 16,
  },
});
