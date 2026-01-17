/* eslint-disable react-native/no-inline-styles */
import { Button, Divider, Text } from '@rneui/themed';
import React, { useCallback, useEffect, useState } from 'react';
import { Control, UseFormRegister, useForm, useWatch } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import Container from '../../components/Container';
import DatePicker from '../../components/DatePicker';
import { Dropdown, FormInput } from '../../components/Input';
import PlusIcon from '../../components/icons/PlusIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { InvoiceFormScreenProps } from '../../navigation/types';
import useClients, { Client } from '../../providers/ClientsProvider';
import { InvoiceSettingsData } from '../Settings/SettingsInvoices';

type FormData = {
  type: number | null;
  number: string | null;
  issueDate: Date | null;
  issuePlace: string | null;
  sellDate: Date | null;
  sellerName: string | null;
  sellerNip: string | null;
  sellerAddress: string | null;
  sellerCode: string | null;
  sellerCity: string | null;
  sellerAccount: string | null;
  client: number | null;
  buyer: string | null;
  buyerName: string | null;
  buyerNip: string | null;
  buyerStreet: string | null;
  buyerCode: string | null;
  buyerCity: string | null;
  paymentMethod: string | null;
  paymentDate: number | null;
  status: string | null;
  prepaid: string | null;
  issuedBy: string | null;
  receivedBy: string | null;
  comment: string | null;
  currency: string | null;
  payment: string | null;
  positions: Array<{
    [key: string]: string | null;
  }>;
};

function InvoiceDetailsForm({ control }: { control: Control<FormData> }) {
  return (
    <View style={{ gap: 0 }}>
      <Dropdown
        name="type"
        control={control}
        label="Typ faktury"
        options={[
          { label: 'Faktura VAT', value: 'vat' },
          { label: 'Faktura proforma', value: 'proforma' },
          { label: 'Faktura zaliczkowa', value: 'zaliczkowa' },
          { label: 'Faktura końcowa', value: 'koncowa' },
          { label: 'Faktura korekta', value: 'korekta' },
          { label: 'Faktura szacunkowa', value: 'szacunkowa' },
        ]}
        isBordered={false}
      />
      <FormInput label="Numer" noPadding control={control} name="number" />
      <View style={styles.firstDatePickerWrapper}>
        <Text style={styles.datePickerLabel}>Data wystawienia</Text>
        <View style={styles.datePickerContainer}>
          <DatePicker
            control={control}
            name="issueDate"
            onChangeDate={date => {
              // TODO nazwa faktury
            }}
          />
        </View>
      </View>
      <FormInput
        label="Miejsce sprzedaży"
        noPadding
        control={control}
        name="issuePlace"
      />
      <View style={styles.secondDatePickerWrapper}>
        <Text style={styles.datePickerLabel}>Data sprzedaży</Text>
        <View style={styles.datePickerContainer}>
          <DatePicker control={control} name="sellDate" />
        </View>
      </View>
    </View>
  );
}

function SellerDetailsForm({ control }: { control: Control<FormData> }) {
  return (
    <View style={{ gap: -18 }}>
      <FormInput
        label="Imie i nazwisko"
        noPadding
        control={control}
        name="sellerName"
      />
      <FormInput label="NIP" noPadding control={control} name="sellerNip" />
      <FormInput
        label="Ulica i nr"
        noPadding
        control={control}
        name="sellerAddress"
      />
      <FormInput
        label="Kod pocztowy"
        noPadding
        control={control}
        name="sellerCode"
      />
      <FormInput
        label="Miejscowość"
        noPadding
        control={control}
        name="sellerCity"
      />
      <FormInput
        label="Numer konta IBAN"
        noPadding
        control={control}
        name="sellerAccount"
      />
    </View>
  );
}

function BuyerDetailsForm({
  control,
  clients,
  onClientIdChange,
  clientId,
}: {
  control: Control<FormData>;
  clients: Client[];
  onClientIdChange: (clientId: number) => void;
  clientId: number | null;
}) {
  if (!clients) {
    return null;
  }

  return (
    <View style={{ gap: -18 }}>
      {!clientId && (
        <Dropdown
          name="client"
          control={control}
          label="Klient"
          options={clients
            .filter(item => item && item?.first_name && item?.last_name)
            .map(item => ({
              label: `${item?.first_name} ${item?.last_name}`,
              value: item.id,
            }))}
          onChange={onClientIdChange}
          isBordered={false}
        />
      )}
      <Dropdown
        name="buyer"
        control={control}
        label="Typ nabywcy"
        options={[
          { label: 'Osoba prywatna', value: 'private' },
          { label: 'Firma', value: 'company' },
        ]}
        isBordered={false}
        disabled={Boolean(clientId)}
      />
      <FormInput
        label="Firma / Imię i nazwisko"
        noPadding
        control={control}
        name="buyerName"
        disabled={Boolean(clientId)}
      />
      <FormInput
        label="NIP"
        noPadding
        control={control}
        name="buyerNip"
        disabled={Boolean(clientId)}
      />
      <FormInput
        label="Adres"
        noPadding
        control={control}
        name="buyerStreet"
        disabled={Boolean(clientId)}
      />
      <FormInput
        label="Kod pocztowy"
        noPadding
        control={control}
        name="buyerCode"
        disabled={Boolean(clientId)}
      />
      <FormInput
        label="Miasto"
        noPadding
        control={control}
        name="buyerCity"
        disabled={Boolean(clientId)}
      />
    </View>
  );
}

function ProductDetailsForm({
  control,
  position,
  register,
  setValue,
  onAddNewPosition,
  isLastPosition,
}: {
  control: Control<FormData>;
  position: number;
  register: UseFormRegister<FormData>;
  setValue: (name: any, value: any) => void;
  onAddNewPosition?: () => void;
  isLastPosition?: boolean;
}) {
  React.useEffect(() => {
    register(`positions.${position}.productName`);
    register(`positions.${position}.buyerType`);
    register(`positions.${position}.productQuantity`);
    register(`positions.${position}.productUnit`);
    register(`positions.${position}.nettoPrice`);
    register(`positions.${position}.vat`);
    register(`positions.${position}.productBrutto`);
  }, [register, position]);

  const quantity = useWatch({
    control,
    name: `positions.${position}.productQuantity` as any,
  });
  const nettoPrice = useWatch({
    control,
    name: `positions.${position}.nettoPrice` as any,
  });
  const vat = useWatch({
    control,
    name: `positions.${position}.vat` as any,
  });

  const bruttoValue = useWatch({
    control,
    name: `positions.${position}.productBrutto` as any,
  });

  // Obliczanie wartości brutto
  useEffect(() => {
    // Sprawdzamy, czy wszystkie wartości są dostępne
    if (
      quantity === undefined &&
      nettoPrice === undefined &&
      vat === undefined
    ) {
      return;
    }

    const qty = parseFloat(quantity?.toString() || '0') || 0;
    const price = parseFloat(nettoPrice?.toString() || '0') || 0;
    const vatRate = parseFloat(vat?.toString() || '0') || 0;

    const grossValue = qty * price * (1 + vatRate / 100);
    const newBruttoValue = grossValue.toFixed(2);

    // Sprawdzamy, czy wartość się zmieniła, aby uniknąć niepotrzebnych aktualizacji
    // Porównujemy jako stringi, aby uniknąć problemów z precyzją liczb zmiennoprzecinkowych
    const currentBruttoStr = bruttoValue?.toString() || '0.00';
    if (currentBruttoStr !== newBruttoValue) {
      setValue(`positions.${position}.productBrutto`, newBruttoValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, nettoPrice, vat, position]);

  return (
    <View style={{ gap: -18 }}>
      <FormInput
        label="Nazwa pozycji"
        noPadding
        isBordered
        control={control}
        name={`positions.${position}.productName`}
      />
      <Dropdown
        name={`positions.${position}.buyerType`}
        control={control}
        label="Typ nabywcy"
        options={[
          { label: 'Osoba prywatna', value: 'private' },
          { label: 'Firma', value: 'company' },
        ]}
        isBordered={false}
      />
      <View style={styles.rowContainer}>
        <View style={styles.halfWidth}>
          <FormInput
            label="Ilość"
            noPadding
            isBordered
            control={control}
            name={`positions.${position}.productQuantity`}
          />
        </View>
        <View style={[styles.halfWidth, styles.rightMargin]}>
          <FormInput
            label="Jednostka"
            noPadding
            isBordered
            control={control}
            name={`positions.${position}.productUnit`}
          />
        </View>
      </View>
      <View style={styles.rowContainer}>
        <View style={styles.halfWidth}>
          <FormInput
            label="Cena netto"
            noPadding
            isBordered
            control={control}
            name={`positions.${position}.nettoPrice`}
          />
        </View>
        <View style={[styles.halfWidth, styles.rightMargin]}>
          <Dropdown
            name={`positions.${position}.vat`}
            control={control}
            label="Stawka VAT"
            options={[
              { label: '23%', value: '23' },
              { label: '0%', value: '0' },
            ]}
            isBordered={false}
          />
        </View>
      </View>
      {/* 
        Stare sprawdzanie wartości brutto
        bruttoValue
          .toString()
          .replace('.', ',')
          .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      */}
      <FormInput
        label="Wartość brutto"
        noPadding
        isBordered
        control={control}
        name={`positions.${position}.productBrutto`}
      />
      {isLastPosition && onAddNewPosition && (
        <Button
          title="Nowa pozycja"
          titleStyle={styles.newButtonTitle}
          buttonStyle={styles.newButton}
          icon={
            <View style={styles.newButtonIconContainer}>
              <PlusIcon size={16} color={Colors.white} />
            </View>
          }
          iconRight={false}
          onPress={onAddNewPosition}
        />
      )}
    </View>
  );
}

function SummarySection({
  positions,
  currency,
}: {
  positions: Array<{ [key: string]: string | null }> | undefined;
  currency: string | null;
}) {
  const calculateSummary = () => {
    if (!positions || positions.length === 0) {
      return {
        netto: '0,00',
        vat: '0,00',
        brutto: '0,00',
      };
    }

    let nettoSum = 0;
    let vatSum = 0;
    let bruttoSum = 0;

    positions.forEach(position => {
      const quantity = parseFloat(position.productQuantity?.toString() || '0');
      const nettoPrice = parseFloat(position.nettoPrice?.toString() || '0');
      const vatRate = parseFloat(position.vat?.toString() || '0');

      const netto = quantity * nettoPrice;
      const vat = netto * (vatRate / 100);
      const brutto = netto + vat;

      nettoSum += netto;
      vatSum += vat;
      bruttoSum += brutto;
    });

    const formatNumber = (num: number) => {
      return num
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    return {
      netto: formatNumber(nettoSum),
      vat: formatNumber(vatSum),
      brutto: formatNumber(bruttoSum),
    };
  };

  const summary = calculateSummary();
  const currencySymbol = currency || 'PLN';

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Suma netto</Text>
        <Text style={styles.summaryValue}>
          {summary.netto} {currencySymbol}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Suma VAT</Text>
        <Text style={styles.summaryValue}>
          {summary.vat} {currencySymbol}
        </Text>
      </View>
      <View style={[styles.summaryRow, { marginBottom: 0 }]}>
        <Text style={styles.summaryLabel}>Suma brutto</Text>
        <Text style={styles.summaryValue}>
          {summary.brutto} {currencySymbol}
        </Text>
      </View>
    </View>
  );
}

function DeliveryDetailsForm({
  control,
  clientId,
}: {
  control: Control<FormData>;
  clientId: number | null;
}) {
  return (
    <View style={{ gap: -18 }}>
      <Dropdown
        name="paymentMethod"
        control={control}
        label="Płatność"
        options={[
          { label: 'Przelew', value: 'transfer' },
          { label: 'Karta', value: 'card' },
          { label: 'Gotówka', value: 'cash' },
        ]}
        isBordered={false}
      />
      <Dropdown
        name="paymentDate"
        control={control}
        label="Termin płatności"
        options={[
          { label: '7 dni', value: 7 },
          { label: '10 dni', value: 10 },
          { label: '14 dni', value: 14 },
          { label: '30 dni', value: 30 },
        ]}
        isBordered={false}
      />
      <Dropdown
        name="status"
        control={control}
        label="Status"
        options={[
          { label: 'Wystawiona', value: 'issued' },
          { label: 'Opłacona', value: 'paid' },
          { label: 'Częściowo opłacona', value: 'partial' },
        ]}
        isBordered={false}
      />
      <FormInput
        label="Kwota opłacona"
        noPadding
        control={control}
        name="prepaid"
      />
      <FormInput
        label="Imię i nazwisko wystawcy"
        noPadding
        control={control}
        name="issuedBy"
      />
      <FormInput
        label="Imię i nazwisko odbiorcy"
        noPadding
        control={control}
        name="receivedBy"
        disabled={Boolean(clientId)}
      />
      <FormInput label="Uwagi" noPadding control={control} name="comment" />
      <Dropdown
        name="currency"
        control={control}
        label="Waluta"
        options={[
          { label: 'PLN', value: 'PLN' },
          { label: 'USD', value: 'USD' },
        ]}
        isBordered={false}
      />
    </View>
  );
}

function InvoiceForm({ navigation, route }: InvoiceFormScreenProps) {
  const {
    clientId: paramClientId,
    installationId,
    sourceScreen,
  } = route.params ?? {};

  const { control, register, handleSubmit, setValue, unregister } =
    useForm<FormData>({
      defaultValues: { sellDate: new Date(), issueDate: new Date() },
    });
  const [positions, setPositions] = useState<Array<number>>([0]);
  const [clientsList, setClientsList] = useState<Client[] | null>(null);
  const [clientId, setClientId] = useState<number | null>(
    paramClientId ?? null,
  );

  type ApiResponse = {
    code?: string;
    message?: {
      buyer_tax_no?: string[];
      seller_tax_no?: string[];
    };
  };

  const { execute: createInvoice } = useApi<ApiResponse>({
    path: 'faktura_create',
  });

  const { result: invoicePresets, execute: getInvoicePresets } =
    useApi<InvoiceSettingsData>({
      path: 'invoice_settings_list',
    });

  const { result: me, execute: getMe } = useApi<Client>({
    path: 'data',
  });

  const { clients, getClients } = useClients();

  const [visible, setVisible] = useState(false);

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const onClientIdChange = (id: number) => {
    if (clientId && id === clientId) return;
    setClientId(id);
  };

  const removePosition = (positionToRemove: number) => {
    const updatedPositions = positions.filter(
      position => position !== positionToRemove,
    );
    setPositions(updatedPositions);
    unregister(`positions.${positionToRemove}.productName`);
    unregister(`positions.${positionToRemove}.productQuantity`);
    unregister(`positions.${positionToRemove}.productUnit`);
    unregister(`positions.${positionToRemove}.nettoPrice`);
    unregister(`positions.${positionToRemove}.vat`);
    unregister(`positions.${positionToRemove}.productBrutto`);
  };

  useEffect(() => {
    if (getClients) {
      getClients();
    }
  }, [getClients]);

  useEffect(() => {
    if (getMe) {
      getMe();
    }
  }, [getMe]);

  useEffect(() => {
    if (getInvoicePresets) {
      getInvoicePresets();
    }
  }, [getInvoicePresets]);

  useEffect(() => {
    if (clients) {
      setClientsList(clients);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients]);

  useEffect(() => {
    if (invoicePresets) {
      setValue('sellerAccount', invoicePresets.iban);
      setValue('sellerName', invoicePresets.issuer_name);
      setValue('issuePlace', invoicePresets.place_of_issue);
      setValue('issuedBy', invoicePresets.issuer_name);
      setValue('issuedBy', invoicePresets.issuer_name);
      setValue('paymentDate', invoicePresets.standard_payment_term);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoicePresets]);

  useEffect(() => {
    if (me) {
      setValue('sellerNip', me.nip);
      setValue('sellerAddress', me.ulica);
      setValue('sellerCode', me.kod_pocztowy);
      setValue('sellerCity', me.miasto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    if (clients && clientId) {
      const client = clients.filter(item => item.id === clientId)[0];

      setValue('buyerName', `${client?.first_name} ${client?.last_name}`);
      setValue('buyerNip', client?.nip);
      setValue('buyerStreet', client?.ulica);
      setValue('buyerCode', client?.kod_pocztowy);
      setValue('buyerCity', client?.miasto);
      setValue('client', clientId);
      setValue('receivedBy', `${client?.first_name} ${client?.last_name}`);
      setValue(
        'buyer',
        client?.rodzaj_klienta === 'firma' ? 'company' : 'private',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, clientId]);

  const addNewPosition = () => {
    const newPositions = [...positions, positions.length];
    setPositions(newPositions);
  };

  const onSubmit = async (data: FormData) => {
    let hasUndefValues = Object.entries(data).some(([key, value]) => {
      if (key === 'buyerNip' && data.buyer === 'private') {
        return false;
      }
      if (key === 'comment' || key === 'payment' || key === 'client') {
        return false;
      }
      return value === undefined || value === '';
    });

    data.positions.forEach(item => {
      // Sprawdź tylko wymagane pola pozycji (pomijamy productBrutto, bo jest obliczane)
      const requiredFields = [
        'productName',
        'productQuantity',
        'productUnit',
        'nettoPrice',
        'vat',
      ];
      requiredFields.forEach(field => {
        if (!item[field] || item[field] === '') {
          hasUndefValues = true;
        }
      });
    });

    if (hasUndefValues) {
      toggleOverlay();
      Alert.alert('Wypełnij wszystkie pola przed zapisaniem faktury.');
      return;
    }

    const response = await createInvoice({ data: { ...data, installationId } });
    if (
      response &&
      response.code === 'error' &&
      response.message &&
      response.message.buyer_tax_no
    ) {
      toggleOverlay();
      Alert.alert('Błędny numer NIP nabywcy');
      return;
    }
    if (
      response &&
      response.code === 'error' &&
      response.message &&
      response.message.seller_tax_no
    ) {
      toggleOverlay();
      Alert.alert('Błędny numer NIP sprzedawcy');
      return;
    }
    toggleOverlay();

    Alert.alert('Sukces', 'Utworzono fakturę', [
      {
        text: 'OK',
        onPress: () => {
          if (
            route.params?.from === 'Installation' &&
            route.params?.clientId &&
            route.params?.installationId
          ) {
            // Navigate back to the installation's Faktury tab
            navigation.navigate('Clients' as any, {
              screen: 'Settings',
              params: {
                clientId: route.params.clientId.toString(),
                installationId: route.params.installationId.toString(),
                activeTab: 'faktury',
              },
            });
          } else if (
            route.params?.from === 'Installation' &&
            route.params?.clientId
          ) {
            // Navigate back to the specific client if we have clientId but no installationId
            navigation.navigate('Clients' as any, {
              screen: 'Menu',
              params: { clientId: route.params.clientId },
            });
          } else if (
            route.params?.from === 'Installation' ||
            route.params?.sourceScreen === 'client'
          ) {
            // Navigate back to client list if we came from installation but don't have specific client
            navigation.navigate('Clients' as any);
          } else {
            // Default behavior - go back to invoice list
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleBackNavigation = useCallback(() => {
    if (
      route.params?.from === 'Installation' &&
      route.params?.clientId &&
      route.params?.installationId
    ) {
      // Navigate back to the installation's Faktury tab
      navigation.navigate('Clients' as any, {
        screen: 'Settings',
        params: {
          clientId: route.params.clientId.toString(),
          installationId: route.params.installationId.toString(),
          activeTab: 'faktury',
        },
      });
    } else if (
      route.params?.from === 'Installation' &&
      route.params?.clientId
    ) {
      // Navigate back to the specific client if we have clientId but no installationId
      navigation.navigate('Clients' as any, {
        screen: 'Menu',
        params: { clientId: route.params.clientId },
      });
    } else if (route.params?.from === 'Installation') {
      // Navigate back to client list if we came from installation
      navigation.navigate('Clients' as any);
    } else {
      // Default behavior
      navigation.goBack();
    }
  }, [navigation, route.params]);

  const watchedPositions = useWatch({
    control,
    name: 'positions',
  });
  const watchedCurrency = useWatch({
    control,
    name: 'currency',
  });

  return (
    <View style={styles.linearGradient}>
      <Container style={styles.container}>
        <ButtonsHeader
          onBackPress={handleBackNavigation}
          title="Nowa faktura"
        />

        <ScrollView style={styles.scrollContainer}>
          <InvoiceDetailsForm control={control} />
          <Text style={styles.header}>Nabywca</Text>
          {clientsList && (
            <BuyerDetailsForm
              control={control}
              clients={clientsList}
              onClientIdChange={onClientIdChange}
              clientId={clientId}
            />
          )}
          <Text style={styles.header}>Pozycje na fakturze</Text>
          <View style={styles.productDetailsForm}>
            {positions.map((position, index) => (
              <React.Fragment key={position}>
                {index > 0 && (
                  <>
                    <Text style={styles.positionHeader}>
                      Pozycja {index + 1}
                    </Text>
                    <Divider style={styles.divider} />
                  </>
                )}
                <ProductDetailsForm
                  control={control}
                  position={position}
                  register={register}
                  setValue={setValue}
                  onAddNewPosition={addNewPosition}
                  isLastPosition={index === positions.length - 1}
                />
                {positions.length > 1 && (
                  <Button
                    title="Usuń pozycję"
                    titleStyle={styles.delButtonTitle}
                    buttonStyle={styles.delButton}
                    icon={<TrashIcon size={24} color={Colors.white} />}
                    onPress={() => removePosition(position)}
                  />
                )}
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.header}>Podsumowanie</Text>
          <SummarySection
            positions={watchedPositions || []}
            currency={watchedCurrency}
          />
          <DeliveryDetailsForm control={control} clientId={clientId} />
          <ButtonGroup
            submitTitle="Wystaw fakturę"
            cancelTitle="Anuluj"
            onSubmitPress={toggleOverlay}
            onCancel={handleBackNavigation}
            stretch
            groupStyle={styles.footerButtons}
            cancelStyle={styles.cancelButtonStyle}
            cancelTitleStyle={styles.cancelButtonTitle}
            submitStyle={styles.submitButtonStyle}
            submitTitleStyle={styles.submitButtonTitle}
          />
        </ScrollView>
        <ConfirmationOverlay
          visible={visible}
          onBackdropPress={toggleOverlay}
          onSubmit={handleSubmit(onSubmit)}
          title="Czy na pewno chcesz wystawić fakturę?"
        />
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: Colors.homeScreenBackground,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    backgroundColor: Colors.homeScreenBackground,
  },
  header: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.2,
    marginTop: 20,
    marginBottom: 8,
  },
  positionHeader: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: 16,
  },
  footerButtons: {
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    gap: 12,
  },
  cancelButtonStyle: {
    flex: 1,
    backgroundColor: Colors.transparent,
    borderWidth: 2,
    borderColor: Colors.grayBorder,
    borderRadius: 60,
    height: 48,
  },
  cancelButtonTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Colors.black,
  },
  submitButtonStyle: {
    flex: 1,
    backgroundColor: Colors.lightRose,
    borderRadius: 60,
    height: 48,
  },
  submitButtonTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
  newButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: Colors.invoiceFormTextContainer,
    borderWidth: 0,
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delButton: {
    width: '100%',
    height: 48,
    borderRadius: 9,
    backgroundColor: Colors.red,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delButtonTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.white,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButtonTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.black,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButtonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  firstDatePickerWrapper: {
    marginTop: -8,
    marginBottom: 16,
  },
  datePickerLabel: {
    fontFamily: 'Archivo_600SemiBold',
    marginTop: 0,
    marginBottom: 6,
    color: Colors.black,
    fontSize: 10,
    letterSpacing: 0.3,
    fontWeight: 'normal',
  },
  secondDatePickerWrapper: {
    marginBottom: 16,
  },
  datePickerContainer: {
    marginTop: 4,
    backgroundColor: Colors.white,
    borderRadius: 9,
    minHeight: 54,
    display: 'flex',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  productDetailsForm: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 9,
    padding: 16,
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
    marginTop: 8,
  },
  halfWidth: {
    flex: 1,
  },
  rightMargin: {
    marginLeft: 0,
  },
  summaryContainer: {
    backgroundColor: Colors.transparent,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.black,
  },
  summaryValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.black,
  },
});

export default InvoiceForm;
