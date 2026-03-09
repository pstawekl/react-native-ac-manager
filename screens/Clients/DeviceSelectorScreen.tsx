import { Text } from '@rneui/themed';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { ClientsParamList, MainParamList } from '../../navigation/types';

import useOffers, {
  Device,
  MultiSplitResponse,
  SplitResponse,
} from '../../providers/OffersProvider';

type DeviceSelectorForm = {
  splitManufacturer: string;
  splitDeviceType: string;
  multisplitProducer: string;
};

type DeviceSelectorScreenProps = CompositeScreenProps<
  StackScreenProps<ClientsParamList, 'DeviceSelector'>,
  DrawerScreenProps<MainParamList, 'Clients'>
>;

type MultisplitStep = 'producer' | 'internal' | 'aggregates';

type QuantityRowStyles = {
  deviceRow: object;
  deviceTextBlock: object;
  deviceText: object;
  quantityRow: object;
  quantityButton: object;
  quantityButtonText: object;
  quantityValue: object;
};

const QuantityRow = memo(function QuantityRow({
  modelKey,
  label,
  moc,
  quantity,
  onAdd,
  onSubtract,
  s,
}: {
  modelKey: string;
  label: string;
  moc: string;
  quantity: number;
  onAdd: (k: string) => void;
  onSubtract: (k: string) => void;
  s: QuantityRowStyles;
}) {
  return (
    <View style={s.deviceRow}>
      <View style={s.deviceTextBlock}>
        <Text style={s.deviceText}>{label}</Text>
        <Text style={s.deviceText}>{moc}</Text>
      </View>
      <View style={s.quantityRow}>
        <TouchableOpacity
          style={s.quantityButton}
          onPress={() => onSubtract(modelKey)}
          disabled={quantity <= 0}
        >
          <Text style={s.quantityButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={s.quantityValue}>{quantity}</Text>
        <TouchableOpacity
          style={s.quantityButton}
          onPress={() => onAdd(modelKey)}
        >
          <Text style={s.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function DeviceSelectorScreen({
  navigation,
  route,
}: DeviceSelectorScreenProps) {
  const {
    installationId,
    montageId,
    montageType: paramMontageType,
  } = route.params;
  const initialMontageType: 'split' | 'multi_split' =
    paramMontageType ?? 'split';
  const [selectedMontageType, setSelectedMontageType] = useState<
    'split' | 'multi_split'
  >(initialMontageType);

  const { getDevicesSplit, getDevicesMultisplit } = useOffers();

  const { result: producersResult, execute: fetchProducers } = useApi<{
    producers: string[];
  }>({ path: 'producenci_list', authorized: false });

  const { control, setValue: setFormValue } = useForm<DeviceSelectorForm>({
    defaultValues: {
      splitManufacturer: '',
      splitDeviceType: '',
      multisplitProducer: '',
    },
  });

  const splitManufacturer =
    useWatch({ control, name: 'splitManufacturer', defaultValue: '' }) ?? '';
  const splitDeviceType =
    useWatch({ control, name: 'splitDeviceType', defaultValue: '' }) ?? '';
  const multisplitProducer =
    useWatch({ control, name: 'multisplitProducer', defaultValue: '' }) ?? '';

  const scrollViewRef = useRef<ScrollView | null>(null);

  // Lista producentów (do dropdownów)
  const [producerOptions, setProducerOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // --- Split flow: lista urządzeń tylko po wyborze Producent+Typ ---
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [splitDevicesForManufacturer, setSplitDevicesForManufacturer] =
    useState<Device[]>([]);
  const [splitLoading, setSplitLoading] = useState(false);

  // --- Multisplit flow: lista urządzeń tylko po wyborze Producenta ---
  const [multisplitStep, setMultisplitStep] =
    useState<MultisplitStep>('producer');
  const [multisplitDevicesForProducer, setMultisplitDevicesForProducer] =
    useState<Device[]>([]);
  const [multisplitLoading, setMultisplitLoading] = useState(false);
  /** Cache ostatnio pobranej listy po producencie – szybsze ponowne wejście */
  const multisplitCacheRef = useRef<{
    producer: string;
    list: Device[];
  } | null>(null);
  /** Ilość sztuk per model (klucz = producent_nazwa_moc) – jednostki wewnętrzne */
  const [internalQuantities, setInternalQuantities] = useState<
    Record<string, number>
  >({});
  /** Ilość sztuk per model – agregaty */
  const [aggregateQuantities, setAggregateQuantities] = useState<
    Record<string, number>
  >({});

  // Załaduj listę producentów przy wejściu na ekran
  useEffect(() => {
    if (fetchProducers) fetchProducers({ data: {} });
  }, [fetchProducers]);

  useEffect(() => {
    if (producersResult?.producers?.length) {
      setProducerOptions(
        producersResult.producers
          .filter((p): p is string => p != null && p !== '')
          .map(p => ({ label: p, value: p })),
      );
    }
  }, [producersResult]);

  // Split: po wyborze Producenta zaciągnij urządzenia tylko tego producenta
  const fetchSplitByManufacturer = useCallback(async () => {
    if (!splitManufacturer || !getDevicesSplit) return;
    setSplitLoading(true);
    setSplitDevicesForManufacturer([]);
    setSelectedDevice(null);
    try {
      const res = (await getDevicesSplit({
        data: { filters: { manufacturer: splitManufacturer } },
      })) as SplitResponse | undefined;
      const list = res?.DevicesSplit ?? [];
      setSplitDevicesForManufacturer(list);
    } finally {
      setSplitLoading(false);
    }
  }, [splitManufacturer, getDevicesSplit]);

  useEffect(() => {
    if (selectedMontageType !== 'split' || !splitManufacturer) {
      setSplitDevicesForManufacturer([]);
      return;
    }
    fetchSplitByManufacturer();
  }, [selectedMontageType, splitManufacturer, fetchSplitByManufacturer]);

  // Przy zmianie Producenta wyczyść Typ
  useEffect(() => {
    if (!splitManufacturer) setFormValue('splitDeviceType', '');
  }, [splitManufacturer, setFormValue]);

  // Lista do wyświetlenia dla Split = po filtrze Typ (client-side z splitDevicesForManufacturer)
  const filteredDevices =
    splitManufacturer &&
      splitDeviceType &&
      splitDevicesForManufacturer.length > 0
      ? splitDevicesForManufacturer.filter(d => d?.typ === splitDeviceType)
      : [];

  const groupedByModel = useMemo(() => {
    if (filteredDevices.length === 0) return {};
    const grouped: Record<string, Record<string, Device[]>> = {};
    filteredDevices.forEach((device: Device) => {
      const prod = device.producent || '';
      const model = device.nazwa_modelu || '';
      if (!grouped[prod]) grouped[prod] = {};
      if (!grouped[prod][model]) grouped[prod][model] = [];
      grouped[prod][model].push(device);
    });
    return grouped;
  }, [filteredDevices]);

  const navigateBackWithSplit = (device: Device) => {
    try {
      const state = navigation.getState();
      const prevRoute = state.routes[state.index - 1];
      if (prevRoute?.name === 'Settings') {
        const prevParams = prevRoute.params as any;
        (navigation as any).navigate('Settings', {
          installationId: String(prevParams?.installationId || installationId),
          clientId: String(prevParams?.clientId || ''),
          activeTab: prevParams?.activeTab || 'montaz',
          montageTypeResult: 'split',
          selectedDevice: {
            id: device.id,
            producent: device.producent,
            typ: device.typ,
            moc_chlodnicza: device.moc_chlodnicza,
            moc_grzewcza: device.moc_grzewcza,
            nazwa_modelu: device.nazwa_modelu,
            nazwa_jedn_wew: device.nazwa_jedn_wew,
            nazwa_jedn_zew: device.nazwa_jedn_zew,
          } as Device,
        });
        return;
      }
    } catch (_) { }
    navigation.goBack();
  };

  const navigateBackWithMultisplit = (
    internal: Device[],
    aggregates: Device[],
  ) => {
    try {
      const state = navigation.getState();
      const prevRoute = state.routes[state.index - 1];
      if (prevRoute?.name === 'Settings') {
        const prevParams = prevRoute.params as any;
        (navigation as any).navigate('Settings', {
          installationId: String(prevParams?.installationId || installationId),
          clientId: String(prevParams?.clientId || ''),
          activeTab: prevParams?.activeTab || 'montaz',
          montageTypeResult: 'multi_split',
          selectedMultisplitDevices: { internal, aggregates },
        });
        return;
      }
    } catch (_) { }
    navigation.goBack();
  };

  const handleConfirmSplit = () => {
    if (!selectedDevice) {
      Alert.alert('Błąd', 'Wybierz urządzenie');
      return;
    }
    navigateBackWithSplit(selectedDevice);
  };

  const addInternal = useCallback((modelKey: string) => {
    setInternalQuantities(prev => ({
      ...prev,
      [modelKey]: (prev[modelKey] ?? 0) + 1,
    }));
  }, []);

  const subtractInternal = useCallback((modelKey: string) => {
    setInternalQuantities(prev => {
      const current = prev[modelKey] ?? 0;
      if (current <= 0) return prev;
      const next = current - 1;
      const nextState = { ...prev };
      if (next === 0) delete nextState[modelKey];
      else nextState[modelKey] = next;
      return nextState;
    });
  }, []);

  const addAggregate = useCallback((modelKey: string) => {
    setAggregateQuantities(prev => ({
      ...prev,
      [modelKey]: (prev[modelKey] ?? 0) + 1,
    }));
  }, []);

  const subtractAggregate = useCallback((modelKey: string) => {
    setAggregateQuantities(prev => {
      const current = prev[modelKey] ?? 0;
      if (current <= 0) return prev;
      const next = current - 1;
      const nextState = { ...prev };
      if (next === 0) delete nextState[modelKey];
      else nextState[modelKey] = next;
      return nextState;
    });
  }, []);

  const buildMultisplitArrays = (): {
    internal: Device[];
    aggregates: Device[];
  } => {
    const internal: Device[] = [];
    Object.entries(internalGrouped).forEach(([key, devices]) => {
      const qty = internalQuantities[key] ?? 0;
      const representative = devices[0];
      for (let i = 0; i < qty; i++) internal.push(representative);
    });
    const aggregates: Device[] = [];
    Object.entries(aggregateGrouped).forEach(([key, devices]) => {
      const qty = aggregateQuantities[key] ?? 0;
      const representative = devices[0];
      for (let i = 0; i < qty; i++) aggregates.push(representative);
    });
    return { internal, aggregates };
  };

  const handleSaveMultisplit = () => {
    const { internal, aggregates } = buildMultisplitArrays();
    navigateBackWithMultisplit(internal, aggregates);
  };

  // Opcje dropdownów: producenci z API producenci_list
  const splitManufacturerOptions = producerOptions;
  const splitTypeOptions =
    splitManufacturer && splitDevicesForManufacturer.length > 0
      ? Array.from(
        new Set(
          splitDevicesForManufacturer
            .map(d => d?.typ)
            .filter((t): t is string => t != null && t !== ''),
        ),
      ).map(t => ({ label: t, value: t }))
      : [];

  const multisplitProducerOptions = producerOptions;

  // Multisplit: zaciągnij urządzenia po wyborze producenta (z cache)
  const fetchMultisplitByProducer = useCallback(async () => {
    if (!multisplitProducer || !getDevicesMultisplit) return;
    const cached = multisplitCacheRef.current;
    if (
      cached &&
      cached.producer === multisplitProducer &&
      cached.list.length > 0
    ) {
      setMultisplitDevicesForProducer(cached.list);
      setMultisplitLoading(false);
      return;
    }
    setMultisplitLoading(true);
    setMultisplitDevicesForProducer([]);
    setInternalQuantities({});
    setAggregateQuantities({});
    try {
      const res = (await getDevicesMultisplit({
        data: { filters: { manufacturer: multisplitProducer } },
      })) as MultiSplitResponse | undefined;
      const list = res?.DevicesMultiSplit ?? [];
      multisplitCacheRef.current = { producer: multisplitProducer, list };
      setMultisplitDevicesForProducer(list);
    } finally {
      setMultisplitLoading(false);
    }
  }, [multisplitProducer, getDevicesMultisplit]);

  useEffect(() => {
    if (selectedMontageType !== 'multi_split' || !multisplitProducer) {
      setMultisplitDevicesForProducer([]);
      return;
    }
    fetchMultisplitByProducer();
  }, [selectedMontageType, multisplitProducer, fetchMultisplitByProducer]);

  const internalUnits =
    multisplitDevicesForProducer.length > 0
      ? multisplitDevicesForProducer.filter(
        d => (d?.rodzaj ?? '').toLowerCase() !== 'agregat',
      )
      : [];

  const aggregateUnits =
    multisplitDevicesForProducer.length > 0
      ? multisplitDevicesForProducer.filter(
        d => (d?.rodzaj ?? '').toLowerCase() === 'agregat',
      )
      : [];

  /** Klucz modelu do grupowania (ten sam model = ta sama ilość) */
  const getModelKey = useCallback((d: Device) => {
    const name = d.nazwa_modelu_producenta || d.nazwa_modelu || String(d.id);
    const moc = `${d.moc_chlodnicza ?? ''}/${d.moc_grzewcza ?? ''}`;
    return `${d.producent ?? ''}|${name}|${moc}`;
  }, []);

  /** Jednostki wewnętrzne pogrupowane po modelu (jeden wpis = jeden model) */
  const internalGrouped = useMemo(() => {
    const map: Record<string, Device[]> = {};
    internalUnits.forEach(d => {
      const key = getModelKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [internalUnits, getModelKey]);

  /** Agregaty pogrupowane po modelu */
  const aggregateGrouped = useMemo(() => {
    const map: Record<string, Device[]> = {};
    aggregateUnits.forEach(d => {
      const key = getModelKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [aggregateUnits, getModelKey]);

  const renderSplitContent = () => (
    <>
      <View style={styles.filtersRow}>
        <View style={styles.filterHalf}>
          <Text style={styles.filterLabel}>Producent</Text>
          <Dropdown
            name="splitManufacturer"
            control={control}
            label=""
            options={splitManufacturerOptions}
            isBordered
            onChange={(value: string) => {
              setFormValue('splitManufacturer', value);
              setFormValue('splitDeviceType', '');
              setSelectedDevice(null);
            }}
          />
        </View>
        <View style={styles.filterHalf}>
          <Text style={styles.filterLabel}>Typ urządzenia</Text>
          <Dropdown
            name="splitDeviceType"
            control={control}
            label=""
            options={splitTypeOptions}
            isBordered
            onChange={(value: string) => {
              setFormValue('splitDeviceType', value);
              setSelectedDevice(null);
            }}
          />
        </View>
      </View>
      {splitManufacturer && !splitDeviceType && splitLoading && (
        <View style={styles.placeholder}>
          <Text>Ładowanie listy urządzeń…</Text>
        </View>
      )}
      {splitManufacturer &&
        splitDeviceType &&
        !splitLoading &&
        filteredDevices.length === 0 && (
          <Text style={styles.noResults}>
            Brak urządzeń dla wybranych filtrów
          </Text>
        )}
      {splitManufacturer && splitDeviceType && filteredDevices.length > 0 && (
        <View style={styles.devicesList}>
          {Object.entries(groupedByModel).map(([, models]) =>
            Object.entries(models).map(([modelName, devices]) => (
              <View key={modelName} style={styles.modelContainer}>
                <View style={styles.modelHeader}>
                  <Text style={styles.modelText}>{modelName}</Text>
                </View>
                <View style={styles.devicesList}>
                  {devices.map(item => {
                    const isSelected = selectedDevice?.id === item.id;
                    return (
                      <View style={styles.deviceRow} key={item.id}>
                        <View>
                          <View style={styles.deviceTextBlock}>
                            <Text style={styles.deviceText}>
                              {`${item.moc_chlodnicza}/${item.moc_grzewcza} kW`}
                            </Text>
                          </View>
                          <View style={styles.deviceTextBlock}>
                            <Text style={styles.deviceText}>
                              {`${item.cena_katalogowa_netto} zł`}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.deviceActions}>
                          {isSelected ? (
                            <TouchableOpacity
                              style={styles.selectedButton}
                              onPress={() => setSelectedDevice(null)}
                            >
                              <Text style={styles.selectedButtonText}>
                                Wybrane
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.selectButton}
                              onPress={() => setSelectedDevice(item)}
                            >
                              <Text style={styles.selectButtonText}>
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
            )),
          )}
        </View>
      )}
    </>
  );

  const renderMultisplitContent = () => {
    if (multisplitStep === 'producer') {
      return (
        <>
          <Text style={styles.stepTitle}>Wybierz producenta</Text>
          <Dropdown
            name="multisplitProducer"
            control={control}
            label="Producent"
            options={multisplitProducerOptions}
            isBordered
            onChange={(value: string) =>
              setFormValue('multisplitProducer', value)
            }
          />
          {multisplitProducer && multisplitLoading && (
            <View style={styles.placeholder}>
              <Text>Ładowanie listy urządzeń…</Text>
            </View>
          )}
          {multisplitProducer && !multisplitLoading && (
            <SubmitButton
              title="Jednostki wewnętrzne"
              onPress={() => setMultisplitStep('internal')}
              style={styles.stepButton}
            />
          )}
        </>
      );
    }

    if (multisplitStep === 'internal') {
      return (
        <>
          <Text style={styles.stepTitle}>
            Jednostki wewnętrzne ({multisplitProducer})
          </Text>
          <Text style={styles.hint}>
            Ustaw liczbę sztuk dla każdego modelu (przyciski - i +)
          </Text>
          <View style={styles.devicesList}>
            {Object.entries(internalGrouped).map(([modelKey, devices]) => {
              const device = devices[0];
              const label =
                device.nazwa_modelu_producenta ||
                device.nazwa_modelu ||
                `ID ${device.id}`;
              const moc = `${device.moc_chlodnicza}/${device.moc_grzewcza} kW`;
              return (
                <QuantityRow
                  key={modelKey}
                  modelKey={modelKey}
                  label={label}
                  moc={moc}
                  quantity={internalQuantities[modelKey] ?? 0}
                  onAdd={addInternal}
                  onSubtract={subtractInternal}
                  s={styles}
                />
              );
            })}
          </View>
          {internalUnits.length === 0 && (
            <Text style={styles.noResults}>
              Brak jednostek wewnętrznych dla tego producenta
            </Text>
          )}
        </>
      );
    }

    // step === 'aggregates'
    const totalInternal = Object.values(internalQuantities).reduce(
      (a, b) => a + b,
      0,
    );
    const totalAggregates = Object.values(aggregateQuantities).reduce(
      (a, b) => a + b,
      0,
    );
    return (
      <>
        <Text style={styles.stepTitle}>Agregaty ({multisplitProducer})</Text>
        <Text style={styles.hint}>
          Ustaw liczbę sztuk dla każdego modelu (przyciski - i +)
        </Text>
        <View style={styles.devicesList}>
          {Object.entries(aggregateGrouped).map(([modelKey, devices]) => {
            const device = devices[0];
            const label =
              device.nazwa_modelu_producenta ||
              device.nazwa_modelu ||
              `ID ${device.id}`;
            const moc = `${device.moc_chlodnicza}/${device.moc_grzewcza} kW`;
            return (
              <QuantityRow
                key={modelKey}
                modelKey={modelKey}
                label={label}
                moc={moc}
                quantity={aggregateQuantities[modelKey] ?? 0}
                onAdd={addAggregate}
                onSubtract={subtractAggregate}
                s={styles}
              />
            );
          })}
        </View>
        {aggregateUnits.length === 0 && (
          <Text style={styles.noResults}>
            Brak agregatów dla tego producenta
          </Text>
        )}
        <View style={styles.multisplitSummary}>
          <Text style={styles.multisplitSummaryText}>
            Jednostki wewnętrzne: {totalInternal}, Agregaty: {totalAggregates}
          </Text>
        </View>
      </>
    );
  };

  const title =
    selectedMontageType === 'multi_split'
      ? 'Wybierz urządzenia multisplit'
      : 'Wybierz urządzenie';

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ButtonsHeader
          onBackPress={() => {
            if (
              selectedMontageType === 'multi_split' &&
              (multisplitStep === 'aggregates' || multisplitStep === 'internal')
            ) {
              setMultisplitStep(
                multisplitStep === 'aggregates' ? 'internal' : 'producer',
              );
            } else {
              navigation.goBack();
            }
          }}
          title={title}
        />
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {/* Przełącznik typu montażu */}
          <View style={styles.typeToggleRow}>
            <TouchableOpacity
              style={[
                styles.typeToggleButton,
                selectedMontageType === 'split' &&
                  styles.typeToggleButtonActive,
              ]}
              onPress={() => {
                setSelectedMontageType('split');
                setFormValue('splitManufacturer', '');
                setFormValue('splitDeviceType', '');
                setSelectedDevice(null);
                setMultisplitStep('producer');
                setMultisplitDevicesForProducer([]);
                setInternalQuantities({});
                setAggregateQuantities({});
              }}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  selectedMontageType === 'split' &&
                    styles.typeToggleTextActive,
                ]}
              >
                Split
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeToggleButton,
                selectedMontageType === 'multi_split' &&
                  styles.typeToggleButtonActive,
              ]}
              onPress={() => {
                setSelectedMontageType('multi_split');
                setFormValue('multisplitProducer', '');
                setMultisplitStep('producer');
                setMultisplitDevicesForProducer([]);
                setInternalQuantities({});
                setAggregateQuantities({});
                setSelectedDevice(null);
              }}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  selectedMontageType === 'multi_split' &&
                    styles.typeToggleTextActive,
                ]}
              >
                MultiSplit
              </Text>
            </TouchableOpacity>
          </View>

          {selectedMontageType === 'split' && renderSplitContent()}
          {selectedMontageType === 'multi_split' && renderMultisplitContent()}
        </ScrollView>

        <View style={styles.footer}>
          {selectedMontageType === 'split' && (
            <SubmitButton
              disabled={!selectedDevice}
              title="Potwierdź wybór"
              style={styles.submitButton}
              onPress={handleConfirmSplit}
            />
          )}
          {selectedMontageType === 'multi_split' &&
            multisplitStep === 'internal' && (
            <SubmitButton
              title="Przejdź do agregatów"
              style={styles.submitButton}
              onPress={() => setMultisplitStep('aggregates')}
            />
          )}
          {selectedMontageType === 'multi_split' &&
            multisplitStep === 'aggregates' && (
            <SubmitButton
              title="Zapisz"
              style={styles.submitButton}
              onPress={handleSaveMultisplit}
            />
          )}
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
    flex: 1,
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
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterHalf: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: Colors.black,
  },
  placeholder: {
    padding: 24,
    alignItems: 'center',
  },
  noResults: {
    padding: 16,
    textAlign: 'center',
    color: Colors.gray,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 8,
  },
  multisplitSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.offerFilterBackground,
    borderRadius: 8,
  },
  multisplitSummaryText: {
    fontSize: 14,
    fontWeight: '600',
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
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'center',
  },
  typeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  typeToggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderButton,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  typeToggleButtonActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  typeToggleText: {
    fontSize: 13,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  typeToggleTextActive: {
    color: Colors.white,
  },
  divider: {
    marginVertical: 8,
    height: 2,
    color: Colors.gray,
    marginBottom: 10,
  },
});
