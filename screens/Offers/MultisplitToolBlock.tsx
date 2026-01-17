import { Divider, Text } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SubmitButton } from '../../components/Button';
import { Dropdown } from '../../components/Input';
import MultiSelectModal from '../../components/MultiSelectModal';
import Colors from '../../consts/Colors';
import { Device } from '../../providers/OffersProvider';
import { ToolFormData } from './AddToolForm';

// Typy dla nowego flow
type SelectedDevice = {
  model: string;
  type: string;
  power: number;
  deviceId: number;
  quantity: number;
};

type AggregateMatch = {
  aggregateId: number;
  aggregateName: string;
  aggregatePower: number;
  aggregateMaxDevices: number;
  assignedDevices: SelectedDevice[];
  usedPower: number;
  usedDevices: number;
};

type MultisplitToolBlockProps = {
  control: Control<ToolFormData>;
  devices: Device[];
  resetField?: (name: keyof ToolFormData) => void;
  setValue?: UseFormSetValue<ToolFormData>;
  onDevicesChange?: (devices: number[]) => void;
  scrollViewRef?: React.RefObject<ScrollView>;
};

export default function MultisplitToolBlock({
  control,
  devices,
  setValue,
  onDevicesChange,
}: MultisplitToolBlockProps) {
  // Stan dla poszczególnych etapów
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevice[]>([]);
  const [matchedAggregates, setMatchedAggregates] = useState<AggregateMatch[]>(
    [],
  );

  // Synchronizuj wartości z formularza
  const selectedManufacturers = useWatch({
    control,
    name: 'multisplit_manufacturers',
    defaultValue: [],
  }) as string[];

  const selectedModels = useWatch({
    control,
    name: 'multisplit_models',
    defaultValue: [],
  }) as string[];

  const selectedTypes = useWatch({
    control,
    name: 'multisplit_types',
    defaultValue: [],
  }) as string[];

  // Etap 1: Pobierz listę producentów
  const manufacturers = useMemo(() => {
    const uniqueManufacturers = Array.from(
      new Set(
        devices
          .filter(d => d.rodzaj !== 'agregat')
          .map(d => d.producent)
          .filter(Boolean),
      ),
    ).sort();
    return uniqueManufacturers;
  }, [devices]);

  // Etap 2: Pobierz listę modeli na podstawie wybranych producentów
  const availableModels = useMemo(() => {
    if (selectedManufacturers.length === 0) return [];

    const models = devices.filter(
      d =>
        d.rodzaj !== 'agregat' &&
        selectedManufacturers.includes(d.producent) &&
        d.nazwa_modelu,
    );

    const uniqueModels = Array.from(
      new Set(models.map(d => d.nazwa_modelu).filter(Boolean)),
    ).sort();

    return uniqueModels;
  }, [devices, selectedManufacturers]);

  // Etap 3: Pobierz listę typów na podstawie wybranych producentów i modeli
  const availableTypes = useMemo(() => {
    if (selectedManufacturers.length === 0 || selectedModels.length === 0)
      return [];

    const filteredDevices = devices.filter(
      d =>
        d.rodzaj !== 'agregat' &&
        selectedManufacturers.includes(d.producent) &&
        selectedModels.includes(d.nazwa_modelu),
    );

    const types = new Set<string>();
    filteredDevices.forEach(d => {
      const deviceType = d.typ_jedn_wew?.trim() || d.typ?.trim();
      if (deviceType) {
        types.add(deviceType);
      }
    });

    return Array.from(types).sort();
  }, [devices, selectedManufacturers, selectedModels]);

  // Etap 4: Pobierz urządzenia do wyboru mocy (pogrupowane po modelu i typie)
  const devicesForPowerSelection = useMemo(() => {
    if (
      selectedManufacturers.length === 0 ||
      selectedModels.length === 0 ||
      selectedTypes.length === 0
    )
      return [];

    const filteredDevices = devices.filter(d => {
      if (d.rodzaj === 'agregat') return false;
      if (!selectedManufacturers.includes(d.producent)) return false;
      if (!selectedModels.includes(d.nazwa_modelu)) return false;

      const deviceType = d.typ_jedn_wew?.trim() || d.typ?.trim();
      if (!deviceType || !selectedTypes.includes(deviceType)) return false;

      return true;
    });

    // Grupuj po modelu i typie
    const grouped: {
      [key: string]: { model: string; type: string; devices: Device[] };
    } = {};

    filteredDevices.forEach(d => {
      const deviceType = d.typ_jedn_wew?.trim() || d.typ?.trim();
      const key = `${d.nazwa_modelu}_${deviceType}`;

      if (!grouped[key]) {
        grouped[key] = {
          model: d.nazwa_modelu,
          type: deviceType || '',
          devices: [],
        };
      }

      grouped[key].devices.push(d);
    });

    return Object.values(grouped);
  }, [devices, selectedManufacturers, selectedModels, selectedTypes]);

  // Funkcja automatycznego dopasowania agregatów
  const matchAggregates = useCallback(() => {
    if (selectedDevices.length === 0) return [];

    // Pobierz agregaty dla wybranych producentów
    const availableAggregates = devices.filter(
      d =>
        d.rodzaj === 'agregat' && selectedManufacturers.includes(d.producent),
    );

    if (availableAggregates.length === 0) return [];

    // Sortuj agregaty według mocy (rosnąco) dla optymalnego dopasowania
    const sortedAggregates = [...availableAggregates].sort(
      (a, b) => Number(a.moc_chlodnicza || 0) - Number(b.moc_chlodnicza || 0),
    );

    const matches: AggregateMatch[] = [];
    const remainingDevices = [...selectedDevices];

    // Algorytm dopasowania: próbuj zmieścić jak najwięcej urządzeń w jednym agregacie
    while (remainingDevices.length > 0) {
      let bestMatch: AggregateMatch | null = null;

      // Znajdź najmniejszy agregat, który pomieści przynajmniej jedno urządzenie
      for (const aggregate of sortedAggregates) {
        const maxPower = Number(aggregate.moc_chlodnicza || 0);
        const maxDevices = aggregate.maks_ilosc_jedn_wew || 0;

        const match: AggregateMatch = {
          aggregateId: aggregate.id,
          aggregateName: aggregate.nazwa_modelu_producenta,
          aggregatePower: maxPower,
          aggregateMaxDevices: maxDevices,
          assignedDevices: [],
          usedPower: 0,
          usedDevices: 0,
        };

        // Próbuj dodać urządzenia do tego agregatu
        for (let i = 0; i < remainingDevices.length; i++) {
          const device = remainingDevices[i];
          const devicePower = device.power * device.quantity;
          const deviceCount = device.quantity;

          if (
            match.usedPower + devicePower <= maxPower &&
            match.usedDevices + deviceCount <= maxDevices
          ) {
            match.assignedDevices.push(device);
            match.usedPower += devicePower;
            match.usedDevices += deviceCount;
          }
        }

        // Jeśli ten agregat pomieści przynajmniej jedno urządzenie
        if (match.assignedDevices.length > 0) {
          bestMatch = match;
          break;
        }
      }

      if (bestMatch) {
        matches.push(bestMatch);
        // Usuń przypisane urządzenia z listy pozostałych
        bestMatch.assignedDevices.forEach(assignedDevice => {
          const index = remainingDevices.findIndex(
            d =>
              d.deviceId === assignedDevice.deviceId &&
              d.model === assignedDevice.model &&
              d.type === assignedDevice.type,
          );
          if (index !== -1) {
            remainingDevices.splice(index, 1);
          }
        });
      } else {
        // Nie można dopasować żadnego agregatu - błąd
        console.error(
          'Nie można dopasować agregatu dla urządzeń:',
          remainingDevices,
        );
        break;
      }
    }

    return matches;
  }, [devices, selectedDevices, selectedManufacturers]);

  // Aktualizuj dopasowane agregaty gdy zmienią się wybrane urządzenia
  useEffect(() => {
    if (selectedDevices.length > 0 && currentStep >= 5) {
      const matches = matchAggregates();
      setMatchedAggregates(matches);
    }
  }, [selectedDevices, currentStep, matchAggregates]);

  // Aktualizuj wybrane urządzenia w AddToolForm
  useEffect(() => {
    if (onDevicesChange && matchedAggregates.length > 0) {
      const deviceIds: number[] = [];

      matchedAggregates.forEach(match => {
        // Dodaj agregat
        deviceIds.push(match.aggregateId);

        // Dodaj wszystkie urządzenia przypisane do tego agregatu
        match.assignedDevices.forEach(device => {
          // Dodaj urządzenie tyle razy, ile wynosi jego ilość
          for (let i = 0; i < device.quantity; i++) {
            deviceIds.push(device.deviceId);
          }
        });
      });

      onDevicesChange(deviceIds);
    }
  }, [matchedAggregates, onDevicesChange]);

  // Przejdź do następnego kroku
  const handleNextStep = useCallback(() => {
    if (currentStep === 1 && selectedManufacturers.length === 0) {
      alert('Wybierz przynajmniej jednego producenta');
      return;
    }
    if (currentStep === 2 && selectedModels.length === 0) {
      alert('Wybierz przynajmniej jeden model');
      return;
    }
    if (currentStep === 3 && selectedTypes.length === 0) {
      alert('Wybierz przynajmniej jeden typ urządzenia');
      return;
    }
    if (currentStep === 4 && selectedDevices.length === 0) {
      alert('Wybierz przynajmniej jedno urządzenie z mocą');
      return;
    }

    setCurrentStep(prev => prev + 1);
  }, [
    currentStep,
    selectedManufacturers,
    selectedModels,
    selectedTypes,
    selectedDevices,
  ]);

  // Wróć do poprzedniego kroku
  const handlePreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  // Dodaj urządzenie z wybraną mocą
  const handleAddDevice = useCallback(
    (model: string, type: string, deviceId: number, power: number) => {
      setSelectedDevices(prev => {
        // Sprawdź czy takie urządzenie już istnieje
        const existingIndex = prev.findIndex(
          d => d.deviceId === deviceId && d.model === model && d.type === type,
        );

        if (existingIndex !== -1) {
          // Zwiększ ilość
          const updated = [...prev];
          updated[existingIndex].quantity += 1;
          return updated;
        }

        // Dodaj nowe urządzenie
        return [
          ...prev,
          {
            model,
            type,
            power,
            deviceId,
            quantity: 1,
          },
        ];
      });
    },
    [],
  );

  // Usuń urządzenie
  const handleRemoveDevice = useCallback(
    (model: string, type: string, deviceId: number) => {
      setSelectedDevices(prev => {
        const existingIndex = prev.findIndex(
          d => d.deviceId === deviceId && d.model === model && d.type === type,
        );

        if (existingIndex !== -1) {
          const updated = [...prev];
          if (updated[existingIndex].quantity > 1) {
            // Zmniejsz ilość
            updated[existingIndex].quantity -= 1;
          } else {
            // Usuń urządzenie
            updated.splice(existingIndex, 1);
          }
          return updated;
        }

        return prev;
      });
    },
    [],
  );

  return (
    <View style={styles.container}>
      {/* Wskaźnik postępu */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Krok {currentStep} z 5</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / 5) * 100}%` },
            ]}
          />
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* ETAP 1: Wybór producentów */}
      {currentStep === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Wybierz producentów</Text>
          <Text style={styles.stepDescription}>
            Możesz wybrać wielu producentów
          </Text>

          <MultiSelectModal
            name="multisplit_manufacturers"
            control={control}
            label="Producenci"
            options={manufacturers.map(m => ({ label: m, value: m }))}
            placeholder="Wybierz producentów..."
            isBordered
            customWidth="100%"
          />

          <SubmitButton
            title="Dalej"
            style={styles.nextButton}
            onPress={handleNextStep}
            disabled={selectedManufacturers.length === 0}
          />
        </View>
      )}

      {/* ETAP 2: Wybór modeli */}
      {currentStep === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Wybierz modele urządzeń</Text>
          <Text style={styles.stepDescription}>
            Wybrane producenci: {selectedManufacturers.join(', ')}
          </Text>

          <MultiSelectModal
            name="multisplit_models"
            control={control}
            label="Modele urządzeń"
            options={availableModels.map(m => ({ label: m, value: m }))}
            placeholder="Wybierz modele..."
            isBordered
            customWidth="100%"
          />

          <View style={styles.buttonRow}>
            <SubmitButton
              title="Wstecz"
              style={[styles.nextButton, styles.backButton]}
              onPress={handlePreviousStep}
            />
            <SubmitButton
              title="Dalej"
              style={styles.nextButton}
              onPress={handleNextStep}
              disabled={selectedModels.length === 0}
            />
          </View>
        </View>
      )}

      {/* ETAP 3: Wybór typów */}
      {currentStep === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Wybierz typy urządzeń</Text>
          <Text style={styles.stepDescription}>
            Wybrane modele: {selectedModels.join(', ')}
          </Text>

          <MultiSelectModal
            name="multisplit_types"
            control={control}
            label="Typy urządzeń"
            options={availableTypes.map(t => ({ label: t, value: t }))}
            placeholder="Wybierz typy..."
            isBordered
            customWidth="100%"
          />

          <View style={styles.buttonRow}>
            <SubmitButton
              title="Wstecz"
              style={[styles.nextButton, styles.backButton]}
              onPress={handlePreviousStep}
            />
            <SubmitButton
              title="Dalej"
              style={styles.nextButton}
              onPress={handleNextStep}
              disabled={selectedTypes.length === 0}
            />
          </View>
        </View>
      )}

      {/* ETAP 4: Wybór mocy dla każdego urządzenia */}
      {currentStep === 4 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Wybierz moc urządzeń</Text>
          <Text style={styles.stepDescription}>
            Dla każdego modelu i typu wybierz moc i ilość
          </Text>

          <ScrollView
            style={styles.deviceSelectionList}
            nestedScrollEnabled={true}
          >
            {devicesForPowerSelection.map((group, index) => (
              <View
                key={`${group.model}_${group.type}`}
                style={styles.deviceGroup}
              >
                <Text style={styles.deviceGroupTitle}>
                  {group.model} - {group.type}
                </Text>

                {group.devices.map(device => {
                  const selectedDevice = selectedDevices.find(
                    d =>
                      d.deviceId === device.id &&
                      d.model === group.model &&
                      d.type === group.type,
                  );

                  return (
                    <View key={device.id} style={styles.deviceItem}>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.devicePower}>
                          {device.moc_chlodnicza} kW
                        </Text>
                        <Text style={styles.devicePrice}>
                          {Number(device.cena_katalogowa_netto).toFixed(2)} zł
                        </Text>
                      </View>

                      <View style={styles.deviceActions}>
                        {selectedDevice && (
                          <>
                            <SubmitButton
                              title="-"
                              style={styles.quantityButton}
                              onPress={() =>
                                handleRemoveDevice(
                                  group.model,
                                  group.type,
                                  device.id,
                                )
                              }
                            />
                            <Text style={styles.quantityText}>
                              {selectedDevice.quantity}
                            </Text>
                          </>
                        )}
                        <SubmitButton
                          title="+"
                          style={styles.quantityButton}
                          onPress={() =>
                            handleAddDevice(
                              group.model,
                              group.type,
                              device.id,
                              Number(device.moc_chlodnicza),
                            )
                          }
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonRow}>
            <SubmitButton
              title="Wstecz"
              style={[styles.nextButton, styles.backButton]}
              onPress={handlePreviousStep}
            />
            <SubmitButton
              title="Dopasuj agregaty"
              style={styles.nextButton}
              onPress={handleNextStep}
              disabled={selectedDevices.length === 0}
            />
          </View>
        </View>
      )}

      {/* ETAP 5: Podgląd dopasowanych agregatów */}
      {currentStep === 5 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Dopasowane agregaty</Text>
          <Text style={styles.stepDescription}>
            Aplikacja automatycznie dopasowała agregaty do wybranych urządzeń
          </Text>

          <ScrollView style={styles.aggregatesList} nestedScrollEnabled={true}>
            {matchedAggregates.length === 0 ? (
              <View style={styles.noAggregatesContainer}>
                <Text style={styles.noAggregatesText}>
                  Nie znaleziono pasujących agregatów dla wybranych urządzeń
                </Text>
              </View>
            ) : (
              matchedAggregates.map((match, index) => (
                <View
                  key={`${match.aggregateId}_${index}`}
                  style={styles.aggregateCard}
                >
                  <Text style={styles.aggregateTitle}>Zestaw {index + 1}</Text>
                  <Divider style={styles.cardDivider} />

                  <View style={styles.aggregateInfo}>
                    <Text style={styles.aggregateLabel}>Agregat:</Text>
                    <Text style={styles.aggregateValue}>
                      {match.aggregateName}
                    </Text>
                  </View>

                  <View style={styles.aggregateInfo}>
                    <Text style={styles.aggregateLabel}>Moc agregatu:</Text>
                    <Text style={styles.aggregateValue}>
                      {match.aggregatePower} kW
                    </Text>
                  </View>

                  <View style={styles.aggregateInfo}>
                    <Text style={styles.aggregateLabel}>Wykorzystana moc:</Text>
                    <Text
                      style={[
                        styles.aggregateValue,
                        match.usedPower > match.aggregatePower &&
                          styles.aggregateValueError,
                      ]}
                    >
                      {match.usedPower.toFixed(2)} kW / {match.aggregatePower}{' '}
                      kW
                    </Text>
                  </View>

                  <View style={styles.aggregateInfo}>
                    <Text style={styles.aggregateLabel}>Liczba urządzeń:</Text>
                    <Text
                      style={[
                        styles.aggregateValue,
                        match.usedDevices > match.aggregateMaxDevices &&
                          styles.aggregateValueError,
                      ]}
                    >
                      {match.usedDevices} / {match.aggregateMaxDevices}
                    </Text>
                  </View>

                  <Divider style={styles.cardDivider} />

                  <Text style={styles.devicesListTitle}>
                    Urządzenia wewnętrzne:
                  </Text>
                  {match.assignedDevices.map((device, deviceIndex) => (
                    <View
                      key={`${device.deviceId}_${deviceIndex}`}
                      style={styles.assignedDevice}
                    >
                      <Text style={styles.assignedDeviceText}>
                        • {device.model} - {device.type} ({device.power} kW) x{' '}
                        {device.quantity} szt.
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.buttonRow}>
            <SubmitButton
              title="Wstecz"
              style={[styles.nextButton, styles.backButton]}
              onPress={handlePreviousStep}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.teal,
    borderRadius: 4,
  },
  divider: {
    marginVertical: 16,
    height: 2,
    backgroundColor: Colors.gray,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Archivo_700Bold',
    color: Colors.black,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.gray,
    marginBottom: 24,
  },
  nextButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.teal,
    marginTop: 24,
  },
  backButton: {
    backgroundColor: Colors.gray,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  deviceSelectionList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  deviceGroup: {
    marginBottom: 24,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  deviceGroupTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  deviceInfo: {
    flex: 1,
  },
  devicePower: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  devicePrice: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.gray,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.teal,
    padding: 0,
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    minWidth: 24,
    textAlign: 'center',
  },
  aggregatesList: {
    maxHeight: 500,
    marginBottom: 16,
  },
  noAggregatesContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noAggregatesText: {
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    color: Colors.gray,
    textAlign: 'center',
  },
  aggregateCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  aggregateTitle: {
    fontSize: 18,
    fontFamily: 'Archivo_700Bold',
    color: Colors.teal,
    marginBottom: 8,
  },
  cardDivider: {
    marginVertical: 12,
    height: 1,
    backgroundColor: Colors.divider,
  },
  aggregateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aggregateLabel: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.gray,
  },
  aggregateValue: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  aggregateValueError: {
    color: Colors.red,
  },
  devicesListTitle: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 8,
  },
  assignedDevice: {
    marginBottom: 4,
  },
  assignedDeviceText: {
    fontSize: 13,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
});
