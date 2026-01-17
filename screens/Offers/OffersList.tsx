import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ListItem, Overlay, Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Animated, Dimensions, StyleSheet, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

import { IconButton, SubmitButton } from '../../components/Button';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import { Dropdown, FormInput } from '../../components/Input';
import RadioButtons from '../../components/RadioButtons';
import Switch from '../../components/Switch';
import CloseIcon from '../../components/icons/CloseIcon';
import NoteTextIcon from '../../components/icons/NoteTextIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { OffersParamList } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useClients from '../../providers/ClientsProvider';
import useOffers, { Offer } from '../../providers/OffersProvider';
import usePermission from '../../providers/PermissionProvider';
import {
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';

// Helper function to get client and installation info for an offer
function getOfferClientAndInstallationInfo(
  offer: Offer,
  allInstallations: ClientsInstallationListItem[] | undefined,
  clients: any[] | undefined,
): { clientInfo?: string; installationInfo?: string } {
  if (!allInstallations || !clients) {
    return {};
  }

  const installation = allInstallations.find(
    inst => inst.id === offer.instalacja,
  );
  if (!installation) {
    return {};
  }

  const client = clients.find(c => c.id === installation.klient_id);
  if (!client) {
    return {
      installationInfo: installation.name || `Instalacja ${installation.id}`,
    };
  }

  const clientInfo =
    client.nazwa_firmy || `${client.first_name} ${client.last_name}`;
  const installationInfo = installation.name || `Instalacja ${installation.id}`;

  return { clientInfo, installationInfo };
}

// Swipe action components similar to ClientsList
function RowRightContent({ onDeletePress }: { onDeletePress: () => void }) {
  const translateX = useRef(new Animated.Value(150)).current;

  const animate = useCallback(
    (toValue: number) => {
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    },
    [translateX],
  );

  useEffect(() => {
    animate(0);
  }, [animate]);

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        styles.offerDelete,
        { transform: [{ translateX }] },
      ]}
    >
      <IconButton
        icon={<TrashIcon color="white" />}
        style={styles.buttonStyle}
        titleStyle={styles.buttonTitleStyle}
        onPress={onDeletePress}
        withoutBackground
      />
    </Animated.View>
  );
}

// Single offer row component similar to ClientRow
const OfferRow = memo(
  ({
    offer,
    onDeletePress,
    isTemplate = false,
    allInstallations,
    clients,
  }: {
    offer: Offer;
    onDeletePress: (id: number) => void;
    isTemplate?: boolean;
    allInstallations?: ClientsInstallationListItem[];
    clients?: any[];
  }) => {
    const navigation = useNavigation<StackNavigationProp<OffersParamList>>();
    const [isDuringSwipe, setIsDuringSwipe] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<
      'left' | 'right' | null
    >(null);

    // Get client and installation info first
    const { clientInfo, installationInfo } = getOfferClientAndInstallationInfo(
      offer,
      allInstallations,
      clients,
    );

    const offerTitle =
      offer.nazwa_oferty ||
      offer.nazwa ||
      `${clientInfo || 'Brak klienta'} - ${installationInfo || `Instalacja ${offer.instalacja}`
      }`;
    const swipeableStyle = { borderRadius: 6, height: 60 };

    const renderRightActions = (): React.ReactNode => {
      if (swipeDirection !== 'right') {
        return null;
      }
      return <RowRightContent onDeletePress={() => onDeletePress(offer.id)} />;
    };

    const viewWidth = Dimensions.get('window').width;
    const halfWidth = viewWidth / 2;

    const handlePress = () => {
      if (isTemplate) {
        // Dla szablonów używamy innych pól
        (navigation as any).navigate('Overview', {
          type: offer.typ || offer.offer_type,
          installationId: null, // Szablony nie mają instalacji
          devices:
            (offer.typ || offer.offer_type) === 'split'
              ? offer.devices_split || []
              : offer.devices_multi_split || [],
          surcharges: offer.narzuty || offer.narzut || [],
          promos: offer.rabat || [],
          offerId: offer.id,
          mode: 'view',
          isTemplate: true,
        });
      } else if (offer.is_accepted) {
        (navigation as any).navigate('Overview', {
          type: offer.offer_type,
          installationId: offer.instalacja,
          devices:
            offer.offer_type === 'split'
              ? offer.devices_split || []
              : offer.devices_multi_split || [],
          surcharges: offer.narzut || [],
          promos: offer.rabat || [],
          offerId: offer.id,
          mode: 'view',
          isTemplate: false,
        });
      } else {
        (navigation as any).navigate('Overview', {
          type: offer.offer_type,
          installationId: offer.instalacja,
          devices:
            offer.offer_type === 'split'
              ? offer.devices_split || []
              : offer.devices_multi_split || [],
          surcharges: offer.narzut || [],
          promos: offer.rabat || [],
          offerId: offer.id,
          mode: 'accept',
          isTemplate: false,
        });
      }
    };

    return (
      <ListItem.Swipeable
        key={offer.id}
        style={[styles.listItem, isDuringSwipe && swipeableStyle]}
        rightStyle={[styles.offerDelete]}
        rightContent={renderRightActions}
        rightWidth={swipeDirection === 'right' ? halfWidth : 0}
        onPress={handlePress}
        onSwipeBegin={direction => {
          setIsDuringSwipe(true);
          setSwipeDirection(direction);
        }}
        onSwipeEnd={() => {
          setIsDuringSwipe(false);
        }}
        containerStyle={
          isDuringSwipe && [
            swipeableStyle,
            { backgroundColor: Colors.draggableBackground },
          ]
        }
      >
        <View style={styles.noteTextIcon}>
          <NoteTextIcon color={Colors.white} size={20} />
        </View>
        <ListItem.Content>
          <ListItem.Title style={styles.offerTitle}>
            {offerTitle}
          </ListItem.Title>
          {/* Client and Installation info */}
          {!isTemplate &&
            (offer.nazwa_oferty || offer.nazwa) &&
            (clientInfo || installationInfo) && (
              <ListItem.Subtitle style={styles.offerSubtitle}>
                <Text style={styles.clientInstallationText}>
                  {clientInfo && installationInfo
                    ? `${clientInfo} - ${installationInfo}`
                    : clientInfo || installationInfo}
                </Text>
              </ListItem.Subtitle>
            )}
          {!isTemplate ? (
            <ListItem.Subtitle
              style={[
                styles.offerSubtitle,
                {
                  backgroundColor: offer.is_accepted
                    ? Colors.green
                    : Colors.red,
                },
              ]}
            >
              <Text style={styles.isAcceptedText}>
                {offer.is_accepted ? 'Zaakceptowana' : 'Nie zaakceptowana'}
              </Text>
            </ListItem.Subtitle>
          ) : (
            <ListItem.Subtitle style={styles.offerSubtitle}>
              <Text style={styles.deviceCountText}>
                Ilość urządzeń:{' '}
                {(offer.devices_split?.length || 0) +
                  (offer.devices_multi_split?.length || 0)}
              </Text>
            </ListItem.Subtitle>
          )}
        </ListItem.Content>
      </ListItem.Swipeable>
    );
  },
);

function OfferOverlay({
  visible,
  onBackdropPress,
  client,
  installation,
  isTemplate = false,
}: {
  visible: boolean;
  onBackdropPress: () => void;
  client?: number;
  installation?: number;
  isTemplate?: boolean;
}) {
  const { isUserClient } = useAuth();
  const navigation = useNavigation<StackNavigationProp<OffersParamList>>();
  const [offerType, setOfferType] = useState<string>('split');
  const [offerName, setOfferName] = useState<string>('');
  const [useTemplate, setUseTemplate] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [filteredClients, setFilteredClients] =
    useState<{ label: string; value: number }[]>();
  const { result: templatesFromApi, execute: fetchTemplates } = useApi<any[]>({
    path: 'oferta_template_list',
  });
  const { execute: getSzablonData } = useApi<any>({
    path: 'szablon_data',
  });
  const { clients, getClients } = useClients();
  const [filteredInstallations, setFilteredInstallations] =
    useState<{ label: string; value: number }[]>();
  const [filteredTemplates, setFilteredTemplates] =
    useState<{ label: string; value: number }[]>();
  const [filteredOfferNames, setFilteredOfferNames] =
    useState<{ label: string; value: string }[]>();
  const [clientId, setClientId] = useState<number | null>(null);
  const [installationId, setInstallationId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [shouldAddClient, setShouldAddClient] = useState<boolean>(false);
  const { result: templates, execute: getTemplates } = useApi<Offer[]>({
    path: 'oferta_list',
  });
  const { result: installationsRes, execute: getInstallations } =
    useApi<ClientInstallationsListResponse>({
      path: 'installation_list',
    });
  const { offers } = useOffers();

  const handleClose = () => {
    // Reset all form state when overlay closes without predefined params
    if (!client && !installation) {
      setOfferType('split');
      setOfferName('');
      setClientId(null);
      setInstallationId(null);
      setTemplateId(null);
      setShouldAddClient(false);
      setFilteredInstallations(undefined);
      setUseTemplate(false);
      setSelectedTemplateId(null);
      reset({
        client: undefined,
        installation: undefined,
        templateId: undefined,
        offerName: '',
        templateName: '',
        template: undefined,
      });
    }
    onBackdropPress();
  };

  const { control, reset, watch, setValue } = useForm<{
    client?: number | null;
    installation?: number | null;
    templateId?: number | null;
    offerName: string;
    templateName: string;
    template?: number | null;
  }>({
    defaultValues: {
      client: client ?? undefined,
      installation: installation ?? undefined,
      templateId: templateId ?? undefined,
      offerName: '',
      templateName: '',
      template: undefined,
    },
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (client) {
      setClientId(client);
      setShouldAddClient(true);
      setValue('client', client);
    } else {
      setClientId(null);
      setShouldAddClient(false);
      setFilteredInstallations(undefined);
      setValue('client', undefined);
    }

    if (installation) {
      setInstallationId(installation);
      setValue('installation', installation);
    } else if (!client) {
      setInstallationId(null);
      setValue('installation', undefined);
    }

    if (templateId) {
      setTemplateId(templateId);
    } else if (!client && !installation) {
      setTemplateId(null);
    }
  }, [client, installation, templateId, visible, setValue]);

  // Zawsze twórz ofertę, a po utworzeniu pytaj o szablon
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { execute: createTemplate, loading: createTemplateLoading } =
    useApi<any>({ path: 'oferta_template_create' });

  const buildOfferName = useCallback(
    (clientData?: any, installationValue?: number | null) => {
      const clientName = [clientData?.first_name, clientData?.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
      const resolvedInstallation =
        installationValue ?? watch('installation') ?? undefined;

      if (!clientName && !resolvedInstallation) {
        return 'Nowa oferta';
      }

      return `${clientName || 'Oferta'}${resolvedInstallation ? ` - Instalacja ${resolvedInstallation}` : ''
        }`;
    },
    [watch],
  );

  const onPress = async () => {
    if (isTemplate || !shouldAddClient || (shouldAddClient && installationId)) {
      // Jeśli użytkownik wybrał szablon, pobierz dane z szablonu i przejdź do OfferOverview
      if (useTemplate && selectedTemplateId) {
        try {
          const response = await getSzablonData({
            data: { szablon_id: selectedTemplateId },
          });
          if (response) {
            const currentClientId = clientId || watch('client');
            const currentClient = clients?.find(x => x.id === currentClientId);
            const defaultOfferName = buildOfferName(
              currentClient,
              installationId,
            );
            navigation.navigate('Overview', {
              type: response.typ === 'multisplit' ? 'multi_split' : 'split',
              installationId: shouldAddClient ? installationId : null,
              devices:
                response.typ === 'split'
                  ? (response.devices_split || []).map((d: any) => d.id)
                  : (response.devices_multisplit || []).map((d: any) => d.id),
              surcharges: (response.narzuty || []).map((n: any) => n.id),
              promos: [],
              mode: 'add',
              isTemplate: false,
              offerName: offerName || watch('offerName') || defaultOfferName,
              allDevices:
                response.typ === 'split'
                  ? response.devices_split || []
                  : response.devices_multisplit || [],
              surchargesList: response.narzuty || [],
            });
            onBackdropPress();
            return;
          }
        } catch (error) {
          Alert.alert('Błąd', 'Nie udało się pobrać danych szablonu');
          return;
        }
      }

      // Standardowy przepływ - przekieruj do AddToolForm
      const currentClientId = clientId || watch('client');
      const currentClient = clients?.find(x => x.id === currentClientId);
      const defaultOfferName = buildOfferName(currentClient, installationId);
      navigation.navigate('AddToolForm', {
        type: offerType,
        installationId: shouldAddClient ? installationId : null,
        offerName:
          offerName ||
          watch('offerName') ||
          (isTemplate ? 'Nowy szablon' : defaultOfferName),
        isTemplate,
      });
      onBackdropPress();
    }
  };

  // Funkcja do zapisu szablonu na podstawie utworzonej oferty
  const handleCreateTemplate = async () => {
    await createTemplate({
      data: {
        nazwa_oferty: templateName,
        offer_type: offerType,
        // Dodaj inne dane oferty, które chcesz przekazać do szablonu
      },
      method: 'POST',
    });
    setShowTemplateModal(false);
    onBackdropPress();
  };

  const handleClientSwitchChange = (value: boolean) => {
    setShouldAddClient(value);
    if (!value) {
      // Clear client and installation when switch is turned off
      setClientId(null);
      setInstallationId(null);
      setFilteredInstallations(undefined);
      setValue('client', undefined);
      setValue('installation', undefined);
    }
  };

  useEffect(() => {
    if (clients) {
      let clientsToDisplay: { label: string; value: number }[] = [];

      clients.forEach(item => {
        // Buduj label - priorytet: nazwa_firmy, imię i nazwisko, NIP, ID
        let label = '';

        if (item.nazwa_firmy && item.nazwa_firmy.trim()) {
          label = item.nazwa_firmy.trim();
        } else if (item.first_name || item.last_name) {
          const fullName = `${item.first_name || ''} ${item.last_name || ''
            }`.trim();
          if (fullName) {
            label = fullName;
          }
        }

        // Jeśli nadal nie ma labela, użyj NIP lub ID
        if (!label) {
          if (item.nip && item.nip.trim()) {
            label = `NIP: ${item.nip.trim()}`;
          } else {
            label = `Klient #${item.id}`;
          }
        }

        clientsToDisplay = [
          ...clientsToDisplay,
          {
            label,
            value: item.id,
          },
        ];
      });

      setFilteredClients(clientsToDisplay);
    } else if (getClients && !isUserClient()) {
      // Tylko admin/monter pobiera klientów
      getClients();
    }
  }, [clients, getClients, isUserClient]);

  useEffect(() => {
    if (templatesFromApi) {
      let templatesToDisplay: { label: string; value: number }[] = [];

      (templatesFromApi || [])
        .filter(item => {
          // Filtruj szablony według typu (split/multisplit)
          const templateType =
            item.typ === 'multisplit' ? 'multi_split' : 'split';
          return templateType === offerType;
        })
        .forEach(item => {
          templatesToDisplay = [
            ...templatesToDisplay,
            {
              label: item.nazwa || `Szablon ${item.id}`,
              value: item.id,
            },
          ];
        });

      setFilteredTemplates(templatesToDisplay);
    } else if (getTemplates) {
      getTemplates();
    }
  }, [templatesFromApi, getTemplates, offerType]);

  // Load templates when useTemplate switch is enabled
  useEffect(() => {
    if (useTemplate && !isTemplate) {
      fetchTemplates();
    }
  }, [useTemplate, isTemplate, fetchTemplates]);

  // Populate offer names from existing offers
  useEffect(() => {
    if (offers) {
      const offerNamesToDisplay: { label: string; value: string }[] = [];
      const uniqueNames = new Set<string>();

      offers.forEach(item => {
        if (item.nazwa_oferty && !uniqueNames.has(item.nazwa_oferty)) {
          uniqueNames.add(item.nazwa_oferty);
          offerNamesToDisplay.push({
            label: item.nazwa_oferty,
            value: item.nazwa_oferty,
          });
        }
      });

      setFilteredOfferNames(offerNamesToDisplay);
    }
  }, [offers]);

  // Przechowuj stabilną referencję do getInstallations
  const getInstallationsRef = useRef(getInstallations);
  useEffect(() => {
    getInstallationsRef.current = getInstallations;
  }, [getInstallations]);

  // Ładuj instalacje gdy zmieni się clientId
  useEffect(() => {
    if (getInstallationsRef.current && clientId) {
      getInstallationsRef.current({ data: { klient_id: clientId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Ładuj instalacje dla przekazanego klienta
  useEffect(() => {
    if (getInstallationsRef.current && client) {
      getInstallationsRef.current({ data: { klient_id: client } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  // Przetwórz odpowiedź z instalacjami
  useEffect(() => {
    if (installationsRes && installationsRes.installation_list) {
      let installationsToDisplay: { label: string; value: number }[] = [];

      (installationsRes.installation_list || []).forEach(item => {
        installationsToDisplay = [
          ...installationsToDisplay,
          { label: item.name ?? `Instalacja ${item.id}`, value: item.id },
        ];
      });

      setFilteredInstallations(installationsToDisplay);
    }
  }, [installationsRes]);

  function clearForm() {
    setOfferType('split');
    setOfferName('');
    setClientId(null);
    setInstallationId(null);
    setFilteredInstallations(undefined);
    setFilteredTemplates(undefined);
    setFilteredOfferNames(undefined);
    setShouldAddClient(false);
    setUseTemplate(false);
    setSelectedTemplateId(null);
    reset({
      client: undefined,
      installation: undefined,
      templateId: undefined,
      offerName: '',
      templateName: '',
      template: undefined,
    });
    setValue('client', undefined);
    setValue('installation', undefined);
    setValue('templateId', undefined);
    setValue('offerName', '');
    setValue('templateName', '');
    setValue('template', undefined);
    setShowTemplateModal(false);
    setTemplateName('');
    setSelectedTemplateId(null);
    setUseTemplate(false);
    setShouldAddClient(false);
    setClientId(null);
    setInstallationId(null);
  }

  return (
    <>
      <Overlay
        isVisible={visible}
        onBackdropPress={handleClose}
        overlayStyle={styles.overlay}
      >
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayHeaderTitle}>Nowa oferta</Text>
          <View style={styles.overlayHeaderButton}>
            <IconButton
              withoutBackground
              onPress={handleClose}
              icon={<CloseIcon color={Colors.black} size={22} />}
            />
          </View>
        </View>

        <View style={styles.overlayRadioContainer}>
          <FormInput
            label={isTemplate ? 'Nazwa szablonu' : 'Nazwa oferty'}
            name="offerName"
            control={control}
            isBordered
            noPadding
            placeholder={
              isTemplate ? 'Wprowadź nazwę szablonu' : 'Wprowadź nazwę oferty'
            }
            onChangeText={setOfferName}
          />
          {!isTemplate && (
            <Switch
              title="Dodaj klienta"
              value={shouldAddClient}
              onValueChange={handleClientSwitchChange}
              color={Colors.offersTeal}
            />
          )}
          {!isTemplate && shouldAddClient && filteredClients && (
            <Dropdown
              label="Klient"
              name="client"
              control={control}
              options={filteredClients}
              isBordered
              zIndex={10}
              onChange={setClientId}
            />
          )}
          {!isTemplate && shouldAddClient && filteredInstallations && (
            <Dropdown
              label="Instalacja"
              name="installation"
              control={control}
              options={filteredInstallations}
              isBordered
              zIndex={9}
              onChange={setInstallationId}
            />
          )}
          <RadioButtons
            value={offerType}
            onChange={value => setOfferType(value as string)}
            iconRight
            checkedColor={Colors.offersTeal}
            uncheckedColor={Colors.grayBorder}
            size={22}
            textStyle={styles.radioButtons}
            options={[
              { label: 'Oferta Split', value: 'split' },
              { label: 'Oferta Multisplit', value: 'multi_split' },
            ]}
          />
          {!isTemplate && (
            <>
              <Switch
                value={useTemplate}
                onValueChange={setUseTemplate}
                title="Użyj szablonu"
                color={Colors.offersTeal}
              />
              {useTemplate && (
                <Dropdown
                  label="Wybierz szablon"
                  name="template"
                  control={control}
                  options={filteredTemplates || []}
                  onChange={setSelectedTemplateId}
                />
              )}
            </>
          )}
          <SubmitButton
            title={isTemplate ? 'Utwórz szablon' : 'Dalej'}
            style={styles.continueButton}
            onPress={onPress}
            disabled={!isTemplate && shouldAddClient && !installationId}
          />
        </View>
      </Overlay>
      {/* Modal do tworzenia szablonu */}
      {showTemplateModal && (
        <Overlay
          isVisible={showTemplateModal}
          onBackdropPress={() => setShowTemplateModal(false)}
          style={styles.overlay}
        >
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayHeaderTitle}>
              Czy chcesz utworzyć szablon?
            </Text>
          </View>
          <View style={styles.overlayRadioContainer}>
            <FormInput
              label="Nazwa szablonu"
              name="templateName"
              control={control}
              isBordered
              noPadding
              placeholder="Wprowadź nazwę szablonu"
              onChangeText={setTemplateName}
            />
            <SubmitButton
              title="Utwórz szablon"
              style={styles.continueButton}
              onPress={handleCreateTemplate}
              loading={createTemplateLoading}
            />
            <SubmitButton
              title="Nie, zamknij"
              style={[styles.continueButton, styles.closeButton]}
              onPress={() => {
                clearForm();
                setShowTemplateModal(false);
              }}
              color="gray"
            />
          </View>
        </Overlay>
      )}
    </>
  );
}

function OffersList({
  route,
  shouldShowAddOverlay,
}: {
  route: {
    params?: {
      from?: string;
      installationId?: number;
      clientId?: number;
      isTemplate?: boolean;
    };
  };
  shouldShowAddOverlay?: boolean;
}) {
  const { isUserClient } = useAuth();
  const { hasAccess } = usePermission();
  const [visible, setVisible] = useState(false);
  const [filteredOffers, setFilteredOffers] = useState<Offer[] | null>();
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [allInstallations, setAllInstallations] = useState<
    ClientsInstallationListItem[]
  >([]);
  const navigation = useNavigation();
  const { offers, getOffers, offersLoading } = useOffers();
  const { execute: fetchTemplates } = useApi<any[]>({
    path: 'oferta_template_list',
  });

  const { execute: deleteOffer } = useApi({
    path: 'oferta_delete',
  });

  // API do pobierania instalacji dla klienta (do filtrowania ofert)
  const { result: clientInstallationsRes, execute: getClientInstallations } =
    useApi<ClientInstallationsListResponse>({
      path: 'installation_list',
    });

  // Hook do pobierania klientów
  const { clients, getClients } = useClients();

  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetchTemplates();
      if (response) {
        setFilteredOffers(response);
      }
    } catch (error) {
      // Ignore error
    }
  }, [fetchTemplates]);

  useEffect(() => {
    if (route.params?.isTemplate) {
      loadTemplates();
    } else if (getOffers) {
      getOffers();
    }
  }, [getOffers, loadTemplates, route.params?.isTemplate]);

  // Przechowuj stabilną referencję do getClientInstallations
  const getClientInstallationsRef = useRef(getClientInstallations);
  useEffect(() => {
    getClientInstallationsRef.current = getClientInstallations;
  }, [getClientInstallations]);

  // Pobierz instalacje dla klienta gdy jest przekazany clientId
  useEffect(() => {
    if (
      getClientInstallationsRef.current &&
      route.params?.clientId &&
      route.params?.from === 'installation'
    ) {
      getClientInstallationsRef.current({
        data: { klient_id: route.params.clientId },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.clientId, route.params?.from]);

  // Pobierz klientów do wyświetlania informacji
  // TYLKO dla admin/monter - klienci nie potrzebują listy klientów
  useEffect(() => {
    if (getClients && !isUserClient()) {
      getClients();
    }
  }, [getClients, isUserClient]);

  // Pobierz instalacje dla wszystkich klientów
  // TYLKO dla admin/monter
  const installationsFetchedRef = useRef<Set<number>>(new Set());
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchAllInstallations = async () => {
      // Zapobiegaj wielokrotnym równoległym wywołaniom
      if (isFetchingRef.current) return;

      if (!clients || clients.length === 0 || isUserClient()) return;

      // Sprawdź, czy już pobrano instalacje dla wszystkich klientów
      const clientsToFetch = clients.filter(
        client => !installationsFetchedRef.current.has(client.id),
      );
      if (clientsToFetch.length === 0) return;

      isFetchingRef.current = true;

      try {
        const installationsPromises = clientsToFetch.map(client =>
          getClientInstallationsRef.current({ data: { klient_id: client.id } }),
        );

        const results = await Promise.all(installationsPromises);
        const allInst: ClientsInstallationListItem[] = [];
        results.forEach((result, index) => {
          if (result?.installation_list) {
            allInst.push(...result.installation_list);
            // Oznacz klienta jako pobranego
            installationsFetchedRef.current.add(clientsToFetch[index].id);
          }
        });

        // Dodaj do istniejących instalacji zamiast zastępować
        setAllInstallations(prev => [...(prev || []), ...allInst]);
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się pobrać instalacji');
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Nie udało się pobrać instalacji', error);
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    fetchAllInstallations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, isUserClient]);

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const toggleDeleteOverlay = useCallback(() => {
    setDeleteVisible(!deleteVisible);
  }, [deleteVisible]);

  // Handle external trigger to show add overlay
  useEffect(() => {
    if (shouldShowAddOverlay) {
      setVisible(true);
    }
  }, [shouldShowAddOverlay]);

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleDeleteOverlay();
  };

  const onDeleteConfirmed = async () => {
    if (idToDelete) {
      try {
        await deleteOffer({ data: { oferta_id: idToDelete } });
        toggleDeleteOverlay();
        setIdToDelete(null); // Reset ID
        Alert.alert(
          route.params?.isTemplate ? 'Usunięto szablon' : 'Usunięto ofertę',
        );
        if (route.params?.isTemplate) {
          loadTemplates();
        } else if (getOffers) {
          getOffers();
        }
        // Force refresh of filtered offers
        setFilteredOffers(null);
      } catch (error) {
        toggleDeleteOverlay();
        setIdToDelete(null); // Reset ID even on error
        Alert.alert(
          'Błąd',
          route.params?.isTemplate
            ? 'Nie udało się usunąć szablonu'
            : 'Nie udało się usunąć oferty',
        );
      }
    }
  };

  useEffect(() => {
    if (offers && !route.params?.isTemplate) {
      // Filtruj tylko oferty (nie szablony)
      const filteredItems = offers.filter(item => item.is_template === false);

      if (
        route.params &&
        route.params.from === 'installation' &&
        route.params.installationId
      ) {
        // Filtruj oferty po instalacji
        const filtered = filteredItems.filter(
          item => item.instalacja === route.params?.installationId,
        );
        setFilteredOffers(filtered);
      } else if (
        route.params &&
        route.params.from === 'installation' &&
        route.params.clientId
      ) {
        // Filtruj oferty po kliencie (przez instalacje)
        if (clientInstallationsRes?.installation_list) {
          const clientInstallationIds =
            clientInstallationsRes.installation_list.map(inst => inst.id);
          const filtered = filteredItems.filter(item =>
            clientInstallationIds.includes(item.instalacja),
          );
          setFilteredOffers(filtered);
        } else {
          // Jeśli nie mamy jeszcze instalacji, pokaż wszystkie oferty
          setFilteredOffers(filteredItems);
        }
      } else {
        // Sort offers by ID (descending) - newest first
        const sortedOffers = filteredItems.sort((a, b) => b.id - a.id);
        setFilteredOffers(sortedOffers);
      }
    } else if (!offers && !route.params?.isTemplate) {
      setFilteredOffers(null);
    }
  }, [offers, route.params, clientInstallationsRes]);

  return (
    <View style={styles.container}>
      <View style={styles.listContainer}>
        <FlashList<Offer>
          data={filteredOffers || []}
          renderItem={({ item }) => (
            <OfferRow
              onDeletePress={onDelete}
              offer={item}
              isTemplate={route.params?.isTemplate}
              allInstallations={allInstallations}
              clients={clients}
            />
          )}
          estimatedItemSize={80}
        />
      </View>

      <Spinner
        visible={offersLoading}
        textContent="Trwa pobieranie danych..."
        textStyle={{ color: Colors.gray }}
      />

      <ConfirmationOverlay
        visible={deleteVisible}
        onBackdropPress={toggleDeleteOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć ofertę?"
      />

      <OfferOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        client={route.params?.clientId}
        installation={route.params?.installationId}
        isTemplate={route.params?.isTemplate}
      />
    </View>
  );
}

export default OffersList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  listItem: {
    width: '100%',
    paddingVertical: 0,
  },
  noteTextIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.offersTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonStyle: {
    flex: 1,
    overflow: 'hidden',
    height: 60,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 0,
    margin: 0,
    padding: 0,
    backgroundColor: Colors.transparent,
  },
  buttonTitleStyle: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    backgroundColor: Colors.transparent,
  },
  offerTitle: {
    fontSize: 16,
  },
  offerSubtitle: {
    fontSize: 14,
    color: Colors.grayerText,
    padding: 4,
    borderRadius: 9,
    alignSelf: 'flex-start',
  },
  clientInstallationText: {
    fontSize: 12,
    color: Colors.grayerText,
    fontStyle: 'italic',
  },
  offerDelete: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    color: Colors.white,
    backgroundColor: Colors.logout,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  overlay: {
    padding: 0,
    width: '95%',
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  overlayHeader: {
    paddingHorizontal: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overlayHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'left',
    fontFamily: 'Poppins_600SemiBold',
    top: 15,
    left: 15,
  },
  overlayHeaderButton: {
    width: 44,
  },
  overlayRadioContainer: {
    padding: 20,
  },
  radioButtons: {
    fontSize: 14,
    letterSpacing: 0.2,
    color: Colors.black,
  },
  continueButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.offersTeal,
    padding: 0,
  },
  closeButton: {
    marginTop: 8,
  },
  isAcceptedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  deviceCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.grayerText,
  },
});
