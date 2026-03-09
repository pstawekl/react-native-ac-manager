import { Route, useFocusEffect } from '@react-navigation/native';
import { Button, Divider, Overlay, Text } from '@rneui/themed';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import FilePicker, { File } from '../../components/FilePicker';
import FloatingActionButton from '../../components/FloatingActionButton';
import HorizontalTabs, { TabItem } from '../../components/HorizontalTabs';
import { Dropdown, FormInput, Textarea } from '../../components/Input';
import Photo from '../../components/Photo';
import SegmentedControl from '../../components/SegmentedControl';
import EditIcon from '../../components/icons/EditIcon';
import FilesIcon from '../../components/icons/FilesIcon';
import InfoCircle from '../../components/icons/InfoCircle';
import MoneyReciveIcon from '../../components/icons/MoneyReciveIcon';
import NoteTextIcon from '../../components/icons/NoteTextIcon';
import SearchStatusIcon from '../../components/icons/SearchStatusIcon';
import TaskListIcon from '../../components/icons/TaskIcon';
import Colors from '../../consts/Colors';
import { getClientDisplayPrimary } from '../../helpers/clientDisplay';
import { getImageUrl } from '../../helpers/image';
import useApi from '../../hooks/useApi';
import { ClientMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import useOffers from '../../providers/OffersProvider';
import useStaff from '../../providers/StaffProvider';
import useTasks from '../../providers/TasksProvider';
import {
  Agreement,
  AgreementListResponse,
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';

// Typy dla zakładek
type TabType =
  | 'dane'
  | 'zadania'
  | 'instalacje'
  | 'oględziny'
  | 'oferty'
  | 'faktury'
  | 'umowy';

// Sekcja pomieszczenia/urządzenia (7 pól)
type InspectionSection = {
  rooms_m2: number | string | undefined;
  power_amount: number | string | undefined;
  typ_urzadzenia_wewnetrznego: string;
  miejsce_montazu: string;
  dlugosc_instalacji: number | string | undefined;
  prowadzenie_instalacji: string;
  prowadzenie_skroplin: string;
  device_photo?: { id: number; image: string } | undefined;
};

// Typy dla formularza oględzin
type ClientInspectionData = {
  rooms: number | undefined; // Ilość chłodzonych pomieszczeń (liczba sekcji)
  device_amount: number; // Liczba urządzeń z dropdownu (1–10)
  roomSections: InspectionSection[];
  deviceSections: InspectionSection[];
  miejsce_agregatu: string;
  podlaczenie_elektryki: string;
  miejsce_urzadzen_wew: string;
  obnizenie: number | undefined;
  uwagi: string;
  photo: File | undefined;
  installation_selector?: number;
};

const defaultInspectionSection: InspectionSection = {
  rooms_m2: undefined,
  power_amount: undefined,
  typ_urzadzenia_wewnetrznego: '',
  miejsce_montazu: '',
  dlugosc_instalacji: undefined,
  prowadzenie_instalacji: '',
  prowadzenie_skroplin: '',
  device_photo: undefined,
};

type InspectionPhoto = {
  id: number;
  image: string;
  created_date: string;
};

type InstallationDataResponse = {
  inspekcja?: Array<{
    miejsce_agregatu?: string;
    podlaczenie_elektryki?: string;
    miejsce_urzadzen_wew?: string;
    sposob_montazu?: string;
    uwagi_agregat?: string;
    uwagi_instalacja?: string;
    uwagi_elektryka?: string;
    uwagi_ogolne?: string;
    rooms?: number;
    rooms_m2?: number;
    device_amount?: number;
    power_amount?: number;
    typ_urzadzenia_wewnetrznego?: string;
    miejsce_montazu?: string;
    dlugosc_instalacji?: number;
    prowadzenie_instalacji?: string;
    prowadzenie_skroplin?: string;
    obnizenie?: number;
    uwagi?: string;
  }>;
  photos?: Array<{
    id: number;
    image: string;
    created_date: string;
  }>;
};

const clientInspectDefaultData: ClientInspectionData = {
  rooms: 1,
  device_amount: 1,
  roomSections: [{ ...defaultInspectionSection }],
  deviceSections: [{ ...defaultInspectionSection }],
  miejsce_agregatu: '',
  podlaczenie_elektryki: '',
  miejsce_urzadzen_wew: '',
  obnizenie: undefined,
  uwagi: '',
  photo: undefined,
};

// Definicja zakładek dla menu klienta
const clientTabs: TabItem[] = [
  { id: 'dane', label: 'Dane' },
  { id: 'zadania', label: 'Zadania' },
  { id: 'instalacje', label: 'Instalacje' },
  { id: 'oferty', label: 'Oferty' },
  { id: 'faktury', label: 'Faktury' },
  { id: 'umowy', label: 'Umowy' },
];

// Helper function to geocode addresses
const getCoordinatesFromAddress = async (
  address: string,
): Promise<{ lat: number; lng: number } | null> => {
  if (!address) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        address,
      )}&format=json`,
      {
        headers: {
          'User-Agent': 'ac-manager-app/1.0',
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const lat = Number.parseFloat(data[0].lat);
      const lng = Number.parseFloat(data[0].lon);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }

    return null;
  } catch {
    return null;
  }
};

type FormData = {
  url: string;
  email: string;
  kod_pocztowy: string;
  first_name: string;
  last_name: string;
  nazwa_firmy: string;
  numer_telefonu: string;
  miasto: string;
  nip: string;
  rodzaj_klienta: string;
  mieszkanie: string;
  ulica: string;
  numer_domu: string;
  client_status: string;
};

// Komponent widoku "Dane" - formularz z danymi klienta
function DaneView({
  client,
  navigation,
  onClientUpdate,
}: {
  client: Client;
  navigation: any;
  onClientUpdate?: () => void;
}) {
  const { token } = useAuth();
  const { getClients } = useClients();
  const [clientType, setClientType] = useState<string | undefined>(
    client?.rodzaj_klienta ?? 'firma',
  );
  const [isEditing, setIsEditing] = useState(false);
  const [invitationTimeout, setInvitationTimeout] = useState<number>(0);
  const timeoutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const { execute, loading } = useApi<{
    message: string;
    error: string;
    Status?: string;
    client_id?: number;
  }>({
    path: 'change_child_data',
  });

  const { execute: sendInvitationApi } = useApi<{
    status: string;
    error?: string;
    invitation_id?: number;
    message?: string;
  }>({
    path: 'send_invitation',
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      first_name: client?.first_name ?? '',
      last_name: client?.last_name ?? '',
      email: client?.email ?? '',
      nazwa_firmy: client?.nazwa_firmy ?? '',
      numer_telefonu: client?.numer_telefonu ?? '',
      miasto: client?.miasto ?? '',
      ulica: client?.ulica ?? '',
      numer_domu: client?.numer_domu ?? '',
      rodzaj_klienta: client?.rodzaj_klienta ?? 'firma',
      mieszkanie: client?.mieszkanie ?? '',
      kod_pocztowy: client?.kod_pocztowy ?? '',
      nip: client?.nip ?? '',
      url: client?.url ?? 'http://51.68.143.33/static/default_user.png',
      client_status: client?.client_status || '0',
    },
  });

  const watchedClientType = watch('rodzaj_klienta');

  useEffect(() => {
    if (client) {
      reset({
        first_name: client.first_name ?? '',
        last_name: client.last_name ?? '',
        email: client.email ?? '',
        nazwa_firmy: client.nazwa_firmy ?? '',
        numer_telefonu: client.numer_telefonu ?? '',
        miasto: client.miasto ?? '',
        ulica: client.ulica ?? '',
        numer_domu: client.numer_domu ?? '',
        rodzaj_klienta: client.rodzaj_klienta ?? 'firma',
        mieszkanie: client.mieszkanie ?? '',
        kod_pocztowy: client.kod_pocztowy ?? '',
        nip: client.nip ?? '',
        url: client.url ?? 'http://51.68.143.33/static/default_user.png',
        client_status: client.client_status || '0',
      });
    }
  }, [client, reset]);

  // Timer dla timeoutu zaproszeń
  useEffect(() => {
    if (invitationTimeout > 0) {
      timeoutIntervalRef.current = setInterval(() => {
        setInvitationTimeout(prev => {
          if (prev <= 1) {
            if (timeoutIntervalRef.current) {
              clearInterval(timeoutIntervalRef.current);
              timeoutIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timeoutIntervalRef.current) {
        clearInterval(timeoutIntervalRef.current);
        timeoutIntervalRef.current = null;
      }
    };
  }, [invitationTimeout]);

  const handleSendInvitation = useCallback(async () => {
    if (invitationTimeout > 0) {
      return; // Przycisk zablokowany podczas timeoutu
    }

    if (!client?.email || client.email.endsWith('@temp.local')) {
      Alert.alert(
        'Błąd',
        'Klient nie ma prawidłowego adresu email. Nie można wysłać zaproszenia.',
      );
      return;
    }

    if (client?.has_account) {
      Alert.alert(
        'Informacja',
        'Klient ma już konto w aplikacji. Nie można wysłać zaproszenia.',
      );
      return;
    }

    try {
      const invitationResponse = await sendInvitationApi({
        data: {
          token,
          email: client.email,
          client_id: client.id,
        },
      });

      if (invitationResponse?.status === 'Zaproszenie wysłane') {
        Alert.alert(
          invitationResponse?.message ||
          'Zaproszenie do aplikacji zostało wysłane na adres email klienta.',
        );
        // Ustaw timeout 30 sekund
        setInvitationTimeout(30);
      } else if (invitationResponse?.error) {
        Alert.alert('Błąd', invitationResponse.error);
      } else {
        Alert.alert(
          'Błąd',
          'Nie udało się wysłać zaproszenia. Spróbuj ponownie później.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Błąd',
        'Nie udało się wysłać zaproszenia do aplikacji. Spróbuj ponownie później.',
      );
    }
  }, [client, token, sendInvitationApi, invitationTimeout]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      const finalData: FormData & { user_id: number } = {
        ...data,
        user_id: client.id,
      };

      // Geokodowanie adresu przed zapisem
      const hasAddress =
        Boolean(data.ulica) &&
        Boolean(data.numer_domu) &&
        Boolean(data.mieszkanie) &&
        Boolean(data.kod_pocztowy) &&
        Boolean(data.miasto);

      if (hasAddress) {
        const geocodeQuery = [
          data.ulica,
          data.numer_domu ?? '',
          data.mieszkanie ?? '',
          data.kod_pocztowy,
          data.miasto,
        ]
          .filter(Boolean)
          .join(', ');

        const coordinates = await getCoordinatesFromAddress(geocodeQuery);

        if (
          coordinates &&
          coordinates.lat !== 0 &&
          coordinates.lng !== 0 &&
          Number.isFinite(coordinates.lat) &&
          Number.isFinite(coordinates.lng)
        ) {
          (finalData as any).latitude = String(coordinates.lat);
          (finalData as any).longitude = String(coordinates.lng);
        }
      }

      const response = await execute({ data: finalData });

      if (response?.message === 'User and user data updated successfully') {
        Alert.alert('Klient zaktualizowany.');
        setIsEditing(false);
        if (getClients) {
          await getClients();
        }
        if (onClientUpdate) {
          onClientUpdate();
        }
      } else {
        Alert.alert(
          'Błąd',
          response?.error || 'Wystąpił błąd podczas zapisywania',
        );
      }
    },
    [execute, getClients, client, onClientUpdate],
  );

  const handleCancelEdit = useCallback(() => {
    reset({
      first_name: client.first_name ?? '',
      last_name: client.last_name ?? '',
      email: client.email ?? '',
      nazwa_firmy: client.nazwa_firmy ?? '',
      numer_telefonu: client.numer_telefonu ?? '',
      miasto: client.miasto ?? '',
      ulica: client.ulica ?? '',
      numer_domu: client.numer_domu ?? '',
      rodzaj_klienta: client.rodzaj_klienta ?? 'firma',
      mieszkanie: client.mieszkanie ?? '',
      kod_pocztowy: client.kod_pocztowy ?? '',
      nip: client.nip ?? '',
      url: client.url ?? 'http://51.68.143.33/static/default_user.png',
      client_status: client.client_status || '0',
    });
    setClientType(client?.rodzaj_klienta ?? 'firma');
    setIsEditing(false);
  }, [client, reset]);

  const previewAddress =
    [
      client?.ulica,
      client?.numer_domu,
      client?.mieszkanie ? `m. ${client.mieszkanie}` : null,
      client?.kod_pocztowy,
      client?.miasto,
    ]
      .filter(Boolean)
      .join(', ') || '—';

  if (!isEditing) {
    const previewRows: { label: string; value: string }[] = [
      {
        label: 'Nazwa / Imię i nazwisko',
        value: getClientDisplayPrimary(client),
      },
      { label: 'Adres', value: previewAddress },
    ];
    if (client?.rodzaj_klienta === 'firma') {
      previewRows.push({
        label: 'NIP',
        value: client?.nip || '—',
      });
    }
    previewRows.push(
      { label: 'E-mail', value: client?.email || '—' },
      { label: 'Telefon', value: client?.numer_telefonu || '—' },
    );
    return (
      <View style={styles.formView}>
        <View style={styles.danePreviewCard}>
          {previewRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.danePreviewRow,
                index === previewRows.length - 1 && styles.danePreviewRowLast,
              ]}
            >
              <Text style={styles.danePreviewLabel}>{row.label}</Text>
              <Text style={styles.danePreviewValue}>{row.value}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.daneEditButton}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.7}
        >
          <EditIcon color={Colors.black} size={22} />
          <Text style={styles.daneEditButtonText}>Edytuj dane klienta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.formView}>
      <ScrollView
        style={styles.formScrollView}
        contentContainerStyle={styles.formScrollContent}
      >
        <View style={styles.segmentedControlContainer}>
          <SegmentedControl
            options={[
              { label: 'Firma', value: 'firma' },
              { label: 'Klient prywatny', value: 'osoba_prywatna' },
            ]}
            value={watchedClientType}
            onChange={value => {
              setValue('rodzaj_klienta', value);
              setClientType(value);
            }}
          />
        </View>
        {watchedClientType === 'firma' && (
          <View style={styles.inputContainer}>
            <FormInput
              name="nazwa_firmy"
              control={control}
              label="Nazwa firmy"
              noPadding
            />
            <FormInput
              name="nip"
              control={control}
              label="NIP"
              error={errors.nip}
              rules={{
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Nieprawidłowy numer NIP (10 cyfr)',
                },
              }}
              noPadding
            />
            <View style={styles.gusDataButton}>
              <SubmitButton
                title="Pobierz dane z gus"
                onPress={() => undefined}
                style={styles.submitButtonStyle}
                titleStyle={styles.submitButtonTitleStyle}
              />
            </View>
          </View>
        )}
        <Text style={styles.sectionText}>Informacje personalne</Text>
        <View style={{ gap: -18 }}>
          <View style={styles.inputContainer}>
            <FormInput
              name="first_name"
              control={control}
              label="Imię *"
              noPadding
              rules={{
                required: 'Imię jest wymagane',
              }}
            />
            <FormInput
              name="last_name"
              control={control}
              label="Nazwisko *"
              noPadding
              rules={{
                required: 'Nazwisko jest wymagane',
              }}
            />
          </View>
          <View style={{ paddingHorizontal: 8 }}>
            <FormInput
              name="ulica"
              control={control}
              label="Ulica"
              noPadding
              rules={{
                required: 'Ulica jest wymagana',
              }}
            />
            <FormInput
              name="numer_domu"
              control={control}
              label="Numer budynku"
              noPadding
              rules={{
                required: 'Numer budynku jest wymagany',
              }}
            />
            <FormInput
              name="mieszkanie"
              control={control}
              label="Numer lokalu"
              noPadding
              rules={{
                required: 'Numer lokalu jest wymagany',
              }}
            />
          </View>
          <View style={styles.inputContainer}>
            <FormInput
              name="kod_pocztowy"
              control={control}
              label="Kod pocztowy"
              noPadding
              rules={{
                required: 'Kod pocztowy jest wymagany',
                pattern: {
                  value: /^\d{2}-\d{3}$/,
                  message: 'Nieprawidłowy format kodu pocztowego (XX-XXX)',
                },
              }}
            />
            <FormInput
              name="miasto"
              control={control}
              label="Miasto"
              noPadding
              rules={{
                required: 'Miasto jest wymagane',
              }}
            />
          </View>
        </View>
        <Text style={styles.sectionText}>Dane kontaktowe</Text>
        <View style={{ gap: -18 }}>
          <FormInput
            name="email"
            control={control}
            label="E-mail *"
            noPadding
            error={errors.email}
            rules={{
              required: 'E-mail jest wymagany',
              validate: (value: string | null) => {
                if (value && value.endsWith('@temp.local')) {
                  return true;
                }
                if (
                  value &&
                  !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value)
                ) {
                  return 'Nieprawidłowy adres e-mail';
                }
                return true;
              },
            }}
          />
          <FormInput
            name="numer_telefonu"
            control={control}
            error={errors.numer_telefonu}
            label="Numer telefonu"
            rules={{
              pattern: {
                value: /^[0-9]{9}$/,
                message: 'Nieprawidłowy numer telefonu (9 cyfr)',
              },
            }}
            noPadding
          />
        </View>
        <Dropdown
          label="Status klienta"
          name="client_status"
          control={control}
          options={[
            { label: 'Aktywny', value: '0' },
            { label: 'Nieaktywny', value: '1' },
          ]}
          isBordered={false}
        />

        {client?.has_account !== true && (
          <View style={styles.invitationButtonContainer}>
            <SubmitButton
              title={
                invitationTimeout > 0
                  ? `Zaproś do aplikacji (${invitationTimeout}s)`
                  : 'Zaproś do aplikacji'
              }
              onPress={handleSendInvitation}
              disabled={invitationTimeout > 0}
              style={[
                styles.invitationButton,
                invitationTimeout > 0 && styles.invitationButtonDisabled,
              ]}
              titleStyle={styles.invitationButtonTitle}
            />
          </View>
        )}

        {/* Przyciski Anuluj i Zapisz na dole formularza */}
        <View style={styles.formFooter}>
          <TouchableOpacity
            style={styles.daneCancelButton}
            onPress={handleCancelEdit}
            activeOpacity={0.7}
          >
            <Text style={styles.daneCancelButtonText}>Anuluj</Text>
          </TouchableOpacity>
          <SubmitButton
            title="Zapisz"
            onPress={handleSubmit(onSubmit)}
            style={[styles.submitButton, styles.daneSaveButton]}
            titleStyle={styles.submitButtonTitle}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Komponent wiersza zadania
function ClientTaskRow({
  task,
  navigation,
  teams,
  employees,
}: {
  task: any;
  navigation: any;
  teams?: any[];
  employees?: any;
}) {
  const { id, nazwa, typ, status, start_date, end_date, grupa } = task;

  // Formatuj datę i czas w formacie "Dziś HH:mm - HH:mm" lub "DD.MM.YYYY HH:mm - HH:mm"
  const formatDateTime = () => {
    if (!start_date) return '';
    const startDate = parseISO(start_date);
    const endDate = end_date ? parseISO(end_date) : null;

    let datePrefix = '';
    if (isToday(startDate)) {
      datePrefix = 'Dziś';
    } else if (isYesterday(startDate)) {
      datePrefix = 'Wczoraj';
    } else if (isTomorrow(startDate)) {
      datePrefix = 'Jutro';
    } else {
      datePrefix = format(startDate, 'dd.MM.yyyy');
    }

    const startTime = format(startDate, 'HH:mm');
    const endTime = endDate ? format(endDate, 'HH:mm') : '';

    return endTime
      ? `${datePrefix} ${startTime} - ${endTime}`
      : `${datePrefix} ${startTime}`;
  };

  // Pobierz nazwę ekipy/pracownika
  const getTeamName = () => {
    if (!grupa) return null;
    const grupaId = grupa;
    if (grupaId > 1 && teams) {
      // Ekipa
      const team = teams.find(t => t.id === grupaId);
      return team ? team.nazwa : `Ekipa ${grupaId}`;
    }
    // Pracownik
    if (employees?.employees) {
      const employee = employees.employees.find((e: any) => e.id === grupaId);
      return employee
        ? `${employee.first_name} ${employee.last_name}`
        : `Pracownik ${grupaId}`;
    }
    return null;
  };

  const teamName = getTeamName();
  const dateTimeString = formatDateTime();

  const handleTaskPress = () => {
    navigation.navigate('Tasks', {
      screen: 'TaskDetails',
      params: {
        task,
        fromClient: true,
        clientId: task.instalacja_info?.klient_id,
      },
    });
  };

  return (
    <TouchableOpacity
      style={styles.clientTaskItem}
      onPress={handleTaskPress}
      activeOpacity={0.7}
    >
      <Text style={styles.clientTaskTitle}>
        {nazwa || typ.charAt(0).toUpperCase() + typ.slice(1).toLowerCase()}
      </Text>
      <Divider style={styles.clientTaskDivider} />
      <View style={styles.clientTaskTagsContainer}>
        {dateTimeString && (
          <View style={styles.clientTaskDateTag}>
            <Text style={styles.clientTaskDateTagText}>{dateTimeString}</Text>
          </View>
        )}
        {teamName && (
          <View style={styles.clientTaskTeamTag}>
            <Text style={styles.clientTaskTeamTagText}>{teamName}</Text>
          </View>
        )}
      </View>
      {task.instalacja_info?.name != null ||
        task.instalacja_info?.id != null ? (
        <View style={styles.rowInstallation}>
          <Text style={styles.rowInstallationText}>
            Instalacja:{' '}
            {task.instalacja_info?.name ??
              `Instalacja ${task.instalacja_info?.id}`}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// Komponent widoku "Zadania"
function ZadaniaView({
  clientId,
  navigation,
}: {
  clientId: number;
  navigation: any;
}) {
  const { result: allTasks, execute: getTasks, loading } = useTasks();
  const { teams, employees } = useStaff();
  const [clientTasks, setClientTasks] = useState<any[]>([]);

  useEffect(() => {
    if (getTasks) {
      getTasks();
    }
  }, [getTasks]);

  useEffect(() => {
    if (allTasks && allTasks.length > 0) {
      // Filtruj zadania dla tego konkretnego klienta
      const filtered = allTasks.filter(
        task =>
          task.instalacja_info && task.instalacja_info.klient_id === clientId,
      );
      setClientTasks(filtered);
    } else {
      setClientTasks([]);
    }
  }, [allTasks, clientId]);

  if (loading) {
    return (
      <View style={styles.tasksContentView}>
        <Text style={styles.emptyText}>Ładowanie zadań...</Text>
      </View>
    );
  }

  if (clientTasks.length === 0) {
    return (
      <View style={styles.tasksContentView}>
        <Text style={styles.emptyText}>Brak zadań dla tego klienta.</Text>
      </View>
    );
  }

  return (
    <View style={styles.tasksContentView}>
      <FlatList
        data={clientTasks}
        contentContainerStyle={styles.clientTasksList}
        renderItem={({ item }) => (
          <ClientTaskRow
            task={item}
            navigation={navigation}
            teams={teams || undefined}
            employees={employees}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

// Komponent karty instalacji
function InstallationCard({
  installation,
  client,
  onPress,
  navigation,
  clientId,
}: {
  installation: ClientsInstallationListItem;
  client?: Client;
  onPress: () => void;
  navigation: any;
  clientId: number;
}) {
  // Formatowanie adresu - tylko dane instalacji, jeśli nie ma to brak wyświetlania
  const formatAddress = () => {
    const inst = installation;
    // Jeśli instalacja nie ma żadnych danych adresowych, nie wyświetlamy adresu
    if (
      !inst.ulica &&
      !inst.numer_domu &&
      !inst.mieszkanie &&
      !inst.kod_pocztowy &&
      !inst.miasto
    ) {
      return null;
    }
    const street = inst.ulica ? `ul. ${inst.ulica}` : '';
    const houseNumber = inst.numer_domu || '';
    const apartment = inst.mieszkanie ? `/${inst.mieszkanie}` : '';
    const address = [street, houseNumber + apartment].filter(Boolean).join(' ');
    const city = inst.miasto || '';
    return [address, city].filter(Boolean).join(', ') || null;
  };

  // Formatowanie daty montażu – tylko jeśli została ustawiona w montażu
  const formatInstallationDate = () => {
    if (!installation.data_montazu) {
      return '-';
    }

    try {
      return format(parseISO(installation.data_montazu), 'dd.MM.yyyy');
    } catch {
      return '-';
    }
  };

  const hasDevice =
    installation.montaz_device_producent != null ||
    installation.montaz_device_typ != null ||
    installation.montaz_device_moc != null;

  return (
    <TouchableOpacity style={styles.installationCard} onPress={onPress}>
      {/* Nazwa instalacji */}
      <Text style={styles.installationCardTitle}>
        {installation.name || `Instalacja ${installation.id}`}
      </Text>

      {/* Informacje o instalacji */}
      <View style={styles.installationCardInfo}>
        <View style={styles.installationCardInfoRow}>
          <Text style={styles.installationCardInfoLabel}>Data montażu:</Text>
          <Text style={styles.installationCardInfoValue}>
            {formatInstallationDate()}
          </Text>
        </View>
        {formatAddress() !== null && (
          <View style={styles.installationCardInfoRow}>
            <Text style={styles.installationCardInfoLabel}>Adres:</Text>
            <Text style={styles.installationCardInfoValue}>
              {formatAddress()}
            </Text>
          </View>
        )}
        {installation.montaz_is_multisplit ? (
          <View style={styles.installationCardInfoRow}>
            <Text style={styles.installationCardInfoLabel}>
              Montaż multisplit:
            </Text>
            <Text style={styles.installationCardInfoValue}>
              {installation.montaz_multisplit_jedn_wew_count ?? 0} jednostek
              wewnętrznych, {installation.montaz_multisplit_agregat_count ?? 0}{' '}
              agregatów
            </Text>
          </View>
        ) : null}
        {hasDevice && !installation.montaz_is_multisplit && (
          <>
            {installation.montaz_device_producent != null &&
              installation.montaz_device_producent !== '' ? (
              <View style={styles.installationCardInfoRow}>
                <Text style={styles.installationCardInfoLabel}>Producent:</Text>
                <Text style={styles.installationCardInfoValue}>
                  {installation.montaz_device_producent}
                </Text>
              </View>
            ) : null}
            {installation.montaz_device_typ != null &&
              installation.montaz_device_typ !== '' ? (
              <View style={styles.installationCardInfoRow}>
                <Text style={styles.installationCardInfoLabel}>Typ:</Text>
                <Text style={styles.installationCardInfoValue}>
                  {installation.montaz_device_typ}
                </Text>
              </View>
            ) : null}
            {installation.montaz_device_moc != null &&
              installation.montaz_device_moc !== '' ? (
              <View style={styles.installationCardInfoRow}>
                <Text style={styles.installationCardInfoLabel}>
                  Moc urządzenia:
                </Text>
                <Text style={styles.installationCardInfoValue}>
                  {installation.montaz_device_moc}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Divider oddzielający informacje od przycisków */}
      <Divider style={styles.installationCardDivider} />

      {/* 5 przycisków */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.installationCardButtons}
      >
        <TouchableOpacity
          style={styles.installationCardButtonContainer}
          onPress={() =>
            navigation.navigate('Settings', {
              installationId: installation.id.toString(),
              clientId: clientId.toString(),
              activeTab: 'szczegoly',
            })
          }
        >
          <View style={styles.installationCardButton}>
            <InfoCircle color={Colors.black} size={24} />
          </View>
          <Text style={styles.installationCardButtonLabel}>Szczegóły</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.installationCardButtonContainer}
          onPress={() =>
            navigation.navigate('Settings', {
              installationId: installation.id.toString(),
              clientId: clientId.toString(),
              activeTab: 'zadania',
            })
          }
        >
          <View style={styles.installationCardButton}>
            <TaskListIcon color={Colors.black} size={24} />
          </View>
          <Text style={styles.installationCardButtonLabel}>Zadania</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.installationCardButtonContainer}
          onPress={() =>
            navigation.navigate('Settings', {
              installationId: installation.id.toString(),
              clientId: clientId.toString(),
              activeTab: 'oferty',
            })
          }
        >
          <View style={styles.installationCardButton}>
            <NoteTextIcon color={Colors.black} size={24} />
          </View>
          <Text style={styles.installationCardButtonLabel}>Oferty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.installationCardButtonContainer}
          onPress={() =>
            navigation.navigate('Settings', {
              installationId: installation.id.toString(),
              clientId: clientId.toString(),
              activeTab: 'faktury',
            })
          }
        >
          <View style={styles.installationCardButton}>
            <MoneyReciveIcon color={Colors.black} size={24} />
          </View>
          <Text style={styles.installationCardButtonLabel}>Faktury</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.installationCardButtonContainer}
          onPress={() =>
            navigation.navigate('Settings', {
              installationId: installation.id.toString(),
              clientId: clientId.toString(),
              activeTab: 'przeglady',
            })
          }
        >
          <View style={styles.installationCardButton}>
            <SearchStatusIcon color={Colors.black} size={24} />
          </View>
          <Text style={styles.installationCardButtonLabel}>Przeglądy</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableOpacity>
  );
}

// Komponent widoku "Instalacje"
function InstallationsView({
  installations,
  clientId,
  navigation,
  onAddInstallation,
  client,
}: {
  installations: ClientsInstallationListItem[];
  clientId: number;
  navigation: any;
  onAddInstallation: () => void;
  client?: Client;
}) {
  const navigateToInstallation = (installationId: number) => {
    navigation.navigate('Settings', {
      installationId: installationId.toString(),
      clientId: clientId.toString(),
      returnTab: 'instalacje', // Informacja o zakładce z której wyszliśmy
    });
  };

  return (
    <ScrollView
      style={styles.contentView}
      contentContainerStyle={styles.contentViewContainer}
    >
      {installations.length > 0 ? (
        installations.map(installation => (
          <InstallationCard
            key={installation.id}
            installation={installation}
            client={client}
            onPress={() => navigateToInstallation(installation.id)}
            navigation={navigation}
            clientId={clientId}
          />
        ))
      ) : (
        <Text style={styles.emptyText}>Brak instalacji</Text>
      )}
    </ScrollView>
  );
}

// Style formularza oględzin: większe etykiety, niższe inputy, mniejsze odstępy

// Komponent galerii zdjęć
function PhotoGallery({
  photos,
  onDeletePhoto,
}: {
  photos: InspectionPhoto[];
  onDeletePhoto: (id: number) => void;
}) {
  const renderPhoto = ({ item }: { item: InspectionPhoto }) => {
    const imageUrl = getImageUrl(item.image);
    if (!imageUrl) {
      return null;
    }
    return (
      <View style={styles.photoItem}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeletePhoto(item.id)}
        >
          <Button
            title="×"
            buttonStyle={styles.deleteButtonStyle}
            titleStyle={styles.deleteButtonTitle}
          />
        </TouchableOpacity>
        <Photo uri={imageUrl} style={styles.thumbnail} />
      </View>
    );
  };

  return (
    <View style={styles.photoGalleryContainer}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photoGalleryContent}
      />
    </View>
  );
}

// Komponent widoku "Oględziny"
function OględzinyView({
  clientId,
  installations,
}: {
  clientId: number;
  installations: ClientsInstallationListItem[];
}) {
  const initialInstallationId =
    installations.length > 0 ? installations[0].id : null;
  const [selectedInstallationId, setSelectedInstallationId] = useState<
    number | null
  >(initialInstallationId);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const { control, handleSubmit, setValue, watch, reset, getValues } =
    useForm<ClientInspectionData>({
      defaultValues: {
        ...clientInspectDefaultData,
        installation_selector: initialInstallationId || undefined,
      },
    });
  const { fields: roomFields, replace: replaceRoomSections } = useFieldArray({
    control,
    name: 'roomSections',
  });
  const { fields: deviceFields, replace: replaceDeviceSections } =
    useFieldArray({
      control,
      name: 'deviceSections',
    });
  const currentPhoto = watch('photo');
  const roomsCount = watch('rooms');
  const deviceCount = watch('device_amount');
  const watchedDeviceSections = watch('deviceSections');

  const { execute } = useApi<object, ClientInspectionData>({
    path: 'inspekcja_edit',
  });
  const { execute: fetchInstallationData } = useApi<InstallationDataResponse>({
    path: 'installation_data',
  });
  const { execute: addPhotoToGallery } = useApi<object, FormData>({
    path: 'add_photo',
  });
  const { execute: deletePhoto } = useApi<object>({
    path: 'photo_delete',
  });

  const loadInspectionData = useCallback(
    async (installationId: number) => {
      try {
        const res = await fetchInstallationData({
          data: { instalacja_id: installationId },
        });

        if (!res) {
          throw new Error('No data received');
        }

        const d = clientInspectDefaultData;
        reset({
          ...d,
          installation_selector: initialInstallationId || undefined,
        });

        if (res.inspekcja && res.inspekcja.length > 0) {
          const insp = res.inspekcja[0] as Record<string, unknown>;
          const apiSectionToForm = (
            item: Record<string, unknown>,
          ): InspectionSection => ({
            rooms_m2: item.rooms_m2 != null ? Number(item.rooms_m2) : undefined,
            power_amount:
              item.power_amount != null ? Number(item.power_amount) : undefined,
            typ_urzadzenia_wewnetrznego:
              item.typ_urzadzenia_wewnetrznego != null
                ? String(item.typ_urzadzenia_wewnetrznego)
                : '',
            miejsce_montazu:
              item.miejsce_montazu != null ? String(item.miejsce_montazu) : '',
            dlugosc_instalacji:
              item.dlugosc_instalacji != null
                ? Number(item.dlugosc_instalacji)
                : undefined,
            prowadzenie_instalacji:
              item.prowadzenie_instalacji != null
                ? String(item.prowadzenie_instalacji)
                : '',
            prowadzenie_skroplin:
              item.prowadzenie_skroplin != null
                ? String(item.prowadzenie_skroplin)
                : '',
          });

          const rawRoomSections = Array.isArray(insp.room_sections)
            ? insp.room_sections
            : [];
          const rawDeviceSections = Array.isArray(insp.device_sections)
            ? insp.device_sections
            : [];
          const hasRoomSections = rawRoomSections.length > 0;
          const hasDeviceSections = rawDeviceSections.length > 0;

          let rooms: number;
          let deviceAmount: number;
          let roomSections: InspectionSection[];
          let deviceSections: InspectionSection[];

          if (hasRoomSections) {
            rooms = rawRoomSections.length;
            roomSections = rawRoomSections.map((item: unknown) =>
              apiSectionToForm((item as Record<string, unknown>) || {}),
            );
          } else {
            rooms = insp.rooms != null ? Number(insp.rooms) : 1;
            const sectionFromFlat = (): InspectionSection =>
              apiSectionToForm(insp);
            roomSections = Array.from({ length: Math.max(1, rooms) }, (_, i) =>
              i === 0 ? sectionFromFlat() : { ...defaultInspectionSection },
            );
          }

          if (hasDeviceSections) {
            deviceAmount = rawDeviceSections.length;
            deviceSections = rawDeviceSections.map((item: unknown) =>
              apiSectionToForm((item as Record<string, unknown>) || {}),
            );
          } else {
            deviceAmount =
              insp.device_amount != null ? Number(insp.device_amount) : 1;
            const sectionFromFlat = (): InspectionSection =>
              apiSectionToForm(insp);
            deviceSections = Array.from(
              { length: Math.max(1, deviceAmount) },
              (_, i) =>
                i === 0 ? sectionFromFlat() : { ...defaultInspectionSection },
            );
          }

          setValue('rooms', rooms);
          setValue('device_amount', deviceAmount);
          replaceRoomSections(roomSections);
          replaceDeviceSections(deviceSections);
          setValue(
            'miejsce_agregatu',
            insp.miejsce_agregatu != null ? String(insp.miejsce_agregatu) : '',
          );
          setValue(
            'podlaczenie_elektryki',
            insp.podlaczenie_elektryki != null
              ? String(insp.podlaczenie_elektryki)
              : '',
          );
          setValue(
            'miejsce_urzadzen_wew',
            insp.miejsce_urzadzen_wew != null
              ? String(insp.miejsce_urzadzen_wew)
              : '',
          );
          setValue(
            'obnizenie',
            insp.obnizenie != null ? Number(insp.obnizenie) : undefined,
          );
          setValue('uwagi', insp.uwagi != null ? String(insp.uwagi) : '');
        }

        if (res.photos && Array.isArray(res.photos)) {
          const allPhotos = res.photos as any[];
          const galleryPhotos: InspectionPhoto[] = allPhotos
            .filter((p: any) => p.device_section_index == null)
            .map((p: any) => ({
              id: p.id,
              image: p.image,
              created_date: p.created_date || new Date().toISOString(),
            }));
          setPhotos(galleryPhotos);

          const devicePhotos = allPhotos.filter(
            (p: any) => p.device_section_index != null,
          );
          if (devicePhotos.length > 0) {
            const currentDevices = getValues('deviceSections') ?? [];
            let updated = false;
            const next = currentDevices.map((section, idx) => {
              const dp = devicePhotos.find(
                (p: any) => p.device_section_index === idx,
              );
              if (dp) {
                updated = true;
                return {
                  ...section,
                  device_photo: { id: dp.id, image: dp.image },
                };
              }
              return section;
            });
            if (updated) replaceDeviceSections(next);
          }
        } else {
          setPhotos([]);
        }
      } catch (error) {
        setPhotos([]);
      }
    },
    [
      fetchInstallationData,
      reset,
      setValue,
      getValues,
      replaceRoomSections,
      replaceDeviceSections,
      initialInstallationId,
    ],
  );

  useEffect(() => {
    if (selectedInstallationId) {
      loadInspectionData(selectedInstallationId);
    }
  }, [selectedInstallationId, loadInspectionData]);

  // Synchronizacja długości tablic z wartościami rooms i device_amount
  useEffect(() => {
    const r = Math.max(1, Number(roomsCount) || 1);
    const d = Math.max(1, Number(deviceCount) || 1);
    const currentRooms = getValues('roomSections') ?? [];
    const currentDevices = getValues('deviceSections') ?? [];
    if (currentRooms.length !== r) {
      let next: InspectionSection[];
      if (currentRooms.length < r) {
        next = [...currentRooms];
        while (next.length < r) next.push({ ...defaultInspectionSection });
      } else {
        next = currentRooms.slice(0, r);
      }
      replaceRoomSections(next);
    }
    if (currentDevices.length !== d) {
      let next: InspectionSection[];
      if (currentDevices.length < d) {
        next = [...currentDevices];
        while (next.length < d) next.push({ ...defaultInspectionSection });
      } else {
        next = currentDevices.slice(0, d);
      }
      replaceDeviceSections(next);
    }
  }, [
    roomsCount,
    deviceCount,
    getValues,
    replaceRoomSections,
    replaceDeviceSections,
  ]);

  const handleAddPhoto = useCallback(
    async (photo: File) => {
      if (!selectedInstallationId) return;

      try {
        const formData = new FormData();
        formData.append('image', {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        } as any);
        formData.append('instalacja_id', selectedInstallationId.toString());
        formData.append('klient', clientId.toString());
        formData.append('inspekcja', 'true');

        const result = await addPhotoToGallery({ data: formData as any });

        if (result) {
          const refreshResponse = await fetchInstallationData({
            data: { instalacja_id: selectedInstallationId },
          });

          if (
            refreshResponse?.photos &&
            Array.isArray(refreshResponse.photos)
          ) {
            const formattedPhotos: InspectionPhoto[] =
              refreshResponse.photos.map((photoItem: any) => ({
                id: photoItem.id,
                image: photoItem.image,
                created_date:
                  photoItem.created_date || new Date().toISOString(),
              }));
            setPhotos(formattedPhotos);
          }
        }
      } catch (error) {
        Alert.alert('Błąd', 'Wystąpił błąd podczas dodawania zdjęcia');
      }
    },
    [
      addPhotoToGallery,
      fetchInstallationData,
      selectedInstallationId,
      clientId,
    ],
  );

  useEffect(() => {
    if (currentPhoto && currentPhoto.uri) {
      handleAddPhoto(currentPhoto);
    }
  }, [currentPhoto, handleAddPhoto]);

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await deletePhoto({ data: { photo_id: photoId } });
      setPhotos(photos.filter(p => p.id !== photoId));
      Alert.alert('Zdjęcie zostało usunięte');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
    }
  };

  const handleAddDevicePhoto = useCallback(
    async (photo: File, deviceIndex: number) => {
      if (!selectedInstallationId) return;
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        } as any);
        formData.append('instalacja_id', selectedInstallationId.toString());
        formData.append('klient', clientId.toString());
        formData.append('inspekcja', 'true');
        formData.append('device_section_index', deviceIndex.toString());

        const result = await addPhotoToGallery({ data: formData as any });
        if (result) {
          await loadInspectionData(selectedInstallationId);
        }
      } catch (error) {
        Alert.alert(
          'Błąd',
          'Wystąpił błąd podczas dodawania zdjęcia urządzenia',
        );
      }
    },
    [addPhotoToGallery, loadInspectionData, selectedInstallationId, clientId],
  );

  const handleDeleteDevicePhoto = useCallback(
    async (photoId: number, deviceIndex: number) => {
      try {
        await deletePhoto({ data: { photo_id: photoId } });
        const sections = getValues('deviceSections');
        if (sections[deviceIndex]) {
          setValue(`deviceSections.${deviceIndex}.device_photo`, undefined);
        }
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia urządzenia');
      }
    },
    [deletePhoto, getValues, setValue],
  );

  const pickDevicePhoto = useCallback(
    async (deviceIndex: number) => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const ext = asset.type?.includes('png') ? 'png' : 'jpg';
        const name = asset.fileName || `device_photo_${timestamp}.${ext}`;
        const mime = name.toLowerCase().includes('.png')
          ? 'image/png'
          : 'image/jpeg';
        await handleAddDevicePhoto(
          { uri: asset.uri, name, type: mime },
          deviceIndex,
        );
      }
    },
    [handleAddDevicePhoto],
  );

  const onSubmit = async (data: ClientInspectionData) => {
    if (!selectedInstallationId) {
      Alert.alert('Błąd', 'Wybierz instalację');
      return;
    }

    const firstRoom = data.roomSections?.[0];
    const firstDevice = data.deviceSections?.[0];
    const toNum = (v: number | string | undefined) =>
      v !== undefined && v !== '' ? Number(v) : undefined;
    const sectionToApi = (s: InspectionSection) => ({
      rooms_m2: toNum(s.rooms_m2) ?? null,
      power_amount: toNum(s.power_amount) ?? null,
      typ_urzadzenia_wewnetrznego: s.typ_urzadzenia_wewnetrznego ?? '',
      miejsce_montazu: s.miejsce_montazu ?? '',
      dlugosc_instalacji: toNum(s.dlugosc_instalacji) ?? null,
      prowadzenie_instalacji: s.prowadzenie_instalacji ?? '',
      prowadzenie_skroplin: s.prowadzenie_skroplin ?? '',
    });

    try {
      const processedData = {
        rooms: data.rooms !== undefined ? Number(data.rooms) : undefined,
        device_amount: data.device_amount ?? 1,
        rooms_m2: toNum(firstRoom?.rooms_m2),
        power_amount: toNum(
          firstRoom?.power_amount ?? firstDevice?.power_amount,
        ),
        typ_urzadzenia_wewnetrznego:
          firstRoom?.typ_urzadzenia_wewnetrznego ??
          firstDevice?.typ_urzadzenia_wewnetrznego ??
          '',
        miejsce_montazu:
          firstRoom?.miejsce_montazu ?? firstDevice?.miejsce_montazu ?? '',
        dlugosc_instalacji: toNum(
          firstRoom?.dlugosc_instalacji ?? firstDevice?.dlugosc_instalacji,
        ),
        prowadzenie_instalacji:
          firstRoom?.prowadzenie_instalacji ??
          firstDevice?.prowadzenie_instalacji ??
          '',
        prowadzenie_skroplin:
          firstRoom?.prowadzenie_skroplin ??
          firstDevice?.prowadzenie_skroplin ??
          '',
        room_sections: (data.roomSections ?? []).map(sectionToApi),
        device_sections: (data.deviceSections ?? []).map(sectionToApi),
        miejsce_agregatu: data.miejsce_agregatu ?? '',
        podlaczenie_elektryki: data.podlaczenie_elektryki ?? '',
        miejsce_urzadzen_wew: data.miejsce_urzadzen_wew ?? '',
        obnizenie: toNum(data.obnizenie),
        uwagi: data.uwagi ?? '',
        instalacja_id: selectedInstallationId,
      };

      const response = await execute({
        data: processedData as unknown as ClientInspectionData,
      });

      if ((response as any)?.status === 'Inspekcja updated') {
        Alert.alert('Zaktualizowano dane inspekcji');
        await loadInspectionData(selectedInstallationId);
      } else {
        Alert.alert(
          'Błąd',
          (response as any)?.error || 'Wystąpił błąd podczas zapisywania',
        );
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania danych inspekcji');
    }
  };

  if (installations.length === 0) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>
          Brak instalacji. Dodaj instalację, aby móc dodać oględziny.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.contentView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.contentView}
        contentContainerStyle={styles.inspectionFormContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Wybór instalacji */}
        {installations.length > 1 && (
          <View style={styles.installationSelector}>
            <Text style={styles.installationSelectorLabel}>
              Wybierz instalację:
            </Text>
            <View style={styles.installationDropdownWrapper}>
              <Dropdown
                label=""
                name="installation_selector"
                control={control}
                options={installations.map(inst => ({
                  label: inst.name || `Instalacja ${inst.id}`,
                  value: inst.id,
                }))}
                onChange={(value: number) => {
                  setSelectedInstallationId(value);
                  setValue('installation_selector', value);
                }}
                isBordered
                isThin
                zIndex={10}
              />
            </View>
          </View>
        )}

        {/* Ilość chłodzonych pomieszczeń – na jej podstawie generowane są sekcje */}
        <FormInput
          label="Ilość chłodzonych pomieszczeń"
          name="rooms"
          control={control}
          numericOnly
          noPadding
          inspectionVariant
        />

        {/* Liczba urządzeń – dropdown; przy >1 powielane są sekcje Urządzenie 1, 2, ... */}
        <View style={styles.inspectionDropdownRow}>
          <Text style={styles.inspectionSectionLabel}>Liczba urządzeń</Text>
          <View style={styles.inspectionDropdownWrap}>
            <Dropdown
              label=""
              name="device_amount"
              control={control}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({
                label: String(n),
                value: n,
              }))}
              isBordered
              isThin
              zIndex={10}
            />
          </View>
        </View>

        {/* Sekcje pomieszczeń */}
        {roomFields.map((field, index) => (
          <View key={field.id} style={styles.inspectionSection}>
            <Text style={styles.inspectionSectionTitle}>
              Pomieszczenie {index + 1}
            </Text>
            <FormInput
              label="Wielkość urządzenia / pomieszczenia (m²)"
              name={`roomSections.${index}.rooms_m2`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Moc"
              name={`roomSections.${index}.power_amount`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Typ urządzenia"
              name={`roomSections.${index}.typ_urzadzenia_wewnetrznego`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Miejsce montażu"
              name={`roomSections.${index}.miejsce_montazu`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Długość instalacji"
              name={`roomSections.${index}.dlugosc_instalacji`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Prowadzenie instalacji"
              name={`roomSections.${index}.prowadzenie_instalacji`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Prowadzenie skroplin"
              name={`roomSections.${index}.prowadzenie_skroplin`}
              control={control}
              noPadding
              inspectionVariant
            />
          </View>
        ))}

        {/* Sekcje urządzeń (Urządzenie 1, 2, ...) */}
        {deviceFields.map((field, index) => (
          <View key={field.id} style={styles.inspectionSection}>
            <Text style={styles.inspectionSectionTitle}>
              Urządzenie {index + 1}
            </Text>
            <FormInput
              label="Wielkość urządzenia / pomieszczenia (m²)"
              name={`deviceSections.${index}.rooms_m2`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Moc"
              name={`deviceSections.${index}.power_amount`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Typ urządzenia"
              name={`deviceSections.${index}.typ_urzadzenia_wewnetrznego`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Miejsce montażu"
              name={`deviceSections.${index}.miejsce_montazu`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Długość instalacji"
              name={`deviceSections.${index}.dlugosc_instalacji`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Prowadzenie instalacji"
              name={`deviceSections.${index}.prowadzenie_instalacji`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Prowadzenie skroplin"
              name={`deviceSections.${index}.prowadzenie_skroplin`}
              control={control}
              noPadding
              inspectionVariant
            />
            <View style={styles.devicePhotoSection}>
              <Text style={styles.devicePhotoLabel}>
                Zdjęcie montażu urządzenia
              </Text>
              {watchedDeviceSections?.[index]?.device_photo ? (
                <View style={styles.devicePhotoPreview}>
                  <Image
                    source={{
                      uri:
                        getImageUrl(
                          watchedDeviceSections[index].device_photo!.image,
                        ) || undefined,
                    }}
                    style={styles.devicePhotoImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.devicePhotoDeleteBtn}
                    onPress={() =>
                      handleDeleteDevicePhoto(
                        watchedDeviceSections[index].device_photo!.id,
                        index,
                      )
                    }
                  >
                    <Text style={styles.devicePhotoDeleteText}>
                      Usuń zdjęcie
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.devicePhotoAddBtn}
                  onPress={() => pickDevicePhoto(index)}
                >
                  <Text style={styles.devicePhotoAddText}>+ Dodaj zdjęcie</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Pola wspólne na końcu */}
        <Textarea
          label="Miejsce i sposób montażu agregatu"
          noPadding
          name="miejsce_agregatu"
          control={control}
          borderColor={Colors.black}
          textColor={Colors.black}
          labelColor={Colors.black}
          fontSize={16}
          labelFontSize={14}
          backgroundColor={Colors.white}
          height={20}
        />
        <FormInput
          label="Miejsce podłączenia elektryki"
          name="podlaczenie_elektryki"
          control={control}
          noPadding
          inspectionVariant
        />
        <FormInput
          label="Miejsce montażu urządzeń wewnętrznych"
          name="miejsce_urzadzen_wew"
          control={control}
          noPadding
          inspectionVariant
        />
        <FormInput
          label="Obniżenie jednostki naściennej przez np. sufit podwieszany, sztukaterię"
          name="obnizenie"
          control={control}
          numericOnly
          allowDecimal
          noPadding
          inspectionVariant
        />
        <Textarea
          label="Uwagi"
          noPadding
          name="uwagi"
          control={control}
          borderColor={Colors.black}
          textColor={Colors.black}
          labelColor={Colors.black}
          fontSize={16}
          labelFontSize={14}
          backgroundColor={Colors.white}
          height={20}
        />

        {/* Zdjęcia */}
        <View style={styles.photoContainer}>
          <FilePicker
            name="photo"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie"
            label="Zdjęcia"
          />
          {photos.length > 0 ? (
            <PhotoGallery photos={photos} onDeletePhoto={handleDeletePhoto} />
          ) : (
            <Text style={styles.noPhotosText}>
              Brak zdjęć ({photos.length})
            </Text>
          )}
        </View>

        {/* Przycisk zapisu */}
        <View style={styles.inspectionFormFooter}>
          <SubmitButton
            title="Zapisz zmiany"
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Komponent wiersza oferty
function ClientOfferRow({
  offer,
  navigation,
  clientId,
  installations,
}: {
  offer: any;
  navigation: any;
  clientId: number;
  installations: ClientsInstallationListItem[];
}) {
  const installation = installations.find(i => i.id === offer.instalacja);
  const handleOfferPress = () => {
    navigation.navigate('Offers', {
      screen: 'Overview',
      params: {
        type: offer.offer_type,
        installationId: offer.instalacja,
        devices:
          offer.offer_type === 'split'
            ? offer.devices_split || []
            : offer.devices_multi_split || [],
        surcharges: offer.narzut || [],
        promos: offer.rabat || [],
        offerId: offer.id,
        mode: offer.is_accepted ? 'view' : 'accept',
        isTemplate: false,
        fromClient: true,
        clientId,
      },
    });
  };

  // Formatuj datę w formacie DD/MM/YYYY
  const formattedDate = offer.created_date
    ? format(parseISO(offer.created_date), 'dd/MM/yyyy')
    : 'Brak daty';

  // Tytuł oferty: użyj nazwa_oferty jeśli istnieje, w przeciwnym razie "Oferta nr X"
  const offerTitle =
    offer.nazwa_oferty || offer.nazwa || `Oferta nr ${offer.id}`;

  return (
    <TouchableOpacity
      style={styles.clientOfferItem}
      onPress={handleOfferPress}
      activeOpacity={0.7}
    >
      <View style={styles.clientOfferContent}>
        <View style={styles.clientOfferIconContainer}>
          <View style={styles.clientOfferIcon}>
            <FilesIcon color={Colors.teal} size={20} />
          </View>
        </View>
        <View style={styles.clientOfferDetails}>
          <Text style={styles.clientOfferTitle}>{offerTitle}</Text>
          <Text style={styles.clientOfferDate}>{formattedDate}</Text>
          {installation ? (
            <View style={styles.rowInstallation}>
              <Text style={styles.rowInstallationText}>
                Instalacja:{' '}
                {installation.name || `Instalacja ${installation.id}`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Komponent widoku "Oferty"
function OfertyView({
  clientId,
  installations,
  navigation,
}: {
  clientId: number;
  installations: ClientsInstallationListItem[];
  navigation: any;
}) {
  const { offers, getOffers, offersLoading } = useOffers();
  const [clientOffers, setClientOffers] = useState<any[]>([]);

  useEffect(() => {
    if (getOffers) {
      getOffers();
    }
  }, [getOffers]);

  useEffect(() => {
    if (offers && offers.length > 0 && installations.length > 0) {
      // Pobierz ID wszystkich instalacji klienta
      const clientInstallationIds = installations.map(inst => inst.id);

      // Filtruj oferty które należą do instalacji tego klienta
      const filtered = offers.filter(
        offer =>
          !offer.is_template &&
          clientInstallationIds.includes(offer.instalacja),
      );

      // Sortuj według daty utworzenia (najnowsze pierwsze)
      const sorted = filtered.sort(
        (a, b) =>
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime(),
      );

      setClientOffers(sorted);
    } else {
      setClientOffers([]);
    }
  }, [offers, installations]);

  const handleAddOffer = () => {
    if (!installations || installations.length === 0) {
      Alert.alert(
        'Brak instalacji',
        'Aby dodać ofertę, najpierw dodaj instalację dla klienta.',
      );
      return;
    }

    const chooseTypeForInstallation = (installationId: number) => {
      const goToOffer = (selectedType: 'split' | 'multi_split') => {
        navigation.navigate('Offers', {
          screen: 'Overview',
          params: {
            type: selectedType,
            installationId,
            devices: [],
            surcharges: [],
            mode: 'create',
            fromClient: true,
            clientId,
          },
        });
      };

      Alert.alert('Nowa oferta', 'Wybierz typ oferty', [
        { text: 'Split', onPress: () => goToOffer('split') },
        { text: 'Multisplit', onPress: () => goToOffer('multi_split') },
        { text: 'Anuluj', style: 'cancel' },
      ]);
    };

    if (installations.length === 1) {
      chooseTypeForInstallation(installations[0].id);
      return;
    }

    Alert.alert(
      'Wybierz instalację',
      'Dla której instalacji chcesz utworzyć ofertę?',
      [
        ...installations.slice(0, 3).map(inst => ({
          text: inst.name || `Instalacja ${inst.id}`,
          onPress: () => chooseTypeForInstallation(inst.id),
        })),
        { text: 'Anuluj', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={styles.contentView}>
      {offersLoading ? (
        <View style={styles.contentView}>
          <Text style={styles.emptyText}>Ładowanie ofert...</Text>
        </View>
      ) : clientOffers.length === 0 ? (
        <View style={styles.contentView}>
          <Text style={styles.emptyText}>Brak ofert dla tego klienta.</Text>
        </View>
      ) : (
        <FlatList
          data={clientOffers}
          contentContainerStyle={styles.clientOffersList}
          renderItem={({ item }) => (
            <ClientOfferRow
              offer={item}
              navigation={navigation}
              clientId={clientId}
              installations={installations}
            />
          )}
          keyExtractor={item => item.id.toString()}
        />
      )}
      <FloatingActionButton
        onPress={handleAddOffer}
        backgroundColor={Colors.teal}
      />
    </View>
  );
}

// Typ faktury z API faktura_list
type ClientInvoice = {
  id: number;
  client_name?: string;
  instalacja?: number | string | null;
  issue_date: string;
  numer_faktury: string;
  status: string;
};

// Komponent wiersza faktury w widoku klienta
function ClientInvoiceRow({
  invoice,
  installations,
  navigation,
}: {
  invoice: ClientInvoice;
  installations: ClientsInstallationListItem[];
  navigation: any;
}) {
  const handlePress = () => {
    navigation.navigate('Invoices', {
      screen: 'Details',
      params: { id: invoice.id },
    });
  };

  let statusBgColor = '#E6F7D9';
  let statusTextColor = '#52C41A';
  let statusText = 'Wystawiona';
  switch (invoice.status) {
    case 'paid':
      statusBgColor = '#E6F7D9';
      statusTextColor = '#52C41A';
      statusText = 'Opłacona';
      break;
    case 'partial':
      statusBgColor = '#FFF4E5';
      statusTextColor = '#FF9800';
      statusText = 'Częściowo opł.';
      break;
    default:
      statusBgColor = Colors.grayBorder;
      statusTextColor = Colors.black;
      break;
  }

  const formattedDate = invoice.issue_date
    ? format(parseISO(invoice.issue_date), 'dd/MM/yyyy')
    : 'Brak daty';

  const installation =
    invoice.instalacja != null
      ? installations.find(i => i.id === Number(invoice.instalacja))
      : null;

  return (
    <TouchableOpacity
      style={styles.clientInvoiceItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.clientInvoiceContent}>
        <View style={styles.clientInvoiceLeft}>
          <Text style={styles.clientInvoiceType}>Faktura VAT</Text>
          <Text style={styles.clientInvoiceNumberDate}>
            {invoice.numer_faktury} • {formattedDate}
          </Text>
          {installation ? (
            <View style={styles.rowInstallation}>
              <Text style={styles.rowInstallationText}>
                Instalacja:{' '}
                {installation.name || `Instalacja ${installation.id}`}
              </Text>
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.clientInvoiceStatusBadge,
            { backgroundColor: statusBgColor },
          ]}
        >
          <Text
            style={[styles.clientInvoiceStatusText, { color: statusTextColor }]}
          >
            {statusText}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Widok "Faktury" w menu klienta (wszystkie instalacje)
function FakturyView({
  clientId,
  installations,
  navigation,
}: {
  clientId: number;
  installations: ClientsInstallationListItem[];
  navigation: any;
}) {
  const {
    result: invoicesResult,
    execute: fetchInvoices,
    loading,
  } = useApi<{
    faktura_list: ClientInvoice[];
  }>({ path: 'faktura_list' });
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([]);

  useEffect(() => {
    if (fetchInvoices) {
      fetchInvoices({});
    }
  }, [fetchInvoices]);

  useEffect(() => {
    if (invoicesResult?.faktura_list != null && installations.length > 0) {
      const installationIds = installations.map(i => i.id);
      const filtered = invoicesResult.faktura_list.filter(
        inv =>
          inv.instalacja == null ||
          installationIds.includes(Number(inv.instalacja)),
      );
      const sorted = filtered.sort(
        (a, b) =>
          new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime(),
      );
      setClientInvoices(sorted);
    } else if (
      invoicesResult?.faktura_list != null &&
      installations.length === 0
    ) {
      setClientInvoices([]);
    } else if (invoicesResult?.faktura_list != null) {
      const sorted = [...invoicesResult.faktura_list].sort(
        (a, b) =>
          new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime(),
      );
      setClientInvoices(sorted);
    } else {
      setClientInvoices([]);
    }
  }, [invoicesResult, installations]);

  if (loading) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Ładowanie faktur...</Text>
      </View>
    );
  }

  if (clientInvoices.length === 0) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Brak faktur dla tego klienta.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contentView}>
      <FlatList
        data={clientInvoices}
        contentContainerStyle={styles.clientOffersList}
        renderItem={({ item }) => (
          <ClientInvoiceRow
            invoice={item}
            installations={installations}
            navigation={navigation}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

// Komponent wiersza umowy w widoku klienta
function ClientAgreementRow({
  agreement,
  installations,
  clientId,
  navigation,
}: {
  agreement: Agreement;
  installations: ClientsInstallationListItem[];
  clientId: number;
  navigation: any;
}) {
  const installation = installations.find(i => i.id === agreement.instalacja);
  const handlePress = () => {
    navigation.navigate('Settings', {
      installationId: agreement.instalacja.toString(),
      clientId: clientId.toString(),
      activeTab: 'umowa',
    });
  };

  const formattedDate = agreement.created_date
    ? format(parseISO(agreement.created_date), 'dd/MM/yyyy')
    : 'Brak daty';

  return (
    <TouchableOpacity
      style={styles.clientAgreementItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.clientAgreementContent}>
        <View style={styles.clientAgreementLeft}>
          <Text style={styles.clientAgreementTitle}>
            Umowa montażu nr {agreement.id}
          </Text>
          <Text style={styles.clientAgreementDate}>{formattedDate}</Text>
          {installation ? (
            <View style={styles.rowInstallation}>
              <Text style={styles.rowInstallationText}>
                Instalacja:{' '}
                {installation.name || `Instalacja ${installation.id}`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Widok "Umowy" w menu klienta (zbieranie po wszystkich instalacjach)
function UmowyView({
  clientId,
  installations,
  navigation,
}: {
  clientId: number;
  installations: ClientsInstallationListItem[];
  navigation: any;
}) {
  const { execute: fetchAgreements } = useApi<AgreementListResponse>({
    path: 'agreement_list',
  });
  const [allAgreements, setAllAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!installations.length) {
      setAllAgreements([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const merged: Agreement[] = [];
      for (const inst of installations) {
        if (cancelled) break;
        const res = await fetchAgreements({
          data: { instalacja_id: inst.id },
        });
        if (res?.umowy) merged.push(...res.umowy);
      }
      if (!cancelled) {
        setAllAgreements(merged);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [installations, fetchAgreements]);

  if (loading) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Ładowanie umów...</Text>
      </View>
    );
  }

  if (allAgreements.length === 0) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Brak umów dla tego klienta.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contentView}>
      <FlatList
        data={allAgreements}
        contentContainerStyle={styles.clientOffersList}
        renderItem={({ item }) => (
          <ClientAgreementRow
            agreement={item}
            installations={installations}
            clientId={clientId}
            navigation={navigation}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

// Overlay do dodawania instalacji
function InstallationsCreateOverlay({
  visible,
  onBackdropPress,
  onAdd,
}: {
  visible: boolean;
  onBackdropPress: () => void;
  onAdd: ({ name }: { name: string }) => void;
}) {
  const { control, handleSubmit } = useForm<{
    name: string;
  }>({ defaultValues: { name: 'Instalacja' } });

  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
    >
      <View>
        <FormInput
          label="Nazwa instalacji"
          name="name"
          control={control}
          isThin
        />
        <SubmitButton
          title="Dodaj"
          style={styles.continueButton}
          onPress={handleSubmit(onAdd)}
        />
      </View>
    </Overlay>
  );
}

function ClientsMenu({
  navigation,
  route,
}: ClientMenuScreenProps & {
  route: Route<
    'Menu',
    {
      clientId: number;
      client?: Client;
      activeTab?: TabType;
      autoShowInstallationOverlay?: boolean;
      fromMap?: boolean;
    }
  >;
}) {
  const { clients } = useClients();
  const client =
    route.params.client || clients?.find(c => c.id === route.params.clientId);
  const [title, setTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>(
    route.params.activeTab || 'dane',
  );
  const [installations, setInstallations] = useState<
    ClientsInstallationListItem[]
  >([]);
  const [addVisible, setAddVisible] = useState(false);

  // API do pobierania instalacji
  const { result: installationsResult, execute: fetchInstallations } =
    useApi<ClientInstallationsListResponse>({
      path: 'installation_list',
    });

  // API do dodawania instalacji
  const { execute: addInstallation } = useApi<ClientInstallationsListResponse>({
    path: 'installation_create',
  });

  useEffect(() => {
    if (client) {
      setTitle(getClientDisplayPrimary(client));
    }
  }, [client]);

  // Odświeżanie listy instalacji przy każdym włączeniu ekranu (np. po powrocie z ClientSettings)
  useFocusEffect(
    useCallback(() => {
      if (client && fetchInstallations) {
        fetchInstallations({ data: { klient_id: client.id } });
      }
    }, [client, fetchInstallations]),
  );

  useEffect(() => {
    if (installationsResult?.installation_list) {
      setInstallations(installationsResult.installation_list);
    }
  }, [installationsResult]);

  // Obsługa powrotu z TaskDetails - przełączenie na zakładkę Zadania
  useEffect(() => {
    if (route.params.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params.activeTab]);

  // Automatyczne wyświetlenie overlay instalacji
  useEffect(() => {
    if (route.params.autoShowInstallationOverlay) {
      setActiveTab('instalacje');
      // Opóźnienie, aby upewnić się, że zakładka jest już aktywna
      setTimeout(() => {
        setAddVisible(true);
      }, 300);
    }
  }, [route.params.autoShowInstallationOverlay]);

  const toggleAddOverlay = () => {
    setAddVisible(!addVisible);
  };

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      const result = await addInstallation({
        data: { klient_id: route.params.clientId, name },
      });

      // Odśwież listę instalacji
      if (fetchInstallations) {
        await fetchInstallations({
          data: { klient_id: route.params.clientId },
        });
      }

      Alert.alert('Instalacja została dodana');
      toggleAddOverlay();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się dodać instalacji');
    }
  };

  // Renderowanie aktywnego widoku
  const renderActiveView = () => {
    if (!client) return null;

    switch (activeTab) {
      case 'dane':
        return (
          <DaneView
            client={client}
            navigation={navigation}
            onClientUpdate={() => {
              // Odśwież dane klienta po aktualizacji
              if (fetchInstallations) {
                fetchInstallations({ data: { klient_id: client.id } });
              }
            }}
          />
        );
      case 'zadania':
        return <ZadaniaView clientId={client.id} navigation={navigation} />;
      case 'instalacje':
        return (
          <InstallationsView
            installations={installations}
            clientId={client.id}
            navigation={navigation}
            onAddInstallation={toggleAddOverlay}
            client={client}
          />
        );
      case 'oględziny':
        return (
          <OględzinyView clientId={client.id} installations={installations} />
        );
      case 'oferty':
        return (
          <OfertyView
            clientId={client.id}
            installations={installations}
            navigation={navigation}
          />
        );
      case 'faktury':
        return (
          <FakturyView
            clientId={client.id}
            installations={installations}
            navigation={navigation}
          />
        );
      case 'umowy':
        return (
          <UmowyView
            clientId={client.id}
            installations={installations}
            navigation={navigation}
          />
        );
      default:
        return (
          <DaneView
            client={client}
            navigation={navigation}
            onClientUpdate={() => {
              if (fetchInstallations) {
                fetchInstallations({ data: { klient_id: client.id } });
              }
            }}
          />
        );
    }
  };

  return (
    <View style={styles.linearGradient}>
      <View style={styles.container}>
        <ButtonsHeader
          onBackPress={() => {
            if (route.params.fromMap) {
              (navigation as any).navigate('Map');
            } else {
              navigation.goBack();
            }
          }}
        />
        {title && (
          <View style={styles.clientTitleContainer}>
            <Text style={styles.clientTitle}>{title}</Text>
          </View>
        )}

        {/* Poziome menu - zawsze widoczne */}
        <HorizontalTabs
          tabs={clientTabs}
          activeTab={activeTab}
          onTabChange={(tabId: string) => setActiveTab(tabId as TabType)}
        />
        {/* Poziomy border oddzielający zakładki od reszty treści */}
        <Divider style={styles.divider} />

        {/* Obszar treści - zmienia się w zależności od aktywnej zakładki */}
        <View style={styles.contentScroll}>{renderActiveView()}</View>
      </View>

      {/* Overlay dodawania instalacji */}
      <InstallationsCreateOverlay
        visible={addVisible}
        onBackdropPress={toggleAddOverlay}
        onAdd={onSubmit}
      />

      {activeTab === 'instalacje' && (
        <FloatingActionButton
          onPress={toggleAddOverlay}
          backgroundColor={Colors.green}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
    height: '100%',
  },
  container: {
    backgroundColor: Colors.white,
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
    height: '100%',
    paddingTop: 40,
  },
  clientTitleContainer: {
    paddingHorizontal: 18,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  clientTitle: {
    fontSize: 26,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  // Style dla obszaru treści
  contentScroll: {
    flex: 1,
    height: '100%',
  },
  contentView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  contentViewContainer: {
    padding: 14,
    paddingBottom: 20,
  },
  // Style dla formularza danych
  formView: {
    position: 'relative',
    flex: 1,
    height: '100%',
    backgroundColor: Colors.homeScreenBackground,
    paddingTop: 20,
  },
  formScrollView: {
    flex: 1,
    height: '100%',
  },
  formScrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 14,
  },
  inputContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 2,
    paddingHorizontal: 8,
  },
  segmentedControlContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  sectionText: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 16,
  },
  divider: {
    paddingTop: 10,
    borderBottomColor: Colors.green,
    borderBottomWidth: 2,
  },
  invitationButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  invitationButton: {
    backgroundColor: Colors.green,
    borderRadius: 60,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  invitationButtonDisabled: {
    backgroundColor: Colors.grayBorder,
    opacity: 0.6,
  },
  invitationButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  gusDataButton: {
    width: '100%',
  },
  submitButtonStyle: {
    width: '100%',
    height: 54,
    backgroundColor: Colors.white,
    borderColor: Colors.white,
    borderWidth: 2,
    borderRadius: 10,
  },
  submitButtonTitleStyle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  infoText: {
    marginVertical: 8,
    fontSize: 14,
    color: Colors.blue,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formFooter: {
    width: '100%',
    paddingBottom: 65,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  daneCancelButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
    borderWidth: 1,
    borderColor: Colors.black,
    backgroundColor: Colors.white,
  },
  daneCancelButtonText: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  daneSaveButton: {
    flex: 1,
  },
  danePreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 14,
    marginTop: 8,
  },
  danePreviewRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  danePreviewRowLast: {
    borderBottomWidth: 0,
  },
  danePreviewLabel: {
    fontSize: 12,
    color: Colors.companyText ?? '#616161',
    marginBottom: 4,
    fontFamily: 'Archivo_400Regular',
  },
  danePreviewValue: {
    fontSize: 15,
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
  },
  daneEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
  },
  daneEditButtonText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
  },
  // buttonGroup: {
  //   position: 'absolute',
  //   bottom: 0,
  //   display: 'flex',
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   minHeight: 100,
  //   gap: 20,
  //   paddingVertical: 30,
  //   shadowColor: Colors.black,
  //   shadowOffset: { width: 0, height: -7 },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 90,
  //   elevation: 5,
  //   overflow: 'visible',
  //   zIndex: 1000,
  //   width: '100%',
  //   backgroundColor: Colors.white,
  //   borderTopLeftRadius: 35,
  //   borderTopRightRadius: 35,
  //   borderWidth: 1,
  //   borderColor: Colors.grayBorder,
  // },
  // cancelButton: {
  //   flex: 1,
  //   width: 140,
  //   paddingHorizontal: 12,
  //   borderRadius: 15,
  //   borderWidth: 1,
  //   backgroundColor: Colors.white,
  //   borderColor: Colors.black,
  //   height: 48,
  // },
  // cancelButtonTitle: {
  //   color: Colors.black,
  //   fontFamily: 'Archivo_600SemiBold',
  //   fontSize: 12,
  //   lineHeight: 18,
  //   overflow: 'visible',
  // },
  submitButton: {
    backgroundColor: Colors.green,
    minHeight: 48,
    height: 48,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    width: '100%',
  },
  submitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  // Style dla karty instalacji
  installationCard: {
    width: '100%',
    height: 'auto',
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  installationCardTitle: {
    fontFamily: 'Archivo_600SemiBold',
    fontWeight: '600',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24, // 150% z 16px
    letterSpacing: 0,
    textAlign: 'left',
    color: Colors.black,
    marginBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  installationCardButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 16,
    gap: 12,
  },
  installationCardButtonContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  installationCardButton: {
    width: 70,
    height: 70,
    backgroundColor: Colors.grayBorder,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  installationCardButtonLabel: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
    textAlign: 'center',
  },
  installationCardInfo: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  installationCardDivider: {
    backgroundColor: Colors.grayBorder,
    height: 1,
    marginTop: 0,
    marginBottom: 16,
  },
  installationCardInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  installationCardInfoLabel: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Archivo_400Regular',
    fontWeight: '500',
    marginRight: 8,
  },
  installationCardInfoValue: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Archivo_400Regular',
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.grayerText,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    fontFamily: 'Archivo_400Regular',
  },
  // Style dla formularza oględzin
  inspectionFormContainer: {
    padding: 14,
    paddingBottom: 30,
    gap: 10,
  },
  installationSelector: {
    marginBottom: 10,
  },
  installationSelectorLabel: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Archivo_400Regular',
    marginBottom: 8,
  },
  installationDropdownWrapper: {
    marginBottom: 10,
  },
  inspectionDropdownRow: {
    marginBottom: 10,
  },
  inspectionSectionLabel: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 4,
  },
  inspectionDropdownWrap: {
    marginBottom: 4,
  },
  inspectionSection: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  inspectionSectionTitle: {
    fontSize: 15,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 10,
  },
  photoContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  photoGalleryContainer: {
    marginTop: 10,
  },
  photoGalleryContent: {
    paddingHorizontal: 5,
  },
  photoItem: {
    marginHorizontal: 5,
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.divider,
  },
  deleteButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1,
  },
  deleteButtonStyle: {
    backgroundColor: Colors.buttons.deleteBg,
    borderRadius: 12,
    width: 24,
    height: 24,
    padding: 0,
  },
  deleteButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  noPhotosText: {
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Archivo_400Regular',
  },
  inspectionFormFooter: {
    marginTop: 20,
    marginBottom: 30,
  },
  devicePhotoSection: {
    marginTop: 12,
  },
  devicePhotoLabel: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 6,
  },
  devicePhotoPreview: {
    alignItems: 'center' as const,
  },
  devicePhotoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  devicePhotoDeleteBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: Colors.red,
    borderRadius: 6,
  },
  devicePhotoDeleteText: {
    color: '#fff',
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 13,
  },
  devicePhotoAddBtn: {
    borderWidth: 1,
    borderColor: Colors.gray,
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center' as const,
  },
  devicePhotoAddText: {
    color: Colors.gray,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
  },
  // Overlay styles
  overlay: {
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  continueButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
  },
  // Style dla listy zadań klienta
  tasksContentView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  clientTasksList: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
  },
  clientTaskItem: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientTaskTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_500Medium',
    color: Colors.black,
    marginBottom: 12,
  },
  clientTaskDivider: {
    marginBottom: 12,
    height: 1,
    backgroundColor: Colors.grayBorder,
  },
  clientTaskTagsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientTaskDateTag: {
    backgroundColor: '#4CBF2426',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clientTaskDateTagText: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: '#4CBF24',
  },
  clientTaskTeamTag: {
    backgroundColor: '#FCE6F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clientTaskTeamTagText: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: '#D66B99',
  },
  rowInstallation: {
    marginTop: 8,
  },
  rowInstallationText: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.grayText,
  },
  // Style dla listy ofert klienta
  clientOffersList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
  },
  clientOfferItem: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientOfferContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientOfferIconContainer: {
    marginRight: 12,
  },
  clientOfferIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.backgroundTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientOfferDetails: {
    flex: 1,
  },
  clientOfferTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    marginBottom: 4,
  },
  clientOfferDate: {
    fontSize: 12,
    color: '#616161',
    fontFamily: 'Archivo_400Regular',
  },
  // Style dla listy faktur klienta
  clientInvoiceItem: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  clientInvoiceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInvoiceLeft: {
    flex: 1,
  },
  clientInvoiceType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    marginBottom: 4,
  },
  clientInvoiceNumberDate: {
    fontSize: 13,
    color: '#777777',
    fontFamily: 'Archivo_400Regular',
  },
  clientInvoiceStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 16,
  },
  clientInvoiceStatusText: {
    fontSize: 12,
    fontFamily: 'Archivo_500Medium',
  },
  // Style dla listy umów klienta
  clientAgreementItem: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  clientAgreementContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clientAgreementLeft: {
    flex: 1,
  },
  clientAgreementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    marginBottom: 4,
  },
  clientAgreementDate: {
    fontSize: 12,
    color: '#616161',
    fontFamily: 'Archivo_400Regular',
  },
});

export default ClientsMenu;
