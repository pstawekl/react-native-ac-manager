import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';

import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import { getClientDisplayPrimary } from '../../helpers/clientDisplay';
import useApi from '../../hooks/useApi';
import useAuth from '../../providers/AuthProvider';
import useClients from '../../providers/ClientsProvider';
import {
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';
import { OffersParamList } from '../../navigation/types';

type FormValues = {
  client?: number | null;
  installation?: number | null;
  offerName: string;
};

export default function CreateOfferFromTemplate() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<OffersParamList, 'CreateOfferFromTemplate'>>();
  const templateId = route.params?.templateId;

  const { isUserClient } = useAuth();
  const { clients, getClients } = useClients();
  const [installationOptions, setInstallationOptions] = useState<
    { label: string; value: number }[]
  >([]);

  const { control, watch, setValue, handleSubmit } = useForm<FormValues>({
    defaultValues: { client: undefined, installation: undefined, offerName: '' },
  });
  const clientId = watch('client');
  const installationId = watch('installation');
  const offerName = watch('offerName');

  const { result: installationsRes, execute: getInstallations } =
    useApi<ClientInstallationsListResponse>({
      path: 'installation_list',
    });

  const { execute: createFromTemplate, loading: createLoading } = useApi<{
    id: number;
    [key: string]: unknown;
  }>({
    path: 'oferta_create_from_template',
  });

  useEffect(() => {
    if (getClients && !isUserClient()) {
      getClients();
    }
  }, [getClients, isUserClient]);

  useEffect(() => {
    if (clientId && getInstallations) {
      setValue('installation', undefined);
      getInstallations({ data: { klient_id: clientId } });
    } else {
      setInstallationOptions([]);
    }
  }, [clientId, getInstallations, setValue]);

  useEffect(() => {
    if (installationsRes?.installation_list?.length) {
      const opts = (installationsRes.installation_list as ClientsInstallationListItem[]).map(
        inst => ({
          label: inst.name ?? `Instalacja ${inst.id}`,
          value: inst.id,
        }),
      );
      setInstallationOptions(opts);
    } else {
      setInstallationOptions([]);
    }
  }, [installationsRes]);

  const clientOptions = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return clients.map(c => ({
      label: getClientDisplayPrimary(c),
      value: c.id,
    }));
  }, [clients]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      if (!templateId) {
        Alert.alert('Błąd', 'Brak ID szablonu');
        return;
      }
      const instId = data.installation ?? installationId;
      if (!instId) {
        Alert.alert('Błąd', 'Wybierz instalację');
        return;
      }
      const name = (data.offerName ?? offerName ?? '').trim();
      if (!name) {
        Alert.alert('Błąd', 'Wprowadź nazwę oferty');
        return;
      }
      try {
        const response = await createFromTemplate({
          method: 'POST',
          data: {
            template_id: templateId,
            instalacja_id: instId,
            nazwa_oferty: name,
          },
        });
        if (response?.id) {
          Alert.alert('Oferta została utworzona', [
            {
              text: 'OK',
              onPress: () => {
                (navigation as any).navigate('Overview', {
                  offerId: response.id,
                  isTemplate: false,
                  mode: 'view',
                  type: 'split',
                  installationId: instId,
                  devices: [],
                  surcharges: [],
                });
              },
            },
          ]);
        }
      } catch (err) {
        Alert.alert(
          'Błąd',
          (err as Error)?.message || 'Nie udało się utworzyć oferty z szablonu',
        );
      }
    },
    [templateId, installationId, offerName, createFromTemplate, navigation],
  );

  if (templateId == null) {
    return (
      <View style={styles.container}>
        <ButtonsHeader onBackPress={() => navigation.goBack()} title="Utwórz ofertę" />
        <Text style={styles.errorText}>Brak szablonu. Wróć i wybierz szablon.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0A8686', '#38BEBF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <View style={styles.container}>
        <ButtonsHeader
          onBackPress={() => navigation.goBack()}
          title="Utwórz ofertę z szablonu"
        />
        <ScrollView style={styles.scroll}>
          <Text style={styles.sectionTitle}>Klient i instalacja</Text>
          <Dropdown<FormValues>
            label="Klient"
            name="client"
            control={control}
            options={clientOptions}
            isBordered
            zIndex={10}
            onChange={() => setValue('installation', undefined)}
          />
          {clientId != null && installationOptions.length > 0 && (
            <Dropdown<FormValues>
              label="Instalacja"
              name="installation"
              control={control}
              options={installationOptions}
              isBordered
              zIndex={9}
            />
          )}
          <FormInput<FormValues>
            label="Nazwa oferty"
            name="offerName"
            control={control}
            placeholder="Wprowadź nazwę oferty"
            noPadding
            isBordered
          />
          <SubmitButton
            title="Utwórz ofertę"
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
            loading={createLoading}
          />
        </ScrollView>
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
  scroll: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: Colors.offersTeal,
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 24,
  },
  errorText: {
    padding: 20,
    fontSize: 14,
    color: Colors.grayerText,
  },
});
