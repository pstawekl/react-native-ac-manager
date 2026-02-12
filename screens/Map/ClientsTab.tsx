import { Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import Constants from 'expo-constants';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { ScrollView } from 'react-native-gesture-handler';
import { IconButton } from '../../components/Button';
import CloseIcon from '../../components/icons/CloseIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import Colors from '../../consts/Colors';
import {
  getClientDisplayPrimary,
  getClientDisplaySecondary,
} from '../../helpers/clientDisplay';
import useApi from '../../hooks/useApi';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import { ClientsLists, Place } from './MapScreen';

function formatListCreatedDate(createdDate?: string): string {
  if (!createdDate) return '—';
  try {
    const d = new Date(createdDate);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function ClientListRow({
  clientsList,
  onPress,
}: {
  clientsList: ClientsLists;
  onPress: () => void;
}) {
  return (
    <Pressable
      key={clientsList.nazwa}
      onPress={onPress}
      style={styles.clientsList}
    >
      <Text style={styles.clientsListsItemText}>{clientsList.nazwa}</Text>
      <Text style={styles.clientsListDateText}>
        {formatListCreatedDate(clientsList.created_date)}
      </Text>
    </Pressable>
  );
}

function AddClientModal({
  clients,
  visible,
  onClose,
  onClientPress,
}: {
  clients: Client[];
  visible: boolean;
  onClose: () => void;
  onClientPress: (clientId: number) => void;
}) {
  useEffect(() => {
    if (visible) {
      console.log('[Map/ClientsTab] AddClientModal opened', {
        clientsCount: clients?.length ?? 0,
        clientIds: clients?.map(c => c.id) ?? [],
      });
    }
  }, [visible, clients]);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      cost: '',
    },
  });

  const windowHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = 75;
  const modalHeight = windowHeight - TAB_BAR_HEIGHT;

  const addClientStyles = StyleSheet.create({
    modalOverlay: {
      justifyContent: 'flex-start' as const,
    },
    modalContent: {
      top: 0,
      height: modalHeight,
    },
    clientList: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '90%',
      width: '100%',
    },
    clientListItem: {
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      minHeight: 60,
      width: '100%',
    },
    clientListItemTextWrap: {
      flex: 1,
      marginRight: 8,
    },
    clientListItemPrimary: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.black,
    },
    clientListItemSecondary: {
      fontSize: 12,
      color: Colors.companyText,
      marginTop: 2,
    },
    headerButtonsStyles: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, addClientStyles.modalOverlay]}>
        <View style={[styles.modalContent, addClientStyles.modalContent]}>
          <View style={addClientStyles.headerButtonsStyles}>
            <Text style={styles.modalTitle}>Dodaj klienta</Text>
            <IconButton
              icon={<CloseIcon color={Colors.black} />}
              onPress={onClose}
              withoutBackground
            />
          </View>
          <ScrollView contentContainerStyle={addClientStyles.clientList}>
            <FlashList<Client>
              data={clients || []}
              renderItem={({ item }) => {
                const primary = getClientDisplayPrimary(item);
                const secondary = getClientDisplaySecondary(item);
                return (
                  <View style={addClientStyles.clientListItem}>
                    <View style={addClientStyles.clientListItemTextWrap}>
                      <Text style={addClientStyles.clientListItemPrimary}>
                        {primary}
                      </Text>
                      {secondary ? (
                        <Text style={addClientStyles.clientListItemSecondary}>
                          {secondary}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton
                      icon={<PlusIcon color={Colors.black} />}
                      onPress={() => {
                        console.log(
                          '[Map/ClientsTab] AddClientModal: user selected client',
                          { clientId: item.id, name: primary },
                        );
                        onClientPress(item.id);
                      }}
                      withoutBackground
                    />
                  </View>
                );
              }}
              estimatedItemSize={70}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export type ClientsTabRef = {
  openAddClientModal: () => void;
  refreshLists: () => void;
};

const ClientsTab = forwardRef<
  ClientsTabRef,
  {
    places: Place[];
    onDataChange?: () => Promise<any>;
    isActive?: boolean;
    onClientsListOpenChange?: (open: boolean) => void;
    listsSearchQuery?: string;
  }
>(function ClientsTab(
  {
    places,
    onDataChange,
    isActive = false,
    onClientsListOpenChange,
    listsSearchQuery: listsSearchQueryProp = '',
  },
  ref,
) {
  const { execute: addClientsList } = useApi({
    path: 'listy_klientow_add',
  });
  const [clientsLists, setClientsLists] = useState<ClientsLists[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const openGoogleMapsForPlace = useCallback((place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    Linking.openURL(url);
  }, []);

  const filteredClientsLists = React.useMemo(() => {
    if (!listsSearchQueryProp.trim()) return clientsLists;
    const q = listsSearchQueryProp.toLowerCase().trim();
    return clientsLists.filter(
      list =>
        list.nazwa?.toLowerCase().includes(q) ||
        formatListCreatedDate(list.created_date).toLowerCase().includes(q),
    );
  }, [clientsLists, listsSearchQueryProp]);

  const API_URL: string =
    Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
  const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
  const API_PATH: string =
    API_URL.length > 0 && API_PORT.length > 0
      ? `${API_URL}:${API_PORT}/api/`
      : `${API_URL}/api/`;
  const { clients, getClients } = useClients();
  const { token } = useAuth();

  const formatClientAddress = useCallback(
    (client: Client) =>
      [
        client.ulica,
        client.numer_domu,
        client.mieszkanie && `m. ${client.mieszkanie}`,
        client.miasto,
        client.kod_pocztowy,
      ]
        .filter(Boolean)
        .join(', '),
    [],
  );

  const mapClientToPlace = useCallback(
    (client: Client): Place => ({
      id: client.id,
      lat: Number(client.latitude ?? 0),
      lng: Number(client.longitude ?? 0),
      name: client.email,
      firstName: client.first_name,
      lastName: client.last_name,
      companyName: client.nazwa_firmy ?? 'Osoba',
      rodzaj_klienta: client.rodzaj_klienta ?? undefined,
      phone: client.numer_telefonu ?? '',
      address: formatClientAddress(client),
      lista_klientow:
        ((client as any).listy_klientow || client.lista_klientow) &&
          Array.isArray(
            (client as any).listy_klientow || client.lista_klientow,
          ) &&
          ((client as any).listy_klientow || client.lista_klientow).length > 0
          ? ((client as any).listy_klientow || client.lista_klientow).map(
            (id: any) => Number(id),
          )
          : undefined,
    }),
    [formatClientAddress],
  );

  const sortPlacesByName = useCallback((list: Place[]) => {
    const sortKey = (p: Place) => {
      const isCompany = p.rodzaj_klienta === 'firma';
      const companyName =
        p.companyName?.trim() && p.companyName !== 'Osoba'
          ? p.companyName.trim()
          : '';
      if (isCompany)
        return companyName || `${p.lastName ?? ''} ${p.firstName ?? ''}`.trim();
      return (
        `${p.lastName ?? ''} ${p.firstName ?? ''}`.trim() ||
        companyName ||
        p.name
      );
    };
    return [...list].sort((a, b) => sortKey(a).localeCompare(sortKey(b), 'pl'));
  }, []);

  const navigation = useNavigation();

  const fetchClientsLists = useCallback(async () => {
    if (!token || !API_PATH) {
      setClientsLists([]);
      setIsLoadingLists(false);
      return;
    }

    setIsLoadingLists(true);
    try {
      const response = await fetch(`${API_PATH}listy_klientow/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
        }),
      });

      if (!response.ok) {
        console.error('[ClientsTab] Failed to fetch lists:', response.status);
        setClientsLists([]);
        return;
      }

      const res = await response.json();

      const lists = res.listy_klientow || [];
      // Sortuj listy według ID
      const sortedLists = lists.sort(
        (a: ClientsLists, b: ClientsLists) => a.id - b.id,
      );
      setClientsLists(sortedLists);
    } catch (error) {
      console.error('[ClientsTab] Error fetching lists:', error);
      setClientsLists([]);
    } finally {
      setIsLoadingLists(false);
    }
  }, [API_PATH, token]);

  // Expose refreshLists method
  useImperativeHandle(
    ref,
    () => ({
      openAddClientModal: () => {
        // This is no longer used - navigation is handled by ClientsListScreen
      },
      refreshLists: () => {
        fetchClientsLists();
      },
    }),
    [fetchClientsLists],
  );

  // Load lists when tab becomes active or when token/API_PATH become available
  useEffect(() => {
    if (isActive && token && API_PATH) {
      fetchClientsLists();
    }
  }, [fetchClientsLists, isActive, token, API_PATH]);

  const handleAddList = async (data: { name: string }) => {
    try {
      await addClientsList({
        data: {
          nazwa: data.name,
        },
      });
      await fetchClientsLists();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się dodać listy');
    }
  };

  return (
    <View style={styles.container}>
      {isLoadingLists && (
        <View style={styles.loaderOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      <FlashList<ClientsLists>
        data={filteredClientsLists}
        renderItem={({ item }) => (
          <ClientListRow
            clientsList={item}
            onPress={() => {
              (navigation as any).navigate('ClientsList', {
                listId: item.id,
              });
            }}
          />
        )}
        contentContainerStyle={styles.clientsListsContainer}
        estimatedItemSize={70}
      />
    </View>
  );
});

const TAB_BAR_HEIGHT = 75;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  listItemsContainer: {
    padding: 10,
  },
  listModalWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    zIndex: 100,
  },
  listOverlayContent: {
    position: 'absolute',
    backgroundColor: Colors.white,
    width: '100%',
  },
  clientsList: {
    height: 50,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.mapRowBackground,
    marginBottom: 10,
    borderRadius: 14,
  },
  listItem: {
    height: 50,
    width: '100%',
  },
  placeRowContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  placeRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeRowTextContent: {
    flex: 1,
    marginRight: 8,
  },
  addressLine1: {
    marginTop: 2,
  },
  addressLine2: {
    marginTop: 2,
  },
  placeRowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.mapDivider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    borderRadius: 0,
  },
  buttonStyle: {
    minHeight: '100%',
    width: 80,
    borderRadius: 0,
  },
  deleteButtonStyle: {
    backgroundColor: Colors.red,
  },
  buttonTitleStyle: {
    fontSize: 12,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientsListsContainer: {
    padding: 20,
  },
  clientsListsItemText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.black,
  },
  clientsListDateText: {
    fontSize: 12,
    color: Colors.black,
    opacity: 0.8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: Colors.mapDivider,
  },
  listHeaderTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.black,
  },
  listHeaderTitleContainer: {
    paddingLeft: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginLeft: -40,
  },
  listHeaderDateText: {
    fontSize: 12,
    color: Colors.companyText,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyListText: {
    fontSize: 14,
    color: Colors.grayerText,
    fontFamily: 'Archivo_400Regular',
  },
});

export default ClientsTab;
