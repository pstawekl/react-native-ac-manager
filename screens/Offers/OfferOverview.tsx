import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Divider, Input, Overlay, Text } from '@rneui/themed';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';

import { IconButton, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import DownloadIcon from '../../components/icons/DownloadIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useAuth from '../../providers/AuthProvider';
import useOffers, { Device } from '../../providers/OffersProvider';

// Typy dla odpowiedzi API
type SzablonDataResponse = {
  devices_split?: Device[];
  devices_multisplit?: Device[];
  narzuty?: any[];
  [key: string]: any;
};

type OfertaDataResponse = {
  devices_split?: Device[];
  devices_multi_split?: Device[];
  narzut?: any[];
  client_id?: number | null;
  client_has_account?: boolean;
  is_current_user_client?: boolean;
  [key: string]: any;
};

const Tool = memo(function Tool(props: {
  tool: Device;
  index: number;
  discountsList?: {
    id: number;
    producent: string;
    owner: number;
    value: number;
  }[];
}) {
  const { tool, index, discountsList } = props;

  // Znajdź rabat dla producenta tego urządzenia - memoizuj wynik
  const discountValue = useMemo(
    () =>
      discountsList?.find(item => item.producent === tool.producent)?.value ??
      null,
    [discountsList, tool.producent],
  );

  return (
    <View>
      <Text>Urządzenie {index + 1}</Text>
      <Divider style={styles.divider} />
      <View style={styles.toolContainer}>
        <View>
          <Text style={styles.text}>Model i typ urządzenia</Text>
          <Text>
            {tool.nazwa_modelu_producenta} ({tool.typ ?? tool.rodzaj})
          </Text>
          <Text style={styles.description}>
            Kolor: {tool.kolor ?? ''}, Moc:{' '}
            {`${tool.moc_chlodnicza}/${tool.moc_grzewcza} kW`}
          </Text>
          <View style={styles.toolInnerContainer}>
            <View>
              <Text style={styles.text}>Rabat (%)</Text>
              <Text style={styles.price}>{discountValue ?? 'Nie dotyczy'}</Text>
            </View>
            <View>
              <Text style={styles.text}>Cena urządzenia</Text>
              <Text style={styles.price}>{tool.cena_katalogowa_netto}</Text>
            </View>
          </View>
        </View>
        <View>
          <Text style={[styles.text, styles.textRight]}>Cena</Text>
          <Text style={styles.totalPrice}>4000</Text>
        </View>
      </View>
    </View>
  );
});

const Tools = memo(function Tools(props: {
  tools: Device[];
  discountsList?: {
    id: number;
    producent: string;
    owner: number;
    value: number;
  }[];
}) {
  const { tools, discountsList } = props;

  return (
    <View>
      {tools.map((tool: Device, index: number) => {
        return (
          <Tool
            key={tool.id}
            tool={tool}
            index={index}
            discountsList={discountsList}
          />
        );
      })}
    </View>
  );
});

const Surcharges = memo(function Surcharges(props: {
  surcharges: { name: string; value: number }[];
}) {
  const { surcharges } = props;

  return (
    <View>
      <Text>Narzuty</Text>
      <Divider style={styles.divider} />
      <View style={styles.surchargeRow}>
        <Text style={styles.nameRow}>Nazwa narzutu</Text>
        <Text style={styles.priceRow}>Cena netto</Text>
      </View>
      {surcharges.map((surcharge, index) => (
        <View key={surcharge.name} style={styles.surchargeRow}>
          <Text style={[styles.nameRow, styles.row]}>{surcharge.name}</Text>
          <Text style={[styles.priceRow, styles.row]}>{surcharge.value}</Text>
        </View>
      ))}
    </View>
  );
});

function OfferOverview({
  route,
}: {
  route: {
    params: {
      type: string;
      installationId: number;
      devices: number[];
      surcharges: number[];
      mode: string;
      offerId?: number;
      isTemplate?: string | boolean;
      offerName?: string;
      fromClient?: boolean;
      fromInstallation?: boolean;
      clientId?: number;
      deviceSurcharges?: {
        [deviceId: number]: {
          surcharges: Array<{
            id: string;
            surchargeId: number | null;
            customValue?: number;
          }>;
          discount: number | null;
        };
      };
      allDevices?: Device[];
      surchargesList?: {
        name: string;
        id: number;
        value: number | null;
      }[];
    };
  };
}) {
  const { isUserClient } = useAuth();
  const [templateName, setTemplateName] = useState('');
  const [templateOverlayVisible, setTemplateOverlayVisible] = useState(false);
  const openTemplateOverlay = () => setTemplateOverlayVisible(true);
  const closeTemplateOverlay = () => setTemplateOverlayVisible(false);
  const handleTemplateSave = (data: { template_name: string | null }) => {
    onAddTemplate(data);
    closeTemplateOverlay();
  };
  const {
    type,
    installationId,
    devices,
    surcharges,
    mode,
    offerId,
    isTemplate = false,
    offerName,
    fromClient = false,
    fromInstallation = false,
    clientId,
    deviceSurcharges,
    allDevices,
    surchargesList,
  } = route.params;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ template_name: string | null }>();
  const [tools, setTools] = useState<Device[]>();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [clientHasAccount, setClientHasAccount] = useState<boolean>(false);
  const [isCurrentUserClient, setIsCurrentUserClient] =
    useState<boolean>(false);
  const [montazStatus, setMontazStatus] = useState<string>('none');

  const [surchargesState, setSurchargesState] = useState<
    {
      name: string;
      value: number | null;
      id?: number;
    }[]
  >();

  const { execute: createOffer } = useApi({
    path: 'oferta_create',
  });
  const { execute: acceptOffer } = useApi({
    path: 'oferta_accept',
  });
  const { execute: addTemplate } = useApi({
    path: 'szablon_create',
  });
  const { execute: getSzablonData } = useApi<SzablonDataResponse>({
    path: 'szablon_data',
  });
  const { execute: getOfertaData } = useApi<OfertaDataResponse>({
    path: 'oferta_data',
  });
  const { execute: sendOfferEmail } = useApi({
    path: 'oferta_send_email',
  });
  const { getOffers } = useOffers();

  // Funkcja do ładowania danych szablonu/oferty
  const loadData = useCallback(async () => {
    if (offerId) {
      try {
        if (isTemplate) {
          // Ładuj dane szablonu
          const response = await getSzablonData({
            data: { szablon_id: offerId },
          });
          if (response) {
            // Ustaw urządzenia z szablonu
            if (response.devices_split && response.devices_split.length > 0) {
              setTools(response.devices_split);
            } else if (
              response.devices_multisplit &&
              response.devices_multisplit.length > 0
            ) {
              setTools(response.devices_multisplit);
            }
          }
        } else {
          // Ładuj dane oferty
          const response = await getOfertaData({
            data: { oferta_id: offerId },
          });
          if (response) {
            // Ustaw urządzenia z oferty
            if (response.devices_split && response.devices_split.length > 0) {
              setTools(response.devices_split);
            } else if (
              response.devices_multi_split &&
              response.devices_multi_split.length > 0
            ) {
              setTools(response.devices_multi_split);
            }
            // Ustaw wybrane urządzenie jeśli oferta jest zaakceptowana
            if (response.selected_device_id) {
              setSelectedDeviceId(response.selected_device_id);
            }
            // Ustaw status akceptacji oferty
            if (response.is_accepted) {
              setIsAccepted(response.is_accepted);
            }
            // Ustaw informacje o kliencie
            if (response.client_has_account !== undefined) {
              setClientHasAccount(response.client_has_account);
            }
            if (response.is_current_user_client !== undefined) {
              setIsCurrentUserClient(response.is_current_user_client);
            }
            // Ustaw status montażu
            if (response.montaz_status) {
              setMontazStatus(response.montaz_status);
            }
          }
        }
      } catch (error) {
        Alert.alert(
          'Błąd',
          (error as Error).message || 'Nie udało się załadować danych',
        );
      }
    } else if (allDevices && allDevices.length > 0) {
      // Gdy nie ma offerId, ale mamy allDevices (np. z szablonu)
      setTools(allDevices);
    }
  }, [offerId, isTemplate, getSzablonData, getOfertaData, allDevices]);

  // Ładowanie danych szablonu/oferty po wejściu do OfferOverview
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Odśwież dane gdy ekran staje się aktywny (np. po powrocie z SelectMontazDate)
  useFocusEffect(
    useCallback(() => {
      if (offerId && !isTemplate) {
        loadData();
      }
    }, [offerId, isTemplate, loadData]),
  );

  const onSubmit = useCallback(async () => {
    const requestData = route.params.isTemplate
      ? {
        // Dla szablonów używamy pól z modelu Szablon
        nazwa: offerName,
        typ: type === 'split' ? 'split' : 'multisplit',
        devices_split: type === 'split' ? devices : [],
        devices_multisplit: type === 'multi_split' ? devices : [],
        narzuty: surcharges ?? [],
      }
      : {
        // Dla ofert używamy pól z modelu Oferta
        instalacja: installationId,
        is_accepted: false,
        is_template: false,
        offer_type: type === 'split' ? 'split' : 'multi_split',
        devices_split: type === 'split' ? devices : [],
        devices_multi_split: type === 'multi_split' ? devices : [],
        narzut: surcharges ?? [],
        nazwa_oferty: offerName,
      };

    const response = route.params.isTemplate
      ? await addTemplate({
        method: 'POST',
        data: requestData,
      })
      : await createOffer({
        method: 'POST',
        data: requestData,
      });

    if (getOffers && !route.params.isTemplate) {
      getOffers();
    }

    Alert.alert(
      'Sukces',
      route.params.isTemplate ? 'Utworzono szablon' : 'Utworzono ofertę',
      [
        {
          text: 'OK',
          onPress: handleGoBack,
        },
      ],
    );
  }, [
    route.params.isTemplate,
    offerName,
    type,
    devices,
    surcharges,
    installationId,
    addTemplate,
    createOffer,
    getOffers,
    handleGoBack,
  ]);

  const onAddTemplate = useCallback(
    async (data: { template_name: string | null }) => {
      if (!data.template_name) {
        Alert.alert('Błąd', 'Nazwa szablonu jest wymagana.');
        return;
      }

      if (!type) {
        Alert.alert('Błąd', 'Typ oferty jest wymagany.');
        return;
      }

      const requestData = {
        nazwa: data.template_name,
        narzuty: surcharges ?? [],
        devices_split: type === 'split' ? devices : [],
        devices_multi_split: type === 'multi_split' ? devices : [],
        typ: type === 'split' ? 'split' : 'multisplit',
      };

      try {
        const response = await addTemplate({
          method: 'POST',
          data: requestData,
        });

        if (response) {
          Alert.alert(`Utworzono szablon: ${data.template_name}`);
        } else {
          Alert.alert('Nie udało się utworzyć szablonu');
        }
      } catch (error) {
        Alert.alert('Wystąpił błąd podczas dodawania szablonu.');
      }
    },
    [type, surcharges, devices, addTemplate],
  );

  const onAccept = useCallback(async () => {
    if (!selectedDeviceId) {
      Alert.alert('Błąd', 'Proszę wybrać urządzenie z oferty');
      return;
    }

    const requestData = {
      oferta_id: Number(offerId),
      is_accepted: true,
      selected_device_id: Number(selectedDeviceId),
    };

    try {
      const response = await acceptOffer({ data: requestData });

      if (response) {
        if (getOffers) {
          getOffers();
        }

        // Jeśli użytkownik to klient, przekieruj do wyboru terminu
        if (isCurrentUserClient) {
          Alert.alert(
            'Sukces',
            'Oferta została zaakceptowana. Teraz możesz wybrać termin montażu.',
            [
              {
                text: 'Wybierz termin',
                onPress: () => {
                  (navigation as any).navigate('SelectMontazDate', {
                    ofertaId: Number(offerId),
                  });
                },
              },
              {
                text: 'Później',
                onPress: handleGoBack,
                style: 'cancel',
              },
            ],
          );
        } else {
          Alert.alert('Sukces', 'Oferta została zaakceptowana', [
            {
              text: 'OK',
              onPress: handleGoBack,
            },
          ]);
        }
      } else {
        Alert.alert('Błąd', 'Nie udało się zaakceptować oferty');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas akceptacji oferty');
    }
  }, [
    selectedDeviceId,
    offerId,
    acceptOffer,
    getOffers,
    isCurrentUserClient,
    handleGoBack,
    navigation,
  ]);

  const {
    devicesSplit,
    devicesMultisplit,
    getDevicesSplit,
    getDevicesMultisplit,
  } = useOffers();
  const { result: surchargesResponse, execute: getSurcharges } = useApi<
    {
      name: string;
      value: number;
      id: number;
    }[]
  >({
    path: 'narzut_list',
  });

  // Optymalizacja: pobierz rabaty raz dla wszystkich urządzeń
  const { result: discountsList, execute: getDiscounts } = useApi<
    { id: number; producent: string; owner: number; value: number }[]
  >({
    path: 'rabat_list',
  });

  useEffect(() => {
    const devicesRequestData = {
      devices_id: devices,
    };
    const surchargesRequestData = {
      narzuty_id: surcharges,
    };

    if (getDevicesSplit && type === 'split') {
      getDevicesSplit(devicesRequestData);
    }
    if (getDevicesMultisplit && type === 'multi_split') {
      getDevicesMultisplit(devicesRequestData);
    }

    // Tylko admin/monter pobiera narzuty i rabaty
    if (!isUserClient()) {
      if (getSurcharges) {
        getSurcharges(surchargesRequestData);
      }
      // Pobierz rabaty raz dla wszystkich urządzeń
      if (getDiscounts) {
        getDiscounts();
      }
    }
  }, [
    getDevicesSplit,
    getDevicesMultisplit,
    getSurcharges,
    getDiscounts,
    isUserClient,
    type,
    devices,
    surcharges,
  ]);

  // Ładowanie narzutów
  useEffect(() => {
    if (surchargesResponse) {
      const filteredSurcharges = surchargesResponse.filter(surcharge =>
        surcharges.includes(surcharge.id),
      );
      setSurchargesState(filteredSurcharges);
    } else if (surchargesList && surchargesList.length > 0) {
      // Gdy nie ma surchargesResponse, ale mamy surchargesList (np. z szablonu)
      setSurchargesState(surchargesList);
    }
  }, [surchargesResponse, surcharges, surchargesList]);

  const navigation = useNavigation();

  // Funkcja nawigacji wstecz zależna od kontekstu - MUSI BYĆ PRZED onSubmit
  const handleGoBack = useCallback(() => {
    console.log('=== HANDLE GO BACK ===');
    console.log('fromInstallation:', fromInstallation);
    console.log('fromClient:', fromClient);
    console.log('installationId:', installationId);
    console.log('clientId:', clientId);

    if (fromInstallation && installationId && clientId) {
      // Jeśli przyszliśmy z modułu instalacji, wracamy do zakładki Oferty tej instalacji
      console.log('Navigating to Installation Settings');
      (navigation as any).navigate('Clients', {
        screen: 'Settings',
        params: {
          installationId: installationId.toString(),
          clientId: clientId.toString(),
          activeTab: 'oferty',
        },
      });
    } else if (fromClient && clientId) {
      // Jeśli przyszliśmy z modułu klientów, wracamy do zakładki Oferty tego klienta
      console.log('Navigating to Client Menu');
      (navigation as any).navigate('Clients', {
        screen: 'Menu',
        params: { clientId, activeTab: 'oferty' },
      });
    } else {
      // Standardowy powrót (do menu ofert w module Ofert)
      console.log('Navigating back (standard)');
      // Wracamy do Menu (gdzie są taby Oferty/Szablony)
      (navigation as any).navigate('Menu');
    }
  }, [fromInstallation, fromClient, installationId, clientId, navigation]);

  // Wysyłanie oferty emailem
  const handleSendEmail = useCallback(async () => {
    if (!offerId) {
      Alert.alert('Błąd', 'Brak ID oferty');
      return;
    }

    try {
      const response = await sendOfferEmail({
        data: { oferta_id: Number(offerId) },
      });

      if (response?.success) {
        Alert.alert('Sukces', 'Oferta została wysłana na email klienta');
      } else {
        Alert.alert('Błąd', response?.error || 'Nie udało się wysłać emaila');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas wysyłania emaila');
    }
  }, [offerId, sendOfferEmail]);

  // Memoizuj funkcję obliczania ceny
  const getDevicePrice = useCallback(
    (cenaKatalogowa: number, prcRabat?: number, narzut?: number) => {
      let price = cenaKatalogowa;
      if (prcRabat) price -= price * (prcRabat / 100);
      if (narzut) price += narzut;

      return price.toFixed(2);
    },
    [],
  );

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <View style={styles.container}>
        <ButtonsHeader onBackPress={handleGoBack} title="Oferta" />

        <View style={styles.header}>
          {/* Przycisk wysyłania emaila - widoczny tylko dla montera/admina i tylko dla ofert (nie szablonów) */}
          {offerId && !isTemplate && !isUserClient() && (
            <IconButton
              withoutBackground
              onPress={handleSendEmail}
              icon={<DownloadIcon color={Colors.black} size={24} />}
            />
          )}
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* <View style={{ marginVertical: 16 }}>
            <SubmitButton
              style={styles.submitButton}
              title="Dodaj szablon"
              onPress={openTemplateOverlay}
            />
          </View> */}
          <Overlay
            isVisible={templateOverlayVisible}
            onBackdropPress={closeTemplateOverlay}
            overlayStyle={{
              width: '90%',
              maxWidth: 340,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <View>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Nowy szablon
              </Text>
              <Input
                value={templateName}
                onChangeText={setTemplateName}
                placeholder="Wpisz nazwę szablonu"
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginTop: 16,
                }}
              >
                <SubmitButton
                  title="Zapisz"
                  style={{ marginRight: 8 }}
                  onPress={() => {
                    if (!templateName || templateName.trim() === '') {
                      Alert.alert('Podaj nazwę szablonu');
                      return;
                    }
                    onAddTemplate({ template_name: templateName });
                    setTemplateName('');
                    closeTemplateOverlay();
                  }}
                />
                <SubmitButton
                  title="Anuluj"
                  onPress={() => {
                    setTemplateName('');
                    closeTemplateOverlay();
                  }}
                />
              </View>
            </View>
          </Overlay>
          {tools && tools.length > 0 ? (
            <View style={styles.devicesTable}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                {offerId && (!clientHasAccount || isCurrentUserClient) && (
                  <Text style={[styles.headerCell, styles.radioColumn]}>
                    Wybór
                  </Text>
                )}
                {offerId && clientHasAccount && !isCurrentUserClient && (
                  <View style={styles.radioColumn} />
                )}
                <Text style={[styles.headerCell, styles.deviceColumn]}>
                  Urządzenia - moc chłodnicza
                </Text>
                <Text style={[styles.headerCell, styles.priceColumn]}>
                  Cena z montażem
                </Text>
              </View>

              {(() => {
                // Group devices by manufacturer
                const filteredDevices = tools || [];
                const groupedByManufacturer: { [key: string]: Device[] } = {};

                filteredDevices.forEach(device => {
                  if (!groupedByManufacturer[device.producent]) {
                    groupedByManufacturer[device.producent] = [];
                  }
                  groupedByManufacturer[device.producent].push(device);
                });

                return Object.entries(groupedByManufacturer).map(
                  ([manufacturer, manufacturerDevices]) => (
                    <View key={manufacturer} style={styles.manufacturerGroup}>
                      {/* Manufacturer Header */}
                      <View style={styles.manufacturerHeader}>
                        <Text style={styles.manufacturerName}>
                          {manufacturer}
                        </Text>
                      </View>

                      {/* Device Rows */}
                      {manufacturerDevices.map((tool: Device) => {
                        const deviceSurchargesList =
                          deviceSurcharges?.[tool.id]?.surcharges || [];
                        const discountValue =
                          deviceSurcharges?.[tool.id]?.discount;

                        // Calculate total surcharge value
                        const totalSurchargeValue = deviceSurchargesList.reduce(
                          (total, surcharge) => {
                            if (surcharge.customValue !== undefined) {
                              return total + surcharge.customValue;
                            }
                            if (surcharge.surchargeId) {
                              const surchargeObj = surchargesList?.find(
                                s => s.id === surcharge.surchargeId,
                              );
                              return total + (surchargeObj?.value ?? 0);
                            }
                            return total;
                          },
                          0,
                        );

                        const catalogPrice = Number(tool.cena_katalogowa_netto);
                        const finalPrice = getDevicePrice(
                          catalogPrice,
                          discountValue ?? undefined,
                          totalSurchargeValue || 0,
                        );

                        // Sprawdź czy można wybierać urządzenie
                        // Można wybierać tylko jeśli: klient nie ma konta LUB użytkownik jest klientem
                        const canSelectDevice =
                          !clientHasAccount || isCurrentUserClient;

                        return (
                          <View key={tool.id} style={styles.tableRow}>
                            {offerId && canSelectDevice && (
                              <View style={styles.radioColumn}>
                                <Text
                                  style={{
                                    fontSize: 24,
                                    color:
                                      selectedDeviceId === tool.id
                                        ? '#007AFF'
                                        : '#C7C7CC',
                                  }}
                                  onPress={() =>
                                    !isAccepted && setSelectedDeviceId(tool.id)
                                  }
                                >
                                  {selectedDeviceId === tool.id ? '●' : '○'}
                                </Text>
                              </View>
                            )}
                            {offerId && !canSelectDevice && (
                              <View style={styles.radioColumn} />
                            )}
                            <Text style={[styles.cell, styles.deviceColumn]}>
                              {tool.nazwa_modelu} {tool.nazwa_modelu_producenta}{' '}
                              – {tool.moc_chlodnicza} kW
                            </Text>
                            <Text
                              style={[
                                styles.cell,
                                styles.priceColumn,
                                styles.rightAlign,
                              ]}
                            >
                              {finalPrice
                                .replace('.', ',')
                                .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ')}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ),
                );
              })()}
            </View>
          ) : (
            <Text>Brak urządzeń</Text>
          )}
          {/* Komunikat informacyjny gdy klient ma konto i użytkownik nie jest klientem */}
          {offerId && clientHasAccount && !isCurrentUserClient && (
            <Text style={styles.infoMessage}>
              Użytkownik ma konto w aplikacji i tylko on może zaakceptować tę
              ofertę
            </Text>
          )}
          {/* {surchargesState && surchargesState?.length !== 0 && (
            <Surcharges surcharges={surchargesState} />
          )} */}
        </ScrollView>
        <View style={styles.footer}>
          {mode === 'add' && (
            <SubmitButton
              title={
                route.params.isTemplate
                  ? 'Zapisz szablon'
                  : installationId
                    ? 'Wyślij'
                    : 'Zapisz'
              }
              style={styles.submitButton}
              onPress={onSubmit}
            />
          )}
          {(mode === 'accept' || (mode === 'view' && isAccepted)) && (
            <View style={styles.customButtonsWrapper}>
              {(!clientHasAccount || isCurrentUserClient) && (
                <>
                  {isAccepted && isCurrentUserClient ? (
                    <>
                      {(montazStatus === 'none' ||
                        montazStatus === 'rejected') && (
                          <SubmitButton
                            style={styles.submitButton}
                            title="Wybierz termin montażu"
                            onPress={() => {
                              (navigation as any).navigate('SelectMontazDate', {
                                ofertaId: Number(offerId),
                              });
                            }}
                          />
                        )}
                      {montazStatus === 'pending' && (
                        <Text style={styles.statusMessage}>
                          ⏳ Oczekuje na potwierdzenie montera
                        </Text>
                      )}
                      {montazStatus === 'confirmed' && (
                        <Text style={styles.statusMessageSuccess}>
                          ✅ Termin montażu został potwierdzony
                        </Text>
                      )}
                      {montazStatus === 'rejected' && (
                        <Text style={styles.statusMessageError}>
                          ❌ Termin został odrzucony. Wybierz inny termin.
                        </Text>
                      )}
                    </>
                  ) : (
                    <SubmitButton
                      style={styles.submitButton}
                      title="Akceptuj ofertę"
                      onPress={onAccept}
                      disabled={!selectedDeviceId}
                    />
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 40,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
  },
  header: {
    position: 'absolute',
    top: 0,
    right: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  submitButton: {
    width: '100%',
    height: 34,
    borderRadius: 4,
    backgroundColor: Colors.teal,
    padding: 0,
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  text: {
    marginBottom: 8,
    fontSize: 10,
  },
  textRight: {
    textAlign: 'right',
  },
  description: {
    marginBottom: 10,
    fontSize: 10,
    color: Colors.grayerText,
  },
  price: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Colors.teal,
  },
  totalPrice: {
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.teal,
  },
  divider: {
    marginTop: 6,
    marginBottom: 12,
    height: 1,
    backgroundColor: Colors.black,
  },
  surchargeRow: {
    marginBottom: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameRow: {
    width: '55%',
  },
  priceRow: {
    width: '40%',
  },
  row: {
    borderWidth: 1,
    borderColor: Colors.black,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 6,
  },
  toolContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  toolInnerContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 30,
  },
  customButtonsWrapper: {
    gap: 4,
  },
  // Table styles
  devicesTable: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.offersTeal,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  headerCell: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  radioColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  deviceColumn: {
    flex: 3,
  },
  priceColumn: {
    flex: 1.5,
    textAlign: 'right',
  },
  manufacturerGroup: {
    marginBottom: 8,
  },
  manufacturerHeader: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  manufacturerName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  cell: {
    fontSize: 12,
    color: 'black',
  },
  rightAlign: {
    textAlign: 'right',
  },
  infoMessage: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.grayerText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusMessage: {
    fontSize: 16,
    color: Colors.grayerText,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    marginBottom: 16,
  },
  statusMessageSuccess: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  statusMessageError: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
    fontWeight: 'bold',
  },
});

export default OfferOverview;
