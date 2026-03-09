import { Text } from '@rneui/themed';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Alert, StyleSheet, View, ScrollView, Switch } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import DatePicker from '../../components/DatePicker';
import FilePicker, { File } from '../../components/FilePicker';
import { FormInput, Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { AddTrainingScreenProps } from '../../navigation/types';
import useCerts from '../../providers/CertsProvider';
import useClients from '../../providers/ClientsProvider';
import useStaff from '../../providers/StaffProvider';
import { getClientDisplayPrimary } from '../../helpers/clientDisplay';
import DefaultSaveResponse from '../../types/DefaultSaveResponse';

type TrainingData = {
  file: File | null;
  set_date: Date;
  name: string;
  participants: number[];
  applies_to_company: boolean;
};

function AddTraining({ navigation }: AddTrainingScreenProps) {
  const {
    execute: addTraining,
    result: addTrainingResponse,
    loading: addTrainingLoading,
  } = useApi<DefaultSaveResponse, FormData>({
    path: 'szkolenie_add',
  });

  const { getTrainings } = useCerts();
  const { clients, getClients } = useClients();
  const { employees, getEmployees } = useStaff();

  useEffect(() => {
    if (addTrainingResponse?.status === 'Szkolenie created') {
      if (getTrainings) {
        getTrainings();
      }

      Alert.alert('Dodano szkolenie');
      navigation.navigate('CertificatesList');
    }
  }, [addTrainingResponse, getTrainings, navigation]);

  const { control, handleSubmit, watch } = useForm<TrainingData>({
    defaultValues: {
      file: null,
      set_date: new Date(),
      name: 'Szkolenie',
      participants: [],
      applies_to_company: true,
    },
  });

  const appliesToCompany = watch('applies_to_company');

  const onSubmit = async (data: TrainingData) => {
    console.log('[AddTraining] onSubmit data:', {
      hasFile: !!data.file,
      fileName: data.file?.name,
      fileType: data.file?.type,
      fileUri: data.file?.uri,
      set_date_iso:
        typeof data.set_date?.toISOString === 'function'
          ? data.set_date.toISOString()
          : null,
      rawSetDate: data.set_date,
      name: data.name,
    });

    const formData = new FormData();

    if (data.file) {
      formData.append('file', data.file);
    }
    formData.append('set_date', data.set_date.toISOString());
    formData.append('name', data.name);

    // Uczestnicy (pracownicy i klienci)
    if (data.participants && data.participants.length > 0) {
      data.participants.forEach(id => {
        formData.append('participants', String(id));
      });
    }

    // Szkolenie dotyczy naszej firmy
    if (appliesToCompany) {
      // Backend na podstawie tokenu i roli admina firmy powiąże szkolenie z firmą
      // Jeśli w przyszłości będziemy potrzebować jawnego ID company_user,
      // można je tu przekazać.
      formData.append('company_user', 'self');
    }

    console.log('[AddTraining] sending request to szkolenie_add');
    addTraining(formData);
  };

  return (
    <Container style={styles.container}>
      <View>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <ScrollView contentContainerStyle={styles.formContainer}>
          <FormInput
            label="Nazwa szkolenia"
            name="name"
            control={control}
            isThin
            noPadding
            style={styles.firstInput}
          />

          <View>
            <Text style={styles.label}>Zaczyna się</Text>
            <View style={styles.pickerContainer}>
              <DatePicker
                name="set_date"
                control={control}
                color={Colors.rose}
              />
              <DatePicker
                name="set_date"
                control={control}
                mode="time"
                color={Colors.rose}
              />
            </View>
          </View>

          <FilePicker
            name="file"
            control={control}
            label="Dodaj szkolenie (opcjonalnie)"
            color={Colors.rose}
          />

          {/* Sekcja DOTYCZY */}
          <Text style={styles.sectionLabel}>Dotyczy</Text>

          {/* Przełącznik: nasza firma */}
          <View style={styles.switchRow}>
            <Text>Nasza firma</Text>
            <Controller
              control={control}
              name="applies_to_company"
              render={({ field: { value, onChange } }) => (
                <Switch value={value} onValueChange={onChange} />
              )}
            />
          </View>

          {/* Uczestnicy – pracownicy */}
          <Text style={styles.subLabel}>Pracownicy</Text>
          <Dropdown
            name="participants"
            control={control}
            options={
              employees
                ? Object.values(employees)
                    .flat()
                    .map(emp => ({
                      label: `${emp.first_name} ${emp.last_name}`,
                      value: emp.id,
                    }))
                : []
            }
            isBordered
            isMulti
            containerStyle={styles.dropdown}
          />

          {/* Uczestnicy – klienci */}
          <Text style={styles.subLabel}>Klienci</Text>
          <Dropdown
            name="participants"
            control={control}
            options={
              clients
                ? clients.map(c => ({
                    label: getClientDisplayPrimary(c),
                    value: c.id,
                  }))
                : []
            }
            isBordered
            isMulti
            containerStyle={styles.dropdown}
          />
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <ButtonGroup
          submitTitle="Zapisz"
          submitStyle={styles.submitButton}
          cancelTitle="Anuluj"
          onSubmitPress={handleSubmit(onSubmit)}
          onCancel={() => navigation.navigate('CertificatesList')}
          loading={addTrainingLoading}
        />
      </View>
    </Container>
  );
}

export default AddTraining;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
  },
  formContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  footer: {
    marginBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  firstInput: {
    marginBottom: -14,
  },
  submitButton: {
    height: 34,
    padding: 0,
    borderRadius: 4,
    backgroundColor: Colors.rose,
  },
  label: {
    fontSize: 11,
    marginBottom: 6,
  },
  pickerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
});
