import { Text } from '@rneui/themed';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import {
  MultisplitKompletPayload,
  OffersParamList,
} from '../../navigation/types';
import useOffers, {
  Device,
  MultiSplitResponse,
} from '../../providers/OffersProvider';

type FormValues = { multisplitProducer: string };
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

type Props = StackScreenProps<OffersParamList, 'MultisplitAddKomplet'>;

export default function MultisplitAddKomplet({ navigation, route }: Props) {
  const { installationId, offerName, isTemplate, existingKomplety } =
    route.params ?? { existingKomplety: [] };
  const { getDevicesMultisplit } = useOffers();
  const { control, setValue: setFormValue } = useForm<FormValues>({
    defaultValues: { multisplitProducer: '' },
  });
  const multisplitProducer =
    useWatch({ control, name: 'multisplitProducer', defaultValue: '' }) ?? '';

  const [multisplitStep, setMultisplitStep] =
    useState<MultisplitStep>('producer');
  const [multisplitDevicesForProducer, setMultisplitDevicesForProducer] =
    useState<Device[]>([]);
  const [multisplitLoading, setMultisplitLoading] = useState(false);
  const [internalQuantities, setInternalQuantities] = useState<
    Record<string, number>
  >({});
  const [aggregateQuantities, setAggregateQuantities] = useState<
    Record<string, number>
  >({});
  const multisplitCacheRef = useRef<{
    producer: string;
    list: Device[];
  } | null>(null);

  const { result: producersResult, execute: fetchProducers } = useApi<{
    producers: string[];
  }>({ path: 'producenci_list', authorized: false });

  const [producerOptions, setProducerOptions] = useState<
    { label: string; value: string }[]
  >([]);

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
    if (!multisplitProducer) {
      setMultisplitDevicesForProducer([]);
      return;
    }
    fetchMultisplitByProducer();
  }, [multisplitProducer, fetchMultisplitByProducer]);

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

  const getModelKey = useCallback((d: Device) => {
    const name = d.nazwa_modelu_producenta || d.nazwa_modelu || String(d.id);
    const moc = `${d.moc_chlodnicza ?? ''}/${d.moc_grzewcza ?? ''}`;
    return `${d.producent ?? ''}|${name}|${moc}`;
  }, []);

  const internalGrouped = useMemo(() => {
    const map: Record<string, Device[]> = {};
    internalUnits.forEach(d => {
      const key = getModelKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [internalUnits, getModelKey]);

  const aggregateGrouped = useMemo(() => {
    const map: Record<string, Device[]> = {};
    aggregateUnits.forEach(d => {
      const key = getModelKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [aggregateUnits, getModelKey]);

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

  const handleSaveKomplet = () => {
    const { internal, aggregates } = buildMultisplitArrays();
    if (internal.length === 0 && aggregates.length === 0) {
      Alert.alert(
        'Błąd',
        'Dodaj co najmniej jedną jednostkę wewnętrzną lub agregat',
      );
      return;
    }
    const payload: MultisplitKompletPayload = {
      producent: multisplitProducer,
      internal_ids: internal.map(d => d.id),
      aggregate_ids: aggregates.map(d => d.id),
    };
    navigation.navigate('MultisplitKompletyList', {
      installationId: installationId ?? null,
      offerName,
      isTemplate,
      komplety: [...(existingKomplety ?? []), payload],
    });
  };

  const renderContent = () => {
    if (multisplitStep === 'producer') {
      return (
        <>
          <Text style={styles.stepTitle}>Wybierz producenta</Text>
          <Dropdown
            name="multisplitProducer"
            control={control}
            label="Producent"
            options={producerOptions}
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
              multisplitStep === 'aggregates' ||
              multisplitStep === 'internal'
            ) {
              setMultisplitStep(
                multisplitStep === 'aggregates' ? 'internal' : 'producer',
              );
            } else {
              navigation.goBack();
            }
          }}
          title="Dodaj komplet"
        />
        <ScrollView
          style={styles.scrollContainer}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
        <View style={styles.footer}>
          {multisplitStep === 'producer' && (
            <SubmitButton
              title="Jednostki wewnętrzne"
              onPress={() => setMultisplitStep('internal')}
              style={styles.footerButton}
              disabled={!multisplitProducer || multisplitLoading}
            />
          )}
          {multisplitStep === 'internal' && (
            <SubmitButton
              title="Przejdź do agregatów"
              onPress={() => setMultisplitStep('aggregates')}
              style={styles.footerButton}
            />
          )}
          {multisplitStep === 'aggregates' && (
            <SubmitButton
              title="Zapisz komplet"
              style={styles.footerButtonPrimary}
              onPress={handleSaveKomplet}
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
    marginVertical: 20,
    gap: 12,
  },
  footerButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.teal,
  },
  footerButtonPrimary: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.offersTeal,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 8,
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
  devicesList: {
    marginTop: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  deviceTextBlock: {
    flex: 1,
  },
  deviceText: {
    fontSize: 14,
    color: Colors.black,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  multisplitSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.backgroundTeal,
    borderRadius: 8,
  },
  multisplitSummaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
