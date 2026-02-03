import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DrawerScreenProps } from '@react-navigation/drawer';
import { Text } from '@rneui/base';
import { useForm } from 'react-hook-form';
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import FloatingActionButton from '../../components/FloatingActionButton';
import { FormInput } from '../../components/Input';
import Tabs from '../../components/Tabs';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { MainParamList } from '../../navigation/types';
import useClients, { Client } from '../../providers/ClientsProvider';
import ClientsTab, { ClientsTabRef } from './ClientsTab';
import MapTab from './MapTab';

export type Place = {
  id: number;
  lat: number;
  lng: number;
  name: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  address: string;
  lista_klientow?: number;
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
          <Text style={styles.modalTitle}>Dodaj listę</Text>

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
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.buttonText}>Anuluj</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Zapisz</Text>
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
          phone: client.numer_telefonu || '',
          address: displayAddress,
          lista_klientow:
            client.lista_klientow !== null
              ? Number(client.lista_klientow)
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
  const insets = useSafeAreaInsets();
  const { clients, getClients } = useClients();
  const [filteredClients, setFilteredClients] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [listTabIndex, setListTabIndex] = useState(0);
  const [clientsTabOpen, setClientsTabOpen] = useState(false);
  const clientsTabRef = useRef<ClientsTabRef>(null);
  const { execute: updateClientCoordinates } = useApi<{
    message: string;
    error?: string;
  }>({
    path: 'change_child_data',
  });
  const { execute: addClientsList } = useApi({
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

        const placesWithCoordinates = await updateClientsPlaces(
          clients.filter(x => x.lista_klientow !== null),
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
                phone: client.numer_telefonu ?? '',
                address: displayAddress,
                lista_klientow:
                  client.lista_klientow !== null
                    ? Number(client.lista_klientow)
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

  const mapTabComponent = useMemo(
    () => <MapTab places={filteredClients} isLoading={isLoadingPlaces} />,
    [filteredClients, isLoadingPlaces],
  );

  const handleAddList = async (data: { name: string }) => {
    try {
      await addClientsList({
        data: {
          nazwa: data.name,
        },
      });
      if (getClients) {
        await getClients();
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się dodać listy');
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
      />
    ),
    [filteredClients, getClients],
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
      <ButtonsHeader onBackPress={navigation.goBack} title="Mapa" />
      <Text style={styles.title}>Lista klientów</Text>
      <Tabs
        // linearGradient={['#EABA10', '#ffdc04']}
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

      {/* FAB - Floating Action Button: dodaj klienta do listy gdy otwarta lista, w przeciwnym razie dodaj nową listę */}
      <FloatingActionButton
        onPress={() => {
          if (listTabIndex === 1 && clientsTabOpen) {
            clientsTabRef.current?.openAddClientModal();
          } else {
            setAddModalVisible(true);
          }
        }}
        backgroundColor={Colors.yellow}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    paddingHorizontal: 20,
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
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
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
});

export default MapScreen;
