import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DrawerScreenProps } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '@rneui/base';
import Constants from 'expo-constants';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import { FormInput } from '../../components/Input';
import Tabs from '../../components/Tabs';
import SearchIcon from '../../components/icons/SearchIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { MainParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import ClientsTab, { ClientsTabRef } from './ClientsTab';
import MapTab, { MapTabRef } from './MapTab';

export type Place = {
  id: number;
  lat: number;
  lng: number;
  name: string;
  firstName: string;
  lastName: string;
  companyName: string;
  rodzaj_klienta?: string | null;
  phone: string;
  address: string;
  lista_klientow?: number[];
};

export type ClientsLists = {
  id: number;
  nazwa: string;
  ac_user?: number;
  created_date?: string;
};

const sanitizeCoordinate = (
  value: string | number | null | undefined,
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized =
    typeof value === 'string' ? value.replace(',', '.').trim() : value;

  if (normalized === '') {
    return null;
  }

  const parsedValue = Number(normalized);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

// Helper function to geocode addresses
const getCoordinatesFromAddress = async (
  address: string,
): Promise<{ lat: number; lng: number } | null> => {
  if (!address) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address,
      )}&format=json`,
      {
        headers: {
          'User-Agent': 'ac-manager-app/1.0',
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      // Nominatim returns lat/lon as strings
      const lat = Number.parseFloat(data[0].lat);
      const lng = Number.parseFloat(data[0].lon);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    // Geocoding failed for the address
    return null;
  } catch (error) {
    // Error during geocoding process
    return null;
  }
};

type PlaceWithSaveInfo = {
  place: Place;
  needsSave: boolean;
  clientId: number;
  lat: number;
  lng: number;
};

function AddListModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const handleSave = handleSubmit(data => {
    onSave(data);
    reset();
    onClose();
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dodaj listę</Text>
            <TouchableOpacity
              style={styles.modalCloseButtonTouchable}
              onPress={handleClose}
            >
              <Text style={styles.modalCloseButton}>×</Text>
            </TouchableOpacity>
          </View>

          <FormInput
            name="name"
            control={control}
            label="Nazwa listy"
            textColor="#737373"
            color={Colors.grayBorder}
            rules={{
              required: 'Nazwa listy jest wymagana',
              minLength: {
                value: 1,
                message: 'Nazwa musi mieć co najmniej 1 znak',
              },
            }}
          />

          {errors.name && (
            <Text style={styles.errorText}>{errors.name.message}</Text>
          )}

          <View style={styles.modalButtonGroup}>
            <TouchableOpacity style={styles.modalButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Dalej</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

async function updateClientsPlaces(
  clients: Client[],
): Promise<PlaceWithSaveInfo[]> {
  const results: PlaceWithSaveInfo[] = await Promise.all(
    clients.map(async client => {
      const addressFragments = [
        client.ulica,
        client.numer_domu,
        client.mieszkanie && `m. ${client.mieszkanie}`,
        client.miasto,
        client.kod_pocztowy,
      ].filter(Boolean);

      const displayAddress = addressFragments.join(', ');

      const latFromApi = sanitizeCoordinate(client.latitude);
      const lngFromApi = sanitizeCoordinate(client.longitude);

      let lat = latFromApi;
      let lng = lngFromApi;
      let needsSave = false;

      const hasAddress =
        Boolean(client.kod_pocztowy) &&
        Boolean(client.miasto) &&
        Boolean(client.ulica);

      if (
        hasAddress &&
        (!Number.isFinite(lat ?? Number.NaN) ||
          !Number.isFinite(lng ?? Number.NaN))
      ) {
        const geocodeQuery = [
          client.kod_pocztowy,
          client.miasto,
          client.ulica,
          client.numer_domu ?? '',
        ]
          .filter(Boolean)
          .join(', ');

        const geocodedCoordinates = await getCoordinatesFromAddress(
          geocodeQuery,
        );

        if (geocodedCoordinates) {
          lat = geocodedCoordinates.lat;
          lng = geocodedCoordinates.lng;
          needsSave = true;
        }
      }
      const safeLat = typeof lat === 'number' && Number.isFinite(lat) ? lat : 0;
      const safeLng = typeof lng === 'number' && Number.isFinite(lng) ? lng : 0;

      return {
        place: {
          id: client.id,
          lat: safeLat,
          lng: safeLng,
          name: client.email,
          firstName: client.first_name,
          lastName: client.last_name,
          companyName: client.nazwa_firmy || '',
          rodzaj_klienta: client.rodzaj_klienta ?? undefined,
          phone: client.numer_telefonu || '',
          address: displayAddress,
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
        },
        needsSave,
        clientId: client.id,
        lat: safeLat,
        lng: safeLng,
      };
    }),
  );

  return results;
}

function MapScreen({ navigation }: DrawerScreenProps<MainParamList, 'Map'>) {
  const { clients, getClients } = useClients();
  const [filteredClients, setFilteredClients] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [listTabIndex, setListTabIndex] = useState(0);
  const [listsSearchQuery, setListsSearchQuery] = useState('');
  const [clientsTabOpen, setClientsTabOpen] = useState(false);
  const clientsTabRef = useRef<ClientsTabRef>(null);
  const mapTabRef = useRef<MapTabRef>(null);
  const { token } = useAuth();
  const API_URL: string =
    Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
  const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
  const API_PATH: string =
    API_URL.length > 0 && API_PORT.length > 0
      ? `${API_URL}:${API_PORT}/api/`
      : `${API_URL}/api/`;
  const { execute: updateClientCoordinates } = useApi<{
    message: string;
    error?: string;
  }>({
    path: 'change_child_data',
  });
  const { execute: addClientsList } = useApi<{
    id: number;
    nazwa: string;
  }>({
    path: 'listy_klientow_add',
  });
  useEffect(() => {
    let isCancelled = false;

    const loadPlaces = async () => {
      setIsLoadingPlaces(true);

      try {
        if (!clients) {
          if (!isCancelled) {
            setFilteredClients([]);
          }
          return;
        }

        const places: Place[] = [];
        const clientsToSave: Array<{
          clientId: number;
          lat: number;
          lng: number;
        }> = [];

        // Filter clients that have a valid address (can be geocoded)
        // Show all clients with valid addresses on the map, not just those in lists
        const clientsWithAddress = clients.filter(client => {
          const hasAddress =
            Boolean(client.kod_pocztowy) &&
            Boolean(client.miasto) &&
            Boolean(client.ulica);
          return hasAddress;
        });

        const placesWithCoordinates = await updateClientsPlaces(
          clientsWithAddress,
        );

        if (placesWithCoordinates.length > 0) {
          placesWithCoordinates.forEach(result => {
            // Dodaj tylko miejsca z prawidłowymi współrzędnymi (nie 0,0)
            if (
              Number.isFinite(result.place.lat) &&
              Number.isFinite(result.place.lng) &&
              result.place.lat !== 0 &&
              result.place.lng !== 0
            ) {
              places.push(result.place);
            }
            if (result.needsSave && result.lat !== 0 && result.lng !== 0) {
              clientsToSave.push({
                clientId: result.clientId,
                lat: result.lat,
                lng: result.lng,
              });
            }
          });
        } else {
          clients.forEach(client => {
            const lat = Number(client.latitude ?? 0);
            const lng = Number(client.longitude ?? 0);

            // Dodaj tylko miejsca z prawidłowymi współrzędnymi (nie 0,0)
            if (
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              lat !== 0 &&
              lng !== 0
            ) {
              // Formatowanie adresu z danych klienta
              const displayAddress = [
                client.ulica,
                client.numer_domu,
                client.mieszkanie && `m. ${client.mieszkanie}`,
                client.miasto,
                client.kod_pocztowy,
              ]
                .filter(Boolean)
                .join(', ');

              places.push({
                id: client.id,
                lat,
                lng,
                name: client.email,
                firstName: client.first_name,
                lastName: client.last_name,
                companyName: client.nazwa_firmy ?? 'Osoba',
                rodzaj_klienta: client.rodzaj_klienta ?? undefined,
                phone: client.numer_telefonu ?? '',
                address: displayAddress,
                lista_klientow:
                  ((client as any).listy_klientow || client.lista_klientow) &&
                    Array.isArray(
                      (client as any).listy_klientow || client.lista_klientow,
                    ) &&
                    ((client as any).listy_klientow || client.lista_klientow)
                      .length > 0
                    ? (
                      (client as any).listy_klientow || client.lista_klientow
                    ).map((id: any) => Number(id))
                    : undefined,
              });
            }
          });
        }

        if (!isCancelled) {
          setFilteredClients(places);
        }

        // Asynchronicznie zapisz współrzędne do bazy (nie blokuje wyświetlania mapy)
        if (clientsToSave.length > 0 && !isCancelled) {
          // Zapisz współrzędne w tle, bez oczekiwania na odpowiedź
          Promise.all(
            clientsToSave.map(({ clientId, lat, lng }) =>
              updateClientCoordinates({
                data: {
                  user_id: clientId,
                  latitude: String(lat),
                  longitude: String(lng),
                },
              }).catch(() => {
                // Cicho obsłuż błędy - nie blokuj wyświetlania mapy
                // Współrzędne zostaną zapisane przy następnym ładowaniu
              }),
            ),
          ).then(() => {
            // Po zapisaniu, odśwież listę klientów aby mieć aktualne dane
            if (!isCancelled && getClients) {
              getClients();
            }
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPlaces(false);
        }
      }
    };

    loadPlaces();

    return () => {
      isCancelled = true;
    };
  }, [clients, updateClientCoordinates, getClients]);

  useEffect(() => {
    if (getClients) {
      getClients();
    }
  }, [getClients]);

  // Track if user was in Lists tab before navigating to ClientsListScreen
  const wasInListsTabRef = useRef<boolean>(false);

  // Track listTabIndex changes
  useEffect(() => {
    if (listTabIndex === 1) {
      wasInListsTabRef.current = true;
    } else if (listTabIndex === 0) {
      wasInListsTabRef.current = false;
    }
  }, [listTabIndex]);

  // Reset state when returning to Map screen from other modules (not from ClientsListScreen)
  useFocusEffect(
    useCallback(() => {
      // If user was in Lists tab before navigating to ClientsListScreen, preserve it
      if (wasInListsTabRef.current) {
        // We're returning from ClientsListScreen, restore Lists tab
        setListTabIndex(1);
        wasInListsTabRef.current = false; // Reset flag after restoring
        return;
      }

      // Reset to initial state when screen receives focus from other modules
      // This ensures we always start from the beginning when coming from Home
      setListTabIndex(0);
      setListsSearchQuery('');
      setClientsTabOpen(false);
      setAddModalVisible(false);
      // Reset ClientsTab state by calling a method if available
      // The ClientsTab will reset its internal state when isActive changes
    }, []),
  );

  const mapTabComponent = useMemo(
    () => (
      <MapTab
        ref={mapTabRef}
        places={filteredClients}
        isLoading={isLoadingPlaces}
      />
    ),
    [filteredClients, isLoadingPlaces],
  );

  const handleAddList = async (data: { name: string }) => {
    try {
      // Create the list
      const newList = await addClientsList({
        data: {
          nazwa: data.name,
        },
      });

      if (!newList || !newList.id) {
        throw new Error('Failed to create list');
      }

      // Get visible places from the map
      const visiblePlaces = mapTabRef.current?.getVisiblePlaces() || [];

      console.log('[MapScreen] handleAddList - visible places:', {
        count: visiblePlaces.length,
        placeIds: visiblePlaces.map(p => p.id),
      });

      if (visiblePlaces.length > 0) {
        // Add all visible clients to the newly created list
        const addPromises = visiblePlaces.map(place => {
          const body = {
            token,
            klient_id: place.id,
            lista_id: newList.id,
          };
          const url = `${API_PATH}listy_klientow_add_klient_to_lista/`;
          return fetch(url, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          }).then(response => {
            if (!response.ok) {
              throw new Error(`Failed to add client ${place.id} to list`);
            }
            return response.json();
          });
        });

        await Promise.all(addPromises);
      }

      // Refresh clients data to get updated lista_klientow from API
      // This is important so that when user opens the list, it shows the clients
      if (getClients) {
        await getClients();
        // Wait a bit for the data to propagate
        await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      }

      // Refresh only the clients lists, not the entire module
      if (clientsTabRef.current) {
        clientsTabRef.current.refreshLists();
      }

      console.log('[MapScreen] handleAddList completed:', {
        listId: newList.id,
        listName: newList.nazwa,
        visiblePlacesCount: visiblePlaces.length,
        clientsRefreshed: !!getClients,
      });
    } catch (error) {
      console.error('Error creating list:', error);
      Alert.alert('Błąd', 'Nie udało się dodać listy lub klientów do listy');
    }
  };

  const renderClientsTab = useCallback(
    (props: { isActive: boolean }) => (
      <ClientsTab
        ref={clientsTabRef}
        places={filteredClients}
        onDataChange={getClients}
        isActive={props.isActive}
        onClientsListOpenChange={setClientsTabOpen}
        listsSearchQuery={listsSearchQuery}
      />
    ),
    [filteredClients, getClients, listsSearchQuery],
  );

  const items = useMemo(
    () => [
      {
        title: 'Mapa',
        component: mapTabComponent,
      },
      {
        title: 'Listy',
        component: renderClientsTab,
      },
    ],
    [mapTabComponent, renderClientsTab],
  );

  return (
    <Container style={styles.container}>
      <View style={styles.headerContainer}>
        <ButtonsHeader onBackPress={navigation.goBack} title="Mapa" />
        {listTabIndex === 0 && (
          <TouchableOpacity
            style={styles.createListButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.createListButtonText}>
              Stwórz listę klientów
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>Lista klientów</Text>
      {listTabIndex === 1 && (
        <View style={styles.listsSearchContainer}>
          <View style={styles.listsSearchBar}>
            <TextInput
              style={styles.listsSearchInput}
              placeholder="Szukaj"
              placeholderTextColor={Colors.lightGray}
              value={listsSearchQuery}
              onChangeText={setListsSearchQuery}
            />
            <View style={styles.listsSearchIconContainer}>
              <SearchIcon color={Colors.black} size={18} />
            </View>
          </View>
        </View>
      )}
      <Tabs
        items={items}
        isWithLinearGradient={false}
        isButtonsHeader={false}
        headerDividerColor={Colors.yellow}
        onTabChange={setListTabIndex}
      />

      <AddListModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddList}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  headerContainer: {
    position: 'relative',
  },
  createListButton: {
    backgroundColor: Colors.transparent,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray,
  },
  createListButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.black,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    paddingHorizontal: 20,
  },
  listsSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listsSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.menuIconBackground,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  listsSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    padding: 0,
  },
  listsSearchIconContainer: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
  },
  modalButtonGroup: {
    flexDirection: 'row',
  },
  modalButton: {
    padding: 10,
    flex: 1,
    backgroundColor: Colors.mapDivider,
    borderRadius: 60,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.black,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.red,
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalCloseButton: {
    fontSize: 32,
    fontWeight: 'normal',
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
  modalCloseButtonTouchable: {
    borderRadius: 5,
    alignItems: 'center',
    top: -10,
  },
});

export default MapScreen;
