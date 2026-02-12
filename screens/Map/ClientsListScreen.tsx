import { ListItem, Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../../components/Button';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import MapIcon from '../../components/icons/MapIcon';
import PhoneIcon from '../../components/icons/PhoneIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import Colors from '../../consts/Colors';
import { MainParamList, MapParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import { Place } from './MapScreen';

type ClientsListScreenProps = CompositeScreenProps<
  StackScreenProps<MapParamList, 'ClientsList'>,
  DrawerScreenProps<MainParamList, 'Map'>
>;

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

function PlaceRow({
  place,
  onDelete,
  onCall,
  onRoute,
  onPress,
}: {
  place: Place;
  onDelete: (id: number) => void;
  onCall: () => void;
  onRoute: () => void;
  onPress: () => void;
}) {
  const isCompany = place.rodzaj_klienta === 'firma';
  const companyName =
    place.companyName?.trim() && place.companyName !== 'Osoba'
      ? place.companyName.trim()
      : '';
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const contactName = `${cap((place.firstName ?? '').trim())} ${cap(
    (place.lastName ?? '').trim(),
  )}`.trim();
  const contactNameReverse = `${cap((place.lastName ?? '').trim())} ${cap(
    (place.firstName ?? '').trim(),
  )}`.trim();
  const primaryTitle = isCompany
    ? companyName || contactNameReverse || place.name
    : contactNameReverse || companyName || place.name;

  // Split address into two lines
  const addressParts = place.address?.trim()
    ? place.address.trim().split(',')
    : [];
  const addressLine1 = addressParts.length > 0 ? addressParts[0].trim() : '';
  const addressLine2 =
    addressParts.length > 1 ? addressParts.slice(1).join(',').trim() : '';

  return (
    <Pressable style={styles.placeRowContainer} onPress={onPress}>
      <View style={styles.placeRowContent}>
        <ListItem.Content style={styles.placeRowTextContent}>
          <ListItem.Title>{primaryTitle || 'Klient'}</ListItem.Title>
          {addressLine1 ? (
            <ListItem.Subtitle style={styles.addressLine1}>
              {addressLine1}
            </ListItem.Subtitle>
          ) : null}
          {addressLine2 ? (
            <ListItem.Subtitle style={styles.addressLine2}>
              {addressLine2}
            </ListItem.Subtitle>
          ) : null}
        </ListItem.Content>
        <View style={styles.placeRowButtons}>
          <IconButton
            icon={<MapIcon color={Colors.black} size={18} />}
            onPress={() => onRoute()}
            withoutBackground
            style={styles.actionButton}
          />
          <IconButton
            icon={<PhoneIcon color={Colors.black} size={14} />}
            onPress={() => onCall()}
            withoutBackground
            style={styles.actionButton}
          />
          <IconButton
            icon={<TrashIcon color={Colors.black} size={18} />}
            onPress={() => onDelete(place.id)}
            withoutBackground
            style={styles.actionButton}
          />
        </View>
      </View>
    </Pressable>
  );
}

function ClientsListScreen({ route, navigation }: ClientsListScreenProps) {
  const { listId } = route.params;
  const [isLoadingListClients, setIsLoadingListClients] = useState(false);
  const [currentListClients, setCurrentListClients] = useState<Place[]>([]);
  const [isMutating, setIsMutating] = useState(false);
  const [clientsLists, setClientsLists] = useState<any[]>([]);
  const savedListIdRef = useRef<number | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const lastLoadedListIdRef = useRef<number | null>(null);

  const API_URL: string =
    Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
  const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
  const API_PATH: string =
    API_URL.length > 0 && API_PORT.length > 0
      ? `${API_URL}:${API_PORT}/api/`
      : `${API_URL}/api/`;
  const { clients, getClients } = useClients();
  const { token } = useAuth();

  const openGoogleMapsForPlace = useCallback((place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    Linking.openURL(url);
  }, []);

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
    (client: Client): Place => {
      // Backend returns 'listy_klientow' but we also support 'lista_klientow' for compatibility
      const listaKlientowRaw =
        (client as any).listy_klientow || client.lista_klientow;
      const listaKlientow =
        listaKlientowRaw &&
          Array.isArray(listaKlientowRaw) &&
          listaKlientowRaw.length > 0
          ? listaKlientowRaw.map(id => Number(id))
          : undefined;

      // Log if client has lista_klientow for debugging
      if (listaKlientow && listaKlientow.length > 0) {
        console.log(
          '[ClientsListScreen] mapClientToPlace - client with lists:',
          {
            clientId: client.id,
            listaKlientow,
            rawListyKlientow: (client as any).listy_klientow,
            rawListaKlientow: client.lista_klientow,
          },
        );
      }

      return {
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
        lista_klientow: listaKlientow,
      };
    },
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

  const loadClientsForList = useCallback(
    async (listIdParam: number | null) => {
      if (isLoadingRef.current && lastLoadedListIdRef.current === listIdParam) {
        return;
      }

      if (!listIdParam) {
        setCurrentListClients([]);
        setIsLoadingListClients(false);
        lastLoadedListIdRef.current = null;
        isLoadingRef.current = false;
        return;
      }

      isLoadingRef.current = true;
      lastLoadedListIdRef.current = listIdParam;
      setIsLoadingListClients(true);

      try {
        // Always fetch from API to get the latest data
        if (getClients) {
          const response = await getClients();
          const clientsData = response?.klient_list ?? [];

          // Log raw data from API to see what field name backend uses
          if (clientsData.length > 0) {
            const sampleClient = clientsData[0];
            console.log('[ClientsListScreen] Sample client from API:', {
              clientId: sampleClient.id,
              hasListaKlientow: !!sampleClient.lista_klientow,
              hasListyKlientow: !!(sampleClient as any).listy_klientow,
              listaKlientowValue: sampleClient.lista_klientow,
              listyKlientowValue: (sampleClient as any).listy_klientow,
              allKeys: Object.keys(sampleClient),
            });
          }

          const mapped = clientsData.map(mapClientToPlace);

          console.log('[ClientsListScreen] loadClientsForList:', {
            listId: listIdParam,
            totalClients: clientsData.length,
            mappedClients: mapped.length,
            clientsWithListaKlientow: mapped.filter(
              c => c.lista_klientow && c.lista_klientow.length > 0,
            ).length,
            sampleClientListaKlientow: mapped.find(c =>
              c.lista_klientow?.includes(listIdParam),
            )?.lista_klientow,
            allClientsWithLists: mapped
              .filter(c => c.lista_klientow && c.lista_klientow.length > 0)
              .map(c => ({ id: c.id, lista_klientow: c.lista_klientow })),
          });

          const filtered = mapped.filter(place =>
            place.lista_klientow?.includes(listIdParam),
          );

          console.log('[ClientsListScreen] Filtered clients for list:', {
            listId: listIdParam,
            filteredCount: filtered.length,
            filteredIds: filtered.map(p => p.id),
          });

          if (lastLoadedListIdRef.current === listIdParam) {
            setCurrentListClients(sortPlacesByName(filtered));
            setIsLoadingListClients(false);
            isLoadingRef.current = false;
          }
        } else {
          setCurrentListClients([]);
          setIsLoadingListClients(false);
          isLoadingRef.current = false;
        }
      } catch (error) {
        console.error('[Map/ClientsListScreen] Error loading clients', error);
        setCurrentListClients([]);
        setIsLoadingListClients(false);
        isLoadingRef.current = false;
      }
    },
    [getClients, mapClientToPlace, sortPlacesByName],
  );

  const fetchClientsLists = useCallback(async () => {
    if (!token || !API_PATH) {
      setClientsLists([]);
      return;
    }

    try {
      const response = await fetch(`${API_PATH}listy_klientow/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients lists');
      }

      const res = await response.json();
      const lists = res.listy_klientow || [];
      // Sortuj listy według ID
      const sortedLists = lists.sort((a: any, b: any) => a.id - b.id);
      setClientsLists(sortedLists);
    } catch (error) {
      console.error('[Map/ClientsListScreen] Error fetching lists', error);
      setClientsLists([]);
    }
  }, [token, API_PATH]);

  useEffect(() => {
    if (listId) {
      loadClientsForList(listId);
    }
  }, [listId, loadClientsForList]);

  useEffect(() => {
    fetchClientsLists();
  }, [fetchClientsLists]);

  const onDelete = async (id: number) => {
    if (!listId) {
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
            lista_id: listId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Remove client request failed');
      }

      await loadClientsForList(listId);
      if (getClients) {
        await getClients();
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć klienta z listy');
    } finally {
      setIsMutating(false);
    }
  };

  const currentList = clientsLists.find(l => l.id === listId);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.listHeader, { paddingTop: insets.top }]}>
        <IconButton
          icon={<ArrowLeftIcon color={Colors.black} size={16} />}
          onPress={() => navigation.goBack()}
          withoutBackground
        />
        <View style={styles.listHeaderTitleContainer}>
          {currentList?.nazwa ? (
            <>
              <Text style={styles.listHeaderTitle} numberOfLines={1}>
                {currentList.nazwa}
              </Text>
              <Text style={styles.listHeaderDateText}>
                {formatListCreatedDate(currentList.created_date)}
              </Text>
            </>
          ) : null}
        </View>
        <View />
      </View>
      {(isLoadingListClients || isMutating) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
      {isLoadingListClients ? (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : currentListClients.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>Brak klientów w liście</Text>
        </View>
      ) : (
        <FlashList<Place>
          data={currentListClients}
          renderItem={({ item }) => {
            const client = clients?.find(c => c.id === item.id);
            const handlePress = () => {
              savedListIdRef.current = listId;
              (navigation as any).navigate('Clients', {
                screen: 'Menu',
                params: {
                  clientId: item.id,
                  client,
                  fromMap: true,
                  returnToListId: listId,
                },
              });
            };
            return (
              <PlaceRow
                place={item}
                onDelete={onDelete}
                onCall={() =>
                  item.phone && Linking.openURL(`tel:${item.phone}`)
                }
                onRoute={() => openGoogleMapsForPlace(item)}
                onPress={handlePress}
              />
            );
          }}
          estimatedItemSize={70}
          contentContainerStyle={styles.listItemsContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 60,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.mapDivider,
  },
  listHeaderTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginLeft: -40,
  },
  listHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
  },
  listHeaderDateText: {
    fontSize: 12,
    color: Colors.companyText,
    marginTop: 2,
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
  listItemsContainer: {
    padding: 10,
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
});

export default ClientsListScreen;
