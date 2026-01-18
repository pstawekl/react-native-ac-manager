import { Divider, Text } from '@rneui/themed';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import ChevronVertical from '../../components/icons/ChevronVertical';
import Colors from '../../consts/Colors';
import { ClientsParamList, MainParamList } from '../../navigation/types';

import useAuth from '../../providers/AuthProvider';
import useOffers, {
  Device,
  SplitResponse,
} from '../../providers/OffersProvider';
import { ToolFormData } from '../Offers/AddToolForm';
import SplitToolBlock from '../Offers/SplitToolBlock';

type DeviceSelectorScreenProps = CompositeScreenProps<
  StackScreenProps<ClientsParamList, 'DeviceSelector'>,
  DrawerScreenProps<MainParamList, 'Clients'>
>;

export default function DeviceSelectorScreen({
  navigation,
  route,
}: DeviceSelectorScreenProps) {
  const { installationId, montageId } = route.params;
  const { token } = useAuth();
  const { control, handleSubmit, resetField, setValue } = useForm<ToolFormData>(
    {
      defaultValues: {
        manufacturer: [],
      },
    },
  );
  const [devicesList, setDevicesList] = useState<Device[]>();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>();
  const [groupedByModel, setGroupedByModel] = useState<
    Record<string, Record<string, Device[]>>
  >({});
  const [expandedManufacturers, setExpandedManufacturers] = useState<
    Record<string, boolean>
  >({});
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { devicesSplit, getDevicesSplit } = useOffers();

  useEffect(() => {
    if (getDevicesSplit) {
      getDevicesSplit();
    }
  }, [getDevicesSplit]);

  useEffect(() => {
    if (devicesSplit) {
      setDevicesList(devicesSplit);
    }
  }, [devicesSplit]);

  // Inicjalizuj stany rozwinięcia gdy zmieni się groupedByModel
  useEffect(() => {
    if (Object.keys(groupedByModel).length > 0) {
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
      if (key === 'fieldAdder' || key === 'units_num' || key === 'aggregate') {
        return;
      }

      if (!value) {
        return;
      }

      if (Array.isArray(value) && value.length === 0) {
        return;
      }

      let fieldName = key;
      const parts = key.split('_');
      const lastPart = parts[parts.length - 1];

      if (parts.length > 1 && !Number.isNaN(Number(lastPart))) {
        fieldName = parts.slice(0, -1).join('_');
      }

      preparedFilters[fieldName] = value;
    });

    return preparedFilters;
  };

  const applyFilters = async (filtersToApply: ToolFormData) => {
    try {
      const preparedFilters = prepareFilters(filtersToApply);

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

      if (response && 'DevicesSplit' in response && response.DevicesSplit) {
        setFilteredDevices(response.DevicesSplit);

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

        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        Alert.alert('Błąd', 'Brak danych w odpowiedzi serwera');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się pobrać urządzeń');
    }
  };

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
  };

  const handleConfirm = () => {
    if (!selectedDevice) {
      Alert.alert('Błąd', 'Wybierz urządzenie');
      return;
    }

    // Zwróć wybrane urządzenie przez parametry nawigacji
    // Przekaż selectedDevice przez route.params, które będzie odczytane w MontageProtocolForm
    // Użyj navigation.navigate z powrotem do Settings z selectedDevice
    try {
      const state = navigation.getState();
      const previousRoute = state.routes[state.index - 1];

      if (previousRoute && previousRoute.name === 'Settings') {
        const prevParams = previousRoute.params as any;
        // Przekaż pełny obiekt urządzenia - React Navigation powinien to obsłużyć
        (navigation as any).navigate('Settings', {
          installationId: String(prevParams?.installationId || installationId),
          clientId: String(prevParams?.clientId || ''),
          activeTab: prevParams?.activeTab || 'montaz',
          selectedDevice: {
            id: selectedDevice.id,
            producent: selectedDevice.producent,
            typ: selectedDevice.typ,
            moc_chlodnicza: selectedDevice.moc_chlodnicza,
            moc_grzewcza: selectedDevice.moc_grzewcza,
            nazwa_modelu: selectedDevice.nazwa_modelu,
            nazwa_jedn_wew: selectedDevice.nazwa_jedn_wew,
            nazwa_jedn_zew: selectedDevice.nazwa_jedn_zew,
          } as Device,
        });
      } else {
        // Fallback - użyj goBack
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error navigating back with selected device:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać wyboru urządzenia');
      navigation.goBack();
    }
  };

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ButtonsHeader
          onBackPress={navigation.goBack}
          title="Wybierz urządzenie"
        />
        {devicesList && (
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollContainer}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.toolContainer}>
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
              {isFiltersOpen && devicesSplit && devicesSplit.length > 0 && (
                <SplitToolBlock
                  devices={devicesSplit}
                  control={control}
                  resetField={resetField}
                  onFilter={handleSubmit(applyFilters)}
                  submitButtonStyle={styles.submitButton}
                />
              )}
            </View>
            {filteredDevices && (
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
                                      {devices.map(item => {
                                        const isSelected =
                                          selectedDevice?.id === item.id;
                                        return (
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
                                              {isSelected ? (
                                                <TouchableOpacity
                                                  style={styles.selectedButton}
                                                  onPress={() =>
                                                    setSelectedDevice(null)
                                                  }
                                                >
                                                  <Text
                                                    style={
                                                      styles.selectedButtonText
                                                    }
                                                  >
                                                    Wybrane
                                                  </Text>
                                                </TouchableOpacity>
                                              ) : (
                                                <TouchableOpacity
                                                  style={styles.selectButton}
                                                  onPress={() =>
                                                    handleDeviceSelect(item)
                                                  }
                                                >
                                                  <Text
                                                    style={
                                                      styles.selectButtonText
                                                    }
                                                  >
                                                    Wybierz
                                                  </Text>
                                                </TouchableOpacity>
                                              )}
                                            </View>
                                          </View>
                                        );
                                      })}
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

        <View style={styles.footer}>
          <SubmitButton
            disabled={!selectedDevice}
            title="Potwierdź wybór"
            style={styles.submitButton}
            onPress={handleConfirm}
          />
        </View>
      </Container>
    </LinearGradient>
  );
}

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
    zIndex: 100,
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
  selectButton: {
    width: 88,
    height: 45,
    borderRadius: 4,
    backgroundColor: Colors.offerFilterAddButton,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonText: {
    color: Colors.offerFilterAddButtonText,
    fontSize: 14,
    fontWeight: '400',
  },
  selectedButton: {
    width: 88,
    height: 45,
    borderRadius: 4,
    backgroundColor: Colors.green,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
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
