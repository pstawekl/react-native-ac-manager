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
import { CatalogsEditPriceListScreenProps } from '../../navigation/types';
import useCatalogs, { PriceListItem } from '../../providers/CatalogsProvider';

type PriceListData = {
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

function EditPriceListForm({ navigation }: CatalogsEditPriceListScreenProps) {
  const route = useRoute();
  const { priceList } = (route.params as { priceList: PriceListItem }) || {};

  const parsed = parseName(priceList?.name ?? '');

  const { control, handleSubmit, setValue } = useForm<PriceListData>({
    defaultValues: {
      is_active: priceList?.is_active ?? true,
      producent: parsed.producent,
      name: parsed.name,
      od: priceList?.od ? new Date(priceList.od) : undefined,
    },
  });

  useEffect(() => {
    if (priceList) {
      const p = parseName(priceList.name);
      setValue('producent', p.producent);
      setValue('name', p.name);
      setValue('is_active', priceList.is_active);
      if (priceList.od) {
        setValue('od', new Date(priceList.od));
      }
    }
  }, [priceList, setValue]);

  const { execute, loading } = useApi<object, FormData>({
    path: 'cennik_update',
  });

  const { getPriceList } = useCatalogs();

  const onSubmit = async (data: PriceListData) => {
    if (!priceList) {
      Alert.alert('Błąd', 'Brak danych cennika.');
      return;
    }

    const fullName = data.producent
      ? `${data.producent} ${data.name}`.trim()
      : data.name.trim();

    const requestData = new FormData();
    requestData.append('cennik_id', priceList.id.toString());
    requestData.append('name', fullName);
    requestData.append('is_active', data.is_active.toString());
    if (data.od) {
      const dateStr = data.od.toISOString().split('T')[0];
      requestData.append('od', dateStr);
    }

    const response = await execute({ data: requestData });

    if (response && !('error' in response)) {
      if (getPriceList) {
        getPriceList();
      }
      Alert.alert('Zaktualizowano cennik', [
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

export default EditPriceListForm;

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
