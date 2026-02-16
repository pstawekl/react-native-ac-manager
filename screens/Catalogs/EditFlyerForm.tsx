import { useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { CatalogsEditFlyerScreenProps } from '../../navigation/types';
import useCatalogs, { Flyer } from '../../providers/CatalogsProvider';

type FlyerData = {
  is_active: boolean;
  name: string;
};

function EditFlyerForm({ navigation }: CatalogsEditFlyerScreenProps) {
  const route = useRoute();
  const { flyer } = (route.params as { flyer: Flyer }) || {};

  const { control, handleSubmit, setValue } = useForm<FlyerData>({
    defaultValues: {
      is_active: flyer?.is_active ?? true,
      name: flyer?.name ?? '',
    },
  });

  // Set initial values when flyer is loaded
  useEffect(() => {
    if (flyer) {
      setValue('name', flyer.name);
      setValue('is_active', flyer.is_active);
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

    const requestData = new FormData();
    requestData.append('ulotka_id', flyer.id.toString());
    requestData.append('name', data.name);
    requestData.append('is_active', data.is_active.toString());

    const response = await execute({ data: requestData });

    if (response && !('error' in response)) {
      if (getFlyers) {
        getFlyers();
      }
      Alert.alert('Sukces', 'Zaktualizowano ulotkę', [
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
            name="name"
            control={control}
            label="Nazwa ulotki"
            noPadding
            style={styles.firstInput}
          />
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
