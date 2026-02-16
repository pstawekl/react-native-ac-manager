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
import { CatalogsEditCatalogScreenProps } from '../../navigation/types';
import useCatalogs, { Catalog } from '../../providers/CatalogsProvider';

type CatalogData = {
  is_active: boolean;
  name: string;
  od?: Date;
};

function EditCatalogForm({ navigation }: CatalogsEditCatalogScreenProps) {
  const route = useRoute();
  const { catalog } = (route.params as { catalog: Catalog }) || {};

  const { control, handleSubmit, setValue } = useForm<CatalogData>({
    defaultValues: {
      is_active: catalog?.is_active ?? false,
      name: catalog?.name ?? '',
      od: catalog?.od ? new Date(catalog.od) : undefined,
    },
  });

  // Set initial values when catalog is loaded
  useEffect(() => {
    if (catalog) {
      setValue('name', catalog.name);
      setValue('is_active', catalog.is_active);
      if (catalog.od) {
        setValue('od', new Date(catalog.od));
      }
    }
  }, [catalog, setValue]);

  const { execute, loading } = useApi<object, FormData>({
    path: 'katalog_update',
  });

  const { getCatalogs } = useCatalogs();

  const onSubmit = async (data: CatalogData) => {
    if (!catalog) {
      Alert.alert('Błąd', 'Brak danych katalogu.');
      return;
    }

    const requestData = new FormData();
    requestData.append('katalog_id', catalog.id.toString());
    requestData.append('name', data.name);
    requestData.append('is_active', data.is_active.toString());
    if (data.od) {
      const dateStr = data.od.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      requestData.append('od', dateStr);
    }

    const response = await execute({ data: requestData });

    if (response && !('error' in response)) {
      if (getCatalogs) {
        getCatalogs();
      }
      Alert.alert('Sukces', 'Zaktualizowano katalog', [
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
            label="Nazwa katalogu"
            noPadding
            style={styles.firstInput}
          />
          <View style={styles.datePickerWrapper}>
            <Text style={styles.datePickerLabel}>Data obowiązywania</Text>
            <View style={styles.datePickerContainer}>
              <DatePicker control={control} name="od" color={Colors.purple} />
            </View>
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

export default EditCatalogForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
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
  datePickerContainer: {
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
