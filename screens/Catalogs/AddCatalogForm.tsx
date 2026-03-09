import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import DatePicker from '../../components/DatePicker';
import FilePicker, { File } from '../../components/FilePicker';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useDiscountProducers from '../../hooks/useDiscountProducers';
import { CatalogsAddCatalogScreenProps } from '../../navigation/types';
import useCatalogs from '../../providers/CatalogsProvider';

type CatalogData = {
  file: File | null;
  is_active: boolean;
  producent: string;
  name: string;
  od?: Date;
};

const defaultCatalogValues: CatalogData = {
  file: null,
  is_active: false,
  producent: '',
  name: '',
  od: undefined,
};

function AddCatalogForm({ navigation }: CatalogsAddCatalogScreenProps) {
  const { control, handleSubmit, reset } = useForm<CatalogData>({
    defaultValues: defaultCatalogValues,
  });

  const { execute, loading } = useApi<object, FormData>({
    path: 'katalog_add',
  });

  const { getCatalogs } = useCatalogs();
  const { producers, loading: producersLoading } = useDiscountProducers();

  const onSubmit = async (data: CatalogData) => {
    if (!data.producent) {
      Alert.alert('Błąd', 'Wybierz producenta z listy rabatów.');
      return;
    }

    if (!data.file) {
      Alert.alert('Błąd', 'Wybierz plik katalogu.');
      return;
    }

    const fullName = data.producent
      ? `${data.producent} ${data.name}`.trim()
      : data.name.trim();

    const requestData = new FormData();
    requestData.append('file', data.file);
    requestData.append('name', fullName);
    requestData.append('is_active', data.is_active);
    if (data.od) {
      const dateStr = data.od.toISOString().split('T')[0];
      requestData.append('od', dateStr);
    }

    const response = await execute({ data: requestData });

    if (response && !('error' in response)) {
      if (getCatalogs) {
        getCatalogs();
      }
      reset(defaultCatalogValues);
      navigation.navigate('Menu', { tab: 'catalogs' });
      Alert.alert('Dodano katalog');
    } else if (response && 'error' in response) {
      Alert.alert('Błąd', (response as { error: string }).error);
    }
  };

  return (
    <Container style={styles.container}>
      <View>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <View style={styles.formContainer}>
          <Dropdown
            name="producent"
            control={control}
            label="Producent (zdefiniowany w rabatach)"
            options={producers.map(producent => ({
              label: producent,
              value: producent,
            }))}
            isBordered
            isThin
            disabled={producersLoading || producers.length === 0}
          />
          {producers.length === 0 && !producersLoading && (
            <Text style={styles.infoText}>
              Brak zdefiniowanych producentów w rabatach. Dodaj rabat dla
              producenta w ustawieniach, aby móc przypisać go do dokumentacji.
            </Text>
          )}
          <FormInput
            name="name"
            control={control}
            label="Nazwa katalogu"
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
          disabled={producers.length === 0 || producersLoading}
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
  infoText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.red,
    marginTop: 4,
    marginBottom: 8,
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
