import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Divider, Text } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import {
  MultisplitKompletPayload,
  OffersParamList,
} from '../../navigation/types';
import { Device, MultiSplitResponse } from '../../providers/OffersProvider';

type Step = 'internal' | 'aggregate';

type Route = RouteProp<OffersParamList, 'MultisplitKompletFlow'>;

function getModelKey(d: Device): string {
  const name = d.nazwa_modelu_producenta || d.nazwa_modelu || String(d.id);
  const moc = `${d.moc_chlodnicza ?? ''}/${d.moc_grzewcza ?? ''}`;
  return `${d.producent ?? ''}|${name}|${moc}`;
}

function getDeviceLabel(d: Device): string {
  return d.nazwa_modelu_producenta || d.nazwa_modelu || `ID ${d.id}`;
}

export default function MultisplitKompletFlow() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const {
    selectedManufacturers = [],
    selectedDeviceTypes = [],
    declaredInternalCount,
    installationId,
    offerName,
    isTemplate,
    filters = {},
  } = route.params ?? {};

  const [builtKomplety, setBuiltKomplety] = useState<MultisplitKompletPayload[]>(
    [],
  );
  const [currentProducerIndex, setCurrentProducerIndex] = useState(0);
  const [step, setStep] = useState<Step>('internal');
  const [internalQuantities, setInternalQuantities] = useState<
    Record<string, number>
  >({});
  const [selectedAggregateId, setSelectedAggregateId] = useState<number | null>(
    null,
  );

  const currentProducer =
    selectedManufacturers[currentProducerIndex] ?? null;

  const {
    result: devicesResult,
    execute: fetchDevices,
    loading: devicesLoading,
  } = useApi<MultiSplitResponse>({ path: 'devices_multisplit' });

  const [devicesForProducer, setDevicesForProducer] = useState<Device[]>([]);

  useEffect(() => {
    if (!currentProducer || !fetchDevices) return;
    fetchDevices({
      data: {
        filters: {
          manufacturers: [currentProducer],
          device_types: selectedDeviceTypes,
          ...filters,
        },
      },
    });
  }, [currentProducer, selectedDeviceTypes, fetchDevices, filters]);

  useEffect(() => {
    if (devicesResult?.DevicesMultiSplit) {
      setDevicesForProducer(devicesResult.DevicesMultiSplit);
    } else {
      setDevicesForProducer([]);
    }
  }, [devicesResult]);

  const internalUnits = useMemo(
    () =>
      devicesForProducer.filter(
        d => (d?.rodzaj ?? '').toLowerCase() !== 'agregat',
      ),
    [devicesForProducer],
  );

  const aggregateUnits = useMemo(
    () =>
      devicesForProducer.filter(
        d => (d?.rodzaj ?? '').toLowerCase() === 'agregat',
      ),
    [devicesForProducer],
  );

  const internalGrouped = useMemo(() => {
    const map: Record<string, Device[]> = {};
    internalUnits.forEach(d => {
      const key = getModelKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [internalUnits]);

  const totalInternalSelected = useMemo(
    () => Object.values(internalQuantities).reduce((a, b) => a + b, 0),
    [internalQuantities],
  );

  const isValidInternalCount = totalInternalSelected === declaredInternalCount;

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

  const buildInternalIds = useCallback((): number[] => {
    const ids: number[] = [];
    Object.entries(internalGrouped).forEach(([key, devices]) => {
      const qty = internalQuantities[key] ?? 0;
      const rep = devices[0];
      if (rep) for (let i = 0; i < qty; i++) ids.push(rep.id);
    });
    return ids;
  }, [internalGrouped, internalQuantities]);

  const goToAggregateStep = useCallback(() => {
    if (!isValidInternalCount) {
      Alert.alert(
        'Niekompletny wybór',
        `Oferta na ${declaredInternalCount} jednostek wewnętrznych, wybrano ${totalInternalSelected}. Proszę dobrać dokładnie ${declaredInternalCount}.`,
      );
      return;
    }
    setStep('aggregate');
    setSelectedAggregateId(null);
  }, [
    declaredInternalCount,
    isValidInternalCount,
    totalInternalSelected,
  ]);

  const saveKompletAndNextProducer = useCallback(() => {
    if (!selectedAggregateId || !currentProducer) {
      Alert.alert('Błąd', 'Wybierz jeden agregat.');
      return;
    }
    const internalIds = buildInternalIds();
    const newKomplet: MultisplitKompletPayload = {
      producent: currentProducer,
      internal_ids: internalIds,
      aggregate_ids: [selectedAggregateId],
    };
    const nextIndex = currentProducerIndex + 1;
    setBuiltKomplety(prev => [...prev, newKomplet]);
    setInternalQuantities({});
    setSelectedAggregateId(null);
    setStep('internal');

    if (nextIndex >= selectedManufacturers.length) {
      const allKomplety = [...builtKomplety, newKomplet];
      const allDeviceIds: number[] = [];
      allKomplety.forEach(k => {
        k.internal_ids.forEach(id => allDeviceIds.push(id));
        k.aggregate_ids.forEach(id => allDeviceIds.push(id));
      });
      navigation.navigate('AddSurchargeForm', {
        type: 'multi_split',
        installationId: installationId ?? null,
        devices: allDeviceIds,
        offerName,
        isTemplate,
        multisplit_komplety: allKomplety,
      });
    } else {
      setCurrentProducerIndex(nextIndex);
    }
  }, [
    builtKomplety,
    buildInternalIds,
    currentProducer,
    currentProducerIndex,
    installationId,
    isTemplate,
    navigation,
    offerName,
    selectedAggregateId,
    selectedManufacturers.length,
  ]);

  const addAnotherKompletSameProducer = useCallback(() => {
    if (!selectedAggregateId || !currentProducer) {
      Alert.alert('Błąd', 'Wybierz jeden agregat.');
      return;
    }
    const internalIds = buildInternalIds();
    const newKomplet: MultisplitKompletPayload = {
      producent: currentProducer,
      internal_ids: internalIds,
      aggregate_ids: [selectedAggregateId],
    };
    setBuiltKomplety(prev => [...prev, newKomplet]);
    setInternalQuantities({});
    setSelectedAggregateId(null);
    setStep('internal');
  }, [buildInternalIds, currentProducer, selectedAggregateId]);

  const goBackFromAggregate = useCallback(() => {
    setStep('internal');
    setSelectedAggregateId(null);
  }, []);

  const sumInternalPower = useMemo(() => {
    let sum = 0;
    Object.entries(internalGrouped).forEach(([key, devices]) => {
      const qty = internalQuantities[key] ?? 0;
      const rep = devices[0];
      if (rep && rep.moc_chlodnicza) sum += Number(rep.moc_chlodnicza) * qty;
    });
    return sum;
  }, [internalGrouped, internalQuantities]);

  const aggregatesSorted = useMemo(() => {
    const withCapacity = [...aggregateUnits].filter(
      a => (a.maks_ilosc_jedn_wew ?? 0) >= declaredInternalCount,
    );
    if (withCapacity.length === 0) {
      return { suggested: [] as Device[], rest: [] as Device[] };
    }

    const getPower = (a: Device) => Number(a.moc_chlodnicza ?? 0);

    // Podział na agregaty słabsze i mocniejsze/idealne względem sumarycznej mocy
    const below = withCapacity.filter(a => getPower(a) < sumInternalPower);
    const aboveOrEqual = withCapacity.filter(
      a => getPower(a) >= sumInternalPower,
    );

    const allSortedByDiff = [...withCapacity].sort(
      (a, b) =>
        Math.abs(getPower(a) - sumInternalPower) -
        Math.abs(getPower(b) - sumInternalPower),
    );

    const pickClosest = (list: Device[], excludeIds: Set<number>) => {
      return list
        .filter(a => !excludeIds.has(a.id))
        .sort(
          (a, b) =>
            Math.abs(getPower(a) - sumInternalPower) -
            Math.abs(getPower(b) - sumInternalPower),
        )[0];
    };

    const suggested: Device[] = [];
    const usedIds = new Set<number>();

    // 1) Agregat idealny – najbliższa moc do sumy
    const ideal = allSortedByDiff[0];
    if (ideal) {
      suggested.push(ideal);
      usedIds.add(ideal.id);
    }

    // 2) Agregat słabszy – najbliżej od dołu
    const weaker = pickClosest(below, usedIds);
    if (weaker) {
      suggested.push(weaker);
      usedIds.add(weaker.id);
    }

    // 3) Agregat mocniejszy – najbliżej od góry (>= sumInternalPower)
    const stronger = pickClosest(aboveOrEqual, usedIds);
    if (stronger) {
      suggested.push(stronger);
      usedIds.add(stronger.id);
    }

    // Uzupełnij do maks. 3 propozycji, jeśli brakuje kandydatów
    if (suggested.length < 3) {
      for (const agg of allSortedByDiff) {
        if (suggested.length >= 3) break;
        if (!usedIds.has(agg.id)) {
          suggested.push(agg);
          usedIds.add(agg.id);
        }
      }
    }

    const rest = withCapacity.filter(a => !usedIds.has(a.id));
    return { suggested, rest };
  }, [aggregateUnits, declaredInternalCount, sumInternalPower]);

  const canProceedFromAggregate =
    selectedAggregateId != null && selectedManufacturers.length > 0;

  if (selectedManufacturers.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Brak wybranych producentów.</Text>
      </View>
    );
  }

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
            if (step === 'aggregate') goBackFromAggregate();
            else if (currentProducerIndex > 0) {
              setCurrentProducerIndex(prev => prev - 1);
              setStep('internal');
              setInternalQuantities({});
            } else navigation.goBack();
          }}
          title={`Komplet: ${currentProducer ?? ''}`}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {step === 'internal' && (
            <>
              <Text style={styles.stepTitle}>
                Jednostki wewnętrzne ({currentProducer})
              </Text>
              <Text style={styles.hint}>
                Wybierz łącznie {declaredInternalCount} jednostek. Wybrano:{' '}
                {totalInternalSelected}.
                {!isValidInternalCount && totalInternalSelected > 0 && (
                  <Text style={styles.validationError}>
                    {' '}
                    Oferta na {declaredInternalCount}, wybrano{' '}
                    {totalInternalSelected}. Proszę dobrać dokładnie{' '}
                    {declaredInternalCount}.
                  </Text>
                )}
              </Text>
              {devicesLoading ? (
                <Text style={styles.loading}>Ładowanie…</Text>
              ) : (
                Object.entries(internalGrouped).map(([modelKey, devices]) => {
                  const device = devices[0];
                  const label = device ? getDeviceLabel(device) : '';
                  const moc = `${device?.moc_chlodnicza ?? ''} kW`;
                  const qty = internalQuantities[modelKey] ?? 0;
                  return (
                    <View key={modelKey} style={styles.deviceRow}>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceLabel}>{label}</Text>
                        <Text style={styles.deviceMoc}>{moc}</Text>
                      </View>
                      <View style={styles.quantityRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => subtractInternal(modelKey)}
                          disabled={qty <= 0}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => addInternal(modelKey)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
              {!devicesLoading && internalUnits.length === 0 && (
                <Text style={styles.noResults}>
                  Brak jednostek wewnętrznych dla tego producenta i typów.
                </Text>
              )}
              <SubmitButton
                title="Dalej – wybór agregatu"
                style={styles.primaryButton}
                onPress={goToAggregateStep}
                disabled={!isValidInternalCount}
              />
            </>
          )}

          {step === 'aggregate' && (
            <>
              <Text style={styles.stepTitle}>Agregat ({currentProducer})</Text>
              <Text style={styles.hint}>
                Wybierz jeden agregat do tego kompletu.
              </Text>
              {sumInternalPower > 0 && (
                <Text style={styles.hint}>
                  Sumaryczna moc wybranych jednostek wewnętrznych:{' '}
                  {sumInternalPower.toFixed(2)} kW
                </Text>
              )}

              {aggregatesSorted.suggested.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>
                    Sugerowane agregaty (dopasowane do mocy)
                  </Text>
                  {aggregatesSorted.suggested.map(agg => (
                    <TouchableOpacity
                      key={agg.id}
                      style={[
                        styles.aggregateItem,
                        selectedAggregateId === agg.id &&
                          styles.aggregateItemSelected,
                      ]}
                      onPress={() => setSelectedAggregateId(agg.id)}
                    >
                      <Text style={styles.aggregateName}>
                        {getDeviceLabel(agg)}
                      </Text>
                      <Text style={styles.aggregateMoc}>
                        {agg.moc_chlodnicza} kW, max {agg.maks_ilosc_jedn_wew}{' '}
                        jedn. wewn.
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {aggregatesSorted.rest.length > 0 && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.sectionLabel}>Pozostałe agregaty</Text>
                  {aggregatesSorted.rest.map(agg => (
                    <TouchableOpacity
                      key={agg.id}
                      style={[
                        styles.aggregateItem,
                        selectedAggregateId === agg.id &&
                          styles.aggregateItemSelected,
                      ]}
                      onPress={() => setSelectedAggregateId(agg.id)}
                    >
                      <Text style={styles.aggregateName}>
                        {agg.nazwa_modelu_producenta || agg.nazwa_modelu || agg.id}
                      </Text>
                      <Text style={styles.aggregateMoc}>
                        {agg.moc_chlodnicza} kW, max {agg.maks_ilosc_jedn_wew}{' '}
                        jedn. wewn.
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {aggregatesSorted.suggested.length === 0 &&
                aggregatesSorted.rest.length === 0 && (
                  <Text style={styles.noResults}>
                    Brak agregatów spełniających wymagania (min.{' '}
                    {declaredInternalCount} jedn. wewn.).
                  </Text>
                )}

              <SubmitButton
                title="Dodaj kolejny komplet tego samego producenta"
                style={styles.secondaryButton}
                onPress={addAnotherKompletSameProducer}
                disabled={!canProceedFromAggregate}
              />
              <SubmitButton
                title={
                  currentProducerIndex + 1 >= selectedManufacturers.length
                    ? 'Zapisz i przejdź do narzutów'
                    : 'Zapisz i następny producent'
                }
                style={styles.primaryButton}
                onPress={saveKompletAndNextProducer}
                disabled={!canProceedFromAggregate}
              />
            </>
          )}
        </ScrollView>
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
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.black,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 16,
  },
  validationError: {
    color: Colors.red || '#c00',
  },
  loading: {
    padding: 16,
    color: Colors.gray,
  },
  noResults: {
    padding: 16,
    color: Colors.gray,
    fontStyle: 'italic',
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider || '#eee',
  },
  deviceInfo: { flex: 1 },
  deviceLabel: { fontSize: 14, color: Colors.black },
  deviceMoc: { fontSize: 12, color: Colors.gray },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, color: '#fff', fontWeight: '600' },
  qtyValue: { fontSize: 16, minWidth: 24, textAlign: 'center' },
  primaryButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.teal,
    marginTop: 16,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.gray,
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: Colors.black,
  },
  divider: { marginVertical: 16 },
  aggregateItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.divider || '#eee',
    marginBottom: 8,
  },
  aggregateItemSelected: {
    borderColor: Colors.teal,
    backgroundColor: Colors.backgroundTeal,
  },
  aggregateName: { fontSize: 14, fontWeight: '600', color: Colors.black },
  aggregateMoc: { fontSize: 12, color: Colors.gray, marginTop: 4 },
});
