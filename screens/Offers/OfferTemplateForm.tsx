/* eslint-disable no-param-reassign */
import { useNavigation, useRoute } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { FormInput } from '../../components/Input';
import RadioButtons from '../../components/RadioButtons';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { Offer } from '../../providers/OffersProvider';

type OfferTemplateData = {
  nazwa_oferty: string;
  offer_type: 'split' | 'multi_split';
  devices_split?: number[];
  devices_multi_split?: number[];
  rabat?: number[];
  narzut?: number[];
};

export default function OfferTemplateForm() {
  const navigation = useNavigation();
  const route = useRoute();
  const template: Offer | undefined = (route.params as any)?.template;

  // Tryb edycji jeśli mamy szablon, tryb tworzenia jeśli nie
  const isEditMode = !!template;

  const [selectedType, setSelectedType] = useState<'split' | 'multi_split'>(
    template?.offer_type || 'split',
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<OfferTemplateData>({
    defaultValues: {
      nazwa_oferty: template?.nazwa_oferty || '',
      offer_type: template?.offer_type || 'split',
      devices_split: template?.devices_split || [],
      devices_multi_split: template?.devices_multi_split || [],
      rabat: template?.rabat || [],
      narzut: template?.narzut || [],
    },
  });

  const { execute: createTemplate, loading: createLoading } = useApi<any>({
    path: 'oferta_template_create',
  });

  const { execute: updateTemplate, loading: updateLoading } = useApi<any>({
    path: isEditMode ? `oferta_template_update/${template?.id}` : '',
  });

  const loading = createLoading || updateLoading;

  // Ustawienie wartości formularza na podstawie przekazanego szablonu w trybie edycji
  useEffect(() => {
    if (template && isEditMode) {
      setValue('nazwa_oferty', template.nazwa_oferty || '');
      setValue('offer_type', template.offer_type);
      setSelectedType(template.offer_type);
    }
  }, [template, setValue, isEditMode]);

  const onSubmit = async (data: OfferTemplateData) => {
    try {
      data.offer_type = selectedType;

      let response;
      let successMessage: string;
      let questionMessage: string;

      if (isEditMode) {
        response = await updateTemplate({ data });
        successMessage = 'Szablon oferty został zaktualizowany';
        questionMessage = 'Czy chcesz przejść do edycji urządzeń i narzutów?';
      } else {
        response = await createTemplate({ data });
        successMessage = 'Szablon oferty został utworzony';
        questionMessage =
          'Czy chcesz przejść do dodawania urządzeń i narzutów?';
      }

      if (response) {
        Alert.alert('Sukces', `${successMessage}. ${questionMessage}`, [
          { text: 'Później', onPress: () => navigation.goBack() },
          {
            text: 'Tak',
            onPress: () => {
              const templateId = isEditMode ? template!.id : response.id;

              const getDevices = () => {
                if (!isEditMode) return [];
                return selectedType === 'split'
                  ? template!.devices_split || []
                  : template!.devices_multi_split || [];
              };

              (navigation as any).navigate('Overview', {
                type: selectedType,
                installationId: 0,
                devices: getDevices(),
                surcharges: isEditMode ? template!.narzut || [] : [],
                promos: isEditMode ? template!.rabat || [] : [],
                offerId: templateId,
                mode: 'add',
                isTemplate: 'true',
              });
            },
          },
        ]);
      }
    } catch (error) {
      const errorMessage = isEditMode
        ? 'Nie udało się zaktualizować szablonu oferty'
        : 'Nie udało się utworzyć szablonu oferty';
      Alert.alert('Błąd', errorMessage);
    }
  };

  return (
    <LinearGradient
      colors={['#0A8686', '#38BEBF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <View style={styles.container}>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.title}>
            {isEditMode ? 'Edytuj szablon oferty' : 'Utwórz szablon oferty'}
          </Text>

          <FormInput
            label="Nazwa szablonu"
            name="nazwa_oferty"
            control={control}
            rules={{ required: 'Nazwa jest wymagana' }}
            placeholder="Wprowadź nazwę szablonu"
          />

          <Text style={styles.sectionTitle}>Typ oferty</Text>
          <RadioButtons
            options={[
              { label: 'Split', value: 'split' },
              { label: 'Multi Split', value: 'multi_split' },
            ]}
            value={selectedType}
            onChange={value =>
              setSelectedType(value as 'split' | 'multi_split')
            }
          />

          <Text style={styles.infoText}>
            {isEditMode
              ? 'Po zapisaniu zmian szablon zostanie zaktualizowany. Urządzenia i narzuty możesz edytować w kolejnym kroku.'
              : 'Po utworzeniu szablonu będziesz mógł dodać urządzenia i narzuty w kolejnym kroku.'}
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <SubmitButton
            title={isEditMode ? 'Zapisz zmiany' : 'Utwórz szablon'}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitButton}
          />
          {isEditMode && (
            <SubmitButton
              title="Edytuj urządzenia i narzuty"
              onPress={() => {
                const devices =
                  template!.offer_type === 'split'
                    ? template!.devices_split || []
                    : template!.devices_multi_split || [];

                (navigation as any).navigate('Overview', {
                  type: template!.offer_type,
                  installationId: 0,
                  devices,
                  surcharges: template!.narzut || [],
                  promos: template!.rabat || [],
                  offerId: template!.id,
                  mode: 'add',
                  isTemplate: 'true',
                });
              }}
              style={[styles.submitButton, styles.secondaryButton]}
            />
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  submitButton: {
    backgroundColor: Colors.offersTeal,
    borderRadius: 25,
    paddingVertical: 15,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.offersTeal,
    marginTop: 10,
  },
});
