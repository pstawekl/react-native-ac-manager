/* eslint-disable react-native/no-inline-styles */
import { Route, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Divider } from '@rneui/base';
import { Text } from '@rneui/themed';
import { useCallback, useEffect, useState } from 'react';
import { Control, useForm } from 'react-hook-form';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { ButtonGroup, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import DatePicker from '../../components/DatePicker';
import FilePicker, { File } from '../../components/FilePicker';
import EditIcon from '../../components/icons/EditIcon';
import { Dropdown, FormInput, Textarea } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useMontages, { Montage } from '../../providers/MontageProvider';
import useOffers, { Device } from '../../providers/OffersProvider';

type MontageData = Montage & {
  // Dodatkowe pola dla formularza
  deviceManufacturer?: string;
  deviceType?: string;
  device_split?: number;
  deviceModel?: string;
  devicePower?: string;
  dlugosc_instalacji?: number | string;
  gwarancja_photo?: File | undefined;
  unitName?: string;
  indoorUnitName?: string;
  outdoorUnitName?: string;
  nominalCoolingCapacity?: string;
  nominalHeatingCapacity?: string;
};

const montageDefaultValues = {
  cisnienie: undefined,
  data_montazu: new Date(),
  split_multisplit: null,
  deviceManufacturer: '',
  deviceType: '',
  devicePower: '',
  dlugosc_instalacji: undefined,
  gaz: undefined,
  gaz_ilos: undefined,
  gaz_ilosc_dodana: undefined,
  gwarancja: undefined,
  gwarancja_photo: undefined,
  liczba_przegladow: undefined,
  miejsce_i_sposob_montazu_jedn_zew: undefined,
  miejsce_i_sposob_montazu_jedn_zew_photo: undefined,
  miejsce_montazu_jedn_wew: undefined,
  miejsce_montazu_jedn_wew_photo: undefined,
  miejsce_montazu_jedn_zew: undefined,
  miejsce_montazu_jedn_zew_photo: undefined,
  miejsce_podlaczenia_elektryki: undefined,
  miejsce_skroplin: undefined,
  nr_seryjny_jedn_wew: undefined,
  nr_seryjny_jedn_wew_photo: undefined,
  nr_seryjny_jedn_zew: undefined,
  nr_seryjny_jedn_zew_photo: undefined,
  przegrzanie: undefined,
  sposob_skroplin: undefined,
  temp_chlodzenia: undefined,
  temp_grzania: undefined,
  temp_wew_montazu: undefined,
  temp_zew_montazu: undefined,
  uwagi: undefined,

  // Nowe pola - Przeprowadzone czynności
  kontrola_stanu_technicznego_jedn_wew: undefined,
  kontrola_stanu_technicznego_jedn_zew: undefined,
  kontrola_stanu_mocowania_agregatu: undefined,
  czyszczenie_filtrow_jedn_wew: undefined,
  czyszczenie_wymiennika_ciepla_jedn_wew: undefined,
  czyszczenie_obudowy_jedn_wew: undefined,
  czyszczenie_tacy_skroplin: undefined,
  kontrola_droznosci_odplywu_skroplin: undefined,
  czyszczenie_obudowy_jedn_zew: undefined,
  czyszczenie_wymiennika_ciepla_jedn_zew: undefined,
  kontrola_szczelnosci_instalacji: undefined,
  kontrola_poprawnosci_dzialania: undefined,

  // Dodatkowe pola
  kontrola_temperatury_nawiewu: undefined,
  diagnostyka_awarii_urzadzen: undefined,
};

export function InstallationToolForm(props: {
  control: any;
  setType?: (type: string | undefined) => void;
  setSplitManufacturer?: (manufacturer: string | undefined) => void;
  setDeviceType?: (type: string | undefined) => void;
}) {
  const { control, setType, setSplitManufacturer, setDeviceType } = props;

  const [type, setTypeLocal] = useState<string | undefined>(undefined);
  const [splitManufacturer, setSplitManufacturerLocal] = useState<
    string | undefined
  >();
  const [multisplitManufacturer, setMultisplitManufacturer] = useState<
    string | undefined
  >();
  const [aggregate, setAggregate] = useState<string | undefined>();
  const [deviceType, setDeviceTypeLocal] = useState<string | undefined>();

  // Użyj przekazanych funkcji lub lokalnych stanów
  const handleSetType = setType || setTypeLocal;
  const handleSetSplitManufacturer =
    setSplitManufacturer || setSplitManufacturerLocal;
  const handleSetDeviceType = setDeviceType || setDeviceTypeLocal;
  const [devicesList, setDevicesList] = useState<Device[]>();

  const {
    devicesSplit,
    devicesMultisplit,
    getDevicesSplit,
    getDevicesMultisplit,
  } = useOffers();

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

  return (
    <View>
      <View style={{ gap: -14 }}>
        <View style={styles.formContainer}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.label}>Data montażu</Text>
            <View>
              <DatePicker
                name="data_montazu"
                control={control}
                color={Colors.rose}
              />
            </View>
          </View>
          <Dropdown
            name="gwarancja"
            control={control}
            label="Długość okresu gwarancji (lata)"
            options={Array.from({ length: 10 }, (_, index) => ({
              label: `${index + 1}`,
              value: index + 1,
            }))}
            isBordered={false}
            zIndex={10}
          />
        </View>
        <View style={styles.formContainer}>
          <Dropdown
            name="liczba_przegladow"
            control={control}
            label="Liczba przeglądów w roku"
            options={Array.from({ length: 4 }, (_, index) => ({
              label: String(index + 1),
              value: index + 1,
            }))}
            isBordered={false}
            isThin
            customWidth="48%"
            zIndex={9}
          />
          <Dropdown
            name="split_multisplit"
            control={control}
            label="Split / MultiSplit"
            options={[
              {
                label: 'Split',
                value: 'split',
              },
              {
                label: 'MultiSplit',
                value: 'multi_split',
              },
            ]}
            isBordered
            isThin
            customWidth="48%"
            zIndex={9}
            onChange={handleSetType}
          />
        </View>
        {type === 'split' && devicesList && devicesList?.length > 0 && (
          <>
            <View style={styles.formContainer}>
              <Dropdown
                name="deviceManufacturer"
                control={control}
                label="Producent urządzenia"
                options={Array.from(
                  new Set(devicesList.map(item => item.producent)),
                ).map(item => ({
                  label: item,
                  value: item,
                }))}
                isBordered
                isThin
                customWidth="48%"
                zIndex={8}
                onChange={handleSetSplitManufacturer}
              />
              {splitManufacturer && (
                <Dropdown
                  name="deviceType"
                  control={control}
                  label="Typ urządzenia"
                  options={Array.from(
                    new Set(
                      devicesList
                        .filter(item => item.producent === splitManufacturer)
                        .map(item => item.typ),
                    ),
                  ).map(item => ({
                    label: item,
                    value: item,
                  }))}
                  isBordered
                  isThin
                  customWidth="48%"
                  zIndex={8}
                  onChange={handleSetDeviceType}
                />
              )}
            </View>
            {splitManufacturer && deviceType && (
              <Dropdown
                name="device_split"
                control={control}
                label="Model urządzenia"
                options={Array.from(
                  new Set(
                    devicesList.filter(
                      item =>
                        item.producent === splitManufacturer &&
                        item.typ === deviceType,
                    ),
                  ),
                ).map(item => ({
                  label: item.nazwa_modelu_producenta,
                  value: item.id,
                }))}
                isBordered
                isThin
                customWidth="48%"
                zIndex={7}
              />
            )}
          </>
        )}
        {type === 'multi_split' && devicesList && devicesList?.length > 0 && (
          <>
            <View style={styles.formContainer}>
              <Dropdown
                name="deviceManufacturer"
                control={control}
                label="Producent urządzenia"
                options={Array.from(
                  new Set(
                    devicesList
                      .filter(item => item.rodzaj === 'agregat')
                      .map(item => item.producent),
                  ),
                ).map(item => ({
                  label: item,
                  value: item,
                }))}
                isBordered
                isThin
                customWidth="48%"
                zIndex={8}
                onChange={setMultisplitManufacturer}
              />
              {multisplitManufacturer && (
                <Dropdown
                  name="aggregate"
                  control={control}
                  label="Agregat"
                  options={Array.from(
                    new Set(
                      devicesList
                        .filter(
                          item =>
                            item.rodzaj === 'agregat' &&
                            item.producent === multisplitManufacturer,
                        )
                        .map(item => item.nazwa_modelu_producenta),
                    ),
                  ).map(item => ({
                    label: item,
                    value: item,
                  }))}
                  isBordered
                  isThin
                  customWidth="48%"
                  zIndex={8}
                  onChange={setAggregate}
                />
              )}
            </View>
            {aggregate && multisplitManufacturer && (
              <View style={styles.formContainer}>
                {Array.from({
                  length: devicesList.filter(
                    item => item.nazwa_modelu_producenta === aggregate,
                  )[0].maks_ilosc_jedn_wew,
                }).map((_item, index) => (
                  <Dropdown
                    name={`devices_multisplit.${index}`}
                    control={control}
                    label={`Urządzenie ${index + 1}`}
                    options={Array.from(
                      new Set(
                        devicesList.filter(
                          device =>
                            device.rodzaj !== 'agregat' &&
                            device.producent === multisplitManufacturer,
                        ),
                      ),
                    ).map(device => ({
                      label: device.nazwa_modelu_producenta,
                      value: device.id,
                    }))}
                    isBordered
                    isThin
                    customWidth="48%"
                    zIndex={index > 1 ? 7 - Math.floor((index - 2) / 2) : 7}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
      <View style={{ marginBottom: 24 }}>
        <View style={styles.deviceRow}>
          <Text>Nazwa urządzenia</Text>
          <Text />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.deviceRow}>
          <Text style={styles.rowText}>Nazwa jednostki:</Text>
          <Text style={[styles.rowText, styles.boldText]}>CO18</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.deviceRow}>
          <Text style={styles.rowText}>Nazwa jednostki wewnętrznej:</Text>
          <Text style={[styles.rowText, styles.boldText]} />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.deviceRow}>
          <Text style={styles.rowText}>Nazwa jednostki zewnętrznej:</Text>
          <Text style={[styles.rowText, styles.boldText]} />
        </View>
        <Divider style={styles.divider} />
        <View style={styles.deviceRow}>
          <Text style={styles.rowText}>Moc nominalna chłodzenia:</Text>
          <Text style={[styles.rowText, styles.boldText]}>5,20 kW</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.deviceRow}>
          <Text style={styles.rowText}>Moc nominalna grzania:</Text>
          <Text style={[styles.rowText, styles.boldText]}>5,33 kW</Text>
        </View>
      </View>
    </View>
  );
}

function InstallationDetailsForm({
  control,
}: {
  control: Control<MontageData>;
}) {
  return (
    <View style={{ gap: -18 }}>
      <View style={styles.formContainer}>
        <FormInput
          name="nr_seryjny_jedn_zew"
          control={control}
          label="Numer seryjny jedn. zewn."
          isThin
          noPadding
          customPercentWidth={48}
        />
        <View style={styles.pickerContainer}>
          <FilePicker
            name="nr_seryjny_jedn_zew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie"
            label="Zdjęcia tabliczki znamionowej jedn. zewn."
            isGoToCamera
          />
        </View>
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="nr_seryjny_jedn_wew"
          control={control}
          label="Numer seryjny jedn. wewn."
          isThin
          noPadding
          customPercentWidth={48}
        />
        <View style={styles.pickerContainer}>
          <FilePicker
            name="nr_seryjny_jedn_wew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie"
            label="Zdjęcia tabliczki znamionowej jedn. wewn."
            isGoToCamera
          />
        </View>
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="miejsce_montazu_jedn_wew"
          control={control}
          label="Miejsce montażu jedn. wewn."
          isThin
          noPadding
          customPercentWidth={48}
        />
        <View style={styles.pickerContainer}>
          <FilePicker
            name="miejsce_montazu_jedn_wew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie"
            label="Zdjęcia miejsca montażu jedn wewn."
            isGoToCamera
          />
        </View>
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="sposob_skroplin"
          control={control}
          label="Sposób odprowadzenia skroplin"
          isThin
          noPadding
          customPercentWidth={48}
        />
        <FormInput
          name="miejsce_skroplin"
          control={control}
          label="Miejsce odprowadzenia skroplin"
          isThin
          noPadding
          customPercentWidth={48}
        />
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="miejsce_montazu_jedn_zew"
          control={control}
          label="Miejsce i sposób montażu jedn. zewn."
          isThin
          noPadding
          customPercentWidth={48}
        />
        <View style={styles.pickerContainer}>
          <FilePicker
            name="miejsce_montazu_jedn_zew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie"
            label="Zdjęcia miejsca i sposobu montażu jedn. zewn."
            isGoToCamera
          />
        </View>
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="miejsce_podlaczenia_elektryki"
          control={control}
          label="Miejsce podłączenia do instalacji elektrycznej"
          isThin
          noPadding
          customPercentWidth={48}
        />
        <FormInput
          name="gaz"
          control={control}
          label="Gaz zastosowany w instalacji"
          isThin
          noPadding
          customPercentWidth={48}
        />
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="gaz_ilosc_dodana"
          control={control}
          label="Dodana ilość gazu do instalacji"
          isThin
          noPadding
          customPercentWidth={48}
        />
        <FormInput
          name="gaz_ilos"
          control={control}
          label="Całkowita ilość gazu w instalacji"
          isThin
          noPadding
          customPercentWidth={48}
        />
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="temp_zew_montazu"
          control={control}
          label="Temperatura na zewnątrz podczas montażu"
          isThin
          noPadding
          customPercentWidth={48}
        />
        <FormInput
          name="temp_wew_montazu"
          control={control}
          label="Temperatura wewnątrz pomieszczeń podczas montażu"
          isThin
          noPadding
          customPercentWidth={48}
        />
      </View>
      <View style={styles.formContainer}>
        <FormInput
          name="cisnienie"
          control={control}
          label="Ciśnienie w instalacji podczas pracy"
          isThin
          noPadding
          customPercentWidth={48}
        />
        <FormInput
          name="przegrzanie"
          control={control}
          label="Wartość przegrzania instalacji podczas pracy"
          isThin
          noPadding
          customPercentWidth={48}
        />
      </View>
      <FormInput
        name="temp_chlodzenia"
        control={control}
        label="Temperatura nawiewanego powietrza z jednostki wewn w trybie chłodzenia"
        isThin
        noPadding
      />
      <FormInput
        name="temp_grzania"
        control={control}
        label="Temperatura nawiewanego powietrza z jednostki wewn. w trybie grzania"
        isThin
        noPadding
      />
      {/* Sekcja - Przeprowadzone czynności */}
      <View style={{ marginTop: 20, marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 15,
            color: Colors.black,
          }}
        >
          Przeprowadzone czynności
        </Text>
      </View>

      <Dropdown
        name="kontrola_stanu_technicznego_jedn_wew"
        control={control}
        label="Kontrola stanu technicznego jednostki wewnętrznej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={20}
      />

      <Dropdown
        name="kontrola_stanu_technicznego_jedn_zew"
        control={control}
        label="Kontrola stanu technicznego jednostki zewnętrznej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={19}
      />

      <Dropdown
        name="kontrola_stanu_mocowania_agregatu"
        control={control}
        label="Kontrola stanu mocowania agregatu"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={18}
      />

      <Dropdown
        name="czyszczenie_filtrow_jedn_wew"
        control={control}
        label="Czyszczenie filtrów jednostki wewnętrznej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={17}
      />

      <Dropdown
        name="czyszczenie_wymiennika_ciepla_jedn_wew"
        control={control}
        label="Czyszczenie wymiennika ciepła jednostki wewnętrznej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={16}
      />

      <Dropdown
        name="czyszczenie_obudowy_jedn_wew"
        control={control}
        label="Czyszczenie obudowy jednostki wewnętrznej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={15}
      />

      <Dropdown
        name="czyszczenie_tacy_skroplin"
        control={control}
        label="Czyszczenie tacy skroplin oraz odpływu skroplin"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={14}
      />

      <Dropdown
        name="kontrola_droznosci_odplywu_skroplin"
        control={control}
        label="Kontrola drożności odpływu skroplin"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={13}
      />

      <Dropdown
        name="czyszczenie_obudowy_jedn_zew"
        control={control}
        label="Czyszczenie obudowy jednostki zewnętrznej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={12}
      />

      <Dropdown
        name="czyszczenie_wymiennika_ciepla_jedn_zew"
        control={control}
        label="Czyszczenie wymiennika ciepła jednostki zewnętrznej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={11}
      />

      <Dropdown
        name="kontrola_szczelnosci_instalacji"
        control={control}
        label="Kontrola szczelności instalacji chłodniczej"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={10}
      />

      <Dropdown
        name="kontrola_poprawnosci_dzialania"
        control={control}
        label="Kontrola poprawności działania urządzenia"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={9}
      />

      {/* Dodatkowe pola */}
      <Dropdown
        name="kontrola_temperatury_nawiewu"
        control={control}
        label="Kontrola temperatury nawiewu jednostki wewnętrznej (chłodzenie/grzanie)"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={8}
      />

      <Dropdown
        name="diagnostyka_awarii_urzadzen"
        control={control}
        label="Diagnostyka awarii urządzeń"
        options={[
          { label: 'Wykonano', value: 'wykonano' },
          { label: 'Nie wykonano', value: 'nie_wykonano' },
          { label: 'Nie dotyczy', value: 'nie_dotyczy' },
        ]}
        isBordered
        isThin
        zIndex={7}
      />

      <Textarea
        label="Uwagi"
        noPadding
        name="uwagi"
        control={control}
        borderColor={Colors.black}
        textColor={Colors.black}
        labelColor={Colors.black}
        fontSize={14}
        labelFontSize={11}
        backgroundColor={Colors.white}
        height={64}
      />
    </View>
  );
}

// Style dla protokołu montażu - muszą być przed komponentem
const protocolStyles = StyleSheet.create({
  protocolFormContainer: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    display: 'flex',
    flexDirection: 'column',
  },
  protocolScrollView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  protocolScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
  },
  protocolTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 20,
  },
  protocolSection: {
    marginBottom: 20,
  },
  protocolSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  protocolSectionTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    justifyContent: 'center',
    alignItems: 'center',
  },
  protocolLabel: {
    fontSize: 10,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 6,
  },
  readOnlySection: {
    backgroundColor: Colors.homeScreenBackground,
    marginBottom: 20,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
  readOnlyValue: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  readOnlyDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 0,
  },
  protocolInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  protocolCancelButton: {
    minHeight: 48,
    height: 48,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    borderWidth: 1,
    backgroundColor: Colors.transparent,
    borderColor: Colors.borderButton,
    flex: 1,
  },
  protocolCancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  protocolSubmitButton: {
    backgroundColor: Colors.green,
    minHeight: 48,
    height: 48,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    flex: 1,
  },
  protocolSubmitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  protocolButtonGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
});

// Eksportowany komponent formularza protokołu montażu do użycia w ClientSettings
export function MontageProtocolForm({
  installationId,
  montage,
  onSave,
  onCancel,
  selectedDevice: initialSelectedDevice,
}: {
  installationId: string;
  montage: Montage | null;
  onSave?: () => void;
  onCancel?: () => void;
  selectedDevice?: Device;
}) {
  const navigation = useNavigation();
  const { control, handleSubmit, setValue } = useForm<MontageData>({
    defaultValues: montageDefaultValues,
  });

  const {
    devicesSplit,
    devicesMultisplit,
    getDevicesSplit,
    getDevicesMultisplit,
  } = useOffers();

  // Stany dla urządzeń
  const [type, setType] = useState<string | undefined>(undefined);
  const [splitManufacturer, setSplitManufacturer] = useState<
    string | undefined
  >();
  const [deviceType, setDeviceType] = useState<string | undefined>(undefined);
  const [devicesList, setDevicesList] = useState<Device[]>([]);
  // Stany dla pól tylko do odczytu
  const [unitName, setUnitName] = useState<string>('');
  const [indoorUnitName, setIndoorUnitName] = useState<string>('');
  const [outdoorUnitName, setOutdoorUnitName] = useState<string>('');
  const [nominalCoolingCapacity, setNominalCoolingCapacity] = useState<string>('');
  const [nominalHeatingCapacity, setNominalHeatingCapacity] = useState<string>('');

  const { execute: fetchMontageData } = useApi<MontageData>({
    path: 'montaz_data',
  });

  // Pobierz urządzenia gdy typ się zmieni
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

  const { execute: addMontage } = useApi<{ status?: string; error?: any }>({
    path: 'montaz_create',
  });

  const { execute: editMontage } = useApi<{ status?: string; error?: any }>({
    path: 'montaz_edit',
  });

  const { execute: addPhoto } = useApi<
    { status?: string; image_url?: string; photo_id?: number },
    FormData
  >({
    path: 'add_photo',
  });

  const { execute: getMontageList } = useApi<Montage[]>({
    path: 'montaz_list',
  });

  const { execute: getPhotoList } = useApi<{ zdjecia: any[] }>({
    path: 'photo_list',
  });

  const loadPhotosForMontage = useCallback(
    async (montazId: number) => {
      try {
        const photoResponse = await getPhotoList({
          data: { montaz_id: montazId },
        });
        return photoResponse?.zdjecia || [];
      } catch (error) {
        console.error('Error loading photos:', error);
        return [];
      }
    },
    [getPhotoList],
  );

  const updateForm = useCallback(
    (montageData: MontageData) => {
      setValue('data_montazu', new Date(montageData.data_montazu));
      setValue('gwarancja', montageData.gwarancja);
      setValue('liczba_przegladow', montageData.liczba_przegladow);

      if (montageData.deviceManufacturer) {
        setValue('deviceManufacturer', montageData.deviceManufacturer);
        setSplitManufacturer(montageData.deviceManufacturer);
      }
      if (montageData.deviceType) {
        setValue('deviceType', montageData.deviceType);
        setDeviceType(montageData.deviceType);
      }
      if (montageData.devices_split && montageData.devices_split.length > 0) {
        setValue('device_split', montageData.devices_split[0]);
      }

      if (montageData.split_multisplit !== null) {
        const montageType = montageData.split_multisplit
          ? 'multi_split'
          : 'split';
        setType(montageType);

        if (montageType === 'split' && getDevicesSplit) {
          getDevicesSplit();
        } else if (montageType === 'multi_split' && getDevicesMultisplit) {
          getDevicesMultisplit();
        }
      }
      setValue('nr_seryjny_jedn_zew', montageData.nr_seryjny_jedn_zew);
      setValue(
        'nr_seryjny_jedn_zew_photo',
        montageData.nr_seryjny_jedn_zew_photo,
      );
      setValue('nr_seryjny_jedn_wew', montageData.nr_seryjny_jedn_wew);
      setValue(
        'nr_seryjny_jedn_wew_photo',
        montageData.nr_seryjny_jedn_wew_photo,
      );
      setValue(
        'miejsce_montazu_jedn_wew',
        montageData.miejsce_montazu_jedn_wew,
      );
      setValue(
        'miejsce_montazu_jedn_wew_photo',
        montageData.miejsce_montazu_jedn_wew_photo,
      );
      setValue('sposob_skroplin', montageData.sposob_skroplin);
      setValue('miejsce_skroplin', montageData.miejsce_skroplin);
      setValue(
        'miejsce_i_sposob_montazu_jedn_zew',
        montageData.miejsce_i_sposob_montazu_jedn_zew,
      );
      setValue(
        'miejsce_i_sposob_montazu_jedn_zew_photo',
        montageData.miejsce_i_sposob_montazu_jedn_zew_photo,
      );
      setValue(
        'miejsce_podlaczenia_elektryki',
        montageData.miejsce_podlaczenia_elektryki,
      );
      setValue('gaz', montageData.gaz);
      setValue('gaz_ilosc_dodana', montageData.gaz_ilosc_dodana);
      setValue('gaz_ilos', montageData.gaz_ilos);
      setValue('temp_zew_montazu', montageData.temp_zew_montazu);
      setValue('temp_wew_montazu', montageData.temp_wew_montazu);
      setValue('cisnienie', montageData.cisnienie);
      setValue('przegrzanie', montageData.przegrzanie);
      setValue('temp_chlodzenia', montageData.temp_chlodzenia);
      setValue('temp_grzania', montageData.temp_grzania);
      setValue('uwagi', montageData.uwagi);
      if (montageData.dlugosc_instalacji !== undefined) {
        setValue('dlugosc_instalacji', montageData.dlugosc_instalacji);
      }
      if (montageData.devicePower) {
        setValue('devicePower', montageData.devicePower);
      }
      if (montageData.gwarancja_photo) {
        setValue('gwarancja_photo', montageData.gwarancja_photo);
      }
    },
    [
      setValue,
      setType,
      setSplitManufacturer,
      setDeviceType,
      getDevicesSplit,
      getDevicesMultisplit,
    ],
  );

  useEffect(() => {
    const loadMontageWithPhotos = async () => {
      if (montage) {
        updateForm(montage);

        // Wczytaj zdjęcia dla montażu
        if (montage.id) {
          const photos = await loadPhotosForMontage(montage.id);

          // Mapuj zdjęcia do odpowiednich pól na podstawie ID zdjęć w montażu
          // Dla pól PositiveIntegerField (miejsce_montazu_jedn_zew_photo, miejsce_montazu_jedn_wew_photo, miejsce_i_sposob_montazu_jedn_zew_photo, gwarancja_photo)
          // znajdź zdjęcie z odpowiednim ID i ustaw jako obiekt File
          const photoMap = new Map(
            photos.map((photo: any) => [photo.id, photo]),
          );

          if (
            montage.miejsce_montazu_jedn_zew_photo &&
            photoMap.has(montage.miejsce_montazu_jedn_zew_photo)
          ) {
            const photo = photoMap.get(montage.miejsce_montazu_jedn_zew_photo);
            if (photo?.image) {
              setValue('miejsce_montazu_jedn_zew_photo', {
                uri: photo.image,
                name: `photo_${photo.id}.jpg`,
                type: 'image/jpeg',
              } as File);
            }
          }

          if (
            montage.miejsce_montazu_jedn_wew_photo &&
            photoMap.has(montage.miejsce_montazu_jedn_wew_photo)
          ) {
            const photo = photoMap.get(montage.miejsce_montazu_jedn_wew_photo);
            if (photo?.image) {
              setValue('miejsce_montazu_jedn_wew_photo', {
                uri: photo.image,
                name: `photo_${photo.id}.jpg`,
                type: 'image/jpeg',
              } as File);
            }
          }

          if (
            montage.miejsce_i_sposob_montazu_jedn_zew_photo &&
            photoMap.has(montage.miejsce_i_sposob_montazu_jedn_zew_photo)
          ) {
            const photo = photoMap.get(
              montage.miejsce_i_sposob_montazu_jedn_zew_photo,
            );
            if (photo?.image) {
              setValue('miejsce_i_sposob_montazu_jedn_zew_photo', {
                uri: photo.image,
                name: `photo_${photo.id}.jpg`,
                type: 'image/jpeg',
              } as File);
            }
          }

          if (
            montage.gwarancja_photo &&
            photoMap.has(montage.gwarancja_photo)
          ) {
            const photo = photoMap.get(montage.gwarancja_photo);
            if (photo?.image) {
              setValue('gwarancja_photo', {
                uri: photo.image,
                name: `photo_${photo.id}.jpg`,
                type: 'image/jpeg',
              } as File);
            }
          }

          // Dla pól CharField (nr_seryjny_jedn_zew_photo, nr_seryjny_jedn_wew_photo)
          // jeśli zawierają URL, ustaw jako obiekt File
          if (
            montage.nr_seryjny_jedn_zew_photo &&
            typeof montage.nr_seryjny_jedn_zew_photo === 'string'
          ) {
            setValue('nr_seryjny_jedn_zew_photo', {
              uri: montage.nr_seryjny_jedn_zew_photo,
              name: 'nr_seryjny_jedn_zew_photo.jpg',
              type: 'image/jpeg',
            } as File);
          }

          if (
            montage.nr_seryjny_jedn_wew_photo &&
            typeof montage.nr_seryjny_jedn_wew_photo === 'string'
          ) {
            setValue('nr_seryjny_jedn_wew_photo', {
              uri: montage.nr_seryjny_jedn_wew_photo,
              name: 'nr_seryjny_jedn_wew_photo.jpg',
              type: 'image/jpeg',
            } as File);
          }
        }
      } else if (
        montage &&
        typeof montage === 'object' &&
        'id' in montage &&
        (montage as any).id
      ) {
        try {
          const montageData = await fetchMontageData({
            data: { montaz_id: (montage as any).id },
          });
          if (montageData) {
            updateForm(montageData);

            // Wczytaj zdjęcia
            if (montageData.id) {
              const photos = await loadPhotosForMontage(montageData.id);
              const photoMap = new Map(
                photos.map((photo: any) => [photo.id, photo]),
              );

              if (
                montageData.miejsce_montazu_jedn_zew_photo &&
                photoMap.has(montageData.miejsce_montazu_jedn_zew_photo)
              ) {
                const photo = photoMap.get(
                  montageData.miejsce_montazu_jedn_zew_photo,
                );
                if (photo?.image) {
                  setValue('miejsce_montazu_jedn_zew_photo', {
                    uri: photo.image,
                    name: `photo_${photo.id}.jpg`,
                    type: 'image/jpeg',
                  } as File);
                }
              }

              if (
                montageData.miejsce_montazu_jedn_wew_photo &&
                photoMap.has(montageData.miejsce_montazu_jedn_wew_photo)
              ) {
                const photo = photoMap.get(
                  montageData.miejsce_montazu_jedn_wew_photo,
                );
                if (photo?.image) {
                  setValue('miejsce_montazu_jedn_wew_photo', {
                    uri: photo.image,
                    name: `photo_${photo.id}.jpg`,
                    type: 'image/jpeg',
                  } as File);
                }
              }

              if (
                montageData.miejsce_i_sposob_montazu_jedn_zew_photo &&
                photoMap.has(
                  montageData.miejsce_i_sposob_montazu_jedn_zew_photo,
                )
              ) {
                const photo = photoMap.get(
                  montageData.miejsce_i_sposob_montazu_jedn_zew_photo,
                );
                if (photo?.image) {
                  setValue('miejsce_i_sposob_montazu_jedn_zew_photo', {
                    uri: photo.image,
                    name: `photo_${photo.id}.jpg`,
                    type: 'image/jpeg',
                  } as File);
                }
              }

              if (
                montageData.gwarancja_photo &&
                photoMap.has(montageData.gwarancja_photo)
              ) {
                const photo = photoMap.get(montageData.gwarancja_photo);
                if (photo?.image) {
                  setValue('gwarancja_photo', {
                    uri: photo.image,
                    name: `photo_${photo.id}.jpg`,
                    type: 'image/jpeg',
                  } as File);
                }
              }

              if (
                montageData.nr_seryjny_jedn_zew_photo &&
                typeof montageData.nr_seryjny_jedn_zew_photo === 'string'
              ) {
                setValue('nr_seryjny_jedn_zew_photo', {
                  uri: montageData.nr_seryjny_jedn_zew_photo,
                  name: 'nr_seryjny_jedn_zew_photo.jpg',
                  type: 'image/jpeg',
                } as File);
              }

              if (
                montageData.nr_seryjny_jedn_wew_photo &&
                typeof montageData.nr_seryjny_jedn_wew_photo === 'string'
              ) {
                setValue('nr_seryjny_jedn_wew_photo', {
                  uri: montageData.nr_seryjny_jedn_wew_photo,
                  name: 'nr_seryjny_jedn_wew_photo.jpg',
                  type: 'image/jpeg',
                } as File);
              }
            }
          }
        } catch (error) {
          Alert.alert('Błąd', 'Nie udało się wczytać danych montażu');
        }
      }
    };

    loadMontageWithPhotos();
  }, [montage, updateForm, fetchMontageData, loadPhotosForMontage, setValue]);

  useEffect(() => {
    if (montage && type && devicesList.length > 0) {
      if (montage.devices_split && montage.devices_split.length > 0) {
        const deviceId = montage.devices_split[0];
        const foundDevice = devicesList.find(device => device.id === deviceId);

        if (foundDevice) {
          setSplitManufacturer(foundDevice.producent);
          setDeviceType(foundDevice.typ);
          // Zaktualizuj pola tylko do odczytu
          setUnitName(foundDevice.nazwa_modelu || '');
          setIndoorUnitName(foundDevice.nazwa_jedn_wew || '');
          setOutdoorUnitName(foundDevice.nazwa_jedn_zew || '');
          setNominalCoolingCapacity(
            foundDevice.moc_chlodnicza
              ? `${foundDevice.moc_chlodnicza.toFixed(2)} kW`
              : '',
          );
          setNominalHeatingCapacity(
            foundDevice.moc_grzewcza
              ? `${foundDevice.moc_grzewcza.toFixed(2)} kW`
              : '',
          );
        }
      }
    }
  }, [montage, type, devicesList]);

  // Obsługa powrotu z ekranu wyboru urządzenia
  useEffect(() => {
    if (initialSelectedDevice) {
      try {
        // Zaktualizuj formularz z wybranym urządzeniem
        const device = initialSelectedDevice;

        if (!device || typeof device !== 'object') {
          console.error('Invalid device object:', device);
          return;
        }

        // Ustaw typ na split
        if (typeof setType === 'function') {
          setType('split');
        }
        if (typeof setValue === 'function') {
          setValue('split_multisplit', false);
        }

        // Ustaw wartości formularza
        if (device.id && typeof setValue === 'function') {
          setValue('device_split', device.id);
        }
        if (device.producent) {
          if (typeof setValue === 'function') {
            setValue('deviceManufacturer', device.producent);
          }
          if (typeof setSplitManufacturer === 'function') {
            setSplitManufacturer(device.producent);
          }
        }
        if (device.typ) {
          if (typeof setValue === 'function') {
            setValue('deviceType', device.typ);
          }
          if (typeof setDeviceType === 'function') {
            setDeviceType(device.typ);
          }
        }

        // Zaktualizuj pola tylko do odczytu
        if (typeof setUnitName === 'function') {
          setUnitName(device.nazwa_modelu || '');
        }
        if (typeof setIndoorUnitName === 'function') {
          setIndoorUnitName(device.nazwa_jedn_wew || '');
        }
        if (typeof setOutdoorUnitName === 'function') {
          setOutdoorUnitName(device.nazwa_jedn_zew || '');
        }
        
        // Bezpieczne formatowanie mocy
        const coolingPower = device.moc_chlodnicza;
        const heatingPower = device.moc_grzewcza;
        
        if (coolingPower !== undefined && coolingPower !== null) {
          let coolingValue: string;
          try {
            if (typeof coolingPower === 'number' && !isNaN(coolingPower)) {
              coolingValue = coolingPower.toFixed(2);
            } else if (typeof coolingPower === 'string') {
              const numValue = parseFloat(coolingPower);
              coolingValue = !isNaN(numValue) ? numValue.toFixed(2) : coolingPower;
            } else {
              coolingValue = String(coolingPower);
            }
            if (typeof setNominalCoolingCapacity === 'function') {
              setNominalCoolingCapacity(`${coolingValue} kW`);
            }
          } catch (err) {
            console.error('Error formatting cooling power:', err);
            if (typeof setNominalCoolingCapacity === 'function') {
              setNominalCoolingCapacity(String(coolingPower) + ' kW');
            }
          }
        } else {
          if (typeof setNominalCoolingCapacity === 'function') {
            setNominalCoolingCapacity('');
          }
        }
        
        if (heatingPower !== undefined && heatingPower !== null) {
          let heatingValue: string;
          try {
            if (typeof heatingPower === 'number' && !isNaN(heatingPower)) {
              heatingValue = heatingPower.toFixed(2);
            } else if (typeof heatingPower === 'string') {
              const numValue = parseFloat(heatingPower);
              heatingValue = !isNaN(numValue) ? numValue.toFixed(2) : heatingPower;
            } else {
              heatingValue = String(heatingPower);
            }
            if (typeof setNominalHeatingCapacity === 'function') {
              setNominalHeatingCapacity(`${heatingValue} kW`);
            }
          } catch (err) {
            console.error('Error formatting heating power:', err);
            if (typeof setNominalHeatingCapacity === 'function') {
              setNominalHeatingCapacity(String(heatingPower) + ' kW');
            }
          }
        } else {
          if (typeof setNominalHeatingCapacity === 'function') {
            setNominalHeatingCapacity('');
          }
        }

        // Pobierz urządzenia jeśli jeszcze nie są załadowane
        if (typeof getDevicesSplit === 'function' && !devicesSplit) {
          try {
            getDevicesSplit();
          } catch (err) {
            console.error('Error fetching devices:', err);
          }
        }
      } catch (error) {
        console.error('Error updating form with selected device:', error);
        Alert.alert('Błąd', 'Nie udało się zaktualizować formularza z wybranym urządzeniem');
      }
    }
  }, [initialSelectedDevice, setValue, getDevicesSplit, devicesSplit]);

  const uploadPhoto = async (
    photo: File | undefined,
    montazId: number,
    installationId: number,
  ): Promise<number | null> => {
    if (!photo || !photo.uri) {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      } as any);
      formData.append('instalacja_id', installationId.toString());
      formData.append('montaz_id', montazId.toString());

      const result = await addPhoto({ data: formData });

      // Zwróć ID zdjęcia jeśli jest dostępne w odpowiedzi
      // Jeśli nie, będziemy musieli pobrać je z bazy później
      return result?.photo_id || null;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const onSubmit = async (data: MontageData & any) => {
    try {
      let response;
      let savedMontageId: number | null = null;

      const isSplit =
        data.split_multisplit === 'split' || data.split_multisplit === false;
      const isMultiSplit =
        data.split_multisplit === 'multi_split' ||
        data.split_multisplit === true;

      // Wyodrębnij zdjęcia z danych przed zapisaniem
      const photosToUpload: {
        fieldName: string;
        photo: File | undefined;
      }[] = [
          {
            fieldName: 'nr_seryjny_jedn_zew_photo',
            photo: data.nr_seryjny_jedn_zew_photo,
          },
          {
            fieldName: 'nr_seryjny_jedn_wew_photo',
            photo: data.nr_seryjny_jedn_wew_photo,
          },
          {
            fieldName: 'miejsce_montazu_jedn_wew_photo',
            photo: data.miejsce_montazu_jedn_wew_photo,
          },
          {
            fieldName: 'miejsce_montazu_jedn_zew_photo',
            photo: data.miejsce_montazu_jedn_zew_photo,
          },
          {
            fieldName: 'miejsce_i_sposob_montazu_jedn_zew_photo',
            photo: data.miejsce_i_sposob_montazu_jedn_zew_photo,
          },
          { fieldName: 'gwarancja_photo', photo: data.gwarancja_photo },
        ];

      // Usuń zdjęcia z danych przed zapisaniem (zostaną dodane później jako ID)
      const dataWithoutPhotos = { ...data };
      photosToUpload.forEach(({ fieldName }) => {
        delete dataWithoutPhotos[fieldName];
      });

      if (montage == null) {
        const finalData: MontageData & { instalacja_id: number } = {
          ...dataWithoutPhotos,
          instalacja_id: Number(installationId),
          devices_split: isSplit ? [data.device_split].filter(Boolean) : [],
          devices_multi_split: isMultiSplit
            ? (Array.isArray(data.devices_multisplit)
              ? data.devices_multisplit
              : [data.devices_multisplit]
            ).filter(Boolean)
            : [],
          split_multisplit: isMultiSplit,
        };
        response = await addMontage({ data: finalData });

        // Pobierz ID utworzonego montażu z odpowiedzi
        if (response && (response as any).montaz_id) {
          savedMontageId = (response as any).montaz_id;
        } else if (response && (response as any).id) {
          savedMontageId = (response as any).id;
        } else {
          // Jeśli nie ma ID w odpowiedzi, pobierz montaż z bazy używając instalacja_id
          // (ponieważ jedna instalacja = jeden montaż)
          try {
            const montageList = await getMontageList({
              data: { instalacja_id: Number(installationId) },
            });
            if (
              montageList &&
              Array.isArray(montageList) &&
              montageList.length > 0
            ) {
              savedMontageId = montageList[0].id;
            }
          } catch (error) {
            console.error('Error fetching montage ID:', error);
          }
        }
      } else {
        const finalData: MontageData & { instalacja_id: number } = {
          ...dataWithoutPhotos,
          id: montage.id,
          instalacja_id: Number(installationId),
          devices_split: isSplit ? [data.device_split].filter(Boolean) : [],
          devices_multi_split: isMultiSplit
            ? (Array.isArray(data.devices_multisplit)
              ? data.devices_multisplit
              : [data.devices_multisplit]
            ).filter(Boolean)
            : [],
          split_multisplit: isMultiSplit,
        };
        response = await editMontage({ data: finalData });
        savedMontageId = montage.id;
      }

      // Zapisz zdjęcia i zaktualizuj montaż
      if (
        savedMontageId &&
        (response?.status === 'Montaz created' ||
          response?.status === 'Montaz updated')
      ) {
        const photoUpdates: Record<string, number | null> = {};

        for (const { fieldName, photo } of photosToUpload) {
          if (photo) {
            const photoId = await uploadPhoto(
              photo,
              savedMontageId,
              Number(installationId),
            );
            if (photoId) {
              photoUpdates[fieldName] = photoId;
            }
          }
        }

        // Zaktualizuj montaż z ID zdjęć
        if (Object.keys(photoUpdates).length > 0) {
          const updateData = {
            id: savedMontageId,
            instalacja_id: Number(installationId),
            ...photoUpdates,
          };
          await editMontage({ data: updateData });
        }
      }

      if (response) {
        if (
          response.status === 'Montaz created' ||
          response.status === 'Montaz updated'
        ) {
          Alert.alert('Sukces', 'Dane montażu zostały zapisane pomyślnie');
          if (onSave) {
            onSave();
          }
        } else if (response.error) {
          Alert.alert('Błąd', JSON.stringify(response.error));
        } else {
          Alert.alert('Sukces', 'Dane montażu zostały zapisane');
        }
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania danych montażu');
    }
  };

  return (
    <View style={protocolStyles.protocolFormContainer}>
      <ScrollView
        style={protocolStyles.protocolScrollView}
        contentContainerStyle={protocolStyles.protocolScrollContent}
      >
        <Text style={protocolStyles.protocolTitle}>Protokół montażu</Text>

        {/* Data montażu */}
        <View style={protocolStyles.protocolSection}>
          <Text style={protocolStyles.protocolLabel}>Data montażu</Text>
          <DatePicker
            name="data_montazu"
            control={control}
            color={Colors.borderInput}
          />
        </View>

        {/* Sekcja Urządzenie */}
        <View style={protocolStyles.protocolSection}>
          <View style={protocolStyles.protocolSectionHeader}>
            <Text style={protocolStyles.protocolSectionTitle}>Urządzenie</Text>
            <TouchableOpacity
              style={protocolStyles.editIconButton}
              onPress={() => {
                // Nawiguj do ekranu wyboru urządzenia
                (navigation as any).navigate('DeviceSelector', {
                  installationId,
                  montageId: montage?.id,
                });
              }}
            >
              <EditIcon color={Colors.black} size={20} />
            </TouchableOpacity>
          </View>

          <Dropdown
            name="split_multisplit"
            control={control}
            label="Split / Multisplit"
            options={[
              { label: 'Split', value: 'split' },
              { label: 'Multisplit', value: 'multi_split' },
            ]}
            isBordered={false}
            onChange={setType}
          />

          {type === 'split' && devicesList && devicesList.length > 0 && (
            <>
              <Dropdown
                name="deviceManufacturer"
                control={control}
                label="Producent urządzenia"
                options={Array.from(
                  new Set(devicesList.map(item => item.producent)),
                ).map(item => ({
                  label: item,
                  value: item,
                }))}
                isBordered={false}
                onChange={setSplitManufacturer}
              />
              {splitManufacturer && (
                <Dropdown
                  name="deviceType"
                  control={control}
                  label="Typ urządzenia"
                  options={Array.from(
                    new Set(
                      devicesList
                        .filter(item => item.producent === splitManufacturer)
                        .map(item => item.typ),
                    ),
                  ).map(item => ({
                    label: item,
                    value: item,
                  }))}
                  isBordered={false}
                  onChange={setDeviceType}
                />
              )}
              {splitManufacturer && deviceType && (
                <>
                  <Dropdown
                    name="device_split"
                    control={control}
                    label="Model urządzenia"
                    options={Array.from(
                      new Set(
                        devicesList.filter(
                          item =>
                            item.producent === splitManufacturer &&
                            item.typ === deviceType,
                        ),
                      ),
                    ).map(item => ({
                      label: item.nazwa_modelu_producenta,
                      value: item.id,
                    }))}
                    isBordered={false}
                  />
                  <FormInput
                    name="devicePower"
                    control={control}
                    label="Moc urządzenia"
                    noPadding
                  />
                </>
              )}
            </>
          )}

          {type === 'multi_split' && devicesList && devicesList.length > 0 && (
            <>
              <Dropdown
                name="deviceManufacturer"
                control={control}
                label="Producent urządzenia"
                options={Array.from(
                  new Set(
                    devicesList
                      .filter(item => item.rodzaj === 'agregat')
                      .map(item => item.producent),
                  ),
                ).map(item => ({
                  label: item,
                  value: item,
                }))}
                isBordered={false}
              />
              <FormInput
                name="deviceType"
                control={control}
                label="Typ urządzenia"
                noPadding
              />
              <FormInput
                name="deviceModel"
                control={control}
                label="Model urządzenia"
                noPadding
              />
              <FormInput
                name="devicePower"
                control={control}
                label="Moc urządzenia"
                noPadding
              />
            </>
          )}
        </View>

        {/* Pola tylko do odczytu */}
        <View style={protocolStyles.readOnlySection}>
          <View style={protocolStyles.readOnlyRow}>
            <Text style={protocolStyles.readOnlyLabel}>Nazwa jednostki:</Text>
            <Text style={protocolStyles.readOnlyValue}>{unitName || '-'}</Text>
          </View>
          <Divider style={protocolStyles.readOnlyDivider} />
          <View style={protocolStyles.readOnlyRow}>
            <Text style={protocolStyles.readOnlyLabel}>
              Nazwa jednostki wewnętrznej:
            </Text>
            <Text style={protocolStyles.readOnlyValue}>
              {indoorUnitName || '-'}
            </Text>
          </View>
          <Divider style={protocolStyles.readOnlyDivider} />
          <View style={protocolStyles.readOnlyRow}>
            <Text style={protocolStyles.readOnlyLabel}>
              Nazwa jednostki zewnętrznej:
            </Text>
            <Text style={protocolStyles.readOnlyValue}>
              {outdoorUnitName || '-'}
            </Text>
          </View>
          <Divider style={protocolStyles.readOnlyDivider} />
          <View style={protocolStyles.readOnlyRow}>
            <Text style={protocolStyles.readOnlyLabel}>
              Moc nominalna chłodzenia:
            </Text>
            <Text style={protocolStyles.readOnlyValue}>
              {nominalCoolingCapacity || '-'}
            </Text>
          </View>
          <Divider style={protocolStyles.readOnlyDivider} />
          <View style={protocolStyles.readOnlyRow}>
            <Text style={protocolStyles.readOnlyLabel}>
              Moc nominalna grzania:
            </Text>
            <Text style={protocolStyles.readOnlyValue}>
              {nominalHeatingCapacity || '-'}
            </Text>
          </View>
        </View>

        {/* Dropdowny */}
        <View style={protocolStyles.protocolSection}>
          <Dropdown
            name="gwarancja"
            control={control}
            label="Długość okresu gwarancji"
            options={Array.from({ length: 10 }, (_, index) => ({
              label: `${index + 1}`,
              value: index + 1,
            }))}
            isBordered={false}
          />
          <Dropdown
            name="liczba_przegladow"
            control={control}
            label="Liczba przeglądów roku"
            options={Array.from({ length: 4 }, (_, index) => ({
              label: String(index + 1),
              value: index + 1,
            }))}
            isBordered={false}
          />
        </View>

        {/* Numer seryjny jednostki zewnętrznej */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="nr_seryjny_jedn_zew"
            control={control}
            label="Numer seryjny jednostki zewnętrznej"
            noPadding
          />
          <FilePicker
            name="nr_seryjny_jedn_zew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie/a"
            label="Zdjęcie/a tabliczki znamionowej jednostki zewnętrznej"
            isGoToCamera
          />
        </View>

        {/* Miejsce montażu jednostki zewnętrznej (textarea) */}
        <View style={protocolStyles.protocolSection}>
          <Textarea
            label="Miejsce montażu jednostki zewnętrznej"
            noPadding
            name="miejsce_i_sposob_montazu_jedn_zew"
            control={control}
            borderColor={Colors.borderInput}
            textColor={Colors.black}
            labelColor={Colors.black}
            fontSize={14}
            labelFontSize={10}
            backgroundColor={Colors.white}
            height={20}
          />
        </View>

        {/* Numer seryjny jednostki wewnętrznej */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="nr_seryjny_jedn_wew"
            control={control}
            label="Numer seryjny jednostki wewnętrznej"
            noPadding
          />
          <FilePicker
            name="nr_seryjny_jedn_wew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie/a"
            label="Zdjęcie/a tabliczki znamionowej jednostki wewnętrznej"
            isGoToCamera
          />
        </View>

        {/* Miejsce montażu jednostki wewnętrznej */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="miejsce_montazu_jedn_wew"
            control={control}
            label="Miejsce montażu jednostki wewnętrznej"
            noPadding
          />
          <FilePicker
            name="miejsce_montazu_jedn_wew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie/a"
            label="Zdjęcie/a miejsca montażu jednostki wewnętrznej"
            isGoToCamera
          />
        </View>

        {/* Sposób odprowadzania skroplin */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="sposob_skroplin"
            control={control}
            label="Sposób odprowadzania skroplin"
            noPadding
          />
        </View>

        {/* Zdjęcie/a miejsca montażu jednostki zewnętrznej */}
        <View style={protocolStyles.protocolSection}>
          <FilePicker
            name="miejsce_montazu_jedn_zew_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie/a"
            label="Zdjęcie/a miejsca montażu jednostki zewnętrznej"
            isGoToCamera
          />
        </View>

        {/* Zdjęcie/a podpisanej gwarancji */}
        <View style={protocolStyles.protocolSection}>
          <FilePicker
            name="gwarancja_photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie/a"
            label="Zdjęcie/a podpisanej gwarancji"
            isGoToCamera
          />
        </View>

        {/* Miejsce odprowadzania skroplin */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="miejsce_skroplin"
            control={control}
            label="Miejsce odprowadzania skroplin"
            noPadding
          />
        </View>

        {/* Miejsce podłączenia do instalacji elektrycznej */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="miejsce_podlaczenia_elektryki"
            control={control}
            label="Miejsce podłączenia do instalacji elektrycznej"
            noPadding
          />
        </View>

        {/* Gaz zastosowany w instalacji */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="gaz"
            control={control}
            label="Gaz zastosowany w instalacji"
            noPadding
          />
        </View>

        {/* Długość instalacji w m */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="dlugosc_instalacji"
            control={control}
            label="Długość instalacji w m"
            noPadding
          />
        </View>

        {/* Dodana ilość gazu / Całkowita ilość gazu */}
        <View style={protocolStyles.protocolSection}>
          <View style={protocolStyles.protocolInputRow}>
            <FormInput
              name="gaz_ilosc_dodana"
              control={control}
              label="Dodana ilość gazu do instalacji w g"
              noPadding
              customPercentWidth={48}
            />
            <FormInput
              name="gaz_ilos"
              control={control}
              label="Całkowita ilość gazu w instalacji w g"
              noPadding
              customPercentWidth={48}
            />
          </View>
        </View>

        {/* Temperatura na zewnątrz podczas montażu */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="temp_zew_montazu"
            control={control}
            label="Temperatura na zewnątrz podczas montażu °C"
            noPadding
          />
        </View>

        {/* Ciśnienie w instalacji podczas pracy */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="cisnienie"
            control={control}
            label="Ciśnienie w instalacji podczas pracy"
            noPadding
          />
        </View>

        {/* Wartość przegrzania instalacji podczas pracy na chłodzeniu w °C */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="przegrzanie"
            control={control}
            label="Wartość przegrzania instalacji podczas pracy na chłodzeniu w °C"
            noPadding
          />
        </View>

        {/* Temperatura wewnątrz pomieszczeń podczas montażu */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="temp_wew_montazu"
            control={control}
            label="Temperatura wewnątrz pomieszczeń podczas montażu °C"
            noPadding
          />
        </View>

        {/* Temperatura nawiewanego powietrza - chłodzenie */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="temp_chlodzenia"
            control={control}
            label="Temperatura nawiewanego powietrza z jednostki wewnętrznej w trybie chłodzenia"
            noPadding
          />
        </View>

        {/* Temperatura nawiewanego powietrza - grzanie */}
        <View style={protocolStyles.protocolSection}>
          <FormInput
            name="temp_grzania"
            control={control}
            label="Temperatura nawiewanego powietrza z jednostki wewnętrznej w trybie grzania"
            noPadding
          />
        </View>

        {/* Uwagi */}
        <View style={protocolStyles.protocolSection}>
          <Textarea
            label="Uwagi"
            noPadding
            name="uwagi"
            control={control}
            borderColor={Colors.borderInput}
            textColor={Colors.black}
            labelColor={Colors.black}
            fontSize={14}
            labelFontSize={10}
            backgroundColor={Colors.white}
            height={20}
          />
        </View>

        {/* Przyciski Anuluj / Zastosuj */}
        <ButtonGroup
          cancelTitle="Anuluj"
          cancelStyle={protocolStyles.protocolCancelButton}
          cancelTitleStyle={protocolStyles.protocolCancelButtonTitle}
          submitTitle="Zastosuj"
          submitStyle={protocolStyles.protocolSubmitButton}
          submitTitleStyle={protocolStyles.protocolSubmitButtonTitle}
          onCancel={() => navigation.goBack()}
          onSubmitPress={handleSubmit(onSubmit)}
          groupStyle={protocolStyles.protocolButtonGroup}
        />
      </ScrollView>
    </View>
  );
}

export default function ClientInstallation({
  route: {
    params: { montage, installationId },
  },
}: {
  route: Route<
    'Inspection',
    { montage: Montage | null; installationId: number }
  >;
}) {
  const navigation = useNavigation();
  const { control, handleSubmit, setValue } = useForm<MontageData>({
    defaultValues: montageDefaultValues,
  });

  const { montages, getMontages, loading } = useMontages();

  const {
    devicesSplit,
    devicesMultisplit,
    getDevicesSplit,
    getDevicesMultisplit,
  } = useOffers();

  // Stany dla urządzeń
  const [type, setType] = useState<string | undefined>(undefined);
  const [splitManufacturer, setSplitManufacturer] = useState<
    string | undefined
  >();
  const [deviceType, setDeviceType] = useState<string | undefined>();

  const { execute: fetchMontageData } = useApi<MontageData>({
    path: 'montaz_data',
  });

  const { execute: addMontage } = useApi<{ status?: string; error?: any }>({
    path: 'montaz_create',
  });

  const { execute: editMontage } = useApi<{ status?: string; error?: any }>({
    path: 'montaz_edit',
  });

  const { execute: generatePDF } = useApi<any>({
    path: 'generate_pdf',
  });

  const handleGeneratePDF = async () => {
    try {
      const data = { type: 'montage', montage_id: montage?.id };

      const response = await generatePDF({ data });

      if (response?.success) {
        Alert.alert(
          'Sukces',
          'Dokument PDF został wygenerowany i zapisany do rekordu montażu',
        );
      } else {
        Alert.alert('Błąd', 'Nie udało się wygenerować dokumentu PDF');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas generowania PDF');
    }
  };

  // useEffect(() => {
  //   fetchInstallationData({ instalacja_id: installationId }).then(
  //     (res: any) => {
  //       const fieldsToSet = Object.keys(installationDefaultValues);

  //       fieldsToSet.forEach((field: any) => {
  //         setValue(
  //           field,
  //           res.montaz[0][field] ? String(res.montaz[0][field]) : null,
  //         );
  //       });
  //     },
  //   );
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const { execute } = useApi<object, MontageData>({
    path: 'montaz_edit',
  });

  const updateForm = useCallback(
    (montageData: MontageData) => {
      setValue('data_montazu', new Date(montageData.data_montazu));
      setValue('gwarancja', montageData.gwarancja);
      setValue('liczba_przegladow', montageData.liczba_przegladow);

      // Pola urządzeń - ustaw na podstawie dodatkowych pól
      if (montageData.deviceManufacturer) {
        setValue('deviceManufacturer', montageData.deviceManufacturer);
        setSplitManufacturer(montageData.deviceManufacturer);
      }
      if (montageData.deviceType) {
        setValue('deviceType', montageData.deviceType);
        setDeviceType(montageData.deviceType);
      }
      if (montageData.devices_split && montageData.devices_split.length > 0) {
        setValue('device_split', montageData.devices_split[0]);
      }

      // Ustaw typ (split/multisplit) i pobierz urządzenia
      if (montageData.split_multisplit !== null) {
        const montageType = montageData.split_multisplit
          ? 'multi_split'
          : 'split';
        setType(montageType);

        // Pobierz urządzenia dla danego typu
        if (montageType === 'split' && getDevicesSplit) {
          getDevicesSplit();
        } else if (montageType === 'multi_split' && getDevicesMultisplit) {
          getDevicesMultisplit();
        }
      }
      setValue('nr_seryjny_jedn_zew', montageData.nr_seryjny_jedn_zew);
      setValue(
        'nr_seryjny_jedn_zew_photo',
        montageData.nr_seryjny_jedn_zew_photo,
      );
      setValue('nr_seryjny_jedn_wew', montageData.nr_seryjny_jedn_wew);
      setValue(
        'nr_seryjny_jedn_wew_photo',
        montageData.nr_seryjny_jedn_wew_photo,
      );
      setValue(
        'miejsce_montazu_jedn_wew',
        montageData.miejsce_montazu_jedn_wew,
      );
      setValue(
        'miejsce_montazu_jedn_wew_photo',
        montageData.miejsce_montazu_jedn_wew_photo,
      );
      setValue('sposob_skroplin', montageData.sposob_skroplin);
      setValue('miejsce_skroplin', montageData.miejsce_skroplin);
      setValue(
        'miejsce_i_sposob_montazu_jedn_zew',
        montageData.miejsce_i_sposob_montazu_jedn_zew,
      );
      setValue(
        'miejsce_i_sposob_montazu_jedn_zew_photo',
        montageData.miejsce_i_sposob_montazu_jedn_zew_photo,
      );
      setValue(
        'miejsce_podlaczenia_elektryki',
        montageData.miejsce_podlaczenia_elektryki,
      );
      setValue('gaz', montageData.gaz);
      setValue('gaz_ilosc_dodana', montageData.gaz_ilosc_dodana);
      setValue('gaz_ilos', montageData.gaz_ilos);
      setValue('temp_zew_montazu', montageData.temp_zew_montazu);
      setValue('temp_wew_montazu', montageData.temp_wew_montazu);
      setValue('cisnienie', montageData.cisnienie);
      setValue('przegrzanie', montageData.przegrzanie);
      setValue('temp_chlodzenia', montageData.temp_chlodzenia);
      setValue('temp_grzania', montageData.temp_grzania);
      setValue('uwagi', montageData.uwagi);

      // Nowe pola - Przeprowadzone czynności
      setValue(
        'kontrola_stanu_technicznego_jedn_wew',
        montageData.kontrola_stanu_technicznego_jedn_wew,
      );
      setValue(
        'kontrola_stanu_technicznego_jedn_zew',
        montageData.kontrola_stanu_technicznego_jedn_zew,
      );
      setValue(
        'kontrola_stanu_mocowania_agregatu',
        montageData.kontrola_stanu_mocowania_agregatu,
      );
      setValue(
        'czyszczenie_filtrow_jedn_wew',
        montageData.czyszczenie_filtrow_jedn_wew,
      );
      setValue(
        'czyszczenie_wymiennika_ciepla_jedn_wew',
        montageData.czyszczenie_wymiennika_ciepla_jedn_wew,
      );
      setValue(
        'czyszczenie_obudowy_jedn_wew',
        montageData.czyszczenie_obudowy_jedn_wew,
      );
      setValue(
        'czyszczenie_tacy_skroplin',
        montageData.czyszczenie_tacy_skroplin,
      );
      setValue(
        'kontrola_droznosci_odplywu_skroplin',
        montageData.kontrola_droznosci_odplywu_skroplin,
      );
      setValue(
        'czyszczenie_obudowy_jedn_zew',
        montageData.czyszczenie_obudowy_jedn_zew,
      );
      setValue(
        'czyszczenie_wymiennika_ciepla_jedn_zew',
        montageData.czyszczenie_wymiennika_ciepla_jedn_zew,
      );
      setValue(
        'kontrola_szczelnosci_instalacji',
        montageData.kontrola_szczelnosci_instalacji,
      );
      setValue(
        'kontrola_poprawnosci_dzialania',
        montageData.kontrola_poprawnosci_dzialania,
      );

      // Dodatkowe pola
      setValue(
        'kontrola_temperatury_nawiewu',
        montageData.kontrola_temperatury_nawiewu,
      );
      setValue(
        'diagnostyka_awarii_urzadzen',
        montageData.diagnostyka_awarii_urzadzen,
      );
    },
    [
      setValue,
      setType,
      setSplitManufacturer,
      setDeviceType,
      getDevicesSplit,
      getDevicesMultisplit,
    ],
  );

  useEffect(() => {
    if (montage) {
      updateForm(montage);
    } else if (
      montage &&
      typeof montage === 'object' &&
      'id' in montage &&
      (montage as any).id
    ) {
      // Jeśli mamy ID montażu, ale nie mamy pełnych danych, pobierz je
      const loadMontageData = async () => {
        try {
          const montageData = await fetchMontageData({
            data: { montaz_id: (montage as any).id },
          });
          if (montageData) {
            updateForm(montageData);
          }
        } catch (error) {
          Alert.alert('Błąd', 'Nie udało się wczytać danych montażu');
        }
      };
      loadMontageData();
    }
  }, [montage, updateForm, fetchMontageData]);

  // useEffect do ustawiania stanów dropdownów po wczytaniu urządzeń
  useEffect(() => {
    if (montage && type) {
      // Znajdź urządzenie na podstawie devices_split
      if (montage.devices_split && montage.devices_split.length > 0) {
        const deviceId = montage.devices_split[0];
        let foundDevice = null;

        if (type === 'split' && devicesSplit) {
          foundDevice = devicesSplit.find(device => device.id === deviceId);
        } else if (type === 'multi_split' && devicesMultisplit) {
          foundDevice = devicesMultisplit.find(
            device => device.id === deviceId,
          );
        }

        if (foundDevice) {
          setSplitManufacturer(foundDevice.producent);
          setDeviceType(foundDevice.typ);
        }
      }
    }
  }, [montage, type, devicesSplit, devicesMultisplit]);

  const onSubmit = async (data: MontageData & any) => {
    try {
      let response;
      // Konwertuj split_multisplit na boolean
      const isSplit =
        data.split_multisplit === 'split' || data.split_multisplit === false;
      const isMultiSplit =
        data.split_multisplit === 'multi_split' ||
        data.split_multisplit === true;

      if (montage == null) {
        const finalData: MontageData & { instalacja_id: number } = {
          ...data,
          instalacja_id: installationId,
          device_split: isSplit ? [data.device_split] : null,
          devices_multisplit: isMultiSplit ? data.devices_multisplit : null,
          split_multisplit: isMultiSplit,
        };
        response = await addMontage({ data: finalData });
      } else {
        const finalData: MontageData & { instalacja_id: number } = {
          ...data,
          id: montage.id,
          instalacja_id: installationId,
          device_split: isSplit ? [data.device_split] : null,
          devices_multisplit: isMultiSplit ? data.devices_multisplit : null,
          split_multisplit: isMultiSplit,
        };
        response = await editMontage({ data: finalData });
      }

      if (response) {
        if (
          response.status === 'Montaz created' ||
          response.status === 'Montaz updated'
        ) {
          Alert.alert('Sukces', 'Dane montażu zostały zapisane pomyślnie');
          await getMontages(installationId);
          navigation.goBack();
        } else if (response.error) {
          Alert.alert('Błąd', JSON.stringify(response.error));
        } else {
          Alert.alert('Sukces', 'Dane montażu zostały zapisane');
        }
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania danych montażu');
    }
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader
        onBackPress={navigation.goBack}
        title={montage ? `Montaż ${montage.id}` : 'Nowy montaż'}
      />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.flexContainer}
      >
        <Text>Urządzenia do montażu</Text>
        <Divider style={styles.divider} />
        <InstallationToolForm
          control={control}
          setType={setType}
          setSplitManufacturer={setSplitManufacturer}
          setDeviceType={setDeviceType}
        />
        <Text>Szczegóły montażu</Text>
        <Divider style={styles.divider} />
        <InstallationDetailsForm control={control} />
      </ScrollView>
      <View style={styles.footer}>
        <SubmitButton title="Zapisz zmiany" onPress={handleSubmit(onSubmit)} />
        {montage && (
          <SubmitButton
            title="Utwórz PDF"
            onPress={handleGeneratePDF}
            style={{ marginTop: 10 }}
            color="secondary"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  flexContainer: {
    paddingBottom: 20,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: Colors.white,
  },
  pickerContainer: {
    width: '48%',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '700',
  },
  datePickerContainer: {
    paddingBottom: 20,
    width: '49%',
    alignSelf: 'flex-end',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  divider: {
    height: 2,
    width: '100%',
    marginTop: 6,
    marginBottom: 14,
    backgroundColor: Colors.black,
  },
  deviceRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowText: {
    fontSize: 12,
  },
  boldText: {
    fontFamily: 'Poppins_600SemiBold',
  },
});
