import { Route, useNavigation } from '@react-navigation/native';
import {
  Alert,
  Animated,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Divider, Overlay, Text } from '@rneui/themed';
import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Swipeable } from 'react-native-gesture-handler';
import { ButtonGroup, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import FilePicker from '../../components/FilePicker';
import FloatingActionButton from '../../components/FloatingActionButton';
import HorizontalTabs, { TabItem } from '../../components/HorizontalTabs';
import { Dropdown, FormInput } from '../../components/Input';
import SegmentedControl from '../../components/SegmentedControl';
import TrashIcon from '../../components/icons/TrashIcon';
import { MontageProtocolForm } from '../Clients/ClientInstallation';
import ReviewCard, { Review } from '../Clients/ReviewCard';
import ReviewProtocolForm from '../Clients/ReviewForm';

import FilesIcon from '../../components/icons/FilesIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useAuth from '../../providers/AuthProvider';
import useClients, { Client } from '../../providers/ClientsProvider';
import { Montage } from '../../providers/MontageProvider';
import useOffers from '../../providers/OffersProvider';
import useStaff from '../../providers/StaffProvider';
import useTasks from '../../providers/TasksProvider';
import {
  Agreement,
  AgreementListResponse,
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';
import {
  MontageListItem,
  MontageListResponse,
} from '../../types/montage.types';

// Typy dla zakładek
type TabType =
  | 'szczegoly'
  | 'ogledziny'
  | 'oferty'
  | 'umowa'
  | 'montaz'
  | 'faktury'
  | 'przeglady'
  | 'zadania';

// Definicja zakładek dla menu instalacji
const installationTabs: TabItem[] = [
  { id: 'szczegoly', label: 'Szczegóły' },
  { id: 'zadania', label: 'Zadania' },
  { id: 'ogledziny', label: 'Oględziny' },
  { id: 'oferty', label: 'Oferty' },
  { id: 'umowa', label: 'Umowy' },
  { id: 'montaz', label: 'Montaż' },
  { id: 'faktury', label: 'Faktury' },
  { id: 'przeglady', label: 'Przeglądy' },
];

// Komponent wiersza montażu
function MontageRow({
  montage,
  onPress,
  onDelete,
}: {
  montage: Montage;
  onPress: () => void;
  onDelete: () => void;
}) {
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.swipeDeleteAction,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeDeleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <TrashIcon color={Colors.white} size={20} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={styles.montageItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.montageContent}>
          <View style={styles.montageIconContainer}>
            <View style={styles.montageIcon}>
              <Text style={styles.montageIconText}>🔧</Text>
            </View>
          </View>
          <View style={styles.montageDetails}>
            <Text style={styles.montageTitle}>Montaż {montage.id}</Text>
            <Text style={styles.montageSubtitle}>
              {montage.created_date
                ? format(parseISO(montage.created_date), 'dd.MM.yyyy')
                : 'Brak daty'}
            </Text>
          </View>
          <View style={styles.montageRight}>
            <View style={styles.montageStatusBadge}>
              <Text style={styles.montageStatusText}>
                {montage.status || 'W trakcie'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

// Komponent widoku "Montaż"
function MontazView({
  installationId,
  montageList,
  navigation,
  onDeleteMontage,
  onSave,
  onCancel,
  selectedDevice,
}: {
  installationId: string;
  montageList: Montage[] | null;
  navigation: any;
  onDeleteMontage: (id: number) => void;
  onSave?: () => void;
  onCancel?: () => void;
  selectedDevice?: any;
}) {
  // Pobierz montaż dla tej instalacji (jedna instalacja = jeden montaż)
  const montage = montageList && montageList.length > 0 ? montageList[0] : null;

  return (
    <MontageProtocolForm
      installationId={installationId}
      montage={montage}
      onSave={onSave}
      onCancel={onCancel}
      selectedDevice={selectedDevice}
    />
  );
}

// Typ dla faktury
type Invoice = {
  id: number;
  ac_user: number;
  client_name: string;
  id_fakturowni: string;
  instalacja: number | string;
  issue_date: string;
  numer_faktury: string;
  order: number;
  status: string;
};

// Komponent wiersza faktury dla instalacji
function InstallationInvoiceRow({
  invoice,
  navigation,
}: {
  invoice: Invoice;
  navigation: any;
}) {
  const handleInvoicePress = () => {
    navigation('Invoices', {
      screen: 'Details',
      params: { id: invoice.id },
    });
  };

  let statusBgColor = '#E6F7D9'; // Light green background
  let statusTextColor = '#52C41A'; // Darker green text
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
      statusText = 'Wystawiona';
      break;
  }

  // Format date as DD/MM/YYYY
  const formattedDate = invoice.issue_date
    ? format(parseISO(invoice.issue_date), 'dd/MM/yyyy')
    : 'Brak daty';

  return (
    <TouchableOpacity
      style={styles.installationInvoiceItem}
      onPress={handleInvoicePress}
      activeOpacity={0.7}
    >
      <View style={styles.installationInvoiceContent}>
        <View style={styles.installationInvoiceLeft}>
          <Text style={styles.installationInvoiceType}>Faktura VAT</Text>
          <Text style={styles.installationInvoiceNumberDate}>
            {invoice.numer_faktury} • {formattedDate}
          </Text>
        </View>
        <View style={styles.installationInvoiceRight}>
          {/* Kwota będzie dostępna z API, na razie ukryta */}
          {/* {invoice.total && (
            <Text style={styles.installationInvoiceAmount}>
              {invoice.total.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN
            </Text>
          )} */}
          <Text style={styles.installationInvoiceClient}>
            {invoice.client_name}
          </Text>
          <View
            style={[
              styles.installationInvoiceStatusBadge,
              { backgroundColor: statusBgColor },
            ]}
          >
            <Text
              style={[
                styles.installationInvoiceStatusText,
                { color: statusTextColor },
              ]}
            >
              {statusText}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Komponent widoku "Faktury" dla instalacji
function FakturyInstallationView({
  installationId,
  navigation,
}: {
  installationId: string;
  navigation: any;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    result: invoicesResult,
    execute: fetchInvoices,
    loading: apiLoading,
  } = useApi<{
    faktura_list: Invoice[];
  }>({
    path: 'faktura_list',
  });

  useEffect(() => {
    if (fetchInvoices) {
      fetchInvoices({});
    }
  }, [fetchInvoices]);

  useEffect(() => {
    // Ustaw loading na false gdy tylko otrzymamy odpowiedź (nawet pustą)
    if (invoicesResult !== undefined) {
      if (invoicesResult?.faktura_list) {
        // Filtruj faktury które należą do tej instalacji
        const filtered = invoicesResult.faktura_list.filter(
          invoice => invoice.instalacja === Number(installationId),
        );

        // Sortuj według daty wystawienia (najnowsze pierwsze)
        const sorted = filtered.sort(
          (a, b) =>
            new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime(),
        );

        setInvoices(sorted);
      } else {
        setInvoices([]);
      }
      setLoading(false);
    }
  }, [invoicesResult, installationId]);

  // Używamy apiLoading zamiast lokalnego loading
  if (loading && apiLoading) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Ładowanie faktur...</Text>
      </View>
    );
  }

  if (invoices.length === 0) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Brak faktur dla tej instalacji.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contentView}>
      <FlatList
        data={invoices}
        contentContainerStyle={styles.installationInvoicesList}
        renderItem={({ item }) => (
          <InstallationInvoiceRow invoice={item} navigation={navigation} />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

// Komponent wiersza zadania dla instalacji
function InstallationTaskRow({
  task,
  navigation,
  installationId,
  clientId,
  teams,
  employees,
}: {
  task: any;
  navigation: any;
  installationId: string;
  clientId: string;
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
        fromInstallation: true,
        installationId: Number(installationId),
        clientId: Number(clientId),
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

// Komponent widoku "Zadania" dla instalacji
function InstallationZadaniaView({
  installationId,
  clientId,
  navigation,
}: {
  installationId: string;
  clientId: string;
  navigation: any;
}) {
  const { result: allTasks, execute: getTasks, loading } = useTasks();
  const { teams, employees } = useStaff();
  const [installationTasks, setInstallationTasks] = useState<any[]>([]);

  useEffect(() => {
    if (getTasks) {
      getTasks();
    }
  }, [getTasks]);

  useEffect(() => {
    if (allTasks && allTasks.length > 0) {
      // Filtruj zadania dla tej konkretnej instalacji
      // Zadania mogą mieć pole instalacja lub instalacja_id
      const filtered = allTasks.filter(task => {
        const taskInstallationId =
          (task as any).instalacja || (task as any).instalacja_id;
        return taskInstallationId === Number(installationId);
      });
      setInstallationTasks(filtered);
    } else {
      setInstallationTasks([]);
    }
  }, [allTasks, installationId]);

  if (loading) {
    return (
      <View style={styles.tasksContentView}>
        <Text style={styles.emptyText}>Ładowanie zadań...</Text>
      </View>
    );
  }

  if (installationTasks.length === 0) {
    return (
      <View style={styles.tasksContentView}>
        <Text style={styles.emptyText}>Brak zadań dla tej instalacji.</Text>
      </View>
    );
  }

  return (
    <View style={styles.tasksContentView}>
      <FlatList
        data={installationTasks}
        contentContainerStyle={styles.clientTasksList}
        renderItem={({ item }) => (
          <InstallationTaskRow
            task={item}
            navigation={navigation}
            installationId={installationId}
            clientId={clientId}
            teams={teams || undefined}
            employees={employees}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

// Komponent karty umowy
function AgreementCard({
  title,
  date,
  onPress,
}: {
  title: string;
  date: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.agreementCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.agreementContent}>
        <View style={styles.agreementIconContainer}>
          <View style={styles.agreementIconCircle}>
            <FilesIcon color="#36B130" size={20} />
          </View>
        </View>
        <View style={styles.agreementTextContainer}>
          <Text style={styles.agreementTitle}>{title}</Text>
          <Text style={styles.agreementDate}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Komponent formularza umowy (do użycia w AgreementsView)
function AgreementFormContent({
  installationId,
  clientId,
  existingAgreement,
  onCancel,
}: {
  installationId: string;
  clientId: string;
  existingAgreement?: Agreement | null;
  onCancel: () => void;
}) {
  const { clients, getClients } = useClients();
  const { token } = useAuth();
  const { control, handleSubmit, watch, setValue } = useForm<{
    client_type: 'firma' | 'klient_prywatny';
    nip?: string;
    nazwa_firmy?: string;
    ulica?: string;
    numer_budynku?: string;
    numer_lokalu?: string;
    kod_pocztowy?: string;
    miasto?: string;
    imie?: string;
    nazwisko?: string;
    email?: string;
    stanowisko_klienta?: string;
    umowa_file?: {
      uri: string;
      name: string;
      type: string;
    };
  }>({
    defaultValues: {
      client_type: 'firma',
      stanowisko_klienta: 'Właściciel instalacji',
    },
  });

  const { execute: createAgreement } = useApi<{
    status: string;
    agreement: any;
    error?: string;
  }>({
    path: 'agreement_create',
  });

  const watchedClientType = watch('client_type');

  // Pobierz dane klienta i wypełnij formularz
  useEffect(() => {
    if (getClients) {
      getClients();
    }
  }, [getClients]);

  // Wypełnij formularz danymi z istniejącej umowy lub klienta
  useEffect(() => {
    if (existingAgreement) {
      // Jeśli umowa istnieje, wypełnij formularz danymi z umowy
      setValue('client_type', existingAgreement.client_type);
      setValue('nip', existingAgreement.nip || '');
      setValue('nazwa_firmy', existingAgreement.nazwa_firmy || '');
      setValue('ulica', existingAgreement.ulica || '');
      setValue('numer_budynku', existingAgreement.numer_budynku || '');
      setValue('numer_lokalu', existingAgreement.numer_lokalu || '');
      setValue('kod_pocztowy', existingAgreement.kod_pocztowy || '');
      setValue('miasto', existingAgreement.miasto || '');
      setValue('imie', existingAgreement.imie || '');
      setValue('nazwisko', existingAgreement.nazwisko || '');
      setValue('email', existingAgreement.email || '');
      setValue(
        'stanowisko_klienta',
        existingAgreement.stanowisko_klienta || '',
      );

      // Ustaw plik PDF jeśli istnieje
      if (existingAgreement.pdf_file || existingAgreement.pdf_file_url) {
        const pdfUrl =
          existingAgreement.pdf_file_url || existingAgreement.pdf_file;
        const urlParts = pdfUrl.split('/');
        const fileName = urlParts[urlParts.length - 1] || 'umowa.pdf';
        setValue('umowa_file', {
          uri: pdfUrl,
          name: fileName,
          type: 'application/pdf',
        });
      }
    } else if (clients && clientId) {
      // Jeśli umowy nie ma, wypełnij danymi klienta
      const client = clients.find(c => c.id === Number(clientId));
      if (client) {
        // Mapuj rodzaj_klienta na client_type
        const clientType =
          client.rodzaj_klienta === 'osoba_prywatna'
            ? 'klient_prywatny'
            : 'firma';

        setValue('client_type', clientType);
        setValue('imie', client.first_name || '');
        setValue('nazwisko', client.last_name || '');
        setValue('email', client.email || '');
        setValue('ulica', client.ulica || '');
        setValue('numer_budynku', client.numer_domu || '');
        setValue('numer_lokalu', client.mieszkanie || '');
        setValue('kod_pocztowy', client.kod_pocztowy || '');
        setValue('miasto', client.miasto || '');

        // Pola tylko dla firmy
        if (clientType === 'firma') {
          setValue('nip', client.nip || '');
          setValue('nazwa_firmy', client.nazwa_firmy || '');
        }
      }
    }
  }, [existingAgreement, clients, clientId, setValue]);

  const onSubmit = async (data: any) => {
    try {
      // Sprawdź czy plik został wybrany (obiekt File) czy to URL z bazy (string)
      const isNewFile =
        data.umowa_file &&
        typeof data.umowa_file === 'object' &&
        data.umowa_file.uri &&
        !data.umowa_file.uri.startsWith('http');

      if (!isNewFile && !existingAgreement) {
        Alert.alert('Błąd', 'Proszę wybrać plik PDF umowy');
        return;
      }

      const formData = new FormData();
      formData.append('token', token || '');
      formData.append('instalacja_id', installationId);
      formData.append('klient_id', clientId);

      // Dodaj plik tylko jeśli został wybrany nowy plik
      if (isNewFile) {
        formData.append('pdf_file', {
          uri: data.umowa_file.uri,
          name: data.umowa_file.name,
          type: 'application/pdf',
        } as any);
      } else if (existingAgreement) {
        // Jeśli umowa istnieje ale nie wybrano nowego pliku, użyj istniejącego
        // Backend powinien zachować istniejący plik - na razie wymagamy nowego pliku
        Alert.alert(
          'Błąd',
          'Aby zaktualizować umowę, proszę wybrać nowy plik PDF',
        );
        return;
      }

      // Dodaj wszystkie pola formularza
      formData.append('client_type', data.client_type || 'firma');
      if (data.nip) formData.append('nip', data.nip);
      if (data.nazwa_firmy) formData.append('nazwa_firmy', data.nazwa_firmy);
      if (data.ulica) formData.append('ulica', data.ulica);
      if (data.numer_budynku)
        formData.append('numer_budynku', data.numer_budynku);
      if (data.numer_lokalu) formData.append('numer_lokalu', data.numer_lokalu);
      if (data.kod_pocztowy) formData.append('kod_pocztowy', data.kod_pocztowy);
      if (data.miasto) formData.append('miasto', data.miasto);
      if (data.imie) formData.append('imie', data.imie);
      if (data.nazwisko) formData.append('nazwisko', data.nazwisko);
      if (data.email) formData.append('email', data.email);
      if (data.stanowisko_klienta)
        formData.append('stanowisko_klienta', data.stanowisko_klienta);

      const response = await createAgreement({ data: formData });

      if (response && response.status === 'Agreement created') {
        Alert.alert('Sukces', 'Umowa została zapisana');
        onCancel();
      } else {
        Alert.alert('Błąd', response?.error || 'Nie udało się zapisać umowy');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać umowy');
    }
  };

  const handleFetchGUSData = () => {
    // TODO: Implementacja pobierania danych z GUS
    Alert.alert(
      'Info',
      'Funkcja pobierania danych z GUS będzie dostępna wkrótce',
    );
  };

  return (
    <ScrollView
      style={styles.agreementFormScrollContainer}
      contentContainerStyle={styles.agreementFormScrollContent}
    >
      {/* Sekcja: Dane klienta */}
      <Text style={styles.agreementFormSectionTitle}>Dane klienta</Text>

      <View style={styles.agreementFormSegmentedControlContainer}>
        <SegmentedControl
          options={[
            { label: 'Firma', value: 'firma' },
            { label: 'Klient prywatny', value: 'klient_prywatny' },
          ]}
          value={watchedClientType}
          onChange={value =>
            setValue('client_type', value as 'firma' | 'klient_prywatny')
          }
        />
      </View>

      {watchedClientType === 'firma' && (
        <>
          <View style={styles.agreementFormInputContainer}>
            <FormInput
              name="nip"
              control={control}
              label="NIP"
              placeholder="Wpisz NIP"
              noPadding
            />
          </View>
          <View style={styles.agreementFormGusButtonContainer}>
            <SubmitButton
              title="Pobierz dane z GUS"
              onPress={handleFetchGUSData}
              style={styles.agreementFormGusButton}
              titleStyle={styles.agreementFormGusButtonTitle}
            />
          </View>
          <View style={styles.agreementFormInputContainer}>
            <FormInput
              name="nazwa_firmy"
              control={control}
              label="Nazwa firmy"
              placeholder="Wpisz nazwę"
              noPadding
            />
          </View>
        </>
      )}

      <View style={styles.agreementFormInputContainer}>
        <FormInput
          name="ulica"
          control={control}
          label="Ulica"
          placeholder="Wpisz ulicę"
          noPadding
        />
      </View>

      <View style={styles.agreementFormRowInputContainer}>
        <FormInput
          name="numer_budynku"
          control={control}
          label="Numer budynku"
          placeholder="Wpisz ulicę"
          noPadding
          customPercentWidth={48}
        />
        <FormInput
          name="numer_lokalu"
          control={control}
          label="Numer lokalu"
          placeholder="Wpisz ulicę"
          noPadding
          customPercentWidth={48}
        />
      </View>

      <View style={styles.agreementFormRowInputContainer}>
        <FormInput
          name="kod_pocztowy"
          control={control}
          label="Kod pocztowy"
          placeholder="Wpisz ulicę"
          noPadding
          customPercentWidth={48}
        />
        <FormInput
          name="miasto"
          control={control}
          label="Miasto"
          placeholder="Wpisz ulicę"
          noPadding
          customPercentWidth={48}
        />
      </View>

      {/* Sekcja: Informacje kontaktowe */}
      <Text style={styles.agreementFormSectionTitle}>
        Informacje kontaktowe
      </Text>

      <View style={styles.agreementFormInputContainer}>
        <FormInput
          name="imie"
          control={control}
          label="Imię"
          placeholder="Wpisz imię"
          noPadding
        />
      </View>

      <View style={styles.agreementFormInputContainer}>
        <FormInput
          name="nazwisko"
          control={control}
          label="Nazwisko"
          placeholder="Wpisz nazwisko"
          noPadding
        />
      </View>

      <View style={styles.agreementFormInputContainer}>
        <FormInput
          name="email"
          control={control}
          label="E-mail"
          placeholder="Wpisz e-mail"
          noPadding
        />
      </View>

      <View style={styles.agreementFormInputContainer}>
        <Dropdown
          label="Stanowisko klienta"
          name="stanowisko_klienta"
          control={control}
          options={[
            {
              label: 'Właściciel instalacji',
              value: 'Właściciel instalacji',
            },
            { label: 'Przedstawiciel', value: 'Przedstawiciel' },
            { label: 'Inne', value: 'Inne' },
          ]}
          isBordered={false}
        />
      </View>

      {/* Sekcja: Umowa */}
      <Text style={styles.agreementFormSectionTitle}>Umowa</Text>

      <View style={styles.agreementFormFileUploadContainer}>
        <FilePicker
          name="umowa_file"
          control={control}
          label=""
          type="file"
          variant="gray"
          title="Prześlij umowę"
          subtitle="Plik powinien być w formacie PDF"
          acceptedFileTypes={['application/pdf']}
          initialValue={
            existingAgreement?.pdf_file_url || existingAgreement?.pdf_file
          }
        />
      </View>

      {/* Przyciski */}
      <View style={styles.agreementFormButtonsContainer}>
        <ButtonGroup
          cancelTitle="Anuluj"
          submitTitle="Wyślij umowę"
          onCancel={onCancel}
          onSubmitPress={handleSubmit(onSubmit)}
          cancelStyle={styles.agreementFormCancelButton}
          cancelTitleStyle={styles.agreementFormCancelButtonTitle}
          submitStyle={styles.agreementFormSubmitButton}
          submitTitleStyle={styles.agreementFormSubmitButtonTitle}
          stretch
          groupStyle={styles.agreementFormButtonGroup}
        />
      </View>
    </ScrollView>
  );
}

// Komponent widoku "Umowa"
function AgreementsView({
  installation,
  installationId,
  clientId,
  navigation,
}: {
  installation: ClientsInstallationListItem | undefined;
  installationId: string;
  clientId: string;
  navigation: any;
}) {
  const [showForm, setShowForm] = useState(false);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    result: agreementsResult,
    execute: fetchAgreements,
    loading: apiLoading,
  } = useApi<AgreementListResponse>({
    path: 'agreement_list',
  });

  useEffect(() => {
    if (fetchAgreements && installationId) {
      fetchAgreements({ data: { instalacja_id: installationId } });
    }
  }, [fetchAgreements, installationId]);

  useEffect(() => {
    if (agreementsResult !== undefined) {
      if (agreementsResult?.umowy && agreementsResult.umowy.length > 0) {
        // Każda instalacja ma tylko jedną umowę, więc bierzemy pierwszą
        setAgreement(agreementsResult.umowy[0]);
      } else {
        setAgreement(null);
      }
      setLoading(false);
    }
  }, [agreementsResult]);

  const handleAgreementPress = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    // Odśwież umowę po zamknięciu formularza
    if (fetchAgreements && installationId) {
      fetchAgreements({ data: { instalacja_id: installationId } });
    }
  };

  if (showForm) {
    return (
      <View style={styles.umowaContentView}>
        <AgreementFormContent
          installationId={installationId}
          clientId={clientId}
          existingAgreement={agreement}
          onCancel={handleCancel}
        />
      </View>
    );
  }

  // Zawsze pokazujemy komponent umowy, nawet jeśli nie ma jej w bazie
  // Jeśli umowa jest w bazie, używamy jej danych, w przeciwnym razie danych instalacji
  let title: string;
  let date: string;

  if (agreement) {
    // Umowa jest w bazie - używamy danych umowy
    title = `Umowa montażu numer ${agreement.id}`;
    date = agreement.created_date
      ? format(parseISO(agreement.created_date), 'dd/MM/yyyy')
      : 'Brak daty';
  } else if (installation) {
    // Umowy nie ma w bazie - używamy danych instalacji
    title = `Umowa montażu numer ${installation.id}`;
    date = installation.created_date
      ? format(parseISO(installation.created_date), 'dd/MM/yyyy')
      : 'Brak daty';
  } else {
    // Fallback jeśli nie ma danych instalacji
    title = 'Umowa montażu';
    date = 'Brak daty';
  }

  return (
    <View style={styles.umowaContentView}>
      <View style={styles.umowaList}>
        <AgreementCard
          key={agreement?.id || installationId}
          title={title}
          date={date}
          onPress={handleAgreementPress}
        />
      </View>
    </View>
  );
}

// Komponent widoku "Przeglądy" dla instalacji
function PrzegladyView({
  installationId,
  navigation,
  onSave,
  onCancel,
  onReviewPress,
}: {
  installationId: string;
  navigation: any;
  onSave?: () => void;
  onCancel?: () => void;
  onReviewPress?: (reviewId: number) => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    result: reviewsResult,
    execute: fetchReviews,
    loading: apiLoading,
  } = useApi<{ przeglady: Review[] }>({
    path: 'przeglad_list',
  });

  useEffect(() => {
    if (fetchReviews) {
      fetchReviews({ data: { instalacja_id: installationId } });
    }
  }, [fetchReviews, installationId]);

  useEffect(() => {
    if (reviewsResult !== undefined) {
      if (reviewsResult?.przeglady) {
        setReviews(reviewsResult.przeglady);
      } else {
        setReviews([]);
      }
      setLoading(false);
    }
  }, [reviewsResult]);

  // Grupuj przeglądy po roku
  const groupedReviews = reviews.reduce((acc, review) => {
    const dateStr = review.data_przegladu || review.created_date;
    if (!dateStr) {
      const noDateKey = 'Brak daty';
      if (!acc[noDateKey]) {
        acc[noDateKey] = [];
      }
      acc[noDateKey].push(review);
      return acc;
    }

    try {
      const date = parseISO(dateStr);
      const year = format(date, 'yyyy');
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(review);
    } catch (error) {
      const noDateKey = 'Brak daty';
      if (!acc[noDateKey]) {
        acc[noDateKey] = [];
      }
      acc[noDateKey].push(review);
    }
    return acc;
  }, {} as Record<string, Review[]>);

  // Sortuj lata malejąco
  const sortedYears = Object.keys(groupedReviews).sort((a, b) => {
    if (a === 'Brak daty') return 1;
    if (b === 'Brak daty') return -1;
    return parseInt(b) - parseInt(a);
  });

  const handleReviewPress = (review: Review) => {
    if (onReviewPress) {
      onReviewPress(review.id);
    }
  };

  if (loading && apiLoading) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Ładowanie przeglądów...</Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>
          Brak przeglądów dla tej instalacji.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contentView}>
      <ScrollView
        style={styles.reviewsScrollView}
        contentContainerStyle={styles.reviewsScrollContent}
      >
        {sortedYears.map(year => (
          <View key={year} style={styles.reviewsYearGroup}>
            <Text style={styles.reviewsYearHeader}>{year}</Text>
            {groupedReviews[year].map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onPress={() => handleReviewPress(review)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Komponent wiersza oferty dla instalacji
function InstallationOfferRow({
  offer,
  navigation,
  installationId,
  clientId,
}: {
  offer: any;
  navigation: any;
  installationId: string;
  clientId: string;
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
        fromInstallation: true,
        installationId: Number(installationId),
        clientId: Number(clientId),
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
      style={styles.installationOfferItem}
      onPress={handleOfferPress}
      activeOpacity={0.7}
    >
      <View style={styles.installationOfferContent}>
        <View style={styles.installationOfferIconContainer}>
          <View style={styles.installationOfferIcon}>
            <FilesIcon color={Colors.teal} size={20} />
          </View>
        </View>
        <View style={styles.installationOfferDetails}>
          <Text style={styles.installationOfferTitle}>{offerTitle}</Text>
          <Text style={styles.installationOfferDate}>{formattedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Komponent widoku "Oferty" dla instalacji
function OfertyInstallationView({
  installationId,
  clientId,
  navigation,
}: {
  installationId: string;
  clientId: string;
  navigation: any;
}) {
  const { offers, getOffers, offersLoading } = useOffers();
  const [installationOffers, setInstallationOffers] = useState<any[]>([]);

  useEffect(() => {
    if (getOffers) {
      getOffers();
    }
  }, [getOffers]);

  useEffect(() => {
    if (offers && offers.length > 0) {
      // Filtruj oferty które należą do tej instalacji
      const filtered = offers.filter(
        offer =>
          !offer.is_template && offer.instalacja === Number(installationId),
      );

      // Sortuj według daty utworzenia (najnowsze pierwsze)
      const sorted = filtered.sort(
        (a, b) =>
          new Date(b.created_date).getTime() -
          new Date(a.created_date).getTime(),
      );

      setInstallationOffers(sorted);
    } else {
      setInstallationOffers([]);
    }
  }, [offers, installationId]);

  if (offersLoading) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Ładowanie ofert...</Text>
      </View>
    );
  }

  if (installationOffers.length === 0) {
    return (
      <View style={styles.contentView}>
        <Text style={styles.emptyText}>Brak ofert dla tej instalacji.</Text>
      </View>
    );
  }

  return (
    <View style={styles.installationOffersContentView}>
      <FlatList
        data={installationOffers}
        contentContainerStyle={styles.installationOffersList}
        renderItem={({ item }) => (
          <InstallationOfferRow
            offer={item}
            navigation={navigation}
            installationId={installationId}
            clientId={clientId}
          />
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}

// Komponent widoku "Oględziny" - wykorzystuje istniejący komponent ClientInspection
function OgledzinyView({
  installationId,
  clientId,
}: {
  installationId: string;
  clientId: string;
}) {
  // Import dynamiczny komponentu ClientInspection
  const ClientInspection = require('./ClientInspection').default;

  return (
    <ClientInspection
      route={{
        params: { installationId, clientId },
      }}
      hideHeader
    />
  );
}

// Komponent widoku "Szczegóły" - formularz edycji danych instalacji
function SzczegolyView({
  installation,
  client,
  onSave,
  onCancel,
  returnTab,
}: {
  installation: ClientsInstallationListItem | undefined;
  client: Client | null;
  onSave?: () => void;
  onCancel?: () => void;
  returnTab?: TabType;
}) {
  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      nazwa_instalacji: installation?.name || '',
      ulica: installation?.ulica || '',
      numer_domu: installation?.numer_domu || '',
      mieszkanie: installation?.mieszkanie || '',
      kod_pocztowy: installation?.kod_pocztowy || '',
      miasto: installation?.miasto || '',
      data_utworzenia: installation?.created_date
        ? format(parseISO(installation.created_date), 'dd/MM/yyyy')
        : '',
      id_instalacji: installation?.id
        ? `#${installation.id.toString().padStart(4, '0')}`
        : '',
    },
  });

  const { goBack, navigate } = useNavigation<any>();

  const { execute: updateInstallation } = useApi({
    path: 'installation_edit',
  });

  const handleCancel = () => {
    if (returnTab && onCancel) {
      // Przekazujemy returnTab aby ustawić właściwą zakładkę przy powrocie
      onCancel();
    } else if (onCancel) {
      onCancel();
    } else {
      goBack();
    }
  };

  const onSubmit = async (data: any) => {
    if (!installation) return;

    try {
      const response = await updateInstallation({
        data: {
          installation_id: installation.id,
          name: data.nazwa_instalacji,
          ulica: data.ulica || null,
          numer_domu: data.numer_domu || null,
          mieszkanie: data.mieszkanie || null,
          kod_pocztowy: data.kod_pocztowy || null,
          miasto: data.miasto || null,
        },
      });

      if (response) {
        Alert.alert('Sukces', 'Instalacja została zaktualizowana');
        if (onSave) {
          onSave();
        }
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zaktualizować instalacji');
    }
  };

  useEffect(() => {
    if (installation) {
      setValue('nazwa_instalacji', installation.name || '');
      setValue(
        'data_utworzenia',
        installation.created_date
          ? format(parseISO(installation.created_date), 'dd/MM/yyyy')
          : '',
      );
      setValue(
        'id_instalacji',
        installation.id
          ? `#${installation.id.toString().padStart(4, '0')}`
          : '',
      );
      // Używamy tylko danych instalacji - jeśli nie ma, pola są puste
      setValue('ulica', installation.ulica || '');
      setValue('numer_domu', installation.numer_domu || '');
      setValue('mieszkanie', installation.mieszkanie || '');
      setValue('kod_pocztowy', installation.kod_pocztowy || '');
      setValue('miasto', installation.miasto || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installation, client]);

  if (!installation) {
    return (
      <View style={styles.szczegolyContentView}>
        <Text style={styles.emptyText}>Ładowanie szczegółów instalacji...</Text>
      </View>
    );
  }

  return (
    <View style={styles.szczegolyFormContainer}>
      <ScrollView style={styles.szczegolyScrollView}>
        <Text style={styles.szczegolyTitle}>Szczegóły instalacji</Text>
        <FormInput
          name="nazwa_instalacji"
          control={control}
          label="Nazwa instalacji"
          noPadding
        />

        <FormInput name="ulica" control={control} label="Ulica" noPadding />

        <View>
          <View style={styles.szczegolyInputContainer}>
            <FormInput
              name="numer_domu"
              control={control}
              label="Numer domu"
              noPadding
              customPercentWidth={48}
            />
            <FormInput
              name="mieszkanie"
              control={control}
              label="Numer mieszkania"
              noPadding
              customPercentWidth={48}
            />
          </View>
          <View style={styles.szczegolyInputContainer}>
            <FormInput
              name="kod_pocztowy"
              control={control}
              label="Kod pocztowy"
              noPadding
              customPercentWidth={48}
            />
            <FormInput
              name="miasto"
              control={control}
              label="Miasto"
              noPadding
              customPercentWidth={48}
            />
          </View>
          <View style={styles.szczegolyInputContainer}>
            <FormInput
              name="data_utworzenia"
              control={control}
              label="Data utworzenia instalacji"
              editable={false}
              noPadding
              customPercentWidth={48}
            />
            <FormInput
              name="id_instalacji"
              control={control}
              label="ID Instalacji"
              editable={false}
              noPadding
              customPercentWidth={48}
            />
          </View>
        </View>

        <View style={styles.szczegolyFooter}>
          <ButtonGroup
            cancelTitle="Anuluj"
            cancelStyle={styles.szczegolyCancelButton}
            cancelTitleStyle={styles.szczegolyCancelButtonTitle}
            submitTitleStyle={styles.szczegolySubmitButtonTitle}
            stretch
            submitTitle="Zastosuj"
            submitStyle={styles.szczegolySubmitButton}
            onCancel={handleCancel}
            onSubmitPress={handleSubmit(onSubmit)}
            groupStyle={styles.szczegolyButtonGroup}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function MontageDeleteOverlay({
  visible,
  onBackdropPress,
  onDelete,
}: {
  visible: boolean;
  onBackdropPress: () => void;
  onDelete: () => void;
}) {
  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
    >
      <Text style={styles.deleteOverlayTitle}>Usunąć?</Text>
      <View style={styles.deleteOverlayButtonsContainer}>
        <SubmitButton
          title="Tak, usuń"
          style={styles.overlayAgreeButton}
          titleStyle={styles.overlayAgreeButtonTitle}
          onPress={onDelete}
        />
        <SubmitButton
          title="Nie usuwaj"
          style={styles.overlayDeclineButton}
          onPress={onBackdropPress}
          titleStyle={styles.overlayDeclineButtonTitle}
        />
      </View>
    </Overlay>
  );
}

function ClientSettings({
  route: {
    params: { installationId, clientId, activeTab, returnTab, selectedDevice },
  },
}: {
  route: Route<
    'Settings',
    {
      installationId: string;
      clientId: string;
      activeTab?: TabType;
      returnTab?: TabType;
      selectedDevice?: any;
    }
  >;
}) {
  const [currentTab, setCurrentTab] = useState<TabType>(
    activeTab || 'szczegoly',
  );
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(
    Number(installationId) ?? null,
  );
  const [isFocused, setIsFocused] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const { goBack, navigate } = useNavigation<any>();
  const [montageList, setMontageList] = useState<Montage[] | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const { result, execute } = useApi<MontageListResponse>({
    path: 'montaz_list',
  });
  const { clients, getClients } = useClients();

  useEffect(() => {
    if (clients) {
      setClient(clients.find(c => c.id === Number(clientId)) || null);
    }
  }, [clients, clientId]);

  const { execute: deleteMontage } = useApi<MontageListItem>({
    path: 'montaz_delete',
  });

  const { execute: deleteInstallation } = useApi<ClientsInstallationListItem>({
    path: 'installation_delete',
  });

  const { result: installationsResult, execute: executeInstallations } =
    useApi<ClientInstallationsListResponse>({
      path: 'installation_list',
    });

  const fetchInstallationList = useCallback(() => {
    if (isFocused && clientId) {
      executeInstallations({ data: { klient_id: Number(clientId) } });
    }
  }, [clientId, executeInstallations, isFocused]);

  useEffect(() => {
    fetchInstallationList();
  }, [fetchInstallationList]);

  useEffect(() => {
    if (installationsResult) {
      setInstallationsList(installationsResult.installation_list || []);
    }
  }, [installationsResult]);

  useEffect(() => {
    if (result) {
      setMontageList(result);
    }
  }, [result]);

  const onDeleteConfirmed = async () => {
    if (idToDelete) {
      // Sprawdź czy usuwamy instalację czy montaż
      if (idToDelete === Number(installationId)) {
        // Usuwanie instalacji
        await deleteInstallation({ data: { installation_id: idToDelete } });
        Alert.alert('Usunięto instalację');
        goBack();
      } else {
        // Usuwanie montażu
        await deleteMontage({ data: { montaz_id: idToDelete } });
        fetchMontageList();
        Alert.alert('Usunięto montaż');
      }
      toggleDeleteOverlay();
    }
  };

  const fetchMontageList = useCallback(
    () => isFocused && execute({ data: { instalacja_id: installationId } }),
    [installationId, execute, isFocused],
  );

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleDeleteOverlay();
  };

  const handleAddMontage = useCallback(() => {
    // Nawiguj do ekranu Installation bez montage (nowy montaż)
    navigate('Installation', {
      montageId: undefined,
      installationId,
    });
  }, [navigate, installationId]);

  const handleAddInvoice = useCallback(() => {
    // Nawiguj do formularza faktury z pre-wypełnioną instalacją
    navigate('Invoices', {
      screen: 'Form',
      params: {
        clientId,
        installationId,
        from: 'Installation',
      },
    });
  }, [navigate, clientId, installationId]);

  const toggleDeleteOverlay = useCallback(() => {
    setDeleteVisible(!deleteVisible);
  }, [deleteVisible]);

  const [installationsList, setInstallationsList] = useState<
    ClientsInstallationListItem[]
  >([]);

  useEffect(() => {
    getClients();
    fetchMontageList();
  }, [fetchMontageList, getClients, setInstallationsList]);

  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    if (installationsList && installationsList.length > 0 && installationId) {
      const foundInstallation = installationsList.find(
        item => item.id === Number(installationId),
      );
      const newTitle =
        foundInstallation?.name || `Instalacja ${installationId}`;
      setTitle(newTitle);
    }
  }, [installationsList, installationId, client?.id]);

  // Obsługa activeTab z parametrów route
  useEffect(() => {
    if (activeTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  // Renderowanie aktywnej zakładki
  const renderActiveView = () => {
    const currentInstallation = installationsList.find(
      item => item.id === Number(installationId),
    );

    switch (currentTab) {
      case 'szczegoly':
        return (
          <SzczegolyView
            installation={currentInstallation}
            client={client}
            onSave={() => {
              fetchInstallationList();
            }}
            onCancel={() => {
              if (returnTab) {
                navigate('ClientsMenu', {
                  clientId,
                  activeTab: returnTab,
                });
              } else {
                goBack();
              }
            }}
            returnTab={returnTab}
          />
        );
      case 'zadania':
        return (
          <InstallationZadaniaView
            installationId={installationId}
            clientId={clientId}
            navigation={navigate}
          />
        );
      case 'ogledziny':
        return (
          <OgledzinyView installationId={installationId} clientId={clientId} />
        );
      case 'oferty':
        return (
          <OfertyInstallationView
            installationId={installationId}
            clientId={clientId}
            navigation={navigate}
          />
        );
      case 'umowa':
        return (
          <AgreementsView
            installation={currentInstallation}
            installationId={installationId}
            clientId={clientId}
            navigation={navigate}
          />
        );
      case 'montaz':
        return (
          <MontazView
            installationId={installationId}
            montageList={montageList}
            navigation={navigate}
            onDeleteMontage={id => {
              setIdToDelete(id);
              toggleDeleteOverlay();
            }}
            onSave={() => {
              fetchMontageList();
            }}
            selectedDevice={selectedDevice}
            onCancel={() => {
              if (returnTab) {
                navigate('ClientsMenu', {
                  clientId,
                  activeTab: returnTab,
                });
              } else {
                goBack();
              }
            }}
          />
        );
      case 'faktury':
        return (
          <FakturyInstallationView
            installationId={installationId}
            navigation={navigate}
          />
        );
      case 'przeglady':
        if (showReviewForm) {
          return (
            <ReviewProtocolForm
              installationId={installationId}
              reviewId={selectedReviewId}
              onSave={() => {
                setShowReviewForm(false);
                setSelectedReviewId(null);
                // Odśwież listę przeglądów - będzie obsłużone przez PrzegladyView
              }}
              onCancel={() => {
                setShowReviewForm(false);
                setSelectedReviewId(null);
                if (returnTab) {
                  navigate('ClientsMenu', {
                    clientId,
                    activeTab: returnTab,
                  });
                } else {
                  goBack();
                }
              }}
            />
          );
        }
        return (
          <PrzegladyView
            installationId={installationId}
            navigation={navigate}
            onSave={() => {
              // Odśwież listę przeglądów - będzie obsłużone wewnątrz PrzegladyView
            }}
            onCancel={() => {
              if (returnTab) {
                navigate('ClientsMenu', {
                  clientId,
                  activeTab: returnTab,
                });
              } else {
                goBack();
              }
            }}
            onReviewPress={(reviewId: number) => {
              setSelectedReviewId(reviewId);
              setShowReviewForm(true);
            }}
          />
        );
      default:
        return (
          <SzczegolyView installation={currentInstallation} client={client} />
        );
    }
  };

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <View style={styles.container}>
        <ButtonsHeader onBackPress={goBack} />

        {title && (
          <View style={styles.installationTitleContainer}>
            <Text style={styles.installationTitle}>{title}</Text>
          </View>
        )}

        {/* Menu horyzontalne */}
        <HorizontalTabs
          tabs={installationTabs}
          activeTab={currentTab}
          onTabChange={(tabId: string) => setCurrentTab(tabId as TabType)}
        />

        {/* Poziomy border oddzielający zakładki od reszty treści */}
        <Divider style={styles.divider} />

        {/* Zawartość aktywnej zakładki */}
        <View style={styles.contentScroll}>{renderActiveView()}</View>

        <MontageDeleteOverlay
          visible={deleteVisible}
          onBackdropPress={toggleDeleteOverlay}
          onDelete={onDeleteConfirmed}
        />
      </View>

      {currentTab === 'faktury' && (
        <FloatingActionButton
          onPress={handleAddInvoice}
          backgroundColor={Colors.green}
        />
      )}

      {currentTab === 'przeglady' && !showReviewForm && (
        <FloatingActionButton
          onPress={() => {
            setSelectedReviewId(null);
            setShowReviewForm(true);
          }}
          backgroundColor={Colors.green}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  divider: {
    paddingTop: 10,
    borderBottomColor: Colors.green,
    borderBottomWidth: 2,
  },
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
    paddingTop: 40,
    height: '100%',
  },
  installationTitleContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: Colors.white,
  },
  installationTitle: {
    fontSize: 20,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  contentScroll: {
    flex: 1,
    height: '100%',
  },
  contentView: {
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
  placeholderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.grayText,
    fontFamily: 'Archivo_400Regular',
    textAlign: 'center',
  },
  szczegolyFormContainer: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    display: 'flex',
    flexDirection: 'column',
  },
  szczegolyContentView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  szczegolyTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 12,
  },
  szczegolyScrollView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    paddingHorizontal: 14,
    paddingTop: 20,
  },
  szczegolyInputContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'space-between',
  },
  szczegolyFooter: {
    width: '100%',
    backgroundColor: Colors.homeScreenBackground,
    paddingBottom: 20,
  },
  szczegolyCancelButton: {
    minHeight: 48,
    height: 48,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    borderWidth: 1,
    backgroundColor: Colors.transparent,
    borderColor: Colors.borderButton,
    flex: 1,
  },
  szczegolyCancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  szczegolySubmitButton: {
    backgroundColor: Colors.green,
    minHeight: 48,
    height: 48,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    flex: 1,
  },
  szczegolySubmitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  szczegolyButtonGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingBottom: 20,
  },
  // Style dla listy ofert instalacji
  installationOffersContentView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  installationOffersList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
  },
  installationOfferItem: {
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
  installationOfferContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  installationOfferIconContainer: {
    marginRight: 12,
  },
  installationOfferIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.backgroundTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  installationOfferDetails: {
    flex: 1,
  },
  installationOfferTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    marginBottom: 4,
  },
  installationOfferDate: {
    fontSize: 12,
    color: '#616161',
    fontFamily: 'Archivo_400Regular',
  },
  installationOfferRight: {
    alignItems: 'flex-end',
  },
  installationOfferStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  installationOfferStatusText: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontWeight: '700',
  },
  // Style dla listy montaży
  montageList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
  },
  montageItem: {
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
  montageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  montageIconContainer: {
    marginRight: 12,
  },
  montageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  montageIconText: {
    fontSize: 20,
  },
  montageDetails: {
    flex: 1,
  },
  montageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    marginBottom: 4,
  },
  montageSubtitle: {
    fontSize: 12,
    color: Colors.grayerText,
    fontFamily: 'Archivo_400Regular',
  },
  montageRight: {
    alignItems: 'flex-end',
  },
  montageStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.statusPlanned,
    minWidth: 80,
    alignItems: 'center',
  },
  montageStatusText: {
    fontSize: 11,
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontWeight: '700',
  },
  swipeDeleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 12,
  },
  swipeDeleteButton: {
    backgroundColor: Colors.logout,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    borderRadius: 8,
  },
  // Style dla listy faktur instalacji
  installationInvoicesList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  installationInvoiceItem: {
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
  installationInvoiceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  installationInvoiceLeft: {
    flex: 1,
  },
  installationInvoiceType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    marginBottom: 4,
  },
  installationInvoiceNumberDate: {
    fontSize: 13,
    color: '#777777',
    fontFamily: 'Archivo_400Regular',
  },
  installationInvoiceRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  installationInvoiceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    marginBottom: 4,
  },
  installationInvoiceClient: {
    fontSize: 13,
    color: '#777777',
    fontFamily: 'Archivo_400Regular',
    marginBottom: 6,
  },
  installationInvoiceStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  installationInvoiceStatusText: {
    fontSize: 11,
    fontFamily: 'Archivo_400Regular',
    fontWeight: '400',
  },
  // Style dla listy zadań instalacji (zgodne z ClientsMenu)
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
  overlay: {
    padding: 12,
    width: '90%',
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  deleteOverlayTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 16,
  },
  deleteOverlayButtonsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  overlayAgreeButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.logout,
    padding: 0,
  },
  overlayAgreeButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  overlayDeclineButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.white,
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.black,
  },
  overlayDeclineButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  // Style dla listy przeglądów
  reviewsScrollView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  reviewsScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
  },
  reviewsYearGroup: {
    marginBottom: 24,
  },
  reviewsYearHeader: {
    fontSize: 24,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 16,
  },
  // Style dla widoku Umowy
  umowaContentView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  umowaList: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
  },
  agreementCard: {
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
  agreementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementIconContainer: {
    marginRight: 12,
  },
  agreementIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E6F7D9', // Light green background matching the header
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 4,
  },
  agreementDate: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: '#616161', // Medium grey
  },
  // Style dla formularza umowy
  agreementFormScrollContainer: {
    flex: 1,
  },
  agreementFormScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  agreementFormSectionTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginTop: 20,
    marginBottom: 12,
  },
  agreementFormSegmentedControlContainer: {
    backgroundColor: Colors.white,
    padding: 10,
    marginBottom: 16,
    borderRadius: 10,
  },
  agreementFormInputContainer: {
    marginBottom: 0,
  },
  agreementFormRowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: 12,
  },
  agreementFormGusButtonContainer: {
    marginBottom: 16,
  },
  agreementFormGusButton: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderButton,
    minHeight: 48,
  },
  agreementFormGusButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
  },
  agreementFormFileUploadContainer: {
    marginBottom: 20,
  },
  agreementFormFileUploadSubtext: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.grayText,
    marginTop: 8,
    paddingLeft: 4,
  },
  agreementFormButtonsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  agreementFormButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  agreementFormCancelButton: {
    flex: 1,
    backgroundColor: Colors.transparent,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: Colors.borderButton,
    minHeight: 48,
  },
  agreementFormCancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  agreementFormSubmitButton: {
    flex: 1,
    backgroundColor: Colors.green,
    borderRadius: 60,
    minHeight: 48,
  },
  agreementFormSubmitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
});

export default ClientSettings;
