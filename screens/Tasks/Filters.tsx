import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';

type FilterData = {
  period: string;
  type: string;
  status: string;
  team: string;
};

function Filters({ navigation }: any) {
  const { control, handleSubmit } = useForm<FilterData>({
    defaultValues: {
      period: 'week2',
      type: 'service',
      status: 'status1',
      team: 'all',
    },
  });

  const onSubmit = () => {
    // TODO: filter
  };

  return (
    <View style={styles.container}>
      <View>
        <ButtonsHeader onBackPress={navigation.goBack} />

        <View style={styles.formContainer}>
          <Dropdown
            name="period"
            control={control}
            label="Okres"
            options={[
              { label: 'Tydzień 1 (00.00 - 00.00)', value: 'week1' },
              { label: 'Tydzień 2 (00.00 - 00.00)', value: 'week2' },
            ]}
            isBordered
            isThin
            zIndex={9}
          />
          <Dropdown
            name="type"
            control={control}
            label="Typ"
            options={[
              { label: 'Serwis', value: 'service' },
              { label: 'Inny', value: 'another' },
            ]}
            isBordered
            isThin
            zIndex={8}
          />
          <Dropdown
            name="status"
            control={control}
            label="Status"
            options={[
              { label: 'Wykonane', value: 'wykonane' },
              { label: 'Niewykonane', value: 'niewykonane' },
              { label: 'Zaplanowane', value: 'Zaplanowane' },
            ]}
            isBordered
            isThin
            zIndex={7}
          />
          <Dropdown
            name="team"
            control={control}
            label="Ekipa"
            options={[
              { label: 'Wszystkie', value: 'all' },
              { label: 'Ekipa 1', value: 'team1' },
            ]}
            isBordered
            isThin
            zIndex={6}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <ButtonGroup
          submitTitle="Zapisz zmiany"
          submitStyle={styles.submitButton}
          cancelTitle="Anuluj"
          onSubmitPress={handleSubmit(onSubmit)}
          onCancel={() => navigation.navigate('Menu')}
        />
      </View>
    </View>
  );
}

export default Filters;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
  },
  formContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
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
    backgroundColor: Colors.red,
  },
});
