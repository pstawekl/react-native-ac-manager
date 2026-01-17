/* eslint-disable react-native/no-inline-styles */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';

import { Divider, Text } from '@rneui/themed';
import { LinkButton, SubmitButton } from '../../components/Button';
import Container from '../../components/Container';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import { AuthParamList } from '../../navigation/types';
import useAuth, { RegistrationData } from '../../providers/AuthProvider';

const INVITATION_TOKEN_KEY = 'invitation_token';

const API_URL: string =
  Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';
const API_PORT: string = Constants?.expoConfig?.extra?.apiPort ?? '';
const API_PATH: string =
  API_URL.length > 0 && API_PORT.length > 0
    ? `${API_URL}:${API_PORT}/api`
    : `${API_URL}/api`;

function RegistrationScreen({
  navigation,
}: StackScreenProps<AuthParamList, 'Registration'>) {
  const { loading, register } = useAuth();
  const route = useRoute();
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [clientType, setClientType] = useState<string>('osoba_prywatna');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegistrationData>({
    defaultValues: {
      rodzaj_klienta: 'osoba_prywatna',
      nazwa_firmy: '',
      nip: '',
      first_name: '',
      last_name: '',
      ulica: '',
      numer_domu: '',
      mieszkanie: '',
      kod_pocztowy: '',
      miasto: '',
      email: '',
      numer_telefonu: '',
      password: '',
    },
  });

  // Obserwowanie typu klienta w czasie rzeczywistym
  const watchedClientType = watch('rodzaj_klienta');

  // Funkcja do parsowania parametrów z URL
  const parseUrlParams = (url: string) => {
    try {
      const urlObj = new URL(url);
      const params: { token?: string; email?: string } = {};

      // Pobierz parametry z query string
      const token = urlObj.searchParams.get('token');
      const email = urlObj.searchParams.get('email');

      if (token) params.token = token;
      if (email) params.email = decodeURIComponent(email);

      return params;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Błąd podczas parsowania URL:', error);
      return {};
    }
  };

  // Funkcja do pobierania danych użytkownika z backendu na podstawie tokenu zaproszenia
  const fetchUserDataFromInvitation = async (
    invitationToken: string,
    email?: string,
  ) => {
    setLoadingUserData(true);
    try {
      // eslint-disable-next-line no-console
      console.log('Pobieranie danych użytkownika z tokenu:', invitationToken);

      const response = await fetch(`${API_PATH}/invitation_data/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_token: invitationToken,
          email: email,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        // eslint-disable-next-line no-console
        console.log('Pobrano dane użytkownika:', userData);

        // Wypełnij formularz danymi użytkownika
        if (userData.email) setValue('email', userData.email);
        if (userData.first_name) setValue('first_name', userData.first_name);
        if (userData.last_name) setValue('last_name', userData.last_name);
        if (userData.ulica) setValue('ulica', userData.ulica);
        if (userData.numer_domu) setValue('numer_domu', userData.numer_domu);
        if (userData.mieszkanie) setValue('mieszkanie', userData.mieszkanie);
        if (userData.miasto) setValue('miasto', userData.miasto);
        if (userData.kod_pocztowy)
          setValue('kod_pocztowy', userData.kod_pocztowy);
        if (userData.numer_telefonu)
          setValue('numer_telefonu', userData.numer_telefonu);
        if (userData.rodzaj_klienta) {
          setValue('rodzaj_klienta', userData.rodzaj_klienta);
          setClientType(userData.rodzaj_klienta);
        }
        if (userData.nazwa_firmy) setValue('nazwa_firmy', userData.nazwa_firmy);
        if (userData.nip) setValue('nip', userData.nip);
      } else {
        const errorData = await response.json();
        // eslint-disable-next-line no-console
        console.error('Błąd podczas pobierania danych użytkownika:', errorData);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Błąd podczas pobierania danych użytkownika:', error);
    } finally {
      setLoadingUserData(false);
    }
  };

  // Pobierz parametry z deep linku
  useEffect(() => {
    // Najpierw sprawdź parametry z route (React Navigation)
    const routeParams = route.params as
      | { token?: string; email?: string }
      | undefined;

    // Następnie sprawdź deep link bezpośrednio
    const handleDeepLink = async () => {
      try {
        let tokenToUse: string | null = null;
        let emailToUse: string | null = null;

        // Sprawdź czy aplikacja została otwarta przez deep link
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes('register')) {
          const params = parseUrlParams(initialUrl);
          if (params.email) {
            emailToUse = params.email;
          }
          if (params.token) {
            tokenToUse = params.token;
            await AsyncStorage.setItem(INVITATION_TOKEN_KEY, params.token);
            // eslint-disable-next-line no-console
            console.log('Token zaproszenia zapisany w AsyncStorage:', params.token);
          }
        }
        // Sprawdź parametry z route jeśli nie ma z initial URL
        else if (routeParams) {
          if (routeParams.email) {
            emailToUse = routeParams.email;
          }
          if (routeParams.token) {
            tokenToUse = routeParams.token;
            await AsyncStorage.setItem(INVITATION_TOKEN_KEY, routeParams.token);
            // eslint-disable-next-line no-console
            console.log('Token zaproszenia zapisany w AsyncStorage:', routeParams.token);
          }
        } else {
          // Sprawdź czy token jest już zapisany (gdy użytkownik wrócił do ekranu)
          const savedToken = await AsyncStorage.getItem(INVITATION_TOKEN_KEY);
          if (savedToken) {
            tokenToUse = savedToken;
            // eslint-disable-next-line no-console
            console.log('Token zaproszenia pobrany z AsyncStorage:', savedToken);
          }
        }

        // Jeśli mamy token, pobierz dane użytkownika z backendu
        if (tokenToUse) {
          await fetchUserDataFromInvitation(tokenToUse, emailToUse || undefined);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Błąd podczas obsługi deep linku:', err);
      }
    };

    handleDeepLink();

    // Nasłuchuj na nowe deep linki (gdy aplikacja jest już otwarta)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && url.includes('register')) {
        const params = parseUrlParams(url);
        let tokenToUse: string | null = null;
        let emailToUse: string | null = null;

        if (params.email) {
          emailToUse = params.email;
        }
        if (params.token) {
          tokenToUse = params.token;
          AsyncStorage.setItem(INVITATION_TOKEN_KEY, params.token)
            .then(() => {
              // eslint-disable-next-line no-console
              console.log('Token zaproszenia zapisany w AsyncStorage:', params.token);
              // Pobierz dane użytkownika po zapisaniu tokenu
              if (tokenToUse) {
                fetchUserDataFromInvitation(tokenToUse, emailToUse || undefined);
              }
            })
            .catch(err => {
              // eslint-disable-next-line no-console
              console.error('Błąd podczas zapisywania tokenu zaproszenia:', err);
            });
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [route.params, setValue]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <Container style={styles.flex}>
          {loadingUserData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.block}>
                <Dropdown
                  label="Rodzaj klienta *"
                  name="rodzaj_klienta"
                  control={control}
                  options={[
                    { label: 'Osoba prywatna', value: 'osoba_prywatna' },
                    { label: 'Firma', value: 'firma' },
                  ]}
                  isBordered
                  isThin
                  zIndex={9}
                  onChange={value => {
                    setClientType(value);
                  }}
                />

                {watchedClientType === 'firma' && (
                  <View style={styles.clientContainer}>
                    <View style={[styles.formContainer, { gap: -18 }]}>
                      <FormInput
                        name="nazwa_firmy"
                        control={control}
                        label="Nazwa firmy"
                        isThin
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
                    </View>
                  </View>
                )}

                <Text style={styles.sectionText}>Informacje personalne</Text>
                <Divider style={styles.divider} />

                <View style={styles.formContainer}>
                  <FormInput
                    name="first_name"
                    control={control}
                    label="Imię *"
                    noPadding
                    rules={{
                      required: 'Imię jest wymagane',
                    }}
                    error={errors.first_name}
                  />
                  <FormInput
                    name="last_name"
                    control={control}
                    label="Nazwisko *"
                    noPadding
                    rules={{
                      required: 'Nazwisko jest wymagane',
                    }}
                    error={errors.last_name}
                  />
                </View>

                <View style={styles.formContainer}>
                  <FormInput
                    name="ulica"
                    control={control}
                    label="Ulica"
                    noPadding
                  />
                  <FormInput
                    name="numer_domu"
                    control={control}
                    label="Numer domu"
                    noPadding
                    customPercentWidth={48}
                  />
                  <FormInput
                    label="Numer mieszkania"
                    name="mieszkanie"
                    control={control}
                    noPadding
                    customPercentWidth={48}
                  />
                </View>

                <View style={styles.formContainer}>
                  <FormInput
                    name="kod_pocztowy"
                    control={control}
                    label="Kod pocztowy"
                    noPadding
                    error={errors.kod_pocztowy}
                    rules={{
                      pattern: {
                        value: /^\d{2}-\d{3}$/,
                        message:
                          'Nieprawidłowy format kodu pocztowego (XX-XXX)',
                      },
                    }}
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

                <Text style={styles.sectionText}>Informacje kontaktowe</Text>
                <Divider style={styles.divider} />

                {watchedClientType === 'osoba_prywatna' && (
                  <Text style={styles.infoText}>
                    💡 Dla osób prywatnych email nie jest wymagany
                  </Text>
                )}

                <FormInput
                  name="email"
                  control={control}
                  label={watchedClientType === 'firma' ? 'E-mail *' : 'E-mail'}
                  noPadding
                  error={errors.email}
                  rules={{
                    required:
                      watchedClientType === 'firma'
                        ? 'E-mail jest wymagany dla firm'
                        : false,
                    validate: (value: string | null) => {
                      // Jeśli pole jest puste i to nie firma, to jest OK
                      if (!value && watchedClientType !== 'firma') {
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

                <Text style={styles.sectionText}>Hasło</Text>
                <Divider style={styles.divider} />

                <FormInput
                  name="password"
                  control={control}
                  label="Hasło *"
                  error={errors.password}
                  rules={{
                    required: 'Hasło jest wymagane',
                    minLength: {
                      value: 6,
                      message: 'Hasło musi mieć minimum 6 znaków',
                    },
                  }}
                  secureTextEntry
                />

                <View style={styles.submitButtonContainer}>
                  <SubmitButton
                    title="Zarejestruj się"
                    onPress={handleSubmit(register)}
                    loading={loading}
                  />
                </View>

                <LinkButton
                  text="Masz już konto?"
                  title="Zaloguj się"
                  onPress={() => navigation.navigate('Login')}
                />
              </View>
            </ScrollView>
          )}
        </Container>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  sectionText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.grayTitle,
  },
  infoText: {
    marginVertical: 8,
    fontSize: 14,
    color: Colors.blue,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  divider: {
    marginTop: 6,
    marginBottom: 20,
    borderBottomColor: Colors.grayTitle,
    borderBottomWidth: 1,
  },
  clientContainer: {
    paddingVertical: 10,
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  block: {
    paddingBottom: 14,
  },
  submitButtonContainer: {
    marginTop: 25,
    marginBottom: 25,
    paddingHorizontal: 30,
    width: '100%',
  },
});

export default RegistrationScreen;
