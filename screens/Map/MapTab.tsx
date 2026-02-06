import { useEffect, useMemo, useRef, useState } from 'react';
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
import ProfileUserIcon from '../../components/icons/ProfileUserIcon';
import Colors from '../../consts/Colors';
import { Place } from './MapScreen';

export default function MapTab({
  places,
  isLoading,
}: {
  places: Place[];
  isLoading: boolean;
}) {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 54.4051589,
    longitude: 18.5893139,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

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

  const renderPlaceCard = (place: Place) => {
    const displayName =
      `${place.firstName} ${place.lastName}`.trim() || place.name || '';
    const companyName =
      place.companyName?.trim() && place.companyName !== 'Osoba'
        ? place.companyName.trim()
        : '';
    const primaryName = companyName || displayName || 'Klient';
    const secondaryName = companyName && displayName ? displayName : null;

    return (
      <View style={styles.placeCard}>
        <View style={styles.placeCardAvatarWrap}>
          <View style={styles.placeCardAvatarCircle}>
            <ProfileUserIcon color={Colors.black} size={28} stroke={1.5} />
          </View>
        </View>
        <Text style={styles.placeCardName} numberOfLines={2}>
          {primaryName}
        </Text>
        {/* {secondaryName && secondaryName !== '' ? (
          <Text style={styles.placeCardSubtitle} numberOfLines={1}>
            {secondaryName}
          </Text>
        ) : null} */}
        <Text style={styles.placeCardAddress} numberOfLines={2}>
          {place.address || '—'}
        </Text>
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
            {selectedPlace ? renderPlaceCard(selectedPlace) : null}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        clusterColor="#FFC002"
        provider={PROVIDER_GOOGLE}
      >
        {places
          .filter(
            place =>
              Number.isFinite(place.lat) &&
              Number.isFinite(place.lng) &&
              place.lat !== 0 &&
              place.lng !== 0,
          )
          .map(place => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              image={require('../../assets/marker.png')}
              onCalloutPress={() => openPlaceModal(place, true)}
            >
              <Callout style={styles.callout} tooltip={false}>
                {renderPlaceCard(place)}
              </Callout>
            </Marker>
          ))}
      </ClusteredMapView>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.yellow} />
        </View>
      )}
    </View>
  );
}

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
    width: 280,
    maxWidth: 320,
    alignItems: 'center',
  },
  placeCardAvatarWrap: {
    marginTop: 10,
    marginBottom: 12,
  },
  placeCardAvatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
  },
  // placeCardSubtitle: {
  //   fontSize: 14,
  //   color: Colors.black,
  //   textAlign: 'center',
  // },
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
