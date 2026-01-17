/* eslint-disable react-native/no-inline-styles */
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Text } from '@rneui/themed';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import {
  BottomTabParamList,
  SettingsDataScreenProps,
} from '../../navigation/types';

type FormData = {
  nazwa_firmy: string | null;
  nip: string | null;
  first_name: string | null;
  last_name: string | null;
  ulica: string | null;
  kod_pocztowy: string | null;
  miasto: string | null;
  email: string | null;
  numer_telefonu: string | null;
  [key: string]: string | null;
};

type MyDataKey =
  | 'nazwa_firmy'
  | 'nip'
  | 'first_name'
  | 'last_name'
  | 'ulica'
  | 'kod_pocztowy'
  | 'miasto'
  | 'email'
  | 'numer_telefonu';

function SettingsData({ navigation }: SettingsDataScreenProps) {
  const { result: myData, execute: getMyData } = useApi<FormData>({
    path: 'data',
  });
  const { execute: updateData } = useApi({
    path: 'change_own_data',
  });
  const { control, handleSubmit, setValue } = useForm<FormData>();

  const handleBackPress = useCallback(() => {
    const bottomTabNavigation = navigation
      .getParent()
      ?.getParent<BottomTabNavigationProp<BottomTabParamList>>();

    if (bottomTabNavigation) {
      bottomTabNavigation.navigate('MenuTab');
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  useEffect(() => {
    if (myData) {
      Object.keys(myData).forEach(key => {
        const dataKey = key as MyDataKey; // Rzutujemy klucz na MyDataKey
        setValue(dataKey, myData[key]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myData]);

  useEffect(() => {
    if (getMyData) {
      getMyData();
    }
  }, [getMyData]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      const response = await updateData({
        nazwa_firmy: data.nazwa_firmy,
        nip: data.nip,
        first_name: data.first_name,
        last_name: data.last_name,
        ulica: data.ulica,
        kod_pocztowy: data.kod_pocztowy,
        miasto: data.miasto,
        numer_telefonu: data.numer_telefonu,
      });

      if (response?.message === 'User and user data updated successfully') {
        Alert.alert('Zaktualizowano dane użytkownika');
        handleBackPress();
      } else {
        Alert.alert('Wystąpił błąd');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [handleBackPress],
  );

  return (
    <View style={styles.container}>
      <ButtonsHeader title="Dane osobiste" onBackPress={handleBackPress} />
      <View style={styles.content}>
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.sectionText}>Podstawowe dane</Text>

          <View style={styles.inputContainer}>
            <FormInput
              name="nazwa_firmy"
              control={control}
              label="Nazwa firmy"
              noPadding
            />
            <FormInput name="nip" control={control} label="NIP" noPadding />
          </View>

          <Text style={styles.sectionText}>Informacje personalne</Text>
          <View style={{ gap: -18 }}>
            <View style={styles.inputContainer}>
              <FormInput
                name="first_name"
                control={control}
                label="Imię"
                noPadding
              />
              <FormInput
                name="last_name"
                control={control}
                label="Nazwisko"
                noPadding
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

          <View style={{ gap: -18 }}>
            <FormInput
              name="email"
              control={control}
              label="E-mail"
              editable={false}
            />
            <FormInput
              name="numer_telefonu"
              control={control}
              label="Numer telefonu"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <ButtonGroup
            cancelTitle="Anuluj"
            cancelStyle={styles.cancelButton}
            cancelTitleStyle={styles.cancelButtonTitle}
            submitTitleStyle={styles.submitButtonTitle}
            stretch
            submitTitle="Zastosuj"
            submitStyle={styles.submitButton}
            onCancel={handleBackPress}
            onSubmitPress={handleSubmit(onSubmit)}
            groupStyle={styles.buttonGroup}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    backgroundColor: Colors.white,
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  content: {
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
  inputContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 2,
    paddingHorizontal: 8,
  },
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
  cancelButton: {
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
    width: '100%',
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  footer: {
    width: '100%',
    paddingBottom: 65,
  },
});

export default SettingsData;
