import { Text } from '@rneui/themed';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import DatePicker from '../../components/DatePicker';
import FilePicker, { File } from '../../components/FilePicker';
import { FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { AddCertificateScreenProps } from '../../navigation/types';
import useCerts from '../../providers/CertsProvider';
import useStaff from '../../providers/StaffProvider';
import DefaultSaveResponse from '../../types/DefaultSaveResponse';

type CertificateData = {
  name: string;
  file: File | null;
  set_date: Date;
};

function AddCertificate({ navigation }: AddCertificateScreenProps) {
  const {
    execute: addCertificate,
    result: addCertificateResponse,
    loading: addCertificateLoading,
  } = useApi<DefaultSaveResponse, FormData>({
    path: 'certyfikat_add',
  });
  const { employees, employeesLoading, getEmployees } = useStaff();
  const { getCertificates } = useCerts();

  useEffect(() => {
    if (!employees && getEmployees) {
      getEmployees();
    }
  }, [employees, getEmployees]);

  const { control, handleSubmit } = useForm<CertificateData>({
    defaultValues: {
      file: null,
      set_date: new Date(),
    },
  });

  const onSubmit = async (data: CertificateData) => {
    const formData = new FormData();

    formData.append('file', data.file);
    formData.append('set_date', data.set_date.toISOString());
    formData.append('name', data.name);

    const result = await addCertificate({ data: formData });

    if (result?.status === 'Certificate created') {
      if (getCertificates) {
        getCertificates();
      }
      Alert.alert('Sukces', 'Dodano certyfikat');
      navigation.navigate('CertificatesList');
    } else {
      Alert.alert('Błąd', 'Nie udało się dodać certyfikatu');
    }
  };

  if (employeesLoading || addCertificateLoading) {
    return (
      <Spinner
        visible={employeesLoading || addCertificateLoading}
        textContent="Trwa pobieranie danych..."
        textStyle={{ color: Colors.gray }}
      />
    );
  }

  return (
    <Container style={styles.container}>
      <View>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <View style={styles.formContainer}>
          <FormInput
            name="name"
            control={control}
            label="Nazwa certyfikatu"
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
            label="Dodaj certyfikat"
            color={Colors.rose}
            acceptedFileTypes={['application/pdf', 'image/png', 'image/jpeg']}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <ButtonGroup
          submitTitle="Zapisz"
          submitStyle={styles.submitButton}
          cancelTitle="Anuluj"
          onSubmitPress={handleSubmit(onSubmit)}
          onCancel={() => navigation.navigate('CertificatesList')}
          loading={addCertificateLoading}
        />
      </View>
    </Container>
  );
}

export default AddCertificate;

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
