import { useNavigation } from '@react-navigation/native';
import { Button, Text } from '@rneui/themed';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import FilterIcon from '../../components/icons/FilterIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import useApi from '../../hooks/useApi';
import { InvoicesListScreenProps } from '../../navigation/types';
import usePermission from '../../providers/PermissionProvider';

type Invoice = {
  id: number;
  ac_user: number;
  client_name: string;
  id_fakturowni: string;
  instalacja: number | string;
  issue_date: string;
  numer_faktury: string;
  order: number;
  status: string;
  total?: number;
  currency?: string;
  kind?: string;
};

function RowRightContent({ onDeletePress }: { onDeletePress: () => void }) {
  return (
    <View style={styles.rowRightContent}>
      <Button
        iconPosition="top"
        title="Usuń"
        icon={{
          name: 'trash',
          type: 'font-awesome-5',
          color: Colors.white,
        }}
        containerStyle={styles.buttonContainer}
        buttonStyle={[styles.buttonStyle, styles.buttonDeleteStyle]}
        titleStyle={styles.buttonTitleStyle}
        onPress={onDeletePress}
      />
    </View>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

function formatAmount(amount: number | undefined, currency = 'PLN'): string {
  if (amount === undefined || amount === null) return '— PLN';
  const formatted = amount
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${currency}`;
}

function getInvoiceTypeLabel(kind: string | undefined): string {
  const typeMap: { [key: string]: string } = {
    vat: 'Faktura VAT',
    proforma: 'Faktura proforma',
    zaliczkowa: 'Faktura zaliczkowa',
    koncowa: 'Faktura końcowa',
    korekta: 'Faktura korekta',
    szacunkowa: 'Faktura szacunkowa',
  };
  return kind && typeMap[kind] ? typeMap[kind] : 'Faktura VAT';
}

function InvoiceItem({
  invoice,
  onDeletePress,
}: {
  invoice: Invoice;
  onDeletePress: (id: number) => void;
}) {
  const navigator = useNavigation<InvoicesListScreenProps['navigation']>();

  let status: { name: string; bgColor: string; textColor: string } = {
    name: 'Wystawiona',
    bgColor: '#E8F5E9',
    textColor: '#2E7D32',
  };

  switch (invoice.status) {
    case 'paid':
      status = {
        name: 'Opłacona',
        bgColor: '#4CBF2426',
        textColor: '#4CBF24',
      };
      break;
    case 'partial':
      status = {
        name: 'Częściowo opł.',
        bgColor: '#FFEBEE',
        textColor: '#C62828',
      };
      break;
    default:
      status = {
        name: 'Wystawiona',
        bgColor: '#F5F5F5',
        textColor: '#616161',
      };
      break;
  }

  const formattedDate = formatDate(invoice.issue_date);
  const formattedAmount = formatAmount(invoice.total, invoice.currency);
  const invoiceType = getInvoiceTypeLabel(invoice.kind);

  return (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => {
        console.log('Navigating to Details with ID:', invoice.id);
        navigator.navigate('Details' as any, { id: invoice.id });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.topRow}>
          <Text style={styles.invoiceType}>{invoiceType}</Text>
          <Text style={styles.invoiceAmount}>{formattedAmount}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.leftInfo}>
            <Text style={styles.clientName}>{invoice.client_name}</Text>
            <Text style={styles.separator}> • </Text>
            <Text style={styles.invoiceNumber}>{invoice.numer_faktury}</Text>
            <Text style={styles.separator}> • </Text>
            <Text style={styles.invoiceDate}>{formattedDate}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: status.bgColor }]}
          >
            <Text style={[styles.statusText, { color: status.textColor }]}>
              {status.name}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function InvoicesList({ navigation }: InvoicesListScreenProps) {
  const [searchValue, setSearchValue] = useState<string>('');
  const [invoices, setInvoices] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | undefined>(undefined);
  const { hasAccess } = usePermission();

  const { result, execute } = useApi<Invoice[]>({
    path: 'faktura_list',
  });

  const { execute: deleteInvoice } = useApi({
    path: 'faktura_delete',
  });

  useEffect(() => {
    if (execute) {
      execute();
    }
  }, [execute]);

  useEffect(() => {
    if (result) {
      setInvoices(result.sort((a, b) => b.order - a.order));
    }
  }, [result]);

  // Filtrowanie faktur na podstawie wyszukiwania
  const filteredInvoices = invoices
    ? invoices.filter((invoice: Invoice) => {
      if (!searchValue.trim()) {
        return true;
      }
      const searchLower = searchValue.toLowerCase().trim();
      const clientName = invoice.client_name?.toLowerCase() || '';
      const invoiceNumber = invoice.numer_faktury?.toLowerCase() || '';
      return (
        clientName.includes(searchLower) ||
        invoiceNumber.includes(searchLower)
      );
    })
    : null;

  // Odświeżanie listy faktur przy każdym wejściu na ekran
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (execute) {
        execute();
      }
    });

    return unsubscribe;
  }, [navigation, execute]);

  const onDeleteConfirmed = async () => {
    if (idToDelete) {
      await deleteInvoice({ data: { invoice_id: idToDelete } as any });
      toggleOverlay();
      Alert.alert('Usunięto fakturę');
      if (execute) {
        execute();
      }
    }
  };

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleOverlay();
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  return (
    <View style={styles.main}>
      <View style={styles.buttonsHeader}>
        <ButtonsHeader onBackPress={navigation.goBack} title="Faktury" />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Szukaj"
            placeholderTextColor={Colors.lightGray}
            value={searchValue}
            onChangeText={setSearchValue}
          />
          <View style={styles.searchIconContainer}>
            <SearchIcon color={Colors.black} size={18} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            // Placeholder - na razie nic nie robi
          }}
          activeOpacity={0.7}
        >
          <FilterIcon color={Colors.black} size={20} />
        </TouchableOpacity>
      </View>

      {filteredInvoices && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
        >
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((item: any) => (
              <InvoiceItem
                key={item.id}
                invoice={item}
                onDeletePress={onDelete}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nie znaleziono faktur pasujących do wyszukiwania
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć fakturę ?"
      />

      {hasAccess(Scopes.addInvoices) && (
        // FAB
        <FloatingActionButton
          onPress={() =>
            navigation.navigate('Form' as any, {
              clientId: undefined,
              installationId: undefined,
            })
          }
          backgroundColor={Colors.lightRose}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 40,
  },
  buttonsHeader: {
    backgroundColor: Colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 2,
    borderBottomColor: Colors.lightRose,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.menuIconBackground,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
    padding: 0,
  },
  searchIconContainer: {
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceType: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.black,
  },
  invoiceAmount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.black,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  clientName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.lightGray,
  },
  separator: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.lightGray,
    marginHorizontal: 4,
  },
  invoiceNumber: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.lightGray,
  },
  invoiceDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.lightGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  buttonContainer: {
    borderRadius: 0,
    // IOS fix for clipping backgroundColor
    height: '95%',
  },
  buttonStyle: {
    minHeight: '100%',
    width: 80,
    borderRadius: 0,
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonTitleStyle: {
    fontSize: 12,
  },
  rowRightContent: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.lightGray,
    textAlign: 'center',
  },
});

export default InvoicesList;
