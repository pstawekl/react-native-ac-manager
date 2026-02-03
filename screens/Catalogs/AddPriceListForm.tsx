import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import FilePicker, { File } from '../../components/FilePicker';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { CatalogsAddPriceListScreenProps } from '../../navigation/types';
import useCatalogs from '../../providers/CatalogsProvider';

type PriceListData = {
  file: File | null;
  name: string;
  is_active: boolean;
};

function AddPriceListForm({ navigation }: CatalogsAddPriceListScreenProps) {
  const { control, handleSubmit } = useForm<PriceListData>({
    defaultValues: {
      file: null,
      is_active: true,
      name: 'Cennik',
    },
  });

  const { execute, loading } = useApi<object, FormData>({
    path: 'cennik_add',
  });

  const { getPriceList } = useCatalogs();

  const onSubmit = async (data: PriceListData) => {
    if (!data.file) {
      Alert.alert('Błąd', 'Wybierz plik PDF cennika.');
      return;
    }

    const requestData = new FormData();
    requestData.append('file', data.file);
    requestData.append('name', data.name);
    requestData.append('is_active', data.is_active);

    const response = await execute({ data: requestData });

    if (response && !('error' in response)) {
      if (getPriceList) {
        getPriceList();
      }
      Alert.alert('Sukces', 'Dodano cennik');
      navigation.navigate('Catalogs');
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
            label="Nazwa cennika"
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
            label="Dodaj cennik"
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

export default AddPriceListForm;

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
