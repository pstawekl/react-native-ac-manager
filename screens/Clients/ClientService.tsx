/* eslint-disable react-native/no-inline-styles */
import { Route, useNavigation } from '@react-navigation/native';
import { Divider, Text } from '@rneui/themed';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';

import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import DatePicker from '../../components/DatePicker';
import { Dropdown, Textarea } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { InstallationToolForm } from './ClientInstallation';

const clientServiceDefaultData = {
  dlugosc_gwarancji: null,
  liczba_przegladow_rok: null,
  data_przegladu: new Date(),
  kontrola_stanu_jedn_wew: false,
  kontrola_stanu_jedn_zew: false,
  kontrola_stanu_mocowania_agregatu: false,
  czyszczenie_filtrow_jedn_wew: false,
  czyszczenie_wymiennika_ciepla_wew: false,
  czyszczenie_obudowy_jedn_wew: false,
  czyszczenie_tacy_skroplin: false,
  kontrola_droznosci_skroplin: false,
  czyszczenie_obudowy_jedn_zew: false,
  czyszczenie_wymiennika_ciepla_zew: false,
  kontrola_szczelnosci: false,
  kontrola_poprawnosci_dzialania: false,
  kontrola_temperatury_nawiewu_wew: false,
  diagnostyka_awari: false,
  uwagi: null,
};

type ClientServiceData = {
  data_montazu: Date | null;
  dlugosc_gwarancji: number | null;
  liczba_przegladow_rok: number | null;
  data_przegladu: Date | null;
  kontrola_stanu_jedn_wew: boolean;
  kontrola_stanu_jedn_zew: boolean;
  kontrola_stanu_mocowania_agregatu: boolean;
  czyszczenie_filtrow_jedn_wew: boolean;
  czyszczenie_wymiennika_ciepla_wew: boolean;
  czyszczenie_obudowy_jedn_wew: boolean;
  czyszczenie_tacy_skroplin: boolean;
  kontrola_droznosci_skroplin: boolean;
  czyszczenie_obudowy_jedn_zew: boolean;
  czyszczenie_wymiennika_ciepla_zew: boolean;
  kontrola_szczelnosci: boolean;
  kontrola_poprawnosci_dzialania: boolean;
  kontrola_temperatury_nawiewu_wew: boolean;
  diagnostyka_awari: boolean;
  uwagi: string | null;
};

export default function ClientService({
  route: {
    params: { installationId, montageId, serviceType = 'serwis' },
  },
}: {
  route: Route<
    'Service',
    {
      installationId: string;
      montageId?: number;
      serviceType?: 'przeglad' | 'serwis';
    }
  >;
}) {
  const navigation = useNavigation();

  const { control, handleSubmit, setValue } = useForm<ClientServiceData>({
    defaultValues: clientServiceDefaultData,
  });
  const { execute } = useApi<object, ClientServiceData>({
    path: 'serwis_edit',
  });

  const { execute: fetchInstallationData } = useApi<any>({
    path: 'installation_data',
  });

  const { execute: fetchPrzegladList } = useApi<any>({
    path: 'przeglad_list',
  });

  const { execute: fetchSerwisList } = useApi<any>({
    path: 'serwis_list',
  });

  const { execute: generatePDF } = useApi<any>({
    path: 'generate_pdf',
  });

  const handleGeneratePDF = async () => {
    try {
      const data =
        serviceType === 'przeglad' && montageId
          ? { type: 'przeglad', montage_id: montageId }
          : { type: 'serwis', installation_id: installationId };

      const response = await generatePDF({ data });

      if (response?.success) {
        Alert.alert(
          'Sukces',
          `Dokument PDF został wygenerowany i zapisany do rekordu ${
            serviceType === 'przeglad' ? 'przeglądu' : 'serwisu'
          }`,
        );
      } else {
        Alert.alert('Błąd', 'Nie udało się wygenerować dokumentu PDF');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas generowania PDF');
    }
  };

  useEffect(() => {
    const loadServiceData = async () => {
      try {
        let serviceData = null;

        if (serviceType === 'przeglad' && montageId) {
          // Ładuj dane przeglądu dla konkretnego montażu
          const res = await fetchPrzegladList({
            data: { montaz_id: montageId },
          });
          if (res.przeglady && res.przeglady.length > 0) {
            serviceData = res.przeglady[0];
          }
        } else {
          // Ładuj dane serwisu dla instalacji
          try {
            const res = await fetchSerwisList({
              data: { instalacja_id: installationId },
            });
            if (res.serwisy && res.serwisy.length > 0) {
              serviceData = res.serwisy[0];
            }
          } catch (error) {
            // Fallback to installation_data if serwis_list fails
            const res = await fetchInstallationData({
              data: { instalacja_id: installationId },
            });
            if (res.serwis && res.serwis.length > 0) {
              serviceData = res.serwis[0];
            }
          }
        }

        // Wczytaj dane do formularza
        if (serviceData) {
          const fieldsToSet = Object.keys(clientServiceDefaultData);
          fieldsToSet.forEach(field => {
            if (serviceData[field as keyof typeof serviceData] !== undefined) {
              setValue(
                field as keyof ClientServiceData,
                serviceData[field as keyof typeof serviceData],
              );
            }
          });
        }
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się wczytać danych serwisu');
      }
    };

    loadServiceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, montageId, installationId]);

  const onSubmit = async (data: ClientServiceData) => {
    try {
      const finalData: ClientServiceData & {
        instalacja_id: string;
        montaz_id?: number;
        typ?: 'przeglad' | 'serwis';
      } = {
        ...data,
        instalacja_id: installationId,
      };

      // Dodanie parametrów w zależności od typu serwisu
      if (serviceType === 'przeglad' && montageId) {
        finalData.montaz_id = montageId;
        finalData.typ = 'przeglad';
      } else {
        finalData.typ = 'serwis';
      }

      const response = await execute({ data: finalData });

      if (
        (response as any)?.status === 'Serwis updated' ||
        (response as any)?.status === 'Przegląd updated'
      ) {
        Alert.alert(
          'Sukces',
          `Zaktualizowano dane ${
            serviceType === 'przeglad' ? 'przeglądu' : 'serwisu'
          }`,
        );
      } else {
        Alert.alert(
          'Błąd',
          (response as any)?.error || 'Wystąpił błąd podczas zapisywania',
        );
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania danych serwisu');
    }
  };

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <View style={styles.container}>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <ScrollView style={styles.scrollContainer}>
          <Text>
            {serviceType === 'przeglad'
              ? 'Przegląd urządzeń'
              : 'Serwisowane urządzenia'}
          </Text>
          <Divider style={styles.divider} />
          <InstallationToolForm control={control} />
          <Text>Przeprowadzone czynności</Text>
          <Divider style={styles.divider} />
          <View style={{ gap: -18 }}>
            <View style={styles.datePicker}>
              <Text
                /* eslint-disable-next-line react-native/no-inline-styles */
                style={{
                  marginBottom: 6,
                  fontFamily: 'Poppins_400Regular',
                  fontSize: 11,
                  color: Colors.black,
                }}
              >
                {serviceType === 'przeglad' ? 'Data przeglądu' : 'Data serwisu'}
              </Text>
              <DatePicker name="data_montazu" control={control} />
            </View>
            <View style={styles.flexContainer}>
              <Dropdown
                label="Kontrola stanu tech. jednostki wewnętrznej"
                name="kontrola_stanu_jedn_wew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={20}
              />
              <Dropdown
                label="Kontrola stanu tech. jednostki zewnętrznej"
                name="kontrola_stanu_jedn_zew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={19}
              />
            </View>
            <View style={styles.flexContainer}>
              <Dropdown
                label="Kontrola stanu mocowania agregatu"
                name="kontrola_stanu_mocowania_agregatu"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={18}
              />
              <Dropdown
                label="Czyszczenie filtrów jednostki wewnętrznej"
                name="czyszczenie_filtrow_jedn_wew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={17}
              />
            </View>
            <View style={styles.flexContainer}>
              <Dropdown
                label="Czyszczenie wymiennika ciepła jednostki wewn."
                name="czyszczenie_wymiennika_ciepla_wew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={16}
              />
              <Dropdown
                label="Czyszczenie obudowy jednostki wewnętrznej"
                name="czyszczenie_obudowy_jedn_wew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={15}
              />
            </View>
            <View style={styles.flexContainer}>
              <Dropdown
                label="Czyszczenie tacy skroplin oraz odpływu skroplin"
                name="czyszczenie_tacy_skroplin"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={14}
              />
              <Dropdown
                label="Kontrola drożności odpływu skroplin"
                name="kontrola_droznosci_skroplin"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={13}
              />
            </View>
            <View style={styles.flexContainer}>
              <Dropdown
                label="Czyszczenie obudowy jednostki zewnętrznej"
                name="czyszczenie_obudowy_jedn_zew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={12}
              />
              <Dropdown
                label="Czyszczenie wymiennika ciepła jednostki zewn."
                name="czyszczenie_wymiennika_ciepla_zew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={11}
              />
            </View>
            <View style={styles.flexContainer}>
              <Dropdown
                label="Kontrola szczelności instalacji chłodniczej"
                name="kontrola_szczelnosci"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={10}
              />
              <Dropdown
                label="Kontrola poprawności działania urządzenia"
                name="kontrola_poprawnosci_dzialania"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={9}
              />
            </View>
            <View style={styles.flexContainer}>
              <Dropdown
                label="Kontrola temperatury nawiewu jednostki wewnętrznej (chłodzenie/grzanie)"
                name="kontrola_temperatury_nawiewu_wew"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={8}
              />
              <Dropdown
                label="Diagnostyka awarii urządzeń"
                name="diagnostyka_awari"
                control={control}
                options={[
                  { label: 'Tak', value: true },
                  { label: 'Nie', value: false },
                ]}
                isSmall
                isBordered
                isThin
                zIndex={7}
              />
            </View>
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
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <SubmitButton
            title={
              serviceType === 'przeglad' ? 'Zapisz przegląd' : 'Zapisz serwis'
            }
            onPress={handleSubmit(onSubmit)}
          />
          <SubmitButton
            title="Utwórz PDF"
            onPress={handleGeneratePDF}
            style={{ marginTop: 10 }}
            color="secondary"
          />
        </View>
      </View>
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
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  divider: {
    height: 2,
    width: '100%',
    marginTop: 6,
    marginBottom: 14,
    backgroundColor: Colors.black,
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  datePicker: {
    width: '100%',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
