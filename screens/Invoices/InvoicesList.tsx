import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Button, Text } from '@rneui/themed';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import { Dropdown } from '../../components/Input';
import FilterIcon from '../../components/icons/FilterIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import useApi from '../../hooks/useApi';
import { InvoicesListScreenProps } from '../../navigation/types';
import useClients from '../../providers/ClientsProvider';
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

export type InvoiceFiltersState = {
  dateFrom: string | null;
  dateTo: string | null;
  clientName: string | null;
  paidStatus: 'all' | 'paid' | 'unpaid';
  sortBy: 'date_asc' | 'date_desc' | 'amount_asc' | 'amount_desc';
};

const defaultInvoiceFilters: InvoiceFiltersState = {
  dateFrom: null,
  dateTo: null,
  clientName: null,
  paidStatus: 'all',
  sortBy: 'date_desc',
};

type InvoicesFiltersModalProps = {
  visible: boolean;
  onClose: () => void;
  filters: InvoiceFiltersState;
  setFilters: (
    f:
      | InvoiceFiltersState
      | ((prev: InvoiceFiltersState) => InvoiceFiltersState),
  ) => void;
};

function InvoicesFiltersModal({
  visible,
  onClose,
  filters,
  setFilters,
}: InvoicesFiltersModalProps) {
  const { clients, getClients } = useClients();
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

  const { control, watch, setValue } = useForm({
    defaultValues: {
      clientName: filters.clientName ?? '',
      paidStatus: filters.paidStatus,
      sortBy: filters.sortBy,
    },
  });

  useEffect(() => {
    if (visible && getClients) {
      getClients();
    }
  }, [visible, getClients]);

  useEffect(() => {
    setValue('clientName', filters.clientName ?? '');
    setValue('paidStatus', filters.paidStatus);
    setValue('sortBy', filters.sortBy);
  }, [filters.clientName, filters.paidStatus, filters.sortBy, setValue]);

  const watchedClient = watch('clientName');
  const watchedPaidStatus = watch('paidStatus');
  const watchedSortBy = watch('sortBy');

  useEffect(() => {
    setFilters(prev => {
      const next = {
        ...prev,
        clientName: watchedClient ? String(watchedClient).trim() || null : null,
        paidStatus: watchedPaidStatus as InvoiceFiltersState['paidStatus'],
        sortBy: watchedSortBy as InvoiceFiltersState['sortBy'],
      };
      return next;
    });
  }, [watchedClient, watchedPaidStatus, watchedSortBy]);

  const clientOptions = useMemo(() => {
    const list = clients ?? [];
    const options = [{ label: 'Wszyscy klienci', value: '' }];
    list.forEach(c => {
      const value = `${c.first_name || ''} ${c.last_name || ''}`.trim();
      const label =
        c.rodzaj_klienta === 'firma'
          ? `Firma: ${c.nazwa_firmy || ''}`
          : value || c.nazwa_firmy || 'Klient';
      if (value) options.push({ label, value });
    });
    return options;
  }, [clients]);

  const handleDateFromSelect = (_: unknown, date?: Date) => {
    setShowDateFromPicker(Platform.OS === 'ios');
    if (date) {
      setFilters(prev => ({ ...prev, dateFrom: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleDateToSelect = (_: unknown, date?: Date) => {
    setShowDateToPicker(Platform.OS === 'ios');
    if (date) {
      setFilters(prev => ({ ...prev, dateTo: format(date, 'yyyy-MM-dd') }));
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={filterStyles.modalOverlay}>
        <View style={filterStyles.modalContent}>
          <Text style={filterStyles.modalTitle}>Filtry faktur</Text>
          <ScrollView contentContainerStyle={filterStyles.modalScrollContent}>
            <Text style={filterStyles.modalLabel}>Okres</Text>
            <View style={filterStyles.dateRow}>
              <View style={filterStyles.dateField}>
                <Text style={filterStyles.dateFieldLabel}>Od</Text>
                <TouchableOpacity
                  style={filterStyles.dateTouchable}
                  onPress={() => setShowDateFromPicker(true)}
                >
                  <Text style={filterStyles.dateTouchableText}>
                    {filters.dateFrom
                      ? format(new Date(filters.dateFrom), 'd MMM yyyy', {
                        locale: pl,
                      })
                      : 'Wybierz datę'}
                  </Text>
                </TouchableOpacity>
                {filters.dateFrom && (
                  <TouchableOpacity
                    onPress={() =>
                      setFilters(prev => ({ ...prev, dateFrom: null }))
                    }
                    style={filterStyles.clearDateBtn}
                  >
                    <Text style={filterStyles.clearDateText}>Wyczyść</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={filterStyles.dateField}>
                <Text style={filterStyles.dateFieldLabel}>Do</Text>
                <TouchableOpacity
                  style={filterStyles.dateTouchable}
                  onPress={() => setShowDateToPicker(true)}
                >
                  <Text style={filterStyles.dateTouchableText}>
                    {filters.dateTo
                      ? format(new Date(filters.dateTo), 'd MMM yyyy', {
                        locale: pl,
                      })
                      : 'Wybierz datę'}
                  </Text>
                </TouchableOpacity>
                {filters.dateTo && (
                  <TouchableOpacity
                    onPress={() =>
                      setFilters(prev => ({ ...prev, dateTo: null }))
                    }
                    style={filterStyles.clearDateBtn}
                  >
                    <Text style={filterStyles.clearDateText}>Wyczyść</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {showDateFromPicker && (
              <DateTimePicker
                value={
                  filters.dateFrom ? new Date(filters.dateFrom) : new Date()
                }
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateFromSelect}
                locale="pl-PL"
              />
            )}
            {showDateToPicker && (
              <DateTimePicker
                value={filters.dateTo ? new Date(filters.dateTo) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateToSelect}
                locale="pl-PL"
              />
            )}

            <Text style={filterStyles.modalLabel}>Klient</Text>
            <Dropdown
              name="clientName"
              control={control}
              options={clientOptions}
              customWidth="100%"
              isBordered
            />

            <Text style={filterStyles.modalLabel}>Status płatności</Text>
            <Dropdown
              name="paidStatus"
              control={control}
              options={[
                { label: 'Wszystkie', value: 'all' },
                { label: 'Opłacona', value: 'paid' },
                { label: 'Nieopłacona', value: 'unpaid' },
              ]}
              customWidth="100%"
              isBordered
            />

            <Text style={filterStyles.modalLabel}>Sortowanie</Text>
            <Dropdown
              name="sortBy"
              control={control}
              options={[
                { label: 'Data od najstarszej', value: 'date_asc' },
                { label: 'Data od najnowszej', value: 'date_desc' },
                { label: 'Kwota od najwyższej', value: 'amount_desc' },
                { label: 'Kwota od najniższej', value: 'amount_asc' },
              ]}
              customWidth="100%"
              isBordered
            />
          </ScrollView>

          <View style={filterStyles.modalButtonGroup}>
            <Button
              title="Zamknij"
              buttonStyle={filterStyles.closeButton}
              onPress={onClose}
              titleStyle={filterStyles.buttonText}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const filterStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollContent: {
    gap: 16,
    paddingBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    marginTop: 8,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.lightGray,
    marginBottom: 4,
  },
  dateTouchable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateTouchableText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
  },
  clearDateBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.calendarPrimary || '#FF6B35',
  },
  modalButtonGroup: {
    marginTop: 20,
    gap: 10,
  },
  closeButton: {
    backgroundColor: Colors.invoiceRose || Colors.calendarPrimary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.white,
  },
});

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

  const totalBrutto = invoice.total ?? Number(invoice.currency) ?? 0;
  const formattedAmount = formatAmount(
    Number.isFinite(totalBrutto) ? totalBrutto : undefined,
    invoice.currency || 'PLN',
  );
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<InvoiceFiltersState>(
    defaultInvoiceFilters,
  );
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

  const toggleFilterModal = useCallback(() => {
    setFilterModalVisible(prev => !prev);
  }, []);

  // Filtrowanie i sortowanie faktur: wyszukiwanie + filtry (okres, klient, opłacona/nieopłacona, sortowanie)
  const filteredInvoices = useMemo(() => {
    if (!invoices) return null;
    let list = [...invoices];

    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase().trim();
      list = list.filter((invoice: Invoice) => {
        const clientName = invoice.client_name?.toLowerCase() || '';
        const invoiceNumber = invoice.numer_faktury?.toLowerCase() || '';
        return (
          clientName.includes(searchLower) ||
          invoiceNumber.includes(searchLower)
        );
      });
    }

    if (filters.dateFrom) {
      list = list.filter(
        (inv: Invoice) => inv.issue_date && inv.issue_date >= filters.dateFrom!,
      );
    }
    if (filters.dateTo) {
      list = list.filter(
        (inv: Invoice) => inv.issue_date && inv.issue_date <= filters.dateTo!,
      );
    }

    if (filters.clientName) {
      list = list.filter(
        (inv: Invoice) =>
          (inv.client_name || '').trim() === filters.clientName!.trim(),
      );
    }

    if (filters.paidStatus === 'paid') {
      list = list.filter((inv: Invoice) => inv.status === 'paid');
    } else if (filters.paidStatus === 'unpaid') {
      list = list.filter((inv: Invoice) => inv.status !== 'paid');
    }

    const cmpDate = (a: Invoice, b: Invoice) => {
      const da = a.issue_date ? new Date(a.issue_date).getTime() : 0;
      const db = b.issue_date ? new Date(b.issue_date).getTime() : 0;
      return da - db;
    };
    const cmpAmount = (a: Invoice, b: Invoice) => {
      const va = a.total ?? 0;
      const vb = b.total ?? 0;
      return va - vb;
    };
    switch (filters.sortBy) {
      case 'date_asc':
        list.sort(cmpDate);
        break;
      case 'date_desc':
        list.sort((a, b) => cmpDate(b, a));
        break;
      case 'amount_asc':
        list.sort(cmpAmount);
        break;
      case 'amount_desc':
        list.sort((a, b) => cmpAmount(b, a));
        break;
      default:
        list.sort((a, b) => cmpDate(b, a));
    }

    return list;
  }, [invoices, searchValue, filters]);

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
          onPress={toggleFilterModal}
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

      <InvoicesFiltersModal
        visible={filterModalVisible}
        onClose={toggleFilterModal}
        filters={filters}
        setFilters={setFilters}
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
          backgroundColor={Colors.invoiceRose}
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
