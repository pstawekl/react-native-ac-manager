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

import { Text } from '@rneui/base';
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

  const handleCalloutPress = (place: Place) => {
    setSelectedPlace(place);
    setActionModalVisible(true);
  };

  const handlePhoneCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(error =>
      Alert.alert('Błąd', 'Nie udało się otworzyć dialera telefonu', error),
    );
    setActionModalVisible(false);
  };

  const handleOpenMaps = (place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
    Linking.openURL(url).catch(error =>
      Alert.alert('Błąd', 'Nie udało się otworzyć Google Maps', error),
    );
    setActionModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Modal z opcjami akcji dla miejsca */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlace && (
              <>
                <Text style={styles.modalTitle}>
                  {`${selectedPlace.firstName} ${selectedPlace.lastName}`.trim() ||
                    selectedPlace.name}
                </Text>
                {selectedPlace.companyName && (
                  <Text style={styles.modalSubtitle}>
                    {selectedPlace.companyName}
                  </Text>
                )}
                {selectedPlace.address && (
                  <Text style={styles.modalAddress}>
                    {selectedPlace.address}
                  </Text>
                )}

                <View style={styles.actionButtonGroup}>
                  {selectedPlace.phone && selectedPlace.phone.trim() !== '' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.phoneActionButton]}
                      onPress={() => handlePhoneCall(selectedPlace.phone)}
                    >
                      <Text style={styles.actionButtonText}>📞 Zadzwoń</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.mapsActionButton]}
                    onPress={() => handleOpenMaps(selectedPlace)}
                  >
                    <Text style={styles.actionButtonText}>🗺️ Google Maps</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setActionModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Zamknij</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
          .map(place => {
            const fullName = `${place.firstName} ${place.lastName}`.trim();
            const displayName = fullName || place.name;

            return (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                image={require('../../assets/marker.png')}
                onCalloutPress={() => handleCalloutPress(place)}
              >
                <Callout style={styles.callout}>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{displayName}</Text>
                    {place.companyName && (
                      <Text style={styles.calloutCompany}>
                        {place.companyName}
                      </Text>
                    )}
                    {place.address && (
                      <Text style={styles.calloutAddress}>{place.address}</Text>
                    )}
                    <Text style={styles.calloutInstruction}>
                      Dotknij aby zobaczyć opcje
                    </Text>
                  </View>
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
    minWidth: 200,
    maxWidth: 250,
  },
  calloutContainer: {
    padding: 10,
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
    textAlign: 'center',
  },
  calloutCompany: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 4,
    textAlign: 'center',
  },
  calloutAddress: {
    fontSize: 13,
    color: Colors.lightGray,
    marginBottom: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  calloutInstruction: {
    fontSize: 12,
    color: Colors.blue,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalAddress: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    width: '100%',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  phoneActionButton: {
    backgroundColor: Colors.primary,
  },
  mapsActionButton: {
    backgroundColor: Colors.blue,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
