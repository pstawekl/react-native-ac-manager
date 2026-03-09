import { useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import DatePicker from '../../components/DatePicker';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { CatalogsEditFlyerScreenProps } from '../../navigation/types';
import useCatalogs, { Flyer } from '../../providers/CatalogsProvider';

type FlyerData = {
  is_active: boolean;
  producent: string;
  name: string;
  od?: Date;
};

function parseName(fullName: string): { producent: string; name: string } {
  const parts = fullName.split(' ');
  if (parts.length <= 1) return { producent: '', name: fullName };
  const producent = parts[0];
  const name = parts.slice(1).join(' ');
  return { producent, name };
}

function EditFlyerForm({ navigation }: CatalogsEditFlyerScreenProps) {
  const route = useRoute();
  const { flyer } = (route.params as { flyer: Flyer }) || {};

  const parsed = parseName(flyer?.name ?? '');

  const { control, handleSubmit, setValue } = useForm<FlyerData>({
    defaultValues: {
      is_active: flyer?.is_active ?? true,
      producent: parsed.producent,
      name: parsed.name,
      od: flyer?.od ? new Date(flyer.od) : undefined,
    },
  });

  useEffect(() => {
    if (flyer) {
      const p = parseName(flyer.name);
      setValue('producent', p.producent);
      setValue('name', p.name);
      setValue('is_active', flyer.is_active);
      if (flyer.od) {
        setValue('od', new Date(flyer.od));
      }
    }
  }, [flyer, setValue]);

  const { execute, loading } = useApi<object, FormData>({
    path: 'ulotka_update',
  });

  const { getFlyers } = useCatalogs();

  const onSubmit = async (data: FlyerData) => {
    if (!flyer) {
      Alert.alert('Błąd', 'Brak danych ulotki.');
      return;
    }

    const fullName = data.producent
      ? `${data.producent} ${data.name}`.trim()
      : data.name.trim();

    const requestData = new FormData();
    requestData.append('ulotka_id', flyer.id.toString());
    requestData.append('name', fullName);
    requestData.append('is_active', data.is_active.toString());
    if (data.od) {
      const dateStr = data.od.toISOString().split('T')[0];
      requestData.append('od', dateStr);
    }

    const response = await execute({ data: requestData });

    if (response && !('error' in response)) {
      if (getFlyers) {
        getFlyers();
      }
      Alert.alert('Zaktualizowano ulotkę', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else if (response && 'error' in response) {
      Alert.alert('Błąd', (response as { error: string }).error);
    }
  };

  return (
    <Container style={styles.container}>
      <View>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <View style={styles.formContainer}>
          <FormInput
            name="producent"
            control={control}
            label="Producent"
            noPadding
            style={styles.firstInput}
          />
          <FormInput
            name="name"
            control={control}
            label="Nazwa ulotki"
            noPadding
          />
          <View style={styles.datePickerWrapper}>
            <Text style={styles.datePickerLabel}>Data obowiązywania</Text>
            <DatePicker control={control} name="od" color={Colors.purple} />
          </View>
          <Dropdown
            name="is_active"
            control={control}
            label="Aktywny"
            options={[
              {
                value: true,
                label: 'Tak',
              },
              {
                value: false,
                label: 'Nie',
              },
            ]}
            isBordered
            isThin
          />
        </View>
      </View>

      <View style={styles.footer}>
        <ButtonGroup
          loading={loading}
          submitTitle="Zapisz"
          submitStyle={styles.submitButton}
          cancelTitle="Anuluj"
          onSubmitPress={handleSubmit(onSubmit)}
          onCancel={() => navigation.goBack()}
        />
      </View>
    </Container>
  );
}

export default EditFlyerForm;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
    backgroundColor: Colors.white,
  },
  formContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: -14,
  },
  firstInput: {
    marginBottom: -4,
  },
  datePickerWrapper: {
    marginBottom: 10,
  },
  datePickerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
    marginBottom: 8,
  },
  footer: {
    marginBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  submitButton: {
    height: 34,
    padding: 0,
    borderRadius: 4,
    backgroundColor: Colors.purple,
  },
});
