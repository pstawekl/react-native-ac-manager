import { Text } from '@rneui/themed';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { useNavigation } from '@react-navigation/native';
import ButtonsHeader from '../../components/ButtonsHeader';
import PrintIcon from '../../components/icons/PrintIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import InvoiceSumTable from './InvoiceSumTable';

function Details({ invoice }: { invoice: any }) {
  let status: { name: string; bgColor: string; textColor: string } = {
    name: 'Wystawiona',
    bgColor: Colors.white,
    textColor: Colors.black,
  };

  switch (invoice.status) {
    case 'paid':
      status = {
        name: 'Opłacona',
        bgColor: Colors.green,
        textColor: Colors.white,
      };
      break;
    case 'partial':
      status = {
        name: 'Częściowo opł.',
        bgColor: Colors.red,
        textColor: Colors.white,
      };
      break;
    default:
      status = {
        name: 'Wystawiona',
        bgColor: Colors.white,
        textColor: Colors.black,
      };
      break;
  }

  return (
    <>
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <PrintIcon color={Colors.black} size={22} />
          <Text style={styles.detailsHeaderText}>{invoice.number}</Text>
        </View>

        <View style={[styles.details, { backgroundColor: status.bgColor }]}>
          <Text style={[styles.detailsStatus, { color: status.textColor }]}>
            {status.name}
          </Text>
        </View>
      </View>
      <View style={styles.detailsDateContainer}>
        <View>
          <View>
            <Text style={styles.title}>Data wystawienia</Text>
            <Text style={styles.text}>{invoice.issue_date}</Text>
          </View>
          <View style={styles.detailsDateMargin}>
            <Text style={styles.title}>Data księgowania</Text>
            <Text style={styles.text}>{invoice.sell_date}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.title}>Data zapłaty</Text>
          <Text style={styles.text}>{invoice.transaction_date}</Text>
        </View>
      </View>
    </>
  );
}

function FormBlock({
  title,
  text,
  isAddressBlock,
  addressData,
  lightText,
}: {
  title: string;
  text?: string;
  isAddressBlock?: boolean;
  addressData?: {
    title?: string;
    address?: string;
    nip?: string;
  };
  lightText?: boolean;
}) {
  return (
    <View style={styles.formBlockContainer}>
      <Text style={styles.formBlockTitle}>{title}</Text>
      <View style={styles.formBlockTextContainer}>
        {isAddressBlock ? (
          <>
            <Text style={styles.formBlockAddressBold}>
              {addressData?.title}
            </Text>
            <Text style={styles.formBlockAddress}>{addressData?.address}</Text>
            <Text style={styles.formBlockAddress}>
              NIP: {addressData?.nip || 'Brak'}
            </Text>
          </>
        ) : (
          <Text
            style={
              lightText ? styles.formBlockLightText : styles.formBlockBoldText
            }
          >
            {text}
          </Text>
        )}
      </View>
    </View>
  );
}

function SumBlock({
  products,
  currency,
}: {
  products: {
    name: string;
    quantity: string;
    quantity_unit: string;
    price_gross: string;
    price_net: string;
    price_tax: string;
  }[];
  currency: string;
}) {
  return (
    <View style={styles.sumContainer}>
      {products.map(item => (
        <View style={styles.sumWrapper}>
          <Text style={styles.sumTitle}>{item.name} </Text>
          <Text style={styles.sumText}>
            {Number(item.quantity)} {item.quantity_unit ?? 'szt'} x{' '}
            {Number(item.price_gross)} {currency}
          </Text>
        </View>
      ))}
      <InvoiceSumTable currency={currency} products={products} />
    </View>
  );
}

function Form({ invoice }: { invoice: any }) {
  if (!invoice) return null;

  const sellerAddress =
    invoice.seller_street || invoice.seller_post_code || invoice.seller_city
      ? `Ul. ${invoice.seller_street || ''}, ${invoice.seller_post_code || ''
        } ${invoice.seller_city || ''}`.trim()
      : 'Brak danych';

  const buyerAddress =
    invoice.buyer_street || invoice.buyer_post_code || invoice.buyer_city
      ? `Ul. ${invoice.buyer_street || ''}, ${invoice.buyer_post_code || ''} ${invoice.buyer_city || ''
        }`.trim()
      : 'Brak danych';

  return (
    <View style={styles.formContainer}>
      <FormBlock text={invoice.number || 'Brak'} title="Tytuł" />
      <FormBlock text={invoice.kind_text || 'Brak'} title="Typ" />
      <FormBlock
        addressData={{
          address: sellerAddress,
          title: 'Sprzedawca',
          nip: invoice.seller_tax_no || 'Brak',
        }}
        title="Sprzedawca"
        isAddressBlock
      />
      <FormBlock
        addressData={{
          address: buyerAddress,
          title: 'Klient',
          nip: invoice.buyer_tax_no || 'Brak',
        }}
        title="Nabywca"
        isAddressBlock
      />
      <FormBlock text={invoice.payment_type || 'Gotówka'} title="Płatność" />
      <FormBlock
        text={
          invoice.status === 'paid'
            ? 'Opłacono'
            : invoice.pattern_nr_m
              ? `${invoice.pattern_nr_m} Dni`
              : 'Brak danych'
        }
        title="Termin"
      />
      {invoice.positions && invoice.positions.length > 0 ? (
        <SumBlock
          products={invoice.positions}
          currency={invoice.currency || 'PLN'}
        />
      ) : (
        <FormBlock text="Brak pozycji" title="Pozycje faktury" />
      )}
      <FormBlock text={invoice.description || 'Brak'} title="Uwagi" lightText />
    </View>
  );
}

function InvoiceDetails({ route }: any) {
  const { id } = route.params;
  const navigation = useNavigation();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { result, loading, execute } = useApi<any>({
    path: 'faktura_data',
  });

  useEffect(() => {
    if (execute && id) {
      setError(null);
      execute({ data: { invoice_id: id } as any });
    }
  }, [execute, id]);

  useEffect(() => {
    if (result) {
      const resultData = result as any;
      // Sprawdź czy wynik zawiera błąd
      if (resultData.error) {
        setError(resultData.error);
        setInvoice(null);
      } else if (resultData.id || resultData.number) {
        // Sprawdź czy to prawidłowa faktura (ma id lub number)
        setInvoice(resultData);
        setError(null);
      } else {
        setError('Nie udało się pobrać danych faktury');
        setInvoice(null);
      }
    }
  }, [result]);

  return (
    <View style={styles.wrapper}>
      <ButtonsHeader onBackPress={navigation.goBack} />

      <ScrollView style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.green} />
            <Text style={styles.loadingText}>Ładowanie faktury...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubtext}>
              Sprawdź, czy faktura ma przypisany numer zewnętrzny
              (id_fakturowni)
            </Text>
          </View>
        )}

        {invoice && !loading && !error && (
          <>
            <Details invoice={invoice} />
            <Form invoice={invoice} />
            <View style={styles.footer}>
              {/* <SubmitButton
            title="Edytuj fakturę"
          /> */}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 40,
  },
  container: {
    paddingHorizontal: 18,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.lightGray,
    fontFamily: 'Poppins_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.red,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.lightGray,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  footer: {
    marginBottom: 100,
  },
  title: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  text: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  formContainer: {
    marginTop: 16,
    marginBottom: 30,
    paddingHorizontal: 0,
  },
  sumContainer: {
    marginVertical: 30,
  },
  sumTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  sumText: {
    marginBottom: 20,
    fontSize: 15,
    lineHeight: 22,
  },
  formBlockContainer: {
    marginVertical: 8,
  },
  formBlockTitle: {
    marginBottom: 6,
    fontSize: 11,
  },
  formBlockTextContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: Colors.invoiceFormTextContainer,
  },
  formBlockAddress: {
    fontSize: 12,
    lineHeight: 18,
  },
  formBlockAddressBold: {
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.black,
  },
  formBlockLightText: {
    minHeight: 132,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.invoiceLightText,
  },
  formBlockBoldText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.black,
  },

  detailsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsHeader: {
    display: 'flex',
    flexDirection: 'row',
  },
  detailsHeaderText: {
    marginLeft: 17,
    fontFamily: 'Poppins_600SemiBold',
  },
  details: {
    width: 87,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.black,
  },
  detailsStatus: {
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: Colors.white,
  },
  detailsDateContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  detailsDateMargin: {
    marginTop: 18,
  },
  sumWrapper: {
    flexDirection: 'row',
  },
});

export default InvoiceDetails;
