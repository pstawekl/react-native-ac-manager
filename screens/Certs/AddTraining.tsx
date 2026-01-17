import { Text } from '@rneui/themed';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import DatePicker from '../../components/DatePicker';
import FilePicker, { File } from '../../components/FilePicker';
import { FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { AddTrainingScreenProps } from '../../navigation/types';
import useCerts from '../../providers/CertsProvider';
import DefaultSaveResponse from '../../types/DefaultSaveResponse';

type TrainingData = {
  file: File | null;
  set_date: Date;
  name: string;
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

  useEffect(() => {
    if (addTrainingResponse?.status === 'Szkolenie created') {
      if (getTrainings) {
        getTrainings();
      }

      Alert.alert('Sukces', 'Dodano szkolenie');
      navigation.navigate('CertificatesList');
    }
  }, [addTrainingResponse, getTrainings, navigation]);

  const { control, handleSubmit } = useForm<TrainingData>({
    defaultValues: {
      file: null,
      set_date: new Date(),
      name: 'Szkolenie',
    },
  });

  const onSubmit = async (data: TrainingData) => {
    const formData = new FormData();

    formData.append('file', data.file);
    formData.append('set_date', data.set_date.toISOString());
    formData.append('name', data.name);

    addTraining(formData);
  };

  return (
    <Container style={styles.container}>
      <View>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <View style={styles.formContainer}>
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
            label="Dodaj szkolenie"
            color={Colors.rose}
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
