/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Divider } from '@rneui/base';
import { LinearGradient } from 'expo-linear-gradient';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import Container from '../../components/Container';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';

export type InvoiceSettingsData = {
  footer: string | null;
  place_of_issue: string | null;
  issuer_name: string | null;
  standard_payment_term: number | null;
  prefix: string | null;
  suffix: string | null;
  numbering_type: string | null;
  year_format: string | null;
  month_format: string | null;
  day_format: string | null;
  iban: string | null;
};

function SettingsInvoices({ navigation }: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<InvoiceSettingsData>();
  const [presets, setPresets] = useState<InvoiceSettingsData>();
  const [visible, setVisible] = useState(false);

  const { execute: editInvoicePresets } = useApi({
    path: 'invoice_settings_edit',
  });

  const { result: invoicePresets, execute: getInvoicePresets } =
    useApi<InvoiceSettingsData>({
      path: 'invoice_settings_list',
    });

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  useEffect(() => {
    if (getInvoicePresets) {
      getInvoicePresets();
    }
  }, [getInvoicePresets]);

  useEffect(() => {
    if (invoicePresets) {
      setPresets(invoicePresets);
    }
  }, [invoicePresets]);

  useEffect(() => {
    if (invoicePresets) {
      Object.keys(invoicePresets).forEach(key => {
        const dataKey = key as keyof InvoiceSettingsData;
        setValue(dataKey, invoicePresets[key]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoicePresets]);

  const onSubmit = async (data: InvoiceSettingsData) => {
    await editInvoicePresets(data);
    Alert.alert('Zapisano zmiany');
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.groupTitle}>Informacje podstawowe</Text>
            <Divider style={styles.divider} />
            <FormInput
              name="footer"
              control={control}
              label="Stopka do faktury"
              noPadding
            />
            <FormInput
              name="place_of_issue"
              control={control}
              label="Miejsce wystawienia faktury"
              noPadding
            />
            <FormInput
              name="issuer_name"
              control={control}
              label="Imię i nazwisko osoby wystawiającej fakturę"
              noPadding
            />
            {/* <FormInput
            name="iban"
            control={control}
            label="IBAN (PL00000000...0000)"
            noPadding
          /> */}
            <Dropdown
              name="standard_payment_term"
              control={control}
              label="Standardowy termin płatności (dni)"
              options={[
                { label: '7 dni', value: 7 },
                { label: '10 dni', value: 10 },
                { label: '14 dni', value: 14 },
              ]}
              isBordered
            />
            {/* <FormInput name="prefix" control={control} label="Prefiks" noPadding />
          <FormInput name="suffix" control={control} label="Sufiks" noPadding /> */}
            <Dropdown
              name="numbering_type"
              control={control}
              label="Rodzaj numeru"
              options={[
                { value: 'yearly', label: 'Numer liczony od początku roku' },
                {
                  value: 'monthly',
                  label: 'Numer liczony od początku miesiąca',
                },
                { value: 'daily', label: 'Numer liczony w danym dniu' },
              ]}
              isBordered
              zIndex={19}
            />
            <Dropdown
              name="year_format"
              control={control}
              label="Format roku"
              options={[
                { value: 'YYYY', label: 'Rok zapisany czterocyfrowo' },
                { value: 'YY', label: 'Rok zapisany dwucyfrowo' },
              ]}
              isBordered
              zIndex={18}
            />
            <Dropdown
              name="month_format"
              control={control}
              label="Format miesiąca"
              options={[
                { value: 'numeric', label: 'Miesiąc w formacie liczbowym' },
                { value: 'short_name', label: 'Skrócona nazwa miesiąca' },
                { value: 'full_name', label: 'Pełna nazwa miesiąca' },
              ]}
              isBordered
              zIndex={17}
            />
            <Dropdown
              name="day_format"
              control={control}
              label="Format dnia"
              options={[
                { value: 'numeric', label: 'Dzień w formacie liczbowym' },
                { value: 'two_digit', label: 'Dzień zawsze dwucyfrowy' },
              ]}
              isBordered
              zIndex={16}
              dropDownDirection="BOTTOM"
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <ButtonGroup
            submitTitle="Zapisz"
            cancelTitle="Anuluj"
            onSubmitPress={toggleOverlay}
            onCancel={navigation.goBack}
            stretch={false}
            groupStyle={styles.buttonGroup}
            cancelStyle={styles.cancelButton}
            cancelTitleStyle={styles.cancelButtonTitle}
            submitStyle={styles.submitButton}
            submitTitleStyle={styles.submitButtonTitle}
          />
        </View>
      </Container>
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={handleSubmit(onSubmit)}
        title="Czy na pewno chcesz zapisać zmiany ?"
      />
    </LinearGradient>
  );
}

export default SettingsInvoices;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingBottom: 130, // Add padding for footer
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },
  groupTitle: {
    color: Colors.grayTitle,
    fontSize: 16,
    marginBottom: 28,
  },
  divider: {
    marginTop: 6,
    marginBottom: 42,
    height: 1,
    backgroundColor: Colors.separator,
  },
  formContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    gap: -18,
  },
  footer: {
    backgroundColor: Colors.white,
    minHeight: 130,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  cancelButton: {
    flex: 1,
    width: 140,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.black,
    height: 48,
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    overflow: 'visible',
  },
  submitButton: {
    backgroundColor: Colors.green,
    flex: 1,
    width: 190,
    height: 48,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 50,
    paddingRight: 50,
    borderRadius: 15,
  },
  submitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    overflow: 'visible',
  },
  buttonGroup: {
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    gap: 20,
    paddingVertical: 30,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -7 },
    shadowOpacity: 0.2,
    shadowRadius: 90,
    elevation: 5,
    overflow: 'visible',
    zIndex: 1000,
    width: '100%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
});
