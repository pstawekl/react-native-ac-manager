import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ButtonGroup, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import FilePicker from '../../components/FilePicker';
import { Dropdown, FormInput } from '../../components/Input';
import SegmentedControl from '../../components/SegmentedControl';
import Colors from '../../consts/Colors';
import useClients from '../../providers/ClientsProvider';

type AgreementFormData = {
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
};

export default function AgreementForm({ route }: any) {
  const navigation = useNavigation<any>();
  const { installationId, clientId } = route.params || {};
  const { clients, getClients } = useClients();

  const { control, handleSubmit, watch, setValue } = useForm<AgreementFormData>(
    {
      defaultValues: {
        client_type: 'firma',
        stanowisko_klienta: 'Właściciel instalacji',
      },
    },
  );

  const watchedClientType = watch('client_type');

  // Pobierz dane klienta i wypełnij formularz
  useEffect(() => {
    if (getClients) {
      getClients();
    }
  }, [getClients]);

  useEffect(() => {
    if (clients && clientId) {
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
  }, [clients, clientId, setValue]);

  const onSubmit = async (data: AgreementFormData) => {
    try {
      // TODO: Implementacja wysyłania umowy do API
      Alert.alert('Sukces', 'Umowa została wysłana');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wysłać umowy');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleFetchGUSData = () => {
    // TODO: Implementacja pobierania danych z GUS
    Alert.alert(
      'Info',
      'Funkcja pobierania danych z GUS będzie dostępna wkrótce',
    );
  };

  return (
    <View style={styles.wrapper}>
      <ButtonsHeader onBackPress={navigation.goBack} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sekcja: Dane klienta */}
          <Text style={styles.sectionTitle}>Dane klienta</Text>

          <View style={styles.segmentedControlContainer}>
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
              <View style={styles.inputContainer}>
                <FormInput
                  name="nip"
                  control={control}
                  label="NIP"
                  placeholder="Wpisz NIP"
                  noPadding
                />
              </View>
              <View style={styles.gusButtonContainer}>
                <SubmitButton
                  title="Pobierz dane z GUS"
                  onPress={handleFetchGUSData}
                  style={styles.gusButton}
                  titleStyle={styles.gusButtonTitle}
                />
              </View>
              <View style={styles.inputContainer}>
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

          <View style={styles.inputContainer}>
            <FormInput
              name="ulica"
              control={control}
              label="Ulica"
              placeholder="Wpisz ulicę"
              noPadding
            />
          </View>

          <View style={styles.rowInputContainer}>
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

          <View style={styles.rowInputContainer}>
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
          <Text style={styles.sectionTitle}>Informacje kontaktowe</Text>

          <View style={styles.inputContainer}>
            <FormInput
              name="imie"
              control={control}
              label="Imię"
              placeholder="Wpisz imię"
              noPadding
            />
          </View>

          <View style={styles.inputContainer}>
            <FormInput
              name="nazwisko"
              control={control}
              label="Nazwisko"
              placeholder="Wpisz nazwisko"
              noPadding
            />
          </View>

          <View style={styles.inputContainer}>
            <FormInput
              name="email"
              control={control}
              label="E-mail"
              placeholder="Wpisz e-mail"
              noPadding
            />
          </View>

          <View style={styles.inputContainer}>
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
          <Text style={styles.sectionTitle}>Umowa</Text>

          <View style={styles.fileUploadContainer}>
            <FilePicker
              name="umowa_file"
              control={control}
              label=""
              type="file"
              variant="gray"
              title="Prześlij umowę"
              acceptedFileTypes={['application/pdf']}
            />
            <Text style={styles.fileUploadSubtext}>
              Plik powinien być w formacie PDF
            </Text>
          </View>

          {/* Przyciski */}
          <View style={styles.buttonsContainer}>
            <ButtonGroup
              cancelTitle="Anuluj"
              submitTitle="Wyślij umowę"
              onCancel={handleCancel}
              onSubmitPress={handleSubmit(onSubmit)}
              cancelStyle={styles.cancelButton}
              cancelTitleStyle={styles.cancelButtonTitle}
              submitStyle={styles.submitButton}
              submitTitleStyle={styles.submitButtonTitle}
              stretch
              groupStyle={styles.buttonGroup}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginTop: 20,
    marginBottom: 12,
  },
  segmentedControlContainer: {
    backgroundColor: Colors.white,
    padding: 10,
    marginBottom: 16,
    borderRadius: 10,
  },
  inputContainer: {
    marginBottom: 0,
  },
  rowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: 12,
  },
  gusButtonContainer: {
    marginBottom: 16,
  },
  gusButton: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderButton,
    minHeight: 48,
  },
  gusButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
  },
  fileUploadContainer: {
    marginBottom: 20,
  },
  fileUploadSubtext: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.grayText,
    marginTop: 8,
    paddingLeft: 4,
  },
  buttonsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderButton,
    minHeight: 48,
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.green,
    borderRadius: 8,
    minHeight: 48,
  },
  submitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
  },
});
