import { Text } from '@rneui/themed';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../consts/Colors';
import { Device } from '../providers/OffersProvider';

type DeviceComparisonSheetProps = {
  isVisible: boolean;
  devices: Device[];
  onClose: () => void;
  onAddToOffer: (deviceId: number) => void;
  onRemoveFromComparison: (deviceId: number) => void;
  isDeviceInOffer: (deviceId: number) => boolean;
};

type ComparisonParameter = {
  label: string;
  key: keyof Device;
  format?: (value: any) => string;
};

const COMPARISON_PARAMETERS: ComparisonParameter[] = [
  { label: 'Nazwa modelu', key: 'nazwa_modelu' },
  { label: 'Producent', key: 'producent' },
  {
    label: 'Moc chłodnicza',
    key: 'moc_chlodnicza',
    format: (val: number) => `${val} kW`,
  },
  {
    label: 'Moc grzewcza',
    key: 'moc_grzewcza',
    format: (val: number) => `${val} kW`,
  },
  {
    label: 'Cena netto',
    key: 'cena_katalogowa_netto',
    format: (val: string) => `${Number(val).toFixed(2)} zł`,
  },
  { label: 'Klasa energ. (chłodzenie)', key: 'klasa_energetyczna_chlodzenie' },
  { label: 'Klasa energ. (grzanie)', key: 'klasa_energetyczna_grzanie' },
  { label: 'Głośność', key: 'glosnosc' },
  {
    label: 'Sterowanie WiFi',
    key: 'sterowanie_wifi',
    format: (val: number) => (val === 1 ? 'Tak' : 'Nie'),
  },
  { label: 'Kolor', key: 'kolor' },
];

const DEVICE_COLUMN_WIDTH = 140;
const PARAMETER_COLUMN_WIDTH = 180;

export default function DeviceComparisonSheet({
  isVisible,
  devices,
  onClose,
  onAddToOffer,
  onRemoveFromComparison,
  isDeviceInOffer,
}: DeviceComparisonSheetProps) {
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get('window').height),
  ).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const handleBackdropPress = () => {
    onClose();
  };

  // Znajdź najlepsze i najgorsze wartości dla podświetleń
  const getBestWorstValues = (param: ComparisonParameter) => {
    if (devices.length < 2) return { best: null, worst: null };

    const values = devices
      .map(d => d[param.key])
      .filter(v => v !== null && v !== undefined && v !== '');

    if (values.length === 0) return { best: null, worst: null };

    // Dla ceny - najniższa jest najlepsza
    if (param.key === 'cena_katalogowa_netto') {
      const numericValues = values.map(v => Number(v));
      return {
        best: Math.min(...numericValues),
        worst: Math.max(...numericValues),
      };
    }

    // Dla mocy - najwyższa jest najlepsza
    if (param.key === 'moc_chlodnicza' || param.key === 'moc_grzewcza') {
      const numericValues = values.map(v => Number(v));
      return {
        best: Math.max(...numericValues),
        worst: Math.min(...numericValues),
      };
    }

    // Dla głośności - najniższa jest najlepsza (jeśli są liczby)
    if (param.key === 'glosnosc') {
      try {
        const numericValues = values
          .map(v => {
            const match = String(v).match(/[\d.]+/);
            return match ? parseFloat(match[0]) : null;
          })
          .filter(v => v !== null) as number[];

        if (numericValues.length > 0) {
          return {
            best: Math.min(...numericValues),
            worst: Math.max(...numericValues),
          };
        }
      } catch (error) {
        return { best: null, worst: null };
      }
    }

    return { best: null, worst: null };
  };

  const getCellStyle = (device: Device, param: ComparisonParameter) => {
    const { best, worst } = getBestWorstValues(param);
    if (best === null || worst === null || best === worst) {
      return {};
    }

    let value: any = device[param.key];

    if (param.key === 'cena_katalogowa_netto') {
      value = Number(value);
      if (value === best) return styles.bestValue;
      if (value === worst) return styles.worstValue;
    }

    if (param.key === 'moc_chlodnicza' || param.key === 'moc_grzewcza') {
      value = Number(value);
      if (value === best) return styles.bestValue;
      if (value === worst) return styles.worstValue;
    }

    if (param.key === 'glosnosc') {
      try {
        const match = String(value).match(/[\d.]+/);
        const numericValue = match ? parseFloat(match[0]) : null;
        if (numericValue !== null) {
          if (numericValue === best) return styles.bestValue;
          if (numericValue === worst) return styles.worstValue;
        }
      } catch (error) {
        // Ignoruj błędy parsowania
      }
    }

    return {};
  };

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Porównanie urządzeń ({devices.length})
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {devices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nie wybrano żadnych urządzeń do porównania
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.contentContainer}
              contentContainerStyle={styles.scrollContentContainer}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                nestedScrollEnabled
              >
                <View style={styles.table}>
                  {/* Header row */}
                  <View style={styles.tableRow}>
                    <View
                      style={[
                        styles.parameterCell,
                        styles.headerCell,
                        styles.stickyColumn,
                      ]}
                    >
                      <Text style={styles.headerText}>Parametr</Text>
                    </View>
                    {devices.map((device, index) => (
                      <View
                        key={device.id}
                        style={[styles.deviceCell, styles.headerCell]}
                      >
                        <Text style={styles.headerText} numberOfLines={2}>
                          Urządzenie {index + 1}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Parameter rows */}
                  {COMPARISON_PARAMETERS.map((param, paramIndex) => (
                    <View
                      key={param.key}
                      style={[
                        styles.tableRow,
                        paramIndex % 2 === 1 && styles.alternateRow,
                      ]}
                    >
                      <View
                        style={[
                          styles.parameterCell,
                          styles.stickyColumn,
                          paramIndex % 2 === 1 && styles.alternateRow,
                        ]}
                      >
                        <Text style={styles.parameterText}>{param.label}</Text>
                      </View>
                      {devices.map(device => {
                        const value = device[param.key];
                        const displayValue = param.format
                          ? param.format(value)
                          : String(value || '-');

                        return (
                          <View
                            key={device.id}
                            style={[
                              styles.deviceCell,
                              getCellStyle(device, param),
                            ]}
                          >
                            <Text style={styles.cellText} numberOfLines={2}>
                              {displayValue}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ))}

                  {/* Action buttons row */}
                  <View style={styles.tableRow}>
                    <View
                      style={[styles.parameterCell, styles.stickyColumn]}
                    >
                      <Text style={styles.parameterText}>Akcje</Text>
                    </View>
                    {devices.map(device => (
                      <View key={device.id} style={styles.deviceCell}>
                        <View style={styles.actionButtons}>
                          {!isDeviceInOffer(device.id) ? (
                            <Pressable
                              style={({ pressed }) => [
                                styles.addButton,
                                pressed && { opacity: 0.7 },
                              ]}
                              onPress={() => {
                                console.log('Add button pressed for device:', device.id);
                                onAddToOffer(device.id);
                              }}
                            >
                              <Text style={styles.addButtonText}>
                                Dodaj do oferty
                              </Text>
                            </Pressable>
                          ) : (
                            <View style={styles.inOfferBadge}>
                              <Text style={styles.inOfferText}>W ofercie</Text>
                            </View>
                          )}
                          <Pressable
                            style={({ pressed }) => [
                              styles.removeButton,
                              pressed && { opacity: 0.7 },
                            ]}
                            onPress={() => {
                              console.log('Remove button pressed for device:', device.id);
                              onRemoveFromComparison(device.id);
                            }}
                          >
                            <Text style={styles.removeButtonText}>Usuń</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Archivo_700Bold',
    color: Colors.black,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    color: Colors.gray,
    textAlign: 'center',
  },
  table: {
    flexDirection: 'column',
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  alternateRow: {
    backgroundColor: Colors.offerFilterBackground,
  },
  parameterCell: {
    width: PARAMETER_COLUMN_WIDTH,
    padding: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  deviceCell: {
    width: DEVICE_COLUMN_WIDTH,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  headerCell: {
    backgroundColor: Colors.teal,
  },
  stickyColumn: {
    backgroundColor: Colors.white,
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'Archivo_700Bold',
    color: Colors.white,
    textAlign: 'center',
  },
  parameterText: {
    fontSize: 13,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  cellText: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
    textAlign: 'center',
  },
  bestValue: {
    backgroundColor: '#d4edda',
  },
  worstValue: {
    backgroundColor: '#f8d7da',
  },
  actionButtons: {
    gap: 8,
    width: '100%',
  },
  addButton: {
    backgroundColor: Colors.teal,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.white,
  },
  removeButton: {
    backgroundColor: Colors.offerFilterRemoveButton,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.offerFilterRemoveButtonText,
  },
  inOfferBadge: {
    backgroundColor: Colors.gray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  inOfferText: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.white,
  },
});

