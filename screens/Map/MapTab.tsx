import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import { Icon, Text } from '@rneui/themed';
import PhoneIcon from '../../components/icons/PhoneIcon';
import Colors from '../../consts/Colors';
import { Place } from './MapScreen';

export type MapTabRef = {
  getVisiblePlaces: () => Place[];
};

const MapTab = forwardRef<MapTabRef, { places: Place[]; isLoading: boolean }>(
  ({ places, isLoading }, ref) => {
    const mapRef = useRef<any>(null);
    const markerRefs = useRef<Map<number, any>>(new Map());
    const [region, setRegion] = useState<Region>({
      latitude: 54.4051589,
      longitude: 18.5893139,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [currentZoom, setCurrentZoom] = useState<number>(0.1);
    const [currentRegion, setCurrentRegion] = useState<Region>(region);

    // Expose method to get visible places
    useImperativeHandle(
      ref,
      () => ({
        getVisiblePlaces: () => {
          // Use currentRegion state which is updated on every region change
          // This should be accurate as it's updated in onRegionChangeComplete
          const regionToUse = currentRegion;

          // If region is not initialized (still has default values), return all places
          // This handles the case when map hasn't finished loading yet
          const isDefaultRegion =
            regionToUse.latitude === 54.4051589 &&
            regionToUse.longitude === 18.5893139 &&
            regionToUse.latitudeDelta === 0.1 &&
            regionToUse.longitudeDelta === 0.1;

          if (isDefaultRegion && places.length > 0) {
            // Return all places if region hasn't been updated yet (map still loading)
            console.log(
              '[MapTab] getVisiblePlaces - using default region, returning all places',
            );
            return places.filter(
              place =>
                Number.isFinite(place.lat) &&
                Number.isFinite(place.lng) &&
                place.lat !== 0 &&
                place.lng !== 0,
            );
          }

          // Filter places that are within the current visible region
          const visiblePlaces = places.filter(place => {
            if (
              !Number.isFinite(place.lat) ||
              !Number.isFinite(place.lng) ||
              place.lat === 0 ||
              place.lng === 0
            ) {
              return false;
            }

            const { lat } = place;
            const { lng } = place;
            const regionLat = regionToUse.latitude;
            const regionLng = regionToUse.longitude;
            const latDelta = regionToUse.latitudeDelta;
            const lngDelta = regionToUse.longitudeDelta;

            // Check if place is within visible bounds
            const isWithinLat =
              lat >= regionLat - latDelta / 2 &&
              lat <= regionLat + latDelta / 2;
            const isWithinLng =
              lng >= regionLng - lngDelta / 2 &&
              lng <= regionLng + lngDelta / 2;

            return isWithinLat && isWithinLng;
          });

          console.log('[MapTab] getVisiblePlaces called:', {
            totalPlaces: places.length,
            visiblePlaces: visiblePlaces.length,
            visiblePlaceIds: visiblePlaces.map(p => p.id),
            region: {
              lat: regionToUse.latitude,
              lng: regionToUse.longitude,
              latDelta: regionToUse.latitudeDelta,
              lngDelta: regionToUse.longitudeDelta,
            },
            isDefaultRegion,
          });

          return visiblePlaces;
        },
      }),
      [places, currentRegion],
    );

    // Threshold for showing callouts automatically (smaller = more zoomed in)
    const CALLOUT_SHOW_THRESHOLD = 0.1; // Show callouts at zoom 0.1 or less
    const ADDRESS_SHOW_THRESHOLD = 0.05; // Show address at zoom 0.05 or less

    const markerCoordinates = useMemo(
      () =>
        places
          .filter(
            place =>
              Number.isFinite(place.lat) &&
              Number.isFinite(place.lng) &&
              place.lat !== 0 &&
              place.lng !== 0,
          )
          .map(place => ({
            latitude: place.lat,
            longitude: place.lng,
          })),
      [places],
    );

    useEffect(() => {
      if (!mapRef.current || markerCoordinates.length === 0) {
        return;
      }

      requestAnimationFrame(() => {
        mapRef.current?.fitToCoordinates?.(markerCoordinates, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: false,
        });
      });
    }, [markerCoordinates]);

    // Automatically show/hide callouts based on zoom level
    // This effect handles initial callout display when places change
    useEffect(() => {
      // Show callouts when zoom <= 0.1, hide when zoom > 0.1
      const shouldShowCallouts = currentZoom <= CALLOUT_SHOW_THRESHOLD;

      if (markerRefs.current.size === 0) {
        // No markers yet, wait for them to be rendered
        return undefined;
      }

      // Small delay to ensure markers are rendered
      const timeoutId = setTimeout(() => {
        markerRefs.current.forEach((markerRef, placeId) => {
          if (
            markerRef &&
            typeof markerRef.showCallout === 'function' &&
            typeof markerRef.hideCallout === 'function'
          ) {
            if (shouldShowCallouts) {
              try {
                markerRef.showCallout();
              } catch (error) {
                // Ignore errors if callout is already shown
              }
            } else {
              try {
                markerRef.hideCallout();
              } catch (error) {
                // Ignore errors if callout is already hidden
              }
            }
          }
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [places, currentZoom]); // Trigger when places or zoom change

    const handlePhoneCall = (phone: string) => {
      setActionModalVisible(false);
      Linking.openURL(`tel:${phone}`).catch(error =>
        Alert.alert('Błąd', 'Nie udało się otworzyć dialera telefonu', error),
      );
    };

    const handleOpenMaps = (place: Place) => {
      setActionModalVisible(false);
      const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
      Linking.openURL(url).catch(error =>
        Alert.alert('Błąd', 'Nie udało się otworzyć Google Maps', error),
      );
    };

    const openPlaceModal = (place: Place, isModal = false) => {
      setSelectedPlace(place);
      setActionModalVisible(true);
    };

    const renderPlaceCard = (place: Place, showAddress = false) => {
      const cap = (s: string) =>
        s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
      const lastNameFirst = `${cap((place.lastName ?? '').trim())} ${cap(
        (place.firstName ?? '').trim(),
      )}`.trim();
      const displayName = lastNameFirst || place.name || '';
      const companyName =
        place.companyName?.trim() && place.companyName !== 'Osoba'
          ? place.companyName.trim()
          : '';
      const isCompany = place.rodzaj_klienta === 'firma';
      const primaryName = isCompany
        ? companyName || displayName || 'Klient'
        : displayName || companyName || 'Klient';
      const secondaryName =
        isCompany && companyName && displayName ? displayName : null;

      return (
        <View style={styles.placeCard}>
          <Text style={styles.placeCardName} numberOfLines={2}>
            {primaryName}
          </Text>
          {secondaryName && secondaryName !== '' ? (
            <Text style={styles.placeCardSubtitle} numberOfLines={1}>
              {secondaryName}
            </Text>
          ) : null}
          {showAddress && (
            <Text style={styles.placeCardAddress} numberOfLines={2}>
              {place.address || '—'}
            </Text>
          )}
          {actionModalVisible ? (
            <View style={styles.placeCardActions}>
              <TouchableOpacity
                style={styles.placeCardActionBtn}
                onPress={() => handleOpenMaps(place)}
              >
                <Icon
                  name="map-marker"
                  type="material-community"
                  color={Colors.black}
                  size={24}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.placeCardActionBtn}
                onPress={() => place.phone && handlePhoneCall(place.phone)}
                disabled={!place.phone?.trim()}
              >
                <PhoneIcon color={Colors.black} size={22} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.placeCardActionBtn}
                onPress={() => handleOpenMaps(place)}
              >
                <Icon
                  name="map-marker"
                  type="material-community"
                  color={Colors.black}
                  size={24}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <Modal
          visible={actionModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setActionModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActionModalVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={e => e.stopPropagation()}
            >
              {selectedPlace ? renderPlaceCard(selectedPlace, true) : null}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <ClusteredMapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          clusterColor="#FFC002"
          provider={PROVIDER_GOOGLE}
          onRegionChange={newRegion => {
            // Only update zoom for address display logic, don't update region here
            // This prevents excessive re-renders during map movement
            const newZoom = newRegion.latitudeDelta;
            setCurrentZoom(newZoom);
          }}
          onRegionChangeComplete={newRegion => {
            // Update region and zoom when map movement is complete
            const newZoom = newRegion.latitudeDelta;
            setCurrentZoom(newZoom);
            setCurrentRegion(newRegion);

            // Show/hide callouts after map movement is complete
            const shouldShowCallouts = newZoom <= CALLOUT_SHOW_THRESHOLD;

            // Small delay to ensure markers are rendered
            setTimeout(() => {
              markerRefs.current.forEach(markerRef => {
                if (
                  markerRef &&
                  typeof markerRef.showCallout === 'function' &&
                  typeof markerRef.hideCallout === 'function'
                ) {
                  if (shouldShowCallouts) {
                    try {
                      markerRef.showCallout();
                    } catch (error) {
                      // Ignore errors - callout might already be shown
                    }
                  } else {
                    try {
                      markerRef.hideCallout();
                    } catch (error) {
                      // Ignore errors - callout might already be hidden
                    }
                  }
                }
              });
            }, 200);
          }}
        >
          {places
            .filter(
              place =>
                Number.isFinite(place.lat) &&
                Number.isFinite(place.lng) &&
                place.lat !== 0 &&
                place.lng !== 0,
            )
            .map(place => {
              // Show address only when zoomed in enough (smaller latitudeDelta = more zoomed in)
              // At zoom 0.1: show only name
              // At zoom 0.05: show name + address
              const showAddress = currentZoom <= ADDRESS_SHOW_THRESHOLD;
              return (
                <Marker
                  key={`marker-${place.id}`}
                  ref={markerRef => {
                    if (markerRef) {
                      markerRefs.current.set(place.id, markerRef);
                    } else {
                      markerRefs.current.delete(place.id);
                    }
                  }}
                  coordinate={{ latitude: place.lat, longitude: place.lng }}
                  image={require('../../assets/marker.png')}
                  onCalloutPress={() => openPlaceModal(place, true)}
                >
                  <Callout style={styles.callout} tooltip={false}>
                    {renderPlaceCard(place, showAddress)}
                  </Callout>
                </Marker>
              );
            })}
        </ClusteredMapView>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.yellow} />
          </View>
        )}
      </View>
    );
  },
);

MapTab.displayName = 'MapTab';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.loadingOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: Colors.transparent,
    borderWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    width: 280,
    maxWidth: 320,
    alignItems: 'center',
  },
  placeCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  placeCardSubtitle: {
    fontSize: 14,
    color: Colors.black,
    textAlign: 'center',
  },
  placeCardAddress: {
    fontSize: 14,
    color: Colors.black,
    textAlign: 'center',
    fontFamily: 'Archivo_400Regular',
  },
  placeCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    gap: 16,
  },
  placeCardActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.menuIconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(MapTab);
