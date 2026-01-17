import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import FilePicker, { File } from '../../components/FilePicker';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { CatalogsAddCatalogScreenProps } from '../../navigation/types';
import useCatalogs from '../../providers/CatalogsProvider';

type CatalogData = {
  file: File | null;
  is_active: boolean;
  name: string;
};

function AddCatalogForm({ navigation }: CatalogsAddCatalogScreenProps) {
  const { control, handleSubmit } = useForm<CatalogData>({
    defaultValues: {
      file: null,
      is_active: false,
      name: '',
    },
  });

  const { result, execute, loading } = useApi<object, FormData>({
    path: 'katalog_add',
  });

  const { getCatalogs } = useCatalogs();

  useEffect(() => {
    // TODO
  }, [result]);

  const onSubmit = async (data: CatalogData) => {
    const requestData = new FormData();

    requestData.append('file', data.file);
    // mocked now: what does ac user stand for?
    // requestData.append('ac_user', 9);
    requestData.append('name', data.name);
    requestData.append('is_active', data.is_active);

    await execute(requestData);

    if (getCatalogs) {
      Alert.alert('Sukces', 'Dodano katalog');
      getCatalogs();
      navigation.navigate('Catalogs');
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

          <FilePicker
            name="file"
            control={control}
            label="Dodaj katalog"
            color={Colors.purple}
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
          onCancel={() => navigation.navigate('Menu')}
        />
      </View>
    </Container>
  );
}

export default AddCatalogForm;

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
