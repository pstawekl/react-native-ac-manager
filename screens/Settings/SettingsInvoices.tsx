/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

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
  default_status: string | null;
  default_payment_method: string | null;
  default_invoice_type: string | null;
  default_vat_rate: string | null;
  default_currency: string | null;
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
      // Ustaw wszystkie pola z ustawień
      if (invoicePresets.footer !== undefined)
        setValue('footer', invoicePresets.footer);
      if (invoicePresets.place_of_issue !== undefined)
        setValue('place_of_issue', invoicePresets.place_of_issue);
      if (invoicePresets.issuer_name !== undefined)
        setValue('issuer_name', invoicePresets.issuer_name);
      if (invoicePresets.standard_payment_term !== undefined)
        setValue('standard_payment_term', invoicePresets.standard_payment_term);
      if (invoicePresets.prefix !== undefined)
        setValue('prefix', invoicePresets.prefix);
      if (invoicePresets.suffix !== undefined)
        setValue('suffix', invoicePresets.suffix);
      if (invoicePresets.numbering_type !== undefined)
        setValue('numbering_type', invoicePresets.numbering_type);
      if (invoicePresets.year_format !== undefined)
        setValue('year_format', invoicePresets.year_format);
      if (invoicePresets.month_format !== undefined)
        setValue('month_format', invoicePresets.month_format);
      if (invoicePresets.day_format !== undefined)
        setValue('day_format', invoicePresets.day_format);
      if (invoicePresets.iban !== undefined)
        setValue('iban', invoicePresets.iban);
      if (invoicePresets.default_status !== undefined)
        setValue('default_status', invoicePresets.default_status);
      if (invoicePresets.default_payment_method !== undefined)
        setValue(
          'default_payment_method',
          invoicePresets.default_payment_method,
        );
      if (invoicePresets.default_invoice_type !== undefined)
        setValue('default_invoice_type', invoicePresets.default_invoice_type);
      if (invoicePresets.default_vat_rate !== undefined)
        setValue('default_vat_rate', invoicePresets.default_vat_rate);
      if (invoicePresets.default_currency !== undefined)
        setValue('default_currency', invoicePresets.default_currency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoicePresets]);

  const onSubmit = async (data: InvoiceSettingsData) => {
    await editInvoicePresets({ data });
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
        <ButtonsHeader
          onBackPress={navigation.goBack}
          title="Ustawienia faktur"
        />
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={styles.formContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
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
                { label: '30 dni', value: 30 },
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
                { value: 'numeric', label: 'Format liczbowy' },
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
            <Dropdown
              name="default_status"
              control={control}
              label="Domyślny status faktury"
              options={[
                { value: 'issued', label: 'Wystawiona' },
                { value: 'paid', label: 'Opłacona' },
                { value: 'partial', label: 'Częściowo opłacona' },
              ]}
              isBordered
              zIndex={15}
            />
            <Dropdown
              name="default_payment_method"
              control={control}
              label="Domyślna forma płatności"
              options={[
                { value: 'transfer', label: 'Przelew' },
                { value: 'card', label: 'Karta' },
                { value: 'cash', label: 'Gotówka' },
              ]}
              isBordered
              zIndex={14}
            />
            <Dropdown
              name="default_invoice_type"
              control={control}
              label="Domyślny typ faktury"
              options={[
                { value: 'vat', label: 'Faktura VAT' },
                { value: 'proforma', label: 'Faktura proforma' },
                { value: 'zaliczkowa', label: 'Faktura zaliczkowa' },
                { value: 'koncowa', label: 'Faktura końcowa' },
                { value: 'korekta', label: 'Faktura korekta' },
                { value: 'szacunkowa', label: 'Faktura szacunkowa' },
              ]}
              isBordered
              zIndex={13}
            />
            <Dropdown
              name="default_vat_rate"
              control={control}
              label="Domyślna stawka VAT"
              options={[
                { value: '23', label: '23%' },
                { value: '12', label: '12%' },
                { value: '8', label: '8%' },
                { value: '0', label: '0%' },
              ]}
              isBordered
              zIndex={12}
            />
            <Dropdown
              name="default_currency"
              control={control}
              label="Domyślna waluta"
              options={[
                { value: 'PLN', label: 'PLN' },
                { value: 'USD', label: 'USD' },
              ]}
              isBordered
              zIndex={11}
              dropDownDirection="BOTTOM"
            />
          </View>
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
        </ScrollView>
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
    backgroundColor: Colors.homeScreenBackground,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 40,
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
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    gap: 20,
    width: '100%',
  },
});
