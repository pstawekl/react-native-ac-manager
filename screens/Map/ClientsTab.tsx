import { Avatar } from '@rneui/base';
import { Button, ListItem, Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { ScrollView } from 'react-native-gesture-handler';
import { IconButton } from '../../components/Button';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import CloseIcon from '../../components/icons/CloseIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import { ClientsLists, Place } from './MapScreen';

function RowLeftContent({ place }: { place: Place }) {
  return (
    <Button
      iconPosition="top"
      title="Zadzwoń"
      icon={{ name: 'phone', color: Colors.white }}
      containerStyle={styles.buttonContainer}
      buttonStyle={[styles.buttonStyle, { backgroundColor: Colors.primary }]}
      titleStyle={styles.buttonTitleStyle}
      onPress={() => Linking.openURL(`tel:${place.phone}`)}
    />
  );
}

function RowRightContent({
  place,
  onDelete,
}: {
  place: Place;
  onDelete: (id: number) => void;
}) {
  return (
    <Button
      iconPosition="top"
      title="Usuń"
      icon={{
        name: 'user',
        type: 'antdesign',
        color: Colors.white,
      }}
      containerStyle={styles.buttonContainer}
      buttonStyle={[styles.buttonStyle, styles.deleteButtonStyle]}
      titleStyle={styles.buttonTitleStyle}
      onPress={() => onDelete(place.id)}
    />
  );
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
      <ArrowRightIcon color={Colors.black} />
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
  const { control, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      cost: '',
    },
  });

  const addClientStyles = StyleSheet.create({
    modalContent: {
      height: '80%',
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
      <View style={styles.modalOverlay}>
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
  onCloseAllSwipes,
  registerSwipeRef,
}: {
  place: Place;
  onDelete: (id: number) => void;
  onCloseAllSwipes: () => void;
  registerSwipeRef: (id: number, ref: any) => void;
}) {
  const swipeRef = useRef<any>(null);

  // Użyj callback ref zamiast useRef + useEffect
  const swipeRefCallback = useCallback(
    (ref: any) => {
      swipeRef.current = ref;
      registerSwipeRef(place.id, ref);
    },
    [place.id, registerSwipeRef],
  );

  const handleSwipeBegin = () => {
    onCloseAllSwipes();
  };

  const handleSwipeEnd = useCallback(() => {
    if (swipeRef.current) {
      registerSwipeRef(place.id, swipeRef.current);
    }
  }, [place.id, registerSwipeRef]);

  const handlePress = () => {
    openGoogleMaps();
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    Linking.openURL(url);
  };

  const fullName = `${place.firstName} ${place.lastName}`.trim();
  const displayName = fullName || place.name;

  return (
    <ListItem.Swipeable
      ref={swipeRefCallback}
      key={place.id}
      onLongPress={() => {
        /* @ToDo */
        Alert.alert('Long press');
      }}
      onPress={handlePress}
      leftContent={<RowLeftContent place={place} />}
      rightContent={<RowRightContent place={place} onDelete={onDelete} />}
      leftWidth={80}
      rightWidth={80}
      containerStyle={styles.listItem}
      onSwipeBegin={handleSwipeBegin}
      onSwipeEnd={handleSwipeEnd}
    >
      <Avatar
        rounded
        size={42}
        icon={{ name: 'user', type: 'antdesign' }}
        containerStyle={styles.avatarContainer}
        overlayContainerStyle={styles.avatarOverlayContainer}
      />
      <ListItem.Content>
        <ListItem.Title>{displayName}</ListItem.Title>
        <ListItem.Subtitle>
          {place.companyName} {place.phone ? `- Tel: ${place.phone}` : ''} -{' '}
          {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem.Swipeable>
  );
}

export default function ClientsTab({
  places,
  onDataChange,
  isActive = false,
}: {
  places: Place[];
  onDataChange?: () => Promise<any>;
  isActive?: boolean;
}) {
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
  const swipeRefs = useRef<Map<number, any>>(new Map());

  // Funkcja do zamykania wszystkich swipe elementów
  const closeAllSwipes = useCallback(() => {
    swipeRefs.current.forEach((ref, placeId) => {
      if (ref && ref.close) {
        ref.close();
      }
    });
  }, []);

  // Funkcja do rejestrowania referencji swipe elementów
  const registerSwipeRef = useCallback((id: number, ref: any) => {
    if (ref) {
      swipeRefs.current.set(id, ref);
    } else {
      swipeRefs.current.delete(id);
    }
  }, []);
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
    if (!currentClientsList) {
      return;
    }

    try {
      setIsMutating(true);
      const response = await fetch(
        `${API_PATH}listy_klientow_add_klient_to_lista/`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            klient_id: clientId,
            lista_id: currentClientsList,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Add client request failed');
      }

      await loadClientsForList(currentClientsList);
      if (onDataChange && onDataChange !== getClients) {
        await onDataChange();
      }
      setAddModalVisible(false);
    } catch (error) {
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
          data={clientsLists}
          renderItem={({ item }) => (
            <ClientListRow
              clientsList={item}
              onPress={() => {
                setClientsTabOpen(true);
                setCurrentClientsList(item.id);
              }}
            />
          )}
          estimatedItemSize={70}
        />
      )}
      {clientsTabOpen && (
        <>
          <FlashList<Place>
            data={currentListClients}
            renderItem={({ item }) => (
              <PlaceRow
                place={item}
                onDelete={onDelete}
                onCloseAllSwipes={closeAllSwipes}
                registerSwipeRef={registerSwipeRef}
              />
            )}
            estimatedItemSize={70}
          />
          <AddClientModal
            visible={addModalVisible}
            onClose={() => {
              setAddModalVisible(false);
            }}
            // eslint-disable-next-line react/jsx-no-bind
            onClientPress={handleAddClientToList}
            clients={clients?.filter(x => x.lista_klientow == null) ?? []}
            key={currentClientsList}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  clientsList: {
    height: 50,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItem: {
    height: 50,
    width: '100%',
  },
  avatarContainer: {
    backgroundColor: Colors.avatarContainer,
    padding: 0,
    margin: 0,
  },
  avatarOverlayContainer: {
    shadowColor: Colors.avatarOverlay,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: -1, height: 7 },
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
  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.red,
    marginBottom: 10,
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
  clientsListsItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
  },
});
