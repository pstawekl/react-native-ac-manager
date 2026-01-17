import { Divider, Text } from '@rneui/themed';
import { StyleSheet, View } from 'react-native';
import Colors from '../../consts/Colors';

function InvoiceSumTable({
  currency,
  products,
}: {
  currency: string;
  products: {
    name: string;
    quantity: string;
    quantity_unit: string;
    price_gross: string;
    price_net: string;
    price_tax: string;
  }[];
}) {
  let summary = { netto: 0, vat: 0, brutto: 0 };

  products.forEach(item => {
    summary = {
      netto: summary.netto + Number(item.price_net),
      vat: summary.vat + Number(item.price_tax),
      brutto: summary.brutto + Number(item.price_gross),
    };
  });

  return (
    <>
      <View style={styles.sumRow}>
        <Text style={styles.sumRowTitle}>Suma netto</Text>
        <Text style={styles.sumRowText}>{summary.netto}</Text>
        <Text style={styles.sumRowText}>{currency}</Text>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumRowTitle}>Suma VAT</Text>
        <Text style={styles.sumRowText}>{summary.vat}</Text>
        <Text style={styles.sumRowText}>{currency}</Text>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumRowTitle}>Suma brutto</Text>
        <Text style={styles.sumRowText}>{summary.brutto}</Text>
        <Text style={styles.sumRowText}>{currency}</Text>
      </View>
      <Divider style={styles.divider} />
    </>
  );
}

const styles = StyleSheet.create({
  sumRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    marginTop: 8,
  },
  sumRowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    width: 150,
  },
  sumRowText: {
    fontSize: 10,
    width: 60,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});

export default InvoiceSumTable;
