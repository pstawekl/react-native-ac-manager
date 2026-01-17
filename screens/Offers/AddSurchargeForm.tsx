import { Divider, Overlay, Text } from '@rneui/themed';
import { useCallback, useEffect, useState } from 'react';
import { Control, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { ScrollView } from 'react-native-virtualized-view';

import { LinearGradient } from 'expo-linear-gradient';
import { IconButton, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { Dropdown, FormInput } from '../../components/Input';
import Switch from '../../components/Switch';
import CloseIcon from '../../components/icons/CloseIcon';
import EditIcon from '../../components/icons/EditIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { OfferAddSurchargeFormScreenProps } from '../../navigation/types';
import useOffers, { Device } from '../../providers/OffersProvider';

export type Surcharge = {
  name: string;
  value: number | null;
};

type FormData = {
  surcharges: Surcharge[];
  promo: string;
};

type ModalFormData = {
  customSurchargeValue: string;
  customDiscountValue: string;
};

function Surcharge({
  index,
  onAddSurcharge,
  onRemoveSurcharge,
  control,
  canRemove,
}: {
  index: number;
  onAddSurcharge: () => void;
  onRemoveSurcharge: () => void;
  control: Control<FormData>;
  canRemove: boolean;
}) {
  const [surcharges, setSurcharges] =
    useState<{ name: string; id: number; value: number }[]>();
  const { result, execute } = useApi<
    { name: string; id: number; value: number }[]
  >({
    path: 'narzut_list',
  });

  useEffect(() => {
    if (execute) {
      execute();
    }
  }, [execute]);

  useEffect(() => {
    if (result) {
      setSurcharges(result);
    }
  }, [result, surcharges]);

  return (
    <View
      style={[
        styles.surchargeContainer,
        {
          zIndex: 1000 - index,
        },
      ]}
    >
      {surcharges && (
        <>
          <Dropdown
            name={`surcharges.${index}.name`}
            control={control}
            label={index === 0 ? 'Nazwa narzutu' : ''}
            options={surcharges.map(surcharge => ({
              label: surcharge.name,
              value: surcharge.id,
            }))}
            isSmall
            isThin
            isBordered
            customWidth="60%"
            zIndex={10}
          />
          <View style={styles.surchargeButtons}>
            <SubmitButton
              title="Dodaj"
              style={styles.surchargeAddButton}
              titleStyle={styles.surchargeAddButtonText}
              onPress={onAddSurcharge}
            />
            {canRemove && (
              <IconButton
                withoutBackground
                onPress={onRemoveSurcharge}
                icon={<CloseIcon color={Colors.red} size={18} />}
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

function AddSurchargeForm({
  navigation,
  route,
}: OfferAddSurchargeFormScreenProps) {
  const { type, installationId, devices, offerName, isTemplate } = route.params;
  const { devicesSplit, devicesMultisplit } = useOffers();
  // Pobierz szczegóły urządzeń na podstawie przekazanych id
  const allDevices = [...(devicesSplit ?? []), ...(devicesMultisplit ?? [])];
  const selectedDevices = allDevices.filter(d => devices.includes(d.id));

  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      surcharges: [{ name: 'montaz_0', value: null }],
    },
  });

  const { control: modalControl, setValue: setModalValue } =
    useForm<ModalFormData>({
      defaultValues: {
        customSurchargeValue: '',
        customDiscountValue: '',
      },
    });

  const customSurchargeValue = useWatch({
    control: modalControl,
    name: 'customSurchargeValue',
  });

  const customDiscountValue = useWatch({
    control: modalControl,
    name: 'customDiscountValue',
  });
  const { fields, append, remove } = useFieldArray<FormData>({
    control,
    name: 'surcharges',
  });

  // Fetch surcharges once for both main form and modal
  const [surcharges, setSurcharges] = useState<
    { name: string; id: number; value: number }[]
  >([]);
  const { result, execute } = useApi<
    { name: string; id: number; value: number }[]
  >({
    path: 'narzut_list',
  });
  useEffect(() => {
    if (execute) execute();
  }, [execute]);
  useEffect(() => {
    if (result) setSurcharges(result);
  }, [result]);

  // Fetch manufacturer discounts
  const [manufacturerDiscounts, setManufacturerDiscounts] = useState<
    { id: number; producent: string; owner: number; value: number }[]
  >([]);
  const { result: discountsResult, execute: fetchDiscounts } = useApi<
    { id: number; producent: string; owner: number; value: number }[]
  >({
    path: 'rabat_list',
  });
  useEffect(() => {
    if (fetchDiscounts) fetchDiscounts();
  }, [fetchDiscounts]);
  useEffect(() => {
    if (discountsResult) setManufacturerDiscounts(discountsResult);
  }, [discountsResult]);

  const addSurcharge = useCallback(
    (index: number) => append({ name: `montaz_${index + 1}`, value: null }),
    [append],
  );

  const removeSurcharge = useCallback(
    (index: number) => remove(index),
    [remove],
  );

  // Function to get manufacturer discount for a device
  const getManufacturerDiscount = useCallback(
    (device: Device) => {
      const discount = manufacturerDiscounts.find(
        d => d.producent === device.producent,
      );
      return discount ? discount.value : null;
    },
    [manufacturerDiscounts],
  );

  const onSubmit = (data: FormData) => {
    const surchargesArr: number[] = [];
    data.surcharges.forEach(item => surchargesArr.push(Number(item.name)));

    // Prepare device surcharges with manufacturer discounts
    const deviceSurchargesWithManufacturerDiscounts = { ...deviceSurcharges };

    // Add manufacturer discounts for devices that don't have custom discounts
    selectedDevices.forEach(device => {
      if (!deviceSurchargesWithManufacturerDiscounts[device.id]) {
        deviceSurchargesWithManufacturerDiscounts[device.id] = {
          surcharges: [],
          discount: null,
        };
      }

      // If no custom discount is set, use manufacturer discount
      if (
        deviceSurchargesWithManufacturerDiscounts[device.id].discount ===
        undefined
      ) {
        const manufacturerDiscount = getManufacturerDiscount(device);
        if (manufacturerDiscount !== null) {
          deviceSurchargesWithManufacturerDiscounts[device.id].discount =
            manufacturerDiscount;
        }
      }
    });

    navigation.navigate('Overview', {
      type,
      installationId,
      devices,
      surcharges: surchargesArr,
      mode: 'add',
      offerName,
      deviceSurcharges: deviceSurchargesWithManufacturerDiscounts as any,
      allDevices: selectedDevices,
      surchargesList: surcharges,
      isTemplate,
    });
  };

  // Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [editSurcharge, setEditSurcharge] = useState<number | string | null>(
    null,
  );
  const [editDiscount, setEditDiscount] = useState<number | null>(null);
  const [modalSurchargeOpen, setModalSurchargeOpen] = useState(false);
  const [applySurchargeToAllDevices, setApplySurchargeToAllDevices] =
    useState(false);
  const [applyDiscountToAllDevices, setApplyDiscountToAllDevices] =
    useState(false);
  const [isCustomSurcharge, setIsCustomSurcharge] = useState(false);
  const [modalMode, setModalMode] = useState<'surcharge' | 'discount'>(
    'surcharge',
  );

  // Per-device surcharge/discount state
  const [deviceSurcharges, setDeviceSurcharges] = useState<{
    [deviceId: number]: {
      surcharges: Array<{
        id: string;
        surchargeId: number | null;
        customValue?: number;
      }>;
      discount: number | null;
    };
  }>({});

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <View style={styles.container}>
        <ButtonsHeader onBackPress={navigation.goBack} title="Oferta" />
        <ScrollView style={styles.scrollContainer}>
          {/* <Text>Dodane urządzenia do oferty:</Text>
          <Divider style={styles.divider} /> */}
          {selectedDevices.length > 0 ? (
            selectedDevices.map((tool, idx) => {
              const deviceSurchargesList =
                deviceSurcharges[tool.id]?.surcharges || [];
              const discountValue = deviceSurcharges[tool.id]?.discount;
              // Get manufacturer discount for this device
              const manufacturerDiscount = getManufacturerDiscount(tool);
              // Use device-specific discount if set, otherwise use manufacturer discount
              const finalDiscountValue =
                discountValue !== undefined
                  ? discountValue
                  : manufacturerDiscount;
              return (
                <View key={tool.id} style={styles.deviceView}>
                  {idx > 0 && <Divider style={styles.divider} />}
                  <Text style={styles.deviceName}>
                    {tool.producent} {tool.nazwa_modelu} (
                    {tool.nazwa_modelu_producenta})
                  </Text>
                  <Text style={styles.pricesDetail}>
                    Kolor:{' '}
                    {tool.kolor.charAt(0).toUpperCase() + tool.kolor.slice(1)},
                    Moc: {tool.moc_chlodnicza}
                    kW
                  </Text>

                  <View style={styles.pricesContainer}>
                    <View style={styles.priceInfoContainer}>
                      <Text style={styles.pricesDetail}>Rabat (%)</Text>
                      <Text style={styles.pricesDetailTeal}>
                        {typeof finalDiscountValue === 'number'
                          ? `${finalDiscountValue}%`
                          : '0%'}
                      </Text>
                    </View>
                    <View style={styles.priceInfoContainer}>
                      <Text style={styles.pricesDetail}>Cena urządzenia</Text>
                      <Text style={styles.pricesDetailTeal}>
                        {Number(tool.cena_katalogowa_netto).toFixed(2)} zł
                      </Text>
                    </View>
                    <View style={styles.priceInfoContainer}>
                      <Text style={styles.pricesDetail}>Narzuty</Text>
                      <View style={styles.surchargesList}>
                        {deviceSurchargesList.length > 0 ? (
                          deviceSurchargesList.map(
                            (surcharge, surchargeIdx) => {
                              const surchargeObj = surcharges.find(
                                s => s.id === surcharge.surchargeId,
                              );
                              return (
                                <View
                                  key={surcharge.id}
                                  style={styles.surchargeItem}
                                >
                                  <Text style={styles.pricesDetailTeal}>
                                    {surcharge.customValue !== undefined
                                      ? `${surcharge.customValue} zł`
                                      : surchargeObj &&
                                        surchargeObj.value !== null
                                        ? `${surchargeObj.value} zł`
                                        : ''}
                                  </Text>
                                  <IconButton
                                    onPress={() => {
                                      setDeviceSurcharges(prev => ({
                                        ...prev,
                                        [tool.id]: {
                                          ...prev[tool.id],
                                          surcharges:
                                            prev[tool.id]?.surcharges.filter(
                                              s => s.id !== surcharge.id,
                                            ) || [],
                                        },
                                      }));
                                    }}
                                    icon={
                                      <CloseIcon
                                        color={Colors.offersTeal}
                                        size={14}
                                      />
                                    }
                                    withoutBackground
                                    style={styles.closeSurchargeButton}
                                  />
                                </View>
                              );
                            },
                          )
                        ) : (
                          <Text style={styles.pricesDetailTeal}>
                            Brak narzutów
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.deviceActions}>
                      <IconButton
                        onPress={() => {
                          setEditDevice(tool);
                          setModalMode('discount');
                          // Reset modal state for editing discount only
                          setEditSurcharge(null);
                          setIsCustomSurcharge(false);
                          setModalValue('customSurchargeValue', '');
                          // Use device-specific discount if set, otherwise use manufacturer discount
                          const finalDiscount =
                            discountValue !== undefined
                              ? discountValue
                              : manufacturerDiscount;
                          setEditDiscount(finalDiscount);
                          setModalValue(
                            'customDiscountValue',
                            finalDiscount?.toString() || '',
                          );
                          setEditModalVisible(true);
                        }}
                        icon={<EditIcon color={Colors.teal} size={18} />}
                        withoutBackground
                      />
                      <IconButton
                        onPress={() => {
                          setEditDevice(tool);
                          setModalMode('surcharge');
                          // Reset modal state for adding new surcharge only
                          setEditSurcharge(null);
                          setIsCustomSurcharge(false);
                          setModalValue('customSurchargeValue', '');
                          // Don't set discount values for surcharge mode
                          setEditDiscount(null);
                          setModalValue('customDiscountValue', '');
                          setEditModalVisible(true);
                        }}
                        icon={<Text style={styles.addSurchargeButton}>+</Text>}
                        withoutBackground
                      />
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text>Brak urządzeń</Text>
          )}
        </ScrollView>

        {/* Modal do edycji narzutu i rabatu */}
        <Overlay
          isVisible={editModalVisible}
          onBackdropPress={() => setEditModalVisible(false)}
          overlayStyle={{
            width: '90%',
            maxWidth: 340,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
              {modalMode === 'surcharge' ? 'Dodaj narzut' : 'Edytuj rabat'}
            </Text>
            {editDevice && (
              <>
                <Text>Marka: {editDevice.producent}</Text>
                <Text>Model: {editDevice.nazwa_modelu_producenta}</Text>
                <Text>
                  Cena: {Number(editDevice.cena_katalogowa_netto).toFixed(2)} zł
                </Text>
              </>
            )}
            {modalMode === 'surcharge' && (
              <>
                <DropDownPicker
                  open={modalSurchargeOpen}
                  value={editSurcharge}
                  items={[
                    { label: 'Brak narzutu', value: null as any },
                    { label: 'Własna kwota', value: 'custom' },
                    ...surcharges.map(s => ({
                      label: `${s.name} - ${s.value} zł`,
                      value: s.id,
                    })),
                  ]}
                  setOpen={setModalSurchargeOpen}
                  setValue={setEditSurcharge}
                  setItems={() => { }}
                  placeholder="Wybierz narzut"
                  style={{ marginBottom: 12 }}
                  onChangeValue={value => {
                    setEditSurcharge(value as any);
                    setIsCustomSurcharge(value === 'custom');
                  }}
                  listMode="MODAL"
                  modalAnimationType="slide"
                />
                {isCustomSurcharge && (
                  <FormInput
                    name="customSurchargeValue"
                    control={modalControl}
                    label="Własna kwota narzutu (zł)"
                    placeholder="Wprowadź kwotę"
                    keyboardType="numeric"
                    style={{ marginBottom: 12 }}
                  />
                )}
              </>
            )}
            {modalMode === 'discount' && (
              <FormInput
                name="customDiscountValue"
                control={modalControl}
                label="Procent rabatu (%)"
                placeholder="Wprowadź procent rabatu"
                keyboardType="numeric"
                style={{ marginBottom: 12 }}
              />
            )}
            {/* Switch for applying surcharge to all devices - only in surcharge mode */}
            {modalMode === 'surcharge' && (
              <Switch
                value={applySurchargeToAllDevices}
                onValueChange={setApplySurchargeToAllDevices}
                color={Colors.teal}
                title="Dodaj ten narzut na wszystkie urządzenia"
              />
            )}

            {/* Switch for applying discount to all devices - only in discount mode */}
            {modalMode === 'discount' && (
              <Switch
                value={applyDiscountToAllDevices}
                onValueChange={setApplyDiscountToAllDevices}
                color={Colors.teal}
                title="Dodaj ten rabat na wszystkie urządzenia"
              />
            )}
            <SubmitButton
              title="Zapisz"
              style={[styles.continueButton, { marginTop: 20 }]}
              onPress={() => {
                // Determine the final surcharge value (only in surcharge mode)
                let finalSurcharge: number | null = null;
                if (modalMode === 'surcharge') {
                  if (editSurcharge === 'custom') {
                    // Use custom value if provided
                    const customValue = parseFloat(customSurchargeValue);
                    if (!Number.isNaN(customValue) && customValue > 0) {
                      finalSurcharge = customValue;
                    }
                  } else if (
                    editSurcharge !== null &&
                    editSurcharge !== 'custom'
                  ) {
                    // Use selected surcharge ID
                    finalSurcharge = editSurcharge as number;
                  }
                }

                // Determine the final discount value (only in discount mode)
                let finalDiscount: number | null = null;
                if (modalMode === 'discount') {
                  const customDiscount = parseFloat(customDiscountValue);
                  if (!Number.isNaN(customDiscount) && customDiscount >= 0) {
                    finalDiscount = customDiscount;
                  }
                }

                // Only create surcharge object if surcharge is actually set
                const hasSurcharge =
                  finalSurcharge !== null && finalSurcharge !== undefined;

                const newSurcharge = hasSurcharge
                  ? {
                    id: Date.now().toString(),
                    surchargeId:
                      editSurcharge === 'custom' ? null : finalSurcharge,
                    customValue:
                      editSurcharge === 'custom'
                        ? finalSurcharge || undefined
                        : undefined,
                  }
                  : null;

                if (
                  (modalMode === 'surcharge' &&
                    applySurchargeToAllDevices &&
                    hasSurcharge) ||
                  (modalMode === 'discount' && applyDiscountToAllDevices)
                ) {
                  // Apply to all devices
                  const updates: {
                    [deviceId: number]: {
                      surcharges: Array<{
                        id: string;
                        surchargeId: number | null;
                        customValue?: number;
                      }>;
                      discount: number | null;
                    };
                  } = {};
                  selectedDevices.forEach(device => {
                    const currentDeviceData = deviceSurcharges[device.id] || {
                      surcharges: [],
                      discount: null,
                    };

                    // Określ nowe narzuty
                    let newSurcharges = currentDeviceData.surcharges;
                    if (
                      modalMode === 'surcharge' &&
                      applySurchargeToAllDevices &&
                      hasSurcharge &&
                      newSurcharge
                    ) {
                      newSurcharges = [
                        ...currentDeviceData.surcharges,
                        newSurcharge,
                      ];
                    }

                    // Określ nowy rabat - zachowaj istniejący, jeśli nie edytujemy rabatu
                    let newDiscount;
                    if (modalMode === 'discount' && applyDiscountToAllDevices) {
                      newDiscount = finalDiscount;
                    } else if (deviceSurcharges[device.id]) {
                      // Jeśli urządzenie już ma dane, zachowaj istniejący rabat
                      newDiscount = deviceSurcharges[device.id].discount;
                    } else {
                      // Jeśli urządzenie nie ma danych, zachowaj rabat producenta
                      const manufacturerDiscount =
                        getManufacturerDiscount(device);
                      newDiscount = manufacturerDiscount;
                    }

                    updates[device.id] = {
                      surcharges: newSurcharges,
                      discount: newDiscount,
                    };
                  });
                  setDeviceSurcharges(prev => ({ ...prev, ...updates }));
                } else if (editDevice) {
                  setDeviceSurcharges(prev => ({
                    ...prev,
                    [editDevice.id]: {
                      surcharges:
                        modalMode === 'surcharge' &&
                          hasSurcharge &&
                          newSurcharge
                          ? [
                            ...(prev[editDevice.id]?.surcharges || []),
                            newSurcharge,
                          ]
                          : prev[editDevice.id]?.surcharges || [],
                      discount:
                        modalMode === 'discount'
                          ? finalDiscount
                          : prev[editDevice.id]?.discount,
                    },
                  }));
                }
                setEditModalVisible(false);
                setApplySurchargeToAllDevices(false);
                setApplyDiscountToAllDevices(false);
                setIsCustomSurcharge(false);
                setModalValue('customSurchargeValue', '');
                setModalValue('customDiscountValue', '');
              }}
            />
          </View>
        </Overlay>
        <View style={styles.footer}>
          <SubmitButton
            title="Dalej"
            style={styles.continueButton}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

export default AddSurchargeForm;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingTop: 0,
  },
  divider: {
    marginTop: 6,
    marginBottom: 16,
    height: 2,
    backgroundColor: Colors.gray,
  },
  footer: {
    paddingHorizontal: 16,
    marginVertical: 30,
  },
  continueButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.teal,
    padding: 0,
  },

  surchargeContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  surchargeButtons: {
    width: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  surchargeAddButton: {
    flex: 1,
    height: 35,
    borderRadius: 4,
    backgroundColor: Colors.teal,
  },
  surchargeAddButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  deviceView: {
    marginBottom: 8,
  },
  priceInfoContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  pricesContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 35,
  },
  deviceName: {
    fontSize: 14,
  },
  pricesDetail: {
    fontSize: 10,
  },
  pricesDetailTeal: {
    fontSize: 11,
    color: Colors.teal,
  },
  surchargesList: {
    flexDirection: 'column',
  },
  surchargeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addSurchargeButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.teal,
  },
  closeSurchargeButton: {
    padding: 0,
    backgroundColor: Colors.transparent,
    margin: 0,
    width: 16,
    height: 16,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
