import { Icon, ListItem, Text } from '@rneui/themed';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../../components/Button';
import FloatingActionButton from '../../components/FloatingActionButton';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import CloseIcon from '../../components/icons/CloseIcon';
import PhoneIcon from '../../components/icons/PhoneIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import { ClientsLists, Place } from './MapScreen';

const CONTEXT_MENU_PRESS_BG = '#F5F5F5';

function ClientContextMenu({
  visible,
  position,
  place,
  onClose,
  onCall,
  onRoute,
  onDelete,
}: {
  visible: boolean;
  position: { x: number; y: number };
  place: Place | null;
  onClose: () => void;
  onCall: () => void;
  onRoute: () => void;
  onDelete: () => void;
}) {
  if (!visible || !place) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={contextMenuStyles.overlay} onPress={onClose}>
        <Pressable
          style={[
            contextMenuStyles.menu,
            { left: position.x, top: position.y + 12 },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <Pressable
            style={contextMenuStyles.option}
            onPress={() => {
              onClose();
              onCall();
            }}
          >
            <PhoneIcon color={Colors.black} size={20} />
            <Text style={contextMenuStyles.optionText}>Zadzwoń</Text>
          </Pressable>
          <View style={contextMenuStyles.separator} />
          <Pressable
            style={contextMenuStyles.option}
            onPress={() => {
              onClose();
              onRoute();
            }}
          >
            <Icon
              name="map-marker"
              type="material-community"
              color={Colors.black}
              size={20}
            />
            <Text style={contextMenuStyles.optionText}>Wyznacz trasę</Text>
          </Pressable>
          <View style={contextMenuStyles.separator} />
          <Pressable
            style={contextMenuStyles.option}
            onPress={() => {
              onClose();
              onDelete();
            }}
          >
            <TrashIcon color={Colors.red} size={20} />
            <Text
              style={[
                contextMenuStyles.optionText,
                contextMenuStyles.optionTextDanger,
              ]}
            >
              Usuń z listy
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const contextMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
  },
  menu: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: Colors.black,
  },
  optionTextDanger: {
    color: Colors.red,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 0,
  },
});

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
      height: 60,
      width: '100%',
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
              renderItem={({ item }) => (
                <View style={addClientStyles.clientListItem}>
                  <Text>
                    {item.first_name} {item.last_name}
                  </Text>
                  <IconButton
                    icon={<PlusIcon color={Colors.black} />}
                    onPress={() => {
                      console.log(
                        '[Map/ClientsTab] AddClientModal: user selected client',
                        {
                          clientId: item.id,
                          name: `${item.first_name} ${item.last_name}`,
                        },
                      );
                      onClientPress(item.id);
                    }}
                    withoutBackground
                  />
                </View>
              )}
              estimatedItemSize={70}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PlaceRow({
  place,
  onDelete,
  onCall,
  onOpenContextMenu,
}: {
  place: Place;
  onDelete: (id: number) => void;
  onCall: () => void;
  onOpenContextMenu: (place: Place, pageX: number, pageY: number) => void;
}) {
  const fullName = `${place.firstName} ${place.lastName}`.trim();
  const displayName = fullName || place.name;

  const handleLongPress = (e: any) => {
    const { pageX, pageY } = e.nativeEvent ?? {};
    if (typeof pageX === 'number' && typeof pageY === 'number') {
      onOpenContextMenu(place, pageX, pageY);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.placeRowContainer,
        pressed && { backgroundColor: CONTEXT_MENU_PRESS_BG },
      ]}
      onLongPress={handleLongPress}
    >
      <View style={styles.placeRowContent}>
        <ListItem.Content>
          <ListItem.Title>{displayName}</ListItem.Title>
          <ListItem.Subtitle>
            {[place.companyName?.trim(), place.address?.trim()]
              .filter(Boolean)
              .join(' – ') || '—'}
          </ListItem.Subtitle>
        </ListItem.Content>
        <Pressable style={styles.phoneButton} onPress={onCall} hitSlop={8}>
          <PhoneIcon color={Colors.black} size={14} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export type ClientsTabRef = {
  openAddClientModal: () => void;
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
  const insets = useSafeAreaInsets();
  const { execute: deleteClient } = useApi({
    path: 'remove_klient',
  });
  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [clientsLists, setClientsLists] = useState<ClientsLists[]>([]);
  const [clientsTabOpen, setClientsTabOpen] = useState(false);
  const [currentClientsList, setCurrentClientsList] = useState<number | null>(
    null,
  );
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isLoadingListClients, setIsLoadingListClients] = useState(false);
  const [currentListClients, setCurrentListClients] = useState<Place[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    place: Place | null;
  }>({ visible: false, position: { x: 0, y: 0 }, place: null });

  const openContextMenu = useCallback(
    (place: Place, pageX: number, pageY: number) => {
      setContextMenu({
        visible: true,
        position: { x: pageX, y: pageY },
        place,
      });
    },
    [],
  );
  const closeContextMenu = useCallback(() => {
    setContextMenu(c => ({ ...c, visible: false, place: null }));
  }, []);

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

  useEffect(() => {
    onClientsListOpenChange?.(clientsTabOpen);
  }, [clientsTabOpen, onClientsListOpenChange]);

  const API_URL: string =
    Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
  const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
  const API_PATH: string =
    API_URL.length > 0 && API_PORT.length > 0
      ? `${API_URL}:${API_PORT}/api/`
      : `${API_URL}/api/`;
  const { clients, getClients } = useClients();
  const { token } = useAuth();

  useImperativeHandle(
    ref,
    () => ({
      openAddClientModal: () => {
        console.log('[Map/ClientsTab] openAddClientModal (FAB) called', {
          currentClientsList,
          availableClientsCount:
            clients?.filter(x => x.lista_klientow == null).length ?? 0,
        });
        setAddModalVisible(true);
      },
    }),
    [currentClientsList, clients],
  );

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
      phone: client.numer_telefonu ?? '',
      address: formatClientAddress(client),
      lista_klientow:
        client.lista_klientow !== null
          ? Number(client.lista_klientow)
          : undefined,
    }),
    [formatClientAddress],
  );

  const sortPlacesByName = useCallback(
    (list: Place[]) =>
      [...list].sort((a, b) => {
        const nameA =
          `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim() || a.name;
        const nameB =
          `${b.firstName ?? ''} ${b.lastName ?? ''}`.trim() || b.name;
        return nameA.localeCompare(nameB);
      }),
    [],
  );

  const loadClientsForList = useCallback(
    async (listId: number | null) => {
      console.log('[Map/ClientsTab] loadClientsForList called', { listId });
      if (!listId) {
        setCurrentListClients([]);
        return;
      }

      setIsLoadingListClients(true);
      try {
        const response = await getClients();
        const clientsData = response?.klient_list ?? [];
        const mapped = clientsData.map(mapClientToPlace);
        const filtered = mapped.filter(
          place => place.lista_klientow === listId,
        );
        setCurrentListClients(sortPlacesByName(filtered));
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się pobrać klientów dla listy');
      } finally {
        setIsLoadingListClients(false);
      }
    },
    [getClients, mapClientToPlace, sortPlacesByName],
  );

  useEffect(() => {
    if (!clientsTabOpen || !currentClientsList || !clients) {
      return;
    }

    const mapped = clients
      .map(mapClientToPlace)
      .filter(place => place.lista_klientow === currentClientsList);
    setCurrentListClients(sortPlacesByName(mapped));
  }, [
    clients,
    clientsTabOpen,
    currentClientsList,
    mapClientToPlace,
    sortPlacesByName,
  ]);

  useEffect(() => {
    if (clientsTabOpen && currentClientsList) {
      setCurrentListClients([]);
      loadClientsForList(currentClientsList);
    }
  }, [clientsTabOpen, currentClientsList, loadClientsForList]);

  useEffect(() => {
    if (!clientsTabOpen || !currentClientsList) {
      return;
    }

    if (clients && clients.length > 0) {
      return;
    }

    const fallback = sortPlacesByName(
      places.filter(place => place.lista_klientow === currentClientsList),
    );
    setCurrentListClients(fallback);
  }, [clients, clientsTabOpen, currentClientsList, places, sortPlacesByName]);

  const onDeleteConfirmed = () => {
    if (idToDelete) {
      deleteClient({ data: { klient_id: idToDelete } });
      toggleOverlay();
      getClients();
    }
  };

  const onDelete = async (id: number) => {
    if (!currentClientsList) {
      return;
    }

    try {
      setIsMutating(true);
      const response = await fetch(
        `${API_PATH}listy_klientow_remove_klient_from_lista/`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            klient_id: id,
            lista_id: currentClientsList,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Remove client request failed');
      }

      await loadClientsForList(currentClientsList);
      if (onDataChange && onDataChange !== getClients) {
        await onDataChange();
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć klienta z listy');
    } finally {
      setIsMutating(false);
    }
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const navigation = useNavigation();

  const [addModalVisible, setAddModalVisible] = useState(false);

  const fetchClientsLists = useCallback(async () => {
    setIsLoadingLists(true);
    if (!token) {
      setClientsLists([]);
      setIsLoadingLists(false);
      return;
    }

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
        Alert.alert('Błąd', 'Nie udało się pobrać list klientów');
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
      Alert.alert('Błąd', 'Nie udało się pobrać list klientów');
    } finally {
      setIsLoadingLists(false);
    }
  }, [API_PATH, token]);

  useEffect(() => {
    fetchClientsLists();
  }, [fetchClientsLists]);

  useEffect(() => {
    if (isActive) {
      fetchClientsLists();
    }
  }, [fetchClientsLists, isActive]);

  const handleAddList = async (data: { name: string }) => {
    try {
      setIsMutating(true);
      await addClientsList({
        data: {
          nazwa: data.name,
        },
      });
      await fetchClientsLists();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się dodać listy');
    } finally {
      setIsMutating(false);
    }
  };

  async function handleAddClientToList(clientId: number) {
    console.log('[Map/ClientsTab] handleAddClientToList called', {
      clientId,
      currentClientsList,
      hasToken: !!token,
      API_PATH,
    });
    if (!currentClientsList) {
      console.warn(
        '[Map/ClientsTab] handleAddClientToList aborted: no currentClientsList',
      );
      return;
    }

    try {
      setIsMutating(true);
      const body = {
        token,
        klient_id: clientId,
        lista_id: currentClientsList,
      };
      const url = `${API_PATH}listy_klientow_add_klient_to_lista/`;
      console.log('[Map/ClientsTab] POST add client to list', { url, body });
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      let responseJson: unknown = null;
      try {
        responseJson = responseText ? JSON.parse(responseText) : null;
      } catch {
        // ignore
      }
      console.log('[Map/ClientsTab] add client response', {
        status: response.status,
        ok: response.ok,
        responseText: responseText.slice(0, 500),
        responseJson,
      });

      if (!response.ok) {
        throw new Error(
          `Add client request failed: ${response.status} ${responseText.slice(
            0,
            200,
          )}`,
        );
      }

      // Aktualizacja optymistyczna: getClients() zwraca tylko pierwszą stronę (20 klientów)
      // i backend cache'uje odpowiedź, więc odświeżenie mogłoby nie pokazać dodanego klienta.
      // Dodajemy klienta do listy z lokalnych danych (był w modalu, więc mamy go w clients).
      const addedClient = clients?.find(c => c.id === clientId);
      if (addedClient) {
        const newPlace = mapClientToPlace({
          ...addedClient,
          lista_klientow: currentClientsList,
        });
        setCurrentListClients(prev => sortPlacesByName([...prev, newPlace]));
      } else {
        // Fallback: odśwież z API (może klient jest na pierwszej stronie)
        await loadClientsForList(currentClientsList);
      }

      if (onDataChange && onDataChange !== getClients) {
        await onDataChange();
      }
      setAddModalVisible(false);
      console.log('[Map/ClientsTab] handleAddClientToList success');
    } catch (error) {
      console.warn('[Map/ClientsTab] handleAddClientToList error', error);
      Alert.alert('Błąd', 'Nie udało się dodać klienta do listy');
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <View style={styles.container}>
      {(isLoadingLists || isMutating || isLoadingListClients) && (
        <View style={styles.loaderOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      {!clientsTabOpen && (
        <FlashList<ClientsLists>
          data={filteredClientsLists}
          renderItem={({ item }) => (
            <ClientListRow
              clientsList={item}
              onPress={() => {
                setClientsTabOpen(true);
                setCurrentClientsList(item.id);
              }}
            />
          )}
          contentContainerStyle={styles.clientsListsContainer}
          estimatedItemSize={70}
        />
      )}

      {/* Modal z listą klientów - nie zasłania BottomTabNavigation */}
      <Modal
        visible={clientsTabOpen}
        animationType="slide"
        onRequestClose={() => {
          setClientsTabOpen(false);
          setCurrentClientsList(null);
        }}
      >
        <View style={styles.listModalWrapper}>
          <View
            style={[
              styles.listOverlayContent,
              {
                paddingTop: insets.top,
                top: 0,
                left: 0,
                right: 0,
                bottom: TAB_BAR_HEIGHT,
              },
            ]}
          >
            <View style={styles.listHeader}>
              <IconButton
                icon={<ArrowLeftIcon color={Colors.black} size={16} />}
                onPress={() => {
                  setClientsTabOpen(false);
                  setCurrentClientsList(null);
                }}
                withoutBackground
              />
              <View style={styles.listHeaderTitleContainer}>
                <Text style={styles.listHeaderTitle} numberOfLines={1}>
                  {clientsLists.find(l => l.id === currentClientsList)?.nazwa ??
                    'Lista klientów'}
                </Text>
                <Text style={styles.listHeaderDateText}>
                  {formatListCreatedDate(
                    clientsLists.find(l => l.id === currentClientsList)
                      ?.created_date,
                  ) ?? '—'}
                </Text>
              </View>
              <View />
            </View>
            {isLoadingListClients ? (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <FlashList<Place>
                data={currentListClients}
                renderItem={({ item }) => (
                  <PlaceRow
                    place={item}
                    onDelete={onDelete}
                    onCall={() =>
                      item.phone && Linking.openURL(`tel:${item.phone}`)
                    }
                    onOpenContextMenu={openContextMenu}
                  />
                )}
                estimatedItemSize={70}
                contentContainerStyle={styles.listItemsContainer}
              />
            )}
            <ClientContextMenu
              visible={contextMenu.visible}
              position={contextMenu.position}
              place={contextMenu.place}
              onClose={closeContextMenu}
              onCall={() =>
                contextMenu.place?.phone &&
                Linking.openURL(`tel:${contextMenu.place.phone}`)
              }
              onRoute={() =>
                contextMenu.place && openGoogleMapsForPlace(contextMenu.place)
              }
              onDelete={() => {
                const id = contextMenu.place?.id;
                closeContextMenu();
                if (id != null) onDelete(id);
              }}
            />
            <AddClientModal
              visible={addModalVisible}
              onClose={() => {
                setAddModalVisible(false);
              }}
              onClientPress={handleAddClientToList}
              clients={clients?.filter(x => x.lista_klientow == null) ?? []}
              key={currentClientsList}
            />
            <FloatingActionButton
              onPress={() => setAddModalVisible(true)}
              backgroundColor={Colors.galleryFabButtonBackground}
              right={20}
              bottom={24}
              iconColor={Colors.black}
            />
          </View>
        </View>
      </Modal>
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
  phoneButton: {
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
});

export default ClientsTab;
