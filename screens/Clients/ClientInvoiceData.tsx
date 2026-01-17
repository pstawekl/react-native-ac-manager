import { Route, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useClients, { Client } from '../../providers/ClientsProvider';

type ClientInvoiceDataType = {
  nazwa_firmy: string;
  ulica: string;
  kod_pocztowy: string;
  miasto: string;
  nip: string;
};

type ClientInvoiceDataScreenProps = {
  route: Route<'InvoiceData', { clientId: string }>;
};

export default function ClientInvoiceData({
  route,
}: ClientInvoiceDataScreenProps) {
  const navigation = useNavigation();
  const { clientId } = route.params;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const { clients, getClients } = useClients();

  const { control, handleSubmit, setValue, reset } =
    useForm<ClientInvoiceDataType>({
      defaultValues: {
        nazwa_firmy: '',
        ulica: '',
        kod_pocztowy: '',
        miasto: '',
        nip: '',
      },
    });

  const { execute: updateClientData } = useApi<{
    message: string;
    error: string;
  }>({
    path: 'change_child_data',
  });

  // Znajdź klienta na podstawie ID
  useEffect(() => {
    if (clients && clientId) {
      const foundClient = clients.find(c => c.id === Number(clientId));
      if (foundClient) {
        setClient(foundClient);
        // Wczytaj dane klienta do formularza
        setValue('nazwa_firmy', foundClient.nazwa_firmy || '');
        setValue('ulica', foundClient.ulica || '');
        setValue('kod_pocztowy', foundClient.kod_pocztowy || '');
        setValue('miasto', foundClient.miasto || '');
        setValue('nip', foundClient.nip || '');
      }
    }
  }, [clients, clientId, setValue]);

  const handleGetDataFromClient = () => {
    if (client) {
      setValue('nazwa_firmy', client.nazwa_firmy || '');
      setValue('ulica', client.ulica || '');
      setValue('kod_pocztowy', client.kod_pocztowy || '');
      setValue('miasto', client.miasto || '');
      setValue('nip', client.nip || '');
      Alert.alert('Sukces', 'Dane zostały pobrane z profilu klienta');
    } else {
      Alert.alert('Błąd', 'Nie znaleziono danych klienta');
    }
  };

  const onSubmit = async (data: ClientInvoiceDataType) => {
    if (!client) {
      Alert.alert('Błąd', 'Nie znaleziono klienta');
      return;
    }

    setLoading(true);
    try {
      const response = await updateClientData({
        data: {
          user_id: client.id,
          nazwa_firmy: data.nazwa_firmy,
          ulica: data.ulica,
          kod_pocztowy: data.kod_pocztowy,
          miasto: data.miasto,
          nip: data.nip,
        },
      });

      if (response?.message === 'User and user data updated successfully') {
        Alert.alert('Sukces', 'Dane faktury zostały zaktualizowane');
        // Odśwież listę klientów
        if (getClients) {
          getClients();
        }
        navigation.goBack();
      } else {
        Alert.alert(
          'Błąd',
          response?.error || 'Wystąpił błąd podczas zapisywania',
        );
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania danych');
    } finally {
      setLoading(false);
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
        <ButtonsHeader
          onBackPress={navigation.goBack}
          title="Dane do faktury"
        />
        <View style={styles.formContainer}>
          <View style={styles.getDataButton}>
            <SubmitButton
              title="Pobierz dane z zakładki Dane Klienta"
              onPress={handleGetDataFromClient}
              disabled={!client}
            />
          </View>
          <FormInput
            name="nazwa_firmy"
            control={control}
            label="Nazwa firmy"
            isThin
            noPadding
          />
          <FormInput
            name="ulica"
            control={control}
            label="Ulica"
            isThin
            noPadding
          />
          <FormInput
            name="kod_pocztowy"
            control={control}
            label="Kod Pocztowy"
            isThin
            noPadding
            customPercentWidth={48}
            rules={{
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
            isThin
            noPadding
            customPercentWidth={48}
          />
          <FormInput
            name="nip"
            control={control}
            label="NIP"
            isThin
            noPadding
            rules={{
              pattern: {
                value: /^\d{10}$/,
                message: 'Nieprawidłowy numer NIP (10 cyfr)',
              },
            }}
          />
        </View>
        <View style={styles.footer}>
          <SubmitButton
            title="Zapisz zmiany"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    display: 'flex',
    justifyContent: 'space-between',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  getDataButton: {
    width: '100%',
    marginVertical: 20,
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
});
