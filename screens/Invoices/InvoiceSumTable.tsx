import { Divider, Text } from '@rneui/themed';
import { StyleSheet, View } from 'react-native';
import Colors from '../../consts/Colors';

function parseProductNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const str = String(value).trim().replace(',', '.');
  const num = parseFloat(str);
  return Number.isNaN(num) ? 0 : num;
}

function formatSum(num: number): string {
  return num
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function InvoiceSumTable({
  currency,
  products,
}: {
  currency: string;
  products: (
    | {
      name: string;
      quantity: string;
      quantity_unit: string;
      price_gross: string;
      price_net: string;
      price_tax: string;
    }
    | Record<string, unknown>
  )[];
}) {
  let summary = { netto: 0, vat: 0, brutto: 0 };

  (products || []).forEach(item => {
    const raw = item as Record<string, unknown>;
    const qty = parseProductNumber(raw.quantity as string) || 1;
    const priceNet = parseProductNumber(raw.price_net as string);
    const priceTax = parseProductNumber(raw.price_tax as string);
    const priceGross = parseProductNumber(
      (raw.price_gross ?? raw.total_price_gross) as string,
    );
    const totalNet = parseProductNumber(raw.total_price_net as string);
    const totalTax = parseProductNumber(raw.total_price_tax as string);
    const totalGross = parseProductNumber(raw.total_price_gross as string);

    const lineNetto = totalNet > 0 ? totalNet : qty * priceNet;
    const lineBrutto = totalGross > 0 ? totalGross : qty * priceGross;
    const lineVat = totalTax > 0 ? totalTax : lineBrutto - lineNetto;

    summary = {
      netto: summary.netto + lineNetto,
      vat: summary.vat + lineVat,
      brutto: summary.brutto + lineBrutto,
    };
  });

  return (
    <>
      <View style={styles.sumRow}>
        <Text style={styles.sumRowTitle}>Suma netto</Text>
        <Text style={styles.sumRowText}>{formatSum(summary.netto)}</Text>
        <Text style={styles.sumRowText}>{currency}</Text>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumRowTitle}>Suma VAT</Text>
        <Text style={styles.sumRowText}>{formatSum(summary.vat)}</Text>
        <Text style={styles.sumRowText}>{currency}</Text>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.sumRow}>
        <Text style={styles.sumRowTitle}>Suma brutto</Text>
        <Text style={styles.sumRowText}>{formatSum(summary.brutto)}</Text>
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
