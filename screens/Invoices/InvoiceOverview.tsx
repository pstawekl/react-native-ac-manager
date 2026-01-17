import { StyleSheet, View } from 'react-native';
import { Divider, Text } from '@rneui/themed';
import { ScrollView } from 'react-native-gesture-handler';

import { useNavigation } from '@react-navigation/native';
import Colors from '../../consts/Colors';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';

function Details() {
  return (
    <View style={styles.container}>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Faktura proforma</Text>
        <View style={styles.detailsStatus}>
          <Text style={styles.detailsStatusText}>Opłacona</Text>
        </View>
      </View>
      <Text style={styles.text}>Faktura nr 0000</Text>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Data wystawienia: 00/00/0000</Text>
        <Text style={styles.text}>Termin płatności: 00/00/0000</Text>
      </View>
      <Divider style={styles.detailsDivider} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Sprzedawca</Text>
        <Text style={styles.text}>Jan Kowalski</Text>
        <Text style={styles.text}>Ulicowa 00</Text>
        <Text style={styles.text}>00-000 Miejscowość</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Klient</Text>
        <Text style={styles.text}>Jan Kowalski</Text>
        <Text style={styles.text}>Ulicowa 00</Text>
        <Text style={styles.text}>00-000 Miejscowość</Text>
      </View>
    </View>
  );
}

function ProductsTable() {
  return (
    <View style={[styles.container, styles.productsTableContainer]}>
      <Text style={styles.title}>Produkty</Text>
      <View style={styles.rowContainer}>
        <View style={[styles.nameColumn, styles.nameColumnTitle]}>
          <Text style={styles.tableText}>Nazwa</Text>
        </View>
        <View style={[styles.priceColumn, styles.priceColumnTitle]}>
          <Text style={styles.tableText}>Wartość VAT (PLN)</Text>
        </View>
        <View style={[styles.priceColumn, styles.priceColumnTitle]}>
          <Text style={styles.tableText}>Wartość Netto (PLN)</Text>
        </View>
        <View style={[styles.priceColumn, styles.priceColumnTitle]}>
          <Text style={styles.tableText}>Wartość Brutto (PLN)</Text>
        </View>
      </View>
      <View style={styles.rowContainer}>
        <View style={styles.nameColumn}>
          <Text style={styles.tableText}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
      </View>
      <View style={styles.rowContainer}>
        <View style={styles.nameColumn}>
          <Text style={styles.tableText}>Lorem ipsum</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
      </View>
      <View style={styles.rowContainer}>
        <View style={styles.nameColumn}>
          <Text style={styles.tableText}>Lorem ipsum dolor sit amet,</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.tableText}>0000,00</Text>
        </View>
      </View>
    </View>
  );
}

function PaymentMethod() {
  return (
    <View style={[styles.container, styles.paymentMethodContainer]}>
      <Text style={styles.title}>Płatność</Text>
      <View style={styles.paymentRow}>
        <Text style={styles.text}>Sposób płatności:</Text>
        <Text style={styles.text}>Przelew</Text>
      </View>
      <Divider style={styles.paymentDivider} />
      <View style={styles.paymentRow}>
        <Text style={styles.text}>Bank:</Text>
        <Text style={styles.text}>Pekao SA</Text>
      </View>
      <Divider style={styles.paymentDivider} />
      <View style={styles.paymentRow}>
        <Text style={styles.text}>Rachunek Bankowy:</Text>
        <Text style={styles.text}>000000000000000000000</Text>
      </View>
    </View>
  );
}

function Calculations() {
  return (
    <View style={styles.calculationsContainer}>
      <Text style={styles.header}>Podsumowanie</Text>
      <View style={styles.sumRow}>
        <Text style={styles.sumRowText}>Razem</Text>
        <Text style={styles.sumRowText}>0000,00 PLN</Text>
      </View>
      <Divider style={styles.sumDivider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumRowText}>Wartość brutto:</Text>
        <Text style={styles.sumRowText}>0000,00 PLN</Text>
      </View>
      <Divider style={styles.sumDivider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumRowText}>Wartość netto:</Text>
        <Text style={styles.sumRowText}>0000,00 PLN</Text>
      </View>
      <Divider style={styles.sumDivider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumRowText}>Wartość VAT:</Text>
        <Text style={styles.sumRowText}>0000,00 PLN</Text>
      </View>
      <View style={styles.footer}>
        <ButtonGroup
          cancelTitle="Anuluj"
          submitTitle="Zapisz"
          onCancel={() => undefined /* @ToDo */}
          onSubmitPress={() => undefined /* @ToDo */}
          cancelStyle={styles.cancelStyle}
          submitStyle={styles.submitStyle}
          submitTitleStyle={styles.submitTitle}
          stretch={false}
        />
      </View>
    </View>
  );
}

function InvoiceOverview() {
  const navigation = useNavigation();

  return (
    <View style={styles.overviewContainer}>
      <ButtonsHeader onBackPress={navigation.goBack} />

      <ScrollView style={styles.overviewScroll}>
        <Details />
        <ProductsTable />
        <PaymentMethod />
      </ScrollView>
      <Calculations />
    </View>
  );
}

const styles = StyleSheet.create({
  sumRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    marginTop: 5,
  },
  sumRowText: {
    fontSize: 12,
    color: Colors.white,
  },
  sumDivider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
  },
  title: {
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  textContainer: {
    marginVertical: 14,
  },
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  nameColumn: {
    width: '28%',
    paddingVertical: 12,
    paddingRight: 20,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  nameColumnTitle: {
    borderRightWidth: 0,
  },
  priceColumn: {
    width: '24%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  priceColumnTitle: {
    borderRightWidth: 0,
    paddingVertical: 0,
  },
  tableText: {
    fontSize: 10,
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  paymentRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentDivider: {
    marginVertical: 2,
    height: 1,
    backgroundColor: Colors.border,
  },
  overviewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  overviewScroll: {
    paddingTop: 20,
  },

  cancelStyle: {
    width: 94,
    borderRadius: 10,
    backgroundColor: Colors.buttons.cancelBg,
  },
  submitStyle: {
    width: 94,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  submitTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.brightGreen,
  },
  footer: {
    marginTop: 20,
    marginBottom: 10,
  },
  header: {
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
  calculationsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 20,
    backgroundColor: Colors.brightGreen,
  },
  productsTableContainer: {
    marginBottom: 10,
  },
  paymentMethodContainer: {
    marginBottom: 40,
  },
  detailsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  detailsStatus: {
    width: 79,
    height: 18,
    borderRadius: 10,
    backgroundColor: Colors.brightGreen,
  },
  detailsStatusText: {
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: Colors.white,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: Colors.brightGreen,
  },
});

export default InvoiceOverview;
