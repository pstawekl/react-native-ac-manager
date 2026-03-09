/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';

import { Text } from '@rneui/themed';
import { ButtonGroup, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { Dropdown, FormInput } from '../../components/Input';
import RadioButtons from '../../components/RadioButtons';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { ClientFormScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useClients from '../../providers/ClientsProvider';

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

type CreateClientData = {
  sendInvitation?: boolean;
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
  latitude?: string;
  longitude?: string;
};
type EditClientData = CreateClientData & { user_id: number };
type FormData = {
  sendInvitation?: boolean;
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

export default function ClientForm({ route }: ClientFormScreenProps) {
  const clientFromParams = route.params?.client;
  const { clients, getClients, resetClients } = useClients();
  const { token } = useAuth();

  // Pobierz aktualne dane klienta z ClientsProvider na podstawie ID
  const client = clientFromParams?.id
    ? clients?.find(c => c.id === clientFromParams.id) || clientFromParams
    : clientFromParams;

  const [clientType, setClientType] = useState<string | undefined>(
    client?.rodzaj_klienta ?? 'firma',
  );

  const isEditMode = Boolean(client);
  const navigation = useNavigation<ClientFormScreenProps['navigation']>();
  const [submitting, setSubmitting] = useState(false);
  const { execute, loading } = useApi<{
    message: string;
    error: string;
    Status?: string;
    client_id?: number;
    user_exists?: boolean;
    existing_user_id?: number;
    existing_user_name?: string;
    existing_user_email?: string;
  }>({
    path: isEditMode ? 'change_child_data' : 'create_klient',
  });

  const { execute: sendInvitationApi } = useApi<{
    status: string;
    error?: string;
    invitation_id?: number;
    message?: string;
  }>({
    path: 'send_invitation',
  });

  const { execute: checkEmailApi } = useApi<{
    exists: boolean;
    email: string;
    error?: string;
    existing_user_id?: number;
    existing_user_name?: string;
    existing_user_email?: string;
  }>({
    path: 'check_email',
  });

  const { execute: addExistingUserToListApi } = useApi<{
    status: string;
    user_id: number;
    user_name: string;
    added_to_list: boolean;
    lista_id?: number;
    error?: string;
  }>({
    path: 'add_existing_user_to_list',
  });

  const { execute: getClientListsApi } = useApi<{
    listy_klientow: Array<{ id: number; nazwa: string }>;
    error?: string;
  }>({
    path: 'listy_klientow',
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
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
      sendInvitation: false,
      client_status: client?.client_status || '0',
    },
  });

  // Obserwowanie typu klienta w czasie rzeczywistym
  const watchedClientType = watch('rodzaj_klienta');

  // Aktualizuj wartości formularza, gdy client się zmieni
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
        sendInvitation: false,
        client_status: client.client_status || '0',
      });
    }
  }, [client, reset]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;
      setSubmitting(true);

      // Jeśli zaznaczono zaproszenie, wymagaj przynajmniej e-maila lub numeru telefonu
      if (
        data.sendInvitation === true &&
        (!data.email || data.email.trim() === '') &&
        (!data.numer_telefonu || data.numer_telefonu.trim() === '')
      ) {
        Alert.alert(
          'Błąd',
          'Wypełnij pole e-mail lub numer telefonu, aby wysłać zaproszenie.',
        );
        setSubmitting(false);
        return;
      }

      // W trybie dodawania (nie edycji) sprawdź czy email już istnieje
      if (!isEditMode && data.email && !data.email.endsWith('@temp.local')) {
        try {
          const emailCheckResponse = await checkEmailApi({
            data: {
              email: data.email,
            },
          });

          if (emailCheckResponse?.exists) {
            // Jeśli mamy informacje o istniejącym użytkowniku, pokaż dialog z opcją dodania
            if (
              emailCheckResponse.existing_user_id &&
              emailCheckResponse.existing_user_name
            ) {
              Alert.alert(
                'Użytkownik już istnieje',
                `Klient z adresem email "${data.email
                }" już istnieje w systemie.\n\nUżytkownik: ${emailCheckResponse.existing_user_name
                }\nEmail: ${emailCheckResponse.existing_user_email || data.email
                }\n\nCzy chcesz dodać tego użytkownika do swojej listy klientów?`,
                [
                  {
                    text: 'Anuluj',
                    style: 'cancel',
                  },
                  {
                    text: 'Dodaj do listy',
                    style: 'default',
                    onPress: async () => {
                      try {
                        // Backend automatycznie doda do pierwszej listy jeśli lista_id nie jest podane
                        const addResponse = await addExistingUserToListApi({
                          data: {
                            existing_user_id:
                              emailCheckResponse.existing_user_id,
                            // lista_id nie jest wymagane - backend automatycznie użyje pierwszej listy
                          },
                        });

                        if (addResponse?.error) {
                          Alert.alert('Błąd', addResponse.error);
                          return;
                        }

                        if (addResponse?.status) {
                          Alert.alert(
                            'Użytkownik dodany do listy klientów',
                            `Użytkownik ${addResponse.user_name} został dodany do listy klientów.`,
                            [
                              {
                                text: 'OK',
                                onPress: () => {
                                  // Odśwież listę klientów i zamknij formularz
                                  getClients?.();
                                  navigation.goBack();
                                },
                              },
                            ],
                          );
                        }
                      } catch (error) {
                        Alert.alert(
                          'Błąd',
                          'Nie udało się dodać użytkownika do listy klientów.',
                        );
                      }
                    },
                  },
                ],
              );
            } else {
              // Fallback - jeśli nie mamy informacji o użytkowniku
              Alert.alert(
                'Użytkownik już istnieje',
                `Klient z adresem email "${data.email}" już istnieje w systemie.\n\nMożliwe przyczyny:\n• Ten email został wcześniej zarejestrowany\n• Klient może być już przypisany do innego użytkownika\n\nSpróbuj użyć innego adresu email lub znajdź istniejącego klienta na liście.`,
                [{ text: 'OK', style: 'default' }],
              );
            }
            return; // Przerwij submit
          }
        } catch {
          // W przypadku błędu API, kontynuuj (backend też sprawdzi)
        }
      }

      // Zapisz wartość sendInvitation przed usunięciem z danych
      const sendInvitationValue = data.sendInvitation;
      const { sendInvitation, ...dataWithoutInvitation } = data;

      const finalData: CreateClientData | EditClientData = {
        ...dataWithoutInvitation,
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

        // Zapisz współrzędne tylko jeśli geokodowanie znalazło lokalizację (nie 0,0)
        if (
          coordinates &&
          coordinates.lat !== 0 &&
          coordinates.lng !== 0 &&
          Number.isFinite(coordinates.lat) &&
          Number.isFinite(coordinates.lng)
        ) {
          finalData.latitude = String(coordinates.lat);
          finalData.longitude = String(coordinates.lng);
        }
      }

      if (isEditMode && client) {
        (finalData as EditClientData).user_id = client.id;
      }

      const response = await execute({ data: finalData });

      // Jeśli nie ma odpowiedzi (błąd sieciowy lub timeout)
      if (!response) {
        return;
      }

      // Sprawdź czy backend zwrócił informację o istniejącym użytkowniku
      if (response?.user_exists && response.existing_user_id) {
        Alert.alert(
          'Użytkownik już istnieje',
          `Klient z adresem email "${data.email
          }" już istnieje w systemie.\n\nUżytkownik: ${response.existing_user_name
          }\nEmail: ${response.existing_user_email || data.email
          }\n\nCzy chcesz dodać tego użytkownika do swojej listy klientów?`,
          [
            {
              text: 'Anuluj',
              style: 'cancel',
            },
            {
              text: 'Dodaj do listy',
              style: 'default',
              onPress: async () => {
                try {
                  // Backend automatycznie doda do pierwszej listy jeśli lista_id nie jest podane
                  const addResponse = await addExistingUserToListApi({
                    data: {
                      existing_user_id: response.existing_user_id,
                      // lista_id nie jest wymagane - backend automatycznie użyje pierwszej listy
                    },
                  });

                  if (addResponse?.error) {
                    Alert.alert('Błąd', addResponse.error);
                    return;
                  }

                  if (addResponse?.status) {
                    Alert.alert(
                      'Użytkownik dodany do listy klientów',
                      `Użytkownik ${addResponse.user_name} został dodany do listy klientów.`,
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            // Odśwież listę klientów i zamknij formularz
                            getClients?.();
                            navigation.goBack();
                          },
                        },
                      ],
                    );
                  }
                } catch (error) {
                  Alert.alert(
                    'Błąd',
                    'Nie udało się dodać użytkownika do listy klientów.',
                  );
                }
              },
            },
          ],
        );
        return;
      }

      // Sprawdź czy jest błąd
      if (response?.error) {
        // Specjalna obsługa dla błędu "użytkownik już istnieje"
        if (
          response.error === 'User already exists.' ||
          (typeof response.error === 'string' &&
            response.error.toLowerCase().includes('already exists'))
        ) {
          Alert.alert(
            'Użytkownik już istnieje',
            `Klient z adresem email "${data.email}" już istnieje w systemie.\n\nMożliwe przyczyny:\n• Ten email został wcześniej zarejestrowany\n• Klient może być już przypisany do innego użytkownika\n\nSpróbuj użyć innego adresu email lub znajdź istniejącego klienta na liście.`,
            [{ text: 'OK', style: 'default' }],
          );
        } else {
          // Inne błędy
          Alert.alert('Błąd', response.error);
        }
        return;
      }

      if (
        response?.message === 'User and user data updated successfully' ||
        response?.Status === 'User Created'
      ) {
        // Pobierz ID klienta z odpowiedzi lub użyj istniejącego
        const clientId =
          response?.client_id || (isEditMode ? client?.id : undefined);

        // Jeśli checkbox "Zaproś do aplikacji" jest zaznaczony i klient ma email (nie tymczasowy)
        if (
          sendInvitationValue === true &&
          clientId &&
          data.email &&
          !data.email.endsWith('@temp.local')
        ) {
          try {
            const invitationResponse = await sendInvitationApi({
              data: {
                token,
                email: data.email,
                client_id: clientId,
              },
            });

            if (invitationResponse?.status === 'Zaproszenie wysłane') {
              Alert.alert(
                isEditMode ? 'Klient zaktualizowany' : 'Klient dodany',
                invitationResponse?.message ||
                'Zaproszenie do aplikacji zostało wysłane na adres email klienta.',
              );
            } else if (invitationResponse?.error) {
              Alert.alert(
                isEditMode ? 'Klient zaktualizowany' : 'Klient dodany',
                `Uwaga: ${invitationResponse.error}`,
              );
            } else {
              // Jeśli nie ma statusu ani błędu, może być problem z odpowiedzią
              Alert.alert(
                isEditMode ? 'Klient zaktualizowany' : 'Klient dodany',
                'Uwaga: Nie udało się potwierdzić wysłania zaproszenia.',
              );
            }
          } catch (error) {
            // Nie przerywaj procesu jeśli wysyłanie zaproszenia się nie powiodło
            Alert.alert(
              isEditMode ? 'Klient zaktualizowany' : 'Klient dodany',
              'Uwaga: Nie udało się wysłać zaproszenia do aplikacji.',
            );
          }
        } else {
          Alert.alert(isEditMode ? 'Klient zaktualizowany.' : 'Klient dodany.');
        }

        if (resetClients && getClients) {
          resetClients();
          await getClients(1, false);
        }
        navigation.goBack();
      } else {
        Alert.alert(
          'Błąd',
          'Wystąpił nieoczekiwany błąd podczas zapisywania klienta.',
        );
      }

      setSubmitting(false);
    },
    [
      execute,
      getClients,
      isEditMode,
      navigation,
      client,
      sendInvitationApi,
      token,
      checkEmailApi,
      resetClients,
      submitting,
    ],
  );

  return (
    <View style={styles.wrapper}>
      <ButtonsHeader onBackPress={navigation.goBack} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <Dropdown
            label="Rodzaj klienta *"
            name="rodzaj_klienta"
            control={control}
            options={[
              { label: 'Firma', value: 'firma' },
              { label: 'Osoba prywatna', value: 'osoba_prywatna' },
            ]}
            isBordered
            isThin
            zIndex={9}
            onChange={value => {
              setClientType(value);
            }}
          />
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
            <View style={styles.inputContainer}>
              <FormInput
                name="email"
                control={control}
                label="E-mail *"
                noPadding
                error={errors.email}
                rules={{
                  required: 'E-mail jest wymagany',
                  validate: (value: string | null) => {
                    // Jeśli to adres @temp.local, nie sprawdzaj poprawności
                    if (value && value.endsWith('@temp.local')) {
                      return true;
                    }
                    // Jeśli pole ma wartość, sprawdź pattern
                    if (
                      value &&
                      !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(
                        value,
                      )
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

          {/* Pokaż checkbox tylko jeśli klient nie ma konta lub nie ma jeszcze przypisanego klienta */}
          {(!isEditMode || client?.has_account !== true) && (
            <RadioButtons
              name="sendInvitation"
              control={control}
              options={[{ label: 'Zaproś do aplikacji', value: true }]}
              size={21}
              textStyle={styles.invitation}
              checkedColor={Colors.primary}
              uncheckedColor={Colors.grayBorder}
            />
          )}
          <ButtonGroup
            submitTitle={isEditMode ? 'Zapisz' : 'Dodaj'}
            cancelTitle="Anuluj"
            onSubmitPress={handleSubmit(onSubmit)}
            onCancel={() => {
              Alert.alert(
                'Anulować wprowadzanie danych?',
                'Wprowadzone dane zostaną utracone.',
                [
                  { text: 'Nie', style: 'cancel' },
                  {
                    text: 'Tak, anuluj',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                  },
                ],
              );
            }}
            stretch
            groupStyle={styles.buttonGroup}
            cancelStyle={styles.cancelButton}
            cancelTitleStyle={styles.cancelButtonTitle}
            submitStyle={styles.submitButton}
            submitTitleStyle={styles.submitButtonTitle}
            loading={loading || submitting}
            disabled={submitting}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 40,
    backgroundColor: Colors.white,
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  container: {
    paddingHorizontal: 14,
    paddingTop: 20,
    backgroundColor: Colors.homeScreenBackground,
    height: '100%',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  sectionText: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 16,
  },
  infoText: {
    marginVertical: 8,
    fontSize: 14,
    color: Colors.blue,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 2,
    paddingHorizontal: 8,
  },
  invitation: {
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
  },
  gusDataButton: {
    marginTop: 10,
    width: '100%',
  },
  submitButtonStyle: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.white,
    borderColor: Colors.gray,
    borderWidth: 2,
    borderRadius: 15,
  },
  submitButtonTitleStyle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  cancelButton: {
    minHeight: 48,
    height: 48,
    borderRadius: 60,
    borderWidth: 1,
    backgroundColor: Colors.transparent,
    borderColor: Colors.borderButton,
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: Colors.green,
    minHeight: 48,
    height: 48,
    borderRadius: 60,
  },
  submitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 20,
    width: '100%',
    paddingBottom: 80,
  },
});
