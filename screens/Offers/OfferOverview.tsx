import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Divider, Input, Overlay, Text } from '@rneui/themed';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';

import { IconButton, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import DownloadIcon from '../../components/icons/DownloadIcon';
import Colors from '../../consts/Colors';
import { getClientDisplayPrimary } from '../../helpers/clientDisplay';
import useApi from '../../hooks/useApi';
import useAuth from '../../providers/AuthProvider';
import useClients from '../../providers/ClientsProvider';
import { useOfferSettings } from '../../providers/OfferSettingsProvider';
import useOffers, { Device } from '../../providers/OffersProvider';

// Typy dla odpowiedzi API
type SzablonDataResponse = {
  devices_split?: Device[];
  devices_multisplit?: Device[];
  narzuty?: any[];
  [key: string]: any;
};

type MultisplitKompletFromApi = {
  id?: number;
  kolejnosc?: number;
  producent?: string;
  internal?: Device[];
  aggregate?: Device[];
};

type OfertaDataResponse = {
  devices_split?: Device[];
  devices_multi_split?: Device[];
  narzut?: any[];
  multisplit_komplety?: MultisplitKompletFromApi[];
  selected_komplet?: number | null;
  client_id?: number | null;
  client_has_account?: boolean;
  is_current_user_client?: boolean;
  fgaz_certificate_number?: string;
  company_logo_url?: string | null;
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
        unit?: string | null;
      }[];
      multisplit_komplety?: Array<{
        producent: string;
        internal_ids: number[];
        aggregate_ids: number[];
      }>;
    };
  };
}) {
  const { isUserClient } = useAuth();
  const { settings: offerSettings } = useOfferSettings();
  const reservationSystemEnabled =
    offerSettings?.reservationSystemEnabled ?? true;
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
    multisplit_komplety: multisplitKompletyFromParams,
  } = route.params;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ template_name: string | null }>();
  const [tools, setTools] = useState<Device[]>();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedKompletId, setSelectedKompletId] = useState<number | null>(
    null,
  );
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [clientHasAccount, setClientHasAccount] = useState<boolean>(false);
  const [isCurrentUserClient, setIsCurrentUserClient] =
    useState<boolean>(false);
  const [montazStatus, setMontazStatus] = useState<string>('none');
  const [fgazNumber, setFgazNumber] = useState<string | undefined>();
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | undefined>();

  const [surchargesState, setSurchargesState] = useState<
    {
      name: string;
      value: number | null;
      id?: number;
    }[]
  >();
  const [overviewDataLoading, setOverviewDataLoading] = useState(false);
  const [multisplitKompletyFromApi, setMultisplitKompletyFromApi] = useState<
    Array<{ producent?: string; internal?: Device[]; aggregate?: Device[] }>
  >([]);
  const [templateOfferName, setTemplateOfferName] = useState('');
  const [isTemplateEditMode, setIsTemplateEditMode] = useState(false);
  const [templateRabatIds, setTemplateRabatIds] = useState<number[]>([]);

  const { execute: createOffer } = useApi({
    path: 'oferta_create',
  });
  const { execute: acceptOffer } = useApi({
    path: 'oferta_accept',
  });
  const { execute: getOfertaData } = useApi<OfertaDataResponse>({
    path: 'oferta_data',
  });
  const { execute: sendOfferEmail } = useApi({
    path: 'oferta_send_email',
  });
  const { execute: updateTemplate, loading: updateTemplateLoading } = useApi({
    path: `oferta_template_update/${offerId ?? 0}`,
  });
  const { getOffers } = useOffers();
  const navigation = useNavigation();
  const { clients } = useClients();

  const headerTitle = useMemo(() => {
    if (isTemplate) return templateOfferName || 'Szablon';
    if (fromInstallation && installationId && clientId && clients?.length) {
      const client = clients.find(c => c.id === Number(clientId));
      if (client) {
        return `Oferta – Instalacja ${installationId} – ${getClientDisplayPrimary(client)}`;
      }
    }
    return 'Oferta';
  }, [
    isTemplate,
    templateOfferName,
    fromInstallation,
    installationId,
    clientId,
    clients,
  ]);

  const handleGoBack = useCallback(() => {
    if (fromInstallation && installationId && clientId) {
      (navigation as any).navigate('Clients', {
        screen: 'Settings',
        params: {
          installationId: installationId.toString(),
          clientId: clientId.toString(),
          activeTab: 'oferty',
        },
      });
    } else if (fromClient && clientId) {
      (navigation as any).navigate('Clients', {
        screen: 'Menu',
        params: { clientId, activeTab: 'oferty' },
      });
    } else {
      (navigation as any).navigate('Menu');
    }
  }, [fromInstallation, fromClient, installationId, clientId, navigation]);

  // Funkcja do ładowania danych szablonu/oferty (gdy wchodzimy z listy – offerId; szablony = Oferta is_template)
  const loadData = useCallback(async () => {
    if (offerId) {
      setOverviewDataLoading(true);
      try {
        if (isTemplate) {
          const response = await getOfertaData({
            data: { oferta_id: offerId },
          });
          if (response) {
            setTemplateOfferName((response as any).nazwa_oferty ?? '');
            setTemplateRabatIds(
              (response as any).rabat?.map((r: { id: number }) => r.id) ?? [],
            );
            if (response.devices_split && response.devices_split.length > 0) {
              setTools(response.devices_split);
            } else if (
              response.devices_multi_split &&
              response.devices_multi_split.length > 0
            ) {
              setTools(response.devices_multi_split);
            } else {
              setTools([]);
            }
            const narzutList = response.narzut ?? (response as any).narzuty ?? [];
            setSurchargesState(
              narzutList.length > 0
                ? narzutList.map((n: any) => ({
                    name: n.name ?? '',
                    value: n.value ?? null,
                    id: n.id,
                  }))
                : [],
            );
            if (
              response.multisplit_komplety &&
              response.multisplit_komplety.length > 0
            ) {
              setMultisplitKompletyFromApi(response.multisplit_komplety);
            } else {
              setMultisplitKompletyFromApi([]);
            }
          }
        } else {
          const response = await getOfertaData({
            data: { oferta_id: offerId },
          });
          if (response) {
            if (response.devices_split && response.devices_split.length > 0) {
              setTools(response.devices_split);
            } else if (
              response.devices_multi_split &&
              response.devices_multi_split.length > 0
            ) {
              setTools(response.devices_multi_split);
            }
            if (response.narzut && response.narzut.length > 0) {
              setSurchargesState(
                response.narzut.map((n: any) => ({
                  name: n.name ?? '',
                  value: n.value ?? null,
                  id: n.id,
                })),
              );
            }
            if (response.selected_device_id) {
              setSelectedDeviceId(response.selected_device_id);
            }
            setSelectedKompletId(response.selected_komplet ?? null);
            if (response.is_accepted) {
              setIsAccepted(response.is_accepted);
            }
            if (response.client_has_account !== undefined) {
              setClientHasAccount(response.client_has_account);
            }
            if (response.is_current_user_client !== undefined) {
              setIsCurrentUserClient(response.is_current_user_client);
            }
            if (response.montaz_status) {
              setMontazStatus(response.montaz_status);
            }
            if (response.fgaz_certificate_number) {
              setFgazNumber(response.fgaz_certificate_number as string);
            }
            if (response.company_logo_url) {
              setCompanyLogoUrl(response.company_logo_url as string);
            }
            if (
              response.multisplit_komplety &&
              response.multisplit_komplety.length > 0
            ) {
              setMultisplitKompletyFromApi(response.multisplit_komplety);
            } else {
              setMultisplitKompletyFromApi([]);
            }
          }
        }
      } catch (error) {
        Alert.alert(
          'Błąd',
          (error as Error).message || 'Nie udało się załadować danych',
        );
      } finally {
        setOverviewDataLoading(false);
      }
    } else if (allDevices && allDevices.length > 0) {
      setTools(allDevices);
    }
  }, [offerId, isTemplate, getOfertaData, allDevices]);

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
    const savingAsTemplate =
      route.params.isTemplate || installationId == null;
    const requestData = {
      instalacja: savingAsTemplate ? null : installationId,
      is_accepted: false,
      is_template: savingAsTemplate,
      offer_type: type === 'split' ? 'split' : 'multi_split',
      devices_split: type === 'split' ? devices : [],
      devices_multi_split: type === 'multi_split' ? devices : [],
      narzut: surcharges ?? [],
      nazwa_oferty: offerName,
      ...(type === 'multi_split' && multisplitKompletyFromParams
        ? { multisplit_komplety: multisplitKompletyFromParams }
        : {}),
    };

    const response = await createOffer({
      method: 'POST',
      data: requestData,
    });

    if (getOffers && !savingAsTemplate) {
      getOffers();
    }

    const successMessage = savingAsTemplate
      ? installationId == null && !route.params.isTemplate
        ? 'Oferta zapisana jako szablon'
        : 'Utworzono szablon'
      : 'Utworzono ofertę';

    Alert.alert(successMessage, [
      {
        text: 'OK',
        onPress: handleGoBack,
      },
    ]);
  }, [
    route.params.isTemplate,
    offerName,
    type,
    devices,
    surcharges,
    installationId,
    multisplitKompletyFromParams,
    createOffer,
    getOffers,
    handleGoBack,
  ]);

  const saveTemplateUpdate = useCallback(async () => {
    if (!offerId || !isTemplate) return;
    const deviceIds = tools?.map(t => t.id) ?? [];
    const narzutIds =
      surchargesState?.map(s => s.id).filter((id): id is number => id != null) ??
      [];
    const payload: Record<string, unknown> = {
      nazwa_oferty: templateOfferName,
      offer_type: type === 'split' ? 'split' : 'multi_split',
      devices_split: type === 'split' ? deviceIds : [],
      devices_multi_split: type === 'multi_split' ? deviceIds : [],
      narzut: narzutIds,
      rabat: templateRabatIds,
    };
    if (
      type === 'multi_split' &&
      multisplitKompletyFromApi &&
      multisplitKompletyFromApi.length > 0
    ) {
      payload.multisplit_komplety = multisplitKompletyFromApi.map(k => ({
        producent: k.producent ?? '',
        internal_ids: (k.internal || []).map((d: Device) => d.id),
        aggregate_ids: (k.aggregate || []).map((d: Device) => d.id),
      }));
    }
    try {
      await updateTemplate({ method: 'POST', data: payload });
      Alert.alert('Szablon został zaktualizowany', [
        { text: 'OK', onPress: () => setIsTemplateEditMode(false) },
      ]);
      loadData();
    } catch (err) {
      Alert.alert(
        'Błąd',
        (err as Error)?.message || 'Nie udało się zaktualizować szablonu',
      );
    }
  }, [
    offerId,
    isTemplate,
    tools,
    surchargesState,
    templateOfferName,
    templateRabatIds,
    type,
    multisplitKompletyFromApi,
    updateTemplate,
    loadData,
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
        instalacja: null,
        is_template: true,
        nazwa_oferty: data.template_name,
        offer_type: type === 'split' ? 'split' : 'multi_split',
        devices_split: type === 'split' ? devices : [],
        devices_multi_split: type === 'multi_split' ? devices : [],
        narzut: surcharges ?? [],
      };

      try {
        const response = await createOffer({
          method: 'POST',
          data: requestData,
        });

        if (response) {
          Alert.alert(`Utworzono szablon: ${data.template_name}`);
        } else {
          Alert.alert('Nie udało się utworzyć szablonu');
        }
      } catch (err) {
        Alert.alert('Wystąpił błąd podczas dodawania szablonu.');
      }
    },
    [type, surcharges, devices, createOffer],
  );

  const onAccept = useCallback(async () => {
    const isMultisplit = type === 'multi_split';
    if (isMultisplit) {
      if (selectedKompletId == null) {
        Alert.alert('Błąd', 'Proszę wybrać komplet z oferty');
        return;
      }
    } else if (!selectedDeviceId) {
      Alert.alert('Błąd', 'Proszę wybrać urządzenie z oferty');
      return;
    }

    const requestData: Record<string, unknown> = {
      oferta_id: Number(offerId),
      is_accepted: true,
    };
    if (isMultisplit) {
      requestData.selected_komplet = Number(selectedKompletId);
    } else {
      requestData.selected_device_id = Number(selectedDeviceId);
    }

    try {
      const response = await acceptOffer({ data: requestData });

      if (response) {
        if (getOffers) {
          getOffers();
        }

        // Jeśli użytkownik to klient, przekieruj do wyboru terminu (gdy rezerwacja włączona)
        if (isCurrentUserClient) {
          if (reservationSystemEnabled) {
            Alert.alert(
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
            Alert.alert('Oferta została zaakceptowana', [
              { text: 'OK', onPress: handleGoBack },
            ]);
          }
        } else {
          Alert.alert('Oferta została zaakceptowana', [
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
    type,
    selectedDeviceId,
    selectedKompletId,
    offerId,
    acceptOffer,
    getOffers,
    isCurrentUserClient,
    reservationSystemEnabled,
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
      unit?: string | null;
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
        getSurcharges({ data: surchargesRequestData });
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

  // Wysyłanie oferty emailem
  const handleSendEmail = useCallback(async () => {
    if (!offerId) {
      Alert.alert('Błąd', 'Brak ID oferty');
      return;
    }

    try {
      const response = (await sendOfferEmail({
        data: { oferta_id: Number(offerId) },
      })) as { success?: boolean; error?: string };
      if (response?.success) {
        Alert.alert('Oferta została wysłana na email klienta');
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

  // Dla multisplit: wyświetlanie pogrupowane po kompletach (z API lub z params)
  type KompletDisplay = {
    id?: number;
    producent: string;
    internal: Device[];
    aggregate: Device[];
  };
  // Pula urządzeń do rozwiązywania id (przed zapisem: allDevices + tools, żeby mieć pełną listę)
  const devicePoolById = useMemo(() => {
    const map = new Map<number, Device>();
    for (const d of allDevices ?? []) {
      if (d?.id != null) map.set(Number(d.id), d);
    }
    for (const d of tools ?? []) {
      if (d?.id != null) map.set(Number(d.id), d);
    }
    return map;
  }, [allDevices, tools]);

  const multisplitKompletyForDisplay = useMemo((): KompletDisplay[] => {
    if (multisplitKompletyFromApi.length > 0) {
      const flatTools = tools ?? [];
      return multisplitKompletyFromApi.map((k: MultisplitKompletFromApi) => {
        const producent = k.producent ?? '';
        let internal = k.internal ?? [];
        let aggregate = k.aggregate ?? [];
        // Fallback: gdy komplet z API ma puste listy, uzupełnij z płaskiej listy urządzeń oferty (po producencie)
        if (
          internal.length === 0 &&
          aggregate.length === 0 &&
          flatTools.length > 0 &&
          producent
        ) {
          internal = flatTools.filter(
            (d: Device) =>
              (d.rodzaj ?? '').toLowerCase() !== 'agregat' &&
              (d.producent ?? '') === producent,
          );
          aggregate = flatTools.filter(
            (d: Device) =>
              (d.rodzaj ?? '').toLowerCase() === 'agregat' &&
              (d.producent ?? '') === producent,
          );
        }
        return { id: k.id, producent, internal, aggregate };
      });
    }
    // Przed zapisem: komplety z parametrów nawigacji – rozwiąż internal_ids/aggregate_ids z puli (allDevices + tools)
    if (
      multisplitKompletyFromParams?.length &&
      (allDevices?.length || tools?.length)
    ) {
      return multisplitKompletyFromParams.map(
        (k: {
          producent?: string;
          internal_ids?: number[];
          aggregate_ids?: number[];
        }) => ({
          producent: k.producent ?? '',
          internal: (k.internal_ids || [])
            .map((id: number) => devicePoolById.get(Number(id)))
            .filter((d): d is Device => d != null),
          aggregate: (k.aggregate_ids || [])
            .map((id: number) => devicePoolById.get(Number(id)))
            .filter((d): d is Device => d != null),
        }),
      );
    }
    return [];
  }, [
    multisplitKompletyFromApi,
    multisplitKompletyFromParams,
    allDevices,
    tools,
    devicePoolById,
  ]);

  // Grupowanie urządzeń po id (ten sam model = jedna linia "model x N - cena")
  const groupDevicesById = useCallback((devices: Device[]) => {
    const byId = new Map<number, { device: Device; count: number }>();
    for (const d of devices) {
      const { id } = d;
      const existing = byId.get(id);
      if (existing) existing.count += 1;
      else byId.set(id, { device: d, count: 1 });
    }
    return Array.from(byId.values());
  }, []);

  const renderMultisplitKompletRow = useCallback(
    (
      item: { device: Device; count: number },
      label: 'Jednostka wewnętrzna' | 'Agregat',
    ) => {
      const { device: tool, count } = item;
      const deviceSurchargesList =
        deviceSurcharges?.[tool.id]?.surcharges || [];
      const discountValue = deviceSurcharges?.[tool.id]?.discount;
      const totalSurchargeValue = (deviceSurchargesList || []).reduce(
        (total: number, surcharge: any) => {
          if (surcharge.customValue !== undefined)
            return total + surcharge.customValue;
          if (surcharge.surchargeId) {
            const s = surchargesList?.find(
              (x: any) => x.id === surcharge.surchargeId,
            );
            return total + (s?.value ?? 0);
          }
          return total;
        },
        0,
      );
      const catalogPrice = Number(tool.cena_katalogowa_netto);
      const unitPrice = getDevicePrice(
        catalogPrice,
        discountValue ?? undefined,
        totalSurchargeValue || 0,
      );
      const totalPrice = (Number(unitPrice) * count).toFixed(2);
      const modelName = tool.nazwa_modelu_producenta || tool.nazwa_modelu || '';
      const canSelectDevice = !clientHasAccount || isCurrentUserClient;
      const showRadio = false; // W multisplit wybór jest na poziomie kompletu, nie urządzenia
      return (
        <View key={`${tool.id}-${label}-${count}`} style={styles.tableRow}>
          {offerId && showRadio && canSelectDevice && (
            <View style={styles.radioColumn}>
              <Text
                style={{
                  fontSize: 24,
                  color: selectedDeviceId === tool.id ? '#007AFF' : '#C7C7CC',
                }}
                onPress={() => !isAccepted && setSelectedDeviceId(tool.id)}
              >
                {selectedDeviceId === tool.id ? '●' : '○'}
              </Text>
            </View>
          )}
          {offerId && showRadio && clientHasAccount && !isCurrentUserClient && (
            <View style={styles.radioColumn} />
          )}
          {offerId && !showRadio && canSelectDevice && (
            <View style={styles.radioColumnNarrow} />
          )}
          {offerId &&
            !showRadio &&
            clientHasAccount &&
            !isCurrentUserClient && <View style={styles.radioColumnNarrow} />}
          <View style={styles.deviceColumn}>
            <Text style={styles.cell}>
              {label} {modelName}
              {modelName &&
              (tool.moc_chlodnicza != null || tool.moc_grzewcza != null)
                ? ` (${tool.moc_chlodnicza ?? '-'}/${
                    tool.moc_grzewcza ?? '-'
                  } kW)`
                : ''}
              {' x '}
              {count}
            </Text>
          </View>
          <View style={[styles.priceColumn, styles.priceColumnRight]}>
            <Text style={styles.cell}>{totalPrice} zł</Text>
          </View>
        </View>
      );
    },
    [
      deviceSurcharges,
      surchargesList,
      getDevicePrice,
      clientHasAccount,
      isCurrentUserClient,
      offerId,
      selectedDeviceId,
      isAccepted,
    ],
  );

  const renderDeviceRow = useCallback(
    (tool: Device) => {
      const deviceSurchargesList =
        deviceSurcharges?.[tool.id]?.surcharges || [];
      const discountValue = deviceSurcharges?.[tool.id]?.discount;
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
      const canSelectDevice = !clientHasAccount || isCurrentUserClient;
      return (
        <View key={tool.id} style={styles.tableRow}>
          {offerId && canSelectDevice && (
            <View style={styles.radioColumn}>
              <Text
                style={{
                  fontSize: 24,
                  color: selectedDeviceId === tool.id ? '#007AFF' : '#C7C7CC',
                }}
                onPress={() => !isAccepted && setSelectedDeviceId(tool.id)}
              >
                {selectedDeviceId === tool.id ? '●' : '○'}
              </Text>
            </View>
          )}
          {offerId && clientHasAccount && !isCurrentUserClient && (
            <View style={styles.radioColumn} />
          )}
          <View style={styles.deviceColumn}>
            <Text style={styles.cell}>
              {tool.nazwa_modelu_producenta || tool.nazwa_modelu} (
              {tool.moc_chlodnicza}/{tool.moc_grzewcza} kW)
            </Text>
          </View>
          <View style={[styles.priceColumn, styles.priceColumnRight]}>
            <Text style={styles.cell}>{finalPrice} zł</Text>
          </View>
        </View>
      );
    },
    [
      deviceSurcharges,
      surchargesList,
      getDevicePrice,
      clientHasAccount,
      isCurrentUserClient,
      offerId,
      selectedDeviceId,
      isAccepted,
    ],
  );

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <View style={styles.container}>
        <ButtonsHeader
          onBackPress={handleGoBack}
          title={headerTitle}
        />

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
          {offerId && overviewDataLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.teal} />
              <Text style={styles.loadingText}>Trwa pobieranie danych...</Text>
            </View>
          ) : null}
          {!overviewDataLoading && (
          <>
            {(companyLogoUrl || fgazNumber) && (
              <View style={styles.companyInfoBox}>
                {companyLogoUrl ? (
                  <Image
                    source={{ uri: companyLogoUrl }}
                    style={styles.companyLogo}
                    resizeMode="contain"
                  />
                ) : null}
                {fgazNumber ? (
                  <Text style={styles.companyInfoText}>
                    Certyfikat F-GAZ: {fgazNumber}
                  </Text>
                ) : null}
              </View>
            )}
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
              {type === 'multi_split' &&
              multisplitKompletyForDisplay.length > 0 ? (
                <View style={styles.devicesTable}>
                  <View style={styles.tableHeader}>
                    {offerId && (!clientHasAccount || isCurrentUserClient) && (
                      <Text
                        style={[
                          styles.headerCell,
                          styles.headerRadioColumnNarrow,
                        ]}
                      >
                        Wybór
                      </Text>
                    )}
                    {offerId && clientHasAccount && !isCurrentUserClient && (
                      <View style={styles.headerRadioColumnNarrow} />
                    )}
                    <Text style={[styles.headerCell, styles.deviceColumn]}>
                      Urządzenia - moc chłodnicza
                    </Text>
                    <Text style={[styles.headerCell, styles.priceColumn]}>
                      Cena z montażem
                    </Text>
                  </View>
                  {multisplitKompletyForDisplay.map(
                    (komplet: KompletDisplay, idx: number) => {
                      const internalGrouped = groupDevicesById(
                        komplet.internal ?? [],
                      );
                      const aggregateGrouped = groupDevicesById(
                        komplet.aggregate ?? [],
                      );
                      return (
                        <View key={idx} style={styles.manufacturerGroup}>
                          <View
                            style={[
                              styles.manufacturerHeaderComplet,
                              styles.tableRowComplet,
                            ]}
                          >
                            {offerId && (
                              <View style={styles.radioColumnKomplet}>
                                {(!clientHasAccount || isCurrentUserClient) &&
                                komplet.id != null ? (
                                  <Text
                                    style={{
                                      fontSize: 24,
                                      color:
                                        selectedKompletId === komplet.id
                                          ? '#007AFF'
                                          : '#C7C7CC',
                                    }}
                                    onPress={() =>
                                      !isAccepted &&
                                      setSelectedKompletId(komplet.id!)
                                    }
                                  >
                                    {selectedKompletId === komplet.id
                                      ? '●'
                                      : '○'}
                                  </Text>
                                ) : null}
                              </View>
                            )}
                            <View style={styles.kompletNameColumn}>
                              <Text style={styles.manufacturerName}>
                                Komplet {idx + 1}
                                {komplet.producent
                                  ? ` – ${komplet.producent}`
                                  : ''}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.kompletSectionLabel}>
                            Jednostki wewnętrzne
                          </Text>
                          {internalGrouped.length > 0 ? (
                            internalGrouped.map(item =>
                              renderMultisplitKompletRow(
                                item,
                                'Jednostka wewnętrzna',
                              ),
                            )
                          ) : (
                            <View style={styles.tableRow}>
                              {offerId && (
                                <View style={styles.radioColumnNarrow} />
                              )}
                              <View style={styles.deviceColumn}>
                                <Text
                                  style={[
                                    styles.cell,
                                    {
                                      fontStyle: 'italic',
                                      color: Colors.grayerText,
                                    },
                                  ]}
                                >
                                  — Brak
                                </Text>
                              </View>
                              <View style={styles.priceColumn} />
                            </View>
                          )}
                          <Text style={styles.kompletSectionLabel}>
                            Agregaty
                          </Text>
                          {aggregateGrouped.length > 0 ? (
                            aggregateGrouped.map(item =>
                              renderMultisplitKompletRow(item, 'Agregat'),
                            )
                          ) : (
                            <View style={styles.tableRow}>
                              {offerId && (
                                <View style={styles.radioColumnNarrow} />
                              )}
                              <View style={styles.deviceColumn}>
                                <Text
                                  style={[
                                    styles.cell,
                                    {
                                      fontStyle: 'italic',
                                      color: Colors.grayerText,
                                    },
                                  ]}
                                >
                                  — Brak
                                </Text>
                              </View>
                              <View style={styles.priceColumn} />
                            </View>
                          )}
                        </View>
                      );
                    },
                  )}
                </View>
              ) : tools && tools.length > 0 ? (
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
                    const groupedByManufacturer: { [key: string]: Device[] } =
                      {};

                    filteredDevices.forEach(device => {
                      if (!groupedByManufacturer[device.producent]) {
                        groupedByManufacturer[device.producent] = [];
                      }
                      groupedByManufacturer[device.producent].push(device);
                    });

                    return Object.entries(groupedByManufacturer).map(
                      ([manufacturer, manufacturerDevices]) => (
                        <View
                          key={manufacturer}
                          style={styles.manufacturerGroup}
                        >
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
                            const totalSurchargeValue =
                              deviceSurchargesList.reduce(
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

                            const catalogPrice = Number(
                              tool.cena_katalogowa_netto,
                            );
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
                                        !isAccepted &&
                                        setSelectedDeviceId(tool.id)
                                      }
                                    >
                                      {selectedDeviceId === tool.id ? '●' : '○'}
                                    </Text>
                                  </View>
                                )}
                                {offerId && !canSelectDevice && (
                                  <View style={styles.radioColumn} />
                                )}
                                <Text
                                  style={[styles.cell, styles.deviceColumn]}
                                >
                                  {tool.nazwa_modelu}{' '}
                                  {tool.nazwa_modelu_producenta} –{' '}
                                  {tool.moc_chlodnicza} kW
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
                  Użytkownik ma konto w aplikacji i tylko on może zaakceptować
                  tę ofertę
                </Text>
              )}
              {/* {surchargesState && surchargesState?.length !== 0 && (
            <Surcharges surcharges={surchargesState} />
          )} */}
            </>
          )}
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
          {isTemplate && offerId && (
            <>
              {isTemplateEditMode ? (
                <>
                  <Input
                    placeholder="Nazwa szablonu"
                    value={templateOfferName}
                    onChangeText={setTemplateOfferName}
                    containerStyle={{ paddingHorizontal: 0 }}
                    inputStyle={{ fontSize: 14 }}
                  />
                  <SubmitButton
                    title="Zapisz zmiany"
                    style={styles.submitButton}
                    onPress={saveTemplateUpdate}
                    loading={updateTemplateLoading}
                  />
                  <SubmitButton
                    title="Anuluj"
                    style={[styles.submitButton, styles.secondaryButton]}
                    onPress={() => setIsTemplateEditMode(false)}
                  />
                </>
              ) : (
                <View style={styles.customButtonsWrapper}>
                  <SubmitButton
                    title="Aktualizuj szablon"
                    style={styles.submitButton}
                    onPress={() => setIsTemplateEditMode(true)}
                  />
                  <SubmitButton
                    title="Utwórz ofertę z szablonu"
                    style={[styles.submitButton, styles.secondaryButton]}
                    onPress={() => {
                      (navigation as any).navigate('CreateOfferFromTemplate', {
                        templateId: offerId,
                      });
                    }}
                  />
                </View>
              )}
            </>
          )}
          {(mode === 'accept' || (mode === 'view' && isAccepted)) && (
            <View style={styles.customButtonsWrapper}>
              {(!clientHasAccount || isCurrentUserClient) && (
                <>
                  {isAccepted && isCurrentUserClient ? (
                    reservationSystemEnabled ? (
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
                    ) : null
                  ) : (
                    <SubmitButton
                      style={styles.submitButton}
                      title="Akceptuj ofertę"
                      onPress={onAccept}
                      disabled={
                        type === 'multi_split'
                          ? selectedKompletId == null
                          : !selectedDeviceId
                      }
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.grayerText,
  },
  submitButton: {
    width: '100%',
    height: 34,
    borderRadius: 4,
    backgroundColor: Colors.teal,
    padding: 0,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.teal,
    marginTop: 8,
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
  headerRadioColumnNarrow: {
    width: 40,
    minWidth: 40,
    maxWidth: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioColumnNarrow: {
    width: 40,
    minWidth: 40,
    maxWidth: 40,
  },
  radioColumnKomplet: {
    width: 40,
    minWidth: 40,
    maxWidth: 40,
    paddingLeft: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  kompletNameColumn: {
    flex: 1,
    flexGrow: 1,
    justifyContent: 'center',
    paddingRight: 8,
    paddingLeft: 4,
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
  manufacturerHeaderComplet: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  manufacturerName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  kompletSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.grayerText,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  tableRowComplet: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 8,
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
  priceColumnRight: {
    alignSelf: 'flex-end',
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
  companyInfoBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.invoiceFormTextContainer,
    alignItems: 'center',
  },
  companyLogo: {
    width: 160,
    height: 60,
    marginBottom: 8,
  },
  companyInfoText: {
    fontSize: 12,
    color: Colors.grayText,
  },
});

export default OfferOverview;
