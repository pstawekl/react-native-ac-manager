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
import { CatalogsAddPriceListScreenProps } from '../../navigation/types';
import useCatalogs from '../../providers/CatalogsProvider';

type PriceListData = {
  file: File | null;
  producent: string;
  name: string;
  is_active: boolean;
  od?: Date;
};

const defaultPriceListValues: PriceListData = {
  file: null,
  is_active: true,
  producent: '',
  name: 'Cennik',
  od: undefined,
};

function AddPriceListForm({ navigation }: CatalogsAddPriceListScreenProps) {
  const { control, handleSubmit, reset } = useForm<PriceListData>({
    defaultValues: defaultPriceListValues,
  });

  const { execute, loading } = useApi<object, FormData>({
    path: 'cennik_add',
  });

  const { getPriceList } = useCatalogs();
  const { producers, loading: producersLoading } = useDiscountProducers();

  const onSubmit = async (data: PriceListData) => {
    if (!data.producent) {
      Alert.alert('Błąd', 'Wybierz producenta z listy rabatów.');
      return;
    }

    if (!data.file) {
      Alert.alert('Błąd', 'Wybierz plik PDF cennika.');
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
      if (getPriceList) {
        getPriceList();
      }
      reset(defaultPriceListValues);
      navigation.navigate('Menu', { tab: 'prices' });
      Alert.alert('Dodano cennik');
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
            label="Nazwa cennika"
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
            label="Dodaj cennik"
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
