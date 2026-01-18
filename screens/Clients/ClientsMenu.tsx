import { Route, useFocusEffect } from '@react-navigation/native';
import { Button, Divider, Input, Overlay, Text } from '@rneui/themed';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
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
import InfoCircle from '../../components/icons/InfoCircle';
import MoneyReciveIcon from '../../components/icons/MoneyReciveIcon';
import NoteTextIcon from '../../components/icons/NoteTextIcon';
import SearchStatusIcon from '../../components/icons/SearchStatusIcon';
import TaskListIcon from '../../components/icons/TaskIcon';
import Colors from '../../consts/Colors';
import { getImageUrl } from '../../helpers/image';
import useApi from '../../hooks/useApi';
import { ClientMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import useOffers from '../../providers/OffersProvider';
import useStaff from '../../providers/StaffProvider';
import useTasks from '../../providers/TasksProvider';
import {
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';

// Typy dla zakładek
type TabType = 'dane' | 'zadania' | 'instalacje' | 'oferty';

// Typy dla formularza oględzin
type ClientInspectionData = {
  rooms: number | undefined;
  rooms_m2: number | undefined;
  device_amount: number | undefined;
  power_amount: number | undefined;
  typ_urzadzenia_wewnetrznego: string | undefined;
  miejsce_montazu: string | undefined;
  dlugosc_instalacji: number | undefined;
  prowadzenie_instalacji: string | undefined;
  prowadzenie_skroplin: string | undefined;
  miejsce_agregatu: string | undefined;
  podlaczenie_elektryki: string | undefined;
  miejsce_urzadzen_wew: string | undefined;
  obnizenie: number | undefined;
  uwagi: string | undefined;
  photo: File | undefined;
  installation_selector?: number; // Pole pomocnicze dla wyboru instalacji
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
  rooms: undefined,
  rooms_m2: undefined,
  device_amount: undefined,
  power_amount: undefined,
  typ_urzadzenia_wewnetrznego: '',
  miejsce_montazu: '',
  dlugosc_instalacji: undefined,
  prowadzenie_instalacji: '',
  prowadzenie_skroplin: '',
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
          'Sukces',
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
        Boolean(data.kod_pocztowy) &&
        Boolean(data.miasto) &&
        Boolean(data.ulica);

      if (hasAddress) {
        const geocodeQuery = [
          data.kod_pocztowy,
          data.miasto,
          data.ulica,
          data.numer_domu ?? '',
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
          <View style={styles.inputContainer}>
            <FormInput
              name="miasto"
              control={control}
              label="Miasto"
              noPadding
            />
            <FormInput
              name="kod_pocztowy"
              control={control}
              label="Kod pocztowy"
              noPadding
              rules={{
                pattern: {
                  value: /^\d{2}-\d{3}$/,
                  message: 'Nieprawidłowy format kodu pocztowego (XX-XXX)',
                },
              }}
            />
          </View>
          <View style={{ paddingHorizontal: 8 }}>
            <FormInput
              name="ulica"
              control={control}
              label="Ulica / Nr domu"
              noPadding
            />
          </View>
        </View>
        <Text style={styles.sectionText}>Dane kontaktowe</Text>
        {watchedClientType === 'osoba_prywatna' && (
          <Text style={styles.infoText}>
            💡 Dla osób prywatnych email nie jest wymagany
          </Text>
        )}
        <View style={{ gap: -18 }}>
          <FormInput
            name="email"
            control={control}
            disabled={Boolean(client?.email)}
            label={watchedClientType === 'firma' ? 'E-mail *' : 'E-mail'}
            editable={client?.email ? false : undefined}
            noPadding
            error={errors.email}
            rules={{
              required:
                watchedClientType === 'firma'
                  ? 'E-mail jest wymagany dla firm'
                  : false,
              validate: (value: string | null) => {
                if (!value && watchedClientType !== 'firma') {
                  return true;
                }
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

        {/* Przycisk Zapisz na dole formularza */}
        <View style={styles.formFooter}>
          <SubmitButton
            title="Zapisz"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
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

  // Formatowanie daty montażu (na razie placeholder, bo nie ma w API)
  const formatInstallationDate = () => {
    // TODO: Pobierz datę montażu z Montage gdy będzie dostępna w API
    return format(parseISO(installation.created_date), 'dd.MM.yyyy'); // Placeholder
  };

  // Nazwa urządzenia (na razie placeholder, bo nie ma w API)
  const getDeviceName = () => {
    // TODO: Pobierz urządzenie z Montage gdy będzie dostępne w API
    return 'Samsung DualCool Deluxe Soft Air'; // Placeholder
  };

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
        {/* <View style={styles.installationCardInfoRow}>
          <Text style={styles.installationCardInfoLabel}>Urządzenie:</Text>
          <Text style={styles.installationCardInfoValue}>
            {getDeviceName()}
          </Text>
        </View> */}
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

// Komponent dla pól numerycznych w formularzu oględzin
function NumericInput({
  name,
  control,
  label,
  allowDecimal = false,
  noPadding = false,
}: {
  name: keyof ClientInspectionData;
  control: any;
  label: string;
  allowDecimal?: boolean;
  noPadding?: boolean;
}) {
  const handleTextChange = (
    text: string,
    onChange: (value: string) => void,
  ) => {
    const regex = allowDecimal ? /^[0-9]*[.,]?[0-9]*$/ : /^[0-9]*$/;
    if (regex.test(text) || text === '') {
      const normalizedText = text.replace(',', '.');
      onChange(normalizedText);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <Input
          label={label}
          value={value || ''}
          onChangeText={text => handleTextChange(text, onChange)}
          keyboardType="numeric"
          inputStyle={{
            fontFamily: 'Archivo_400Regular',
            borderWidth: 1,
            color: Colors.black,
            borderColor: Colors.black,
            borderRadius: 4,
            height: 45,
            minHeight: 40,
            paddingHorizontal: 12,
            fontSize: 14,
            backgroundColor: Colors.white,
          }}
          inputContainerStyle={{
            borderBottomWidth: 0,
          }}
          containerStyle={{
            paddingHorizontal: noPadding ? 0 : 8,
            width: '100%',
          }}
          labelStyle={{
            fontFamily: 'Archivo_400Regular',
            marginTop: 0,
            marginBottom: 6,
            color: Colors.black,
            fontSize: 12,
            letterSpacing: 0.3,
            fontWeight: 'normal',
          }}
        />
      )}
    />
  );
}

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
  const { control, handleSubmit, setValue, watch, reset } =
    useForm<ClientInspectionData>({
      defaultValues: {
        ...clientInspectDefaultData,
        installation_selector: initialInstallationId || undefined,
      },
    });
  const currentPhoto = watch('photo');

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

        // Reset formularza przed wczytaniem nowych danych
        reset(clientInspectDefaultData);

        // Wczytaj dane inspekcji
        if (res.inspekcja && res.inspekcja.length > 0) {
          const inspectionData = res.inspekcja[0];
          const fieldsToSet = Object.keys(clientInspectDefaultData);

          fieldsToSet.forEach((field: string) => {
            if (
              field !== 'photo' &&
              inspectionData[field as keyof typeof inspectionData] !== undefined
            ) {
              const value =
                inspectionData[field as keyof typeof inspectionData];
              setValue(
                field as keyof ClientInspectionData,
                value !== null && value !== undefined ? String(value) : '',
              );
            }
          });
        }

        // Wczytaj zdjęcia
        if (res.photos && Array.isArray(res.photos)) {
          const formattedPhotos: InspectionPhoto[] = res.photos.map(
            (photo: any) => ({
              id: photo.id,
              image: photo.image,
              created_date: photo.created_date || new Date().toISOString(),
            }),
          );
          setPhotos(formattedPhotos);
        } else {
          setPhotos([]);
        }
      } catch (error) {
        // Nie pokazuj błędu jeśli to pierwsze wczytanie
        setPhotos([]);
      }
    },
    [fetchInstallationData, reset, setValue],
  );

  useEffect(() => {
    if (selectedInstallationId) {
      loadInspectionData(selectedInstallationId);
    }
  }, [selectedInstallationId, loadInspectionData]);

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

        const result = await addPhotoToGallery({ data: formData });

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
      Alert.alert('Sukces', 'Zdjęcie zostało usunięte');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
    }
  };

  const onSubmit = async (data: ClientInspectionData) => {
    if (!selectedInstallationId) {
      Alert.alert('Błąd', 'Wybierz instalację');
      return;
    }

    try {
      const processedData = {
        ...data,
        rooms: data.rooms ? Number(data.rooms) : undefined,
        rooms_m2: data.rooms_m2 ? Number(data.rooms_m2) : undefined,
        device_amount: data.device_amount
          ? Number(data.device_amount)
          : undefined,
        power_amount: data.power_amount ? Number(data.power_amount) : undefined,
        dlugosc_instalacji: data.dlugosc_instalacji
          ? Number(data.dlugosc_instalacji)
          : undefined,
        obnizenie: data.obnizenie ? Number(data.obnizenie) : undefined,
        instalacja_id: selectedInstallationId,
      };

      const response = await execute({ data: processedData });

      if ((response as any)?.status === 'Inspekcja updated') {
        Alert.alert('Sukces', 'Zaktualizowano dane inspekcji');
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
    <ScrollView
      style={styles.contentView}
      contentContainerStyle={styles.inspectionFormContainer}
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

      {/* Pola z pierwszego zdjęcia */}
      <NumericInput
        label="Ilość chłodzonych pomieszczeń"
        name="rooms"
        control={control}
        noPadding
      />
      <NumericInput
        label="Wielkość chłodzonych pomieszczeń (m²)"
        name="rooms_m2"
        control={control}
        allowDecimal
        noPadding
      />
      <NumericInput
        label="Ilość urządzeń"
        name="device_amount"
        control={control}
        noPadding
      />
      <NumericInput
        label="Moc urządzeń"
        name="power_amount"
        control={control}
        allowDecimal
        noPadding
      />
      <FormInput
        label="Typ urządzenia wewnętrznego"
        name="typ_urzadzenia_wewnetrznego"
        control={control}
        noPadding
      />
      <FormInput
        label="Miejsce montażu"
        name="miejsce_montazu"
        control={control}
        noPadding
      />
      <NumericInput
        label="Długość instalacji"
        name="dlugosc_instalacji"
        control={control}
        allowDecimal
        noPadding
      />
      <FormInput
        label="Prowadzenie instalacji"
        name="prowadzenie_instalacji"
        control={control}
        noPadding
      />

      {/* Pola z drugiego zdjęcia */}
      <FormInput
        label="Prowadzenie skroplin"
        name="prowadzenie_skroplin"
        control={control}
        noPadding
      />
      <Textarea
        label="Miejsce i sposób montażu agregatu"
        noPadding
        name="miejsce_agregatu"
        control={control}
        borderColor={Colors.black}
        textColor={Colors.black}
        labelColor={Colors.black}
        fontSize={14}
        labelFontSize={11}
        backgroundColor={Colors.white}
        height={20}
      />
      <FormInput
        label="Miejsce podłączenia elektryki"
        name="podlaczenie_elektryki"
        control={control}
        noPadding
      />
      <FormInput
        label="Miejsce montażu urządzeń wewnętrznych"
        name="miejsce_urzadzen_wew"
        control={control}
        noPadding
      />
      <NumericInput
        label="Obniżenie jednostki naściennej przez np. sufit podwieszany, sztukaterię"
        name="obnizenie"
        control={control}
        allowDecimal
        noPadding
      />
      <Textarea
        label="Uwagi"
        noPadding
        name="uwagi"
        control={control}
        borderColor={Colors.black}
        textColor={Colors.black}
        labelColor={Colors.black}
        fontSize={14}
        labelFontSize={11}
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
          <Text style={styles.noPhotosText}>Brak zdjęć ({photos.length})</Text>
        )}
      </View>

      {/* Przycisk zapisu */}
      <View style={styles.inspectionFormFooter}>
        <SubmitButton title="Zapisz zmiany" onPress={handleSubmit(onSubmit)} />
      </View>
    </ScrollView>
  );
}

// Komponent wiersza oferty
function ClientOfferRow({
  offer,
  navigation,
  clientId,
}: {
  offer: any;
  navigation: any;
  clientId: number;
}) {
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

  const offerTitle = offer.nazwa_oferty || offer.nazwa || `Oferta ${offer.id}`;

  return (
    <TouchableOpacity
      style={styles.clientOfferItem}
      onPress={handleOfferPress}
      activeOpacity={0.7}
    >
      <View style={styles.clientOfferContent}>
        <View style={styles.clientOfferIconContainer}>
          <View style={styles.clientOfferIcon}>
            <Text style={styles.clientOfferIconText}>📄</Text>
          </View>
        </View>
        <View style={styles.clientOfferDetails}>
          <Text style={styles.clientOfferTitle}>{offerTitle}</Text>
          <Text style={styles.clientOfferSubtitle}>
            {offer.offer_type === 'split' ? 'Split' : 'Multisplit'}
          </Text>
        </View>
        <View style={styles.clientOfferRight}>
          <View
            style={[
              styles.clientOfferStatusBadge,
              {
                backgroundColor: offer.is_accepted ? Colors.green : Colors.red,
              },
            ]}
          >
            <Text style={styles.clientOfferStatusText}>
              {offer.is_accepted ? 'Zaakceptowana' : 'Nie zaakceptowana'}
            </Text>
          </View>
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

  if (offersLoading) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Ładowanie ofert...</Text>
      </View>
    );
  }

  if (clientOffers.length === 0) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Brak ofert dla tego klienta.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contentView}>
      <FlatList
        data={clientOffers}
        contentContainerStyle={styles.clientOffersList}
        renderItem={({ item }) => (
          <ClientOfferRow
            offer={item}
            navigation={navigation}
            clientId={clientId}
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
      if (client.first_name && client.last_name) {
        setTitle(
          `${client.first_name
            .charAt(0)
            .toUpperCase()}${client.first_name.slice(1)} ${client.last_name
              .charAt(0)
              .toUpperCase()}${client.last_name.slice(1)}`,
        );
      } else if (client.nip && client.nazwa_firmy) {
        setTitle(`${client.nazwa_firmy}`);
      }
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

      Alert.alert('Sukces', 'Instalacja została dodana');
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
        <ButtonsHeader onBackPress={() => navigation.goBack()} />
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
  // Style dla listy ofert klienta
  clientOffersList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
  },
  clientOfferItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clientOfferContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientOfferIconContainer: {
    marginRight: 12,
  },
  clientOfferIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.offersTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientOfferIconText: {
    fontSize: 20,
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
  clientOfferSubtitle: {
    fontSize: 12,
    color: Colors.grayerText,
    fontFamily: 'Archivo_400Regular',
  },
  clientOfferRight: {
    alignItems: 'flex-end',
  },
  clientOfferStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  clientOfferStatusText: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontWeight: '700',
  },
});

export default ClientsMenu;
