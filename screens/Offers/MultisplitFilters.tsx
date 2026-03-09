import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import { Dropdown, FormInput } from '../../components/Input';
import MultiSelectModal from '../../components/MultiSelectModal';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { OffersParamList } from '../../navigation/types';
import { Device, MultiSplitResponse } from '../../providers/OffersProvider';

type FormValues = {
  manufacturers: string[];
  device_types: string[];
  declaredInternalCount: string;
  coolPowerFrom?: string;
  coolPowerTo?: string;
  heatPowerFrom?: string;
  heatPowerTo?: string;
  color?: string;
  wifi?: number | null;
};

type Route = RouteProp<OffersParamList, 'MultisplitFilters'>;

export default function MultisplitFilters() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { installationId, offerName, isTemplate } = route.params ?? {};
  const { result: devicesResult, execute: fetchDevices } = useApi<
    MultiSplitResponse
  >({ path: 'devices_multisplit' });

  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      manufacturers: [],
      device_types: [],
      declaredInternalCount: '',
      coolPowerFrom: '',
      coolPowerTo: '',
      heatPowerFrom: '',
      heatPowerTo: '',
      color: '',
      wifi: null,
    },
  });

  const selectedManufacturers = watch('manufacturers') ?? [];
  const selectedDeviceTypes = watch('device_types') ?? [];
  const declaredInternalCountStr = watch('declaredInternalCount') ?? '';
  const coolPowerFrom = watch('coolPowerFrom') ?? '';
  const coolPowerTo = watch('coolPowerTo') ?? '';
  const heatPowerFrom = watch('heatPowerFrom') ?? '';
  const heatPowerTo = watch('heatPowerTo') ?? '';
  const selectedColor = watch('color') ?? '';
  const selectedWifi = watch('wifi');

  const { result: producersResult, execute: fetchProducers } = useApi<{
    producers: string[];
  }>({ path: 'producenci_list', authorized: false });

  const [producerOptions, setProducerOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [deviceTypesOptions, setDeviceTypesOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [colorOptions, setColorOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (fetchProducers) fetchProducers({ data: {} });
  }, [fetchProducers]);

  useEffect(() => {
    if (producersResult?.producers?.length) {
      const opts = producersResult.producers
        .filter((p): p is string => p != null && p !== '')
        .map(p => ({ label: p, value: p }));
      setProducerOptions(opts);
    }
  }, [producersResult]);

  useEffect(() => {
    if (selectedManufacturers.length === 0) {
      setDeviceTypesOptions([]);
      setColorOptions([]);
      return;
    }
    if (fetchDevices) {
      fetchDevices({
        data: {
          filters: {
            manufacturers: selectedManufacturers,
            coolPowerFrom: coolPowerFrom || undefined,
            coolPowerTo: coolPowerTo || undefined,
            heatPowerFrom: heatPowerFrom || undefined,
            heatPowerTo: heatPowerTo || undefined,
            color: selectedColor || undefined,
            wifi: selectedWifi ?? undefined,
          },
        },
      });
    }
  }, [
    selectedManufacturers,
    fetchDevices,
    coolPowerFrom,
    coolPowerTo,
    heatPowerFrom,
    heatPowerTo,
    selectedColor,
    selectedWifi,
  ]);

  useEffect(() => {
    const list = devicesResult?.DevicesMultiSplit ?? [];
    if (list.length === 0 && selectedManufacturers.length > 0) return;
    const internalTypes = new Set<string>();
    const colors = new Set<string>();
    list.forEach((d: Device) => {
      if ((d?.rodzaj ?? '').toLowerCase() !== 'agregat') {
        const t = (d.typ_jedn_wew ?? d.typ ?? '').trim();
        if (t) internalTypes.add(t);
      }
      const color = (d.kolor ?? '').trim();
      if (color) colors.add(color);
    });
    const typesOpts = Array.from(internalTypes)
      .sort()
      .map(t => ({ label: t, value: t }));
    setDeviceTypesOptions(typesOpts);
    const colorsOpts = Array.from(colors)
      .sort()
      .map(c => ({ label: c, value: c }));
    setColorOptions(colorsOpts);
  }, [devicesResult, selectedManufacturers.length]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      const manufacturers = (data.manufacturers ?? []).filter(Boolean);
      const deviceTypes = (data.device_types ?? []).filter(Boolean);
      const count = parseInt(data.declaredInternalCount ?? '0', 10);
      const {
        coolPowerFrom: cFrom,
        coolPowerTo: cTo,
        heatPowerFrom: hFrom,
        heatPowerTo: hTo,
        color,
        wifi,
      } = data;

      if (manufacturers.length === 0) {
        Alert.alert('Błąd', 'Wybierz przynajmniej jednego producenta.');
        return;
      }
      if (deviceTypes.length === 0) {
        Alert.alert('Błąd', 'Wybierz przynajmniej jeden typ urządzenia.');
        return;
      }
      if (!Number.isInteger(count) || count < 1) {
        Alert.alert(
          'Błąd',
          'Deklarowana liczba jednostek wewnętrznych musi być liczbą większą od zera.',
        );
        return;
      }

      const sortedManufacturers = [...manufacturers].sort();
      const filters: Record<string, any> = {};
      if (cFrom) filters.coolPowerFrom = cFrom;
      if (cTo) filters.coolPowerTo = cTo;
      if (hFrom) filters.heatPowerFrom = hFrom;
      if (hTo) filters.heatPowerTo = hTo;
      if (color) filters.color = color;
      if (wifi !== null && wifi !== undefined) filters.wifi = wifi;

      navigation.navigate('MultisplitKompletFlow', {
        selectedManufacturers: sortedManufacturers,
        selectedDeviceTypes: deviceTypes,
        declaredInternalCount: count,
        installationId: installationId ?? null,
        offerName,
        isTemplate,
        filters,
      });
    },
    [installationId, offerName, isTemplate, navigation],
  );

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ButtonsHeader
          onBackPress={() => navigation.goBack()}
          title="Oferta multisplit – filtry"
        />
        <View style={styles.content}>
          <Text style={styles.title}>Ustaw filtry oferty</Text>
          <Text style={styles.hint}>
            Wybierz producentów i typy urządzeń, oraz podaj łączną liczbę
            jednostek wewnętrznych w ofercie.
          </Text>

          <MultiSelectModal
            name="manufacturers"
            control={control}
            label="Producenci"
            options={producerOptions}
            placeholder="Wybierz producentów..."
            isBordered
            customWidth="100%"
          />

          <MultiSelectModal
            name="device_types"
            control={control}
            label="Typy urządzeń"
            options={deviceTypesOptions}
            placeholder={
              selectedManufacturers.length === 0
                ? 'Najpierw wybierz producentów'
                : 'Wybierz typy...'
            }
            isBordered
            customWidth="100%"
            disabled={selectedManufacturers.length === 0}
          />

          <FormInput
            name="declaredInternalCount"
            control={control}
            label="Deklarowana liczba jednostek wewnętrznych"
            placeholder="np. 4"
            keyboardType="number-pad"
            rules={{ required: 'Podaj liczbę jednostek' }}
          />

          <Text style={styles.sectionTitle}>Dodatkowe filtry (opcjonalne)</Text>
          <View>
            <Text style={styles.sectionHint}>Moc chłodnicza urządzeń (kW)</Text>
            <View style={styles.rangeRow}>
              <View style={styles.rangeInput}>
                <FormInput
                  name="coolPowerFrom"
                  control={control}
                  label="Od"
                  keyboardType="numeric"
                  placeholder="np. 2.5"
                  isMarginBottom={false}
                />
              </View>
              <View style={styles.rangeInput}>
                <FormInput
                  name="coolPowerTo"
                  control={control}
                  label="Do"
                  keyboardType="numeric"
                  placeholder="np. 7.0"
                  isMarginBottom={false}
                />
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionHint}>Moc grzewcza urządzeń (kW)</Text>
            <View style={styles.rangeRow}>
              <View style={styles.rangeInput}>
                <FormInput
                  name="heatPowerFrom"
                  control={control}
                  label="Od"
                  keyboardType="numeric"
                  placeholder="np. 2.5"
                  isMarginBottom={false}
                />
              </View>
              <View style={styles.rangeInput}>
                <FormInput
                  name="heatPowerTo"
                  control={control}
                  label="Do"
                  keyboardType="numeric"
                  placeholder="np. 7.0"
                  isMarginBottom={false}
                />
              </View>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Dropdown
              name="color"
              control={control}
              label="Kolor jednostek"
              options={colorOptions}
              customWidth="100%"
              isBordered
              isSmall
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <Dropdown
              name="wifi"
              control={control}
              label="Sterowanie WiFi"
              options={[
                { label: 'Dowolne', value: null },
                { label: 'Tak', value: 1 },
                { label: 'Nie', value: 0 },
              ]}
              customWidth="100%"
              isBordered
              isSmall
            />
          </View>

          <SubmitButton
            title="Rozpocznij"
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
            disabled={
              selectedManufacturers.length === 0 ||
              selectedDeviceTypes.length === 0 ||
              !declaredInternalCountStr.trim()
            }
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
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.black,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 24,
  },
  submitButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.teal,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
    color: Colors.black,
  },
  sectionHint: {
    fontSize: 11,
    color: Colors.gray,
    marginBottom: 4,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
});
