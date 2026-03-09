import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import Colors from '../../consts/Colors';
import {
  MultisplitKompletPayload,
  OffersParamList,
} from '../../navigation/types';

type Route = RouteProp<OffersParamList, 'MultisplitKompletyList'>;

export default function MultisplitKompletyList() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { installationId, offerName, isTemplate } = route.params ?? {};
  const [komplety, setKomplety] = useState<MultisplitKompletPayload[]>(
    route.params?.komplety ?? [],
  );

  useFocusEffect(
    useCallback(() => {
      const added = route.params?.addedKomplet;
      const fullList = route.params?.komplety;
      if (fullList && fullList.length > 0) {
        setKomplety(fullList);
      } else if (added) {
        setKomplety(prev => [...prev, added]);
      } else {
        setKomplety([]);
        // Nowy flow: przy pustej liście przekieruj do filtrów multisplit
        navigation.replace('MultisplitFilters', {
          installationId: installationId ?? null,
          offerName,
          isTemplate,
        });
      }
    }, [
      route.params?.addedKomplet,
      route.params?.komplety,
      installationId,
      offerName,
      isTemplate,
      navigation,
    ]),
  );

  const handleAddKomplet = () => {
    navigation.navigate('MultisplitAddKomplet', {
      installationId: installationId ?? null,
      offerName,
      isTemplate,
      existingKomplety: komplety,
    });
  };

  const handleDalej = () => {
    const allDeviceIds: number[] = [];
    komplety.forEach(k => {
      k.internal_ids.forEach(id => allDeviceIds.push(id));
      k.aggregate_ids.forEach(id => allDeviceIds.push(id));
    });
    navigation.navigate('AddSurchargeForm', {
      type: 'multi_split',
      installationId: installationId ?? null,
      devices: allDeviceIds,
      offerName,
      isTemplate,
      multisplit_komplety: komplety,
    });
  };

  return (
    <LinearGradient
      colors={['#0A8686', '#36b4b4ff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ButtonsHeader
          onBackPress={() => navigation.goBack()}
          title="Oferta multisplit"
        />
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.title}>Komplety w ofercie</Text>
          <Text style={styles.hint}>
            Każdy komplet to zestaw: producent → jednostki wewnętrzne →
            agregaty. Możesz dodać wiele kompletów (np. różnych producentów).
          </Text>
          {komplety.length === 0 ? (
            <Text style={styles.empty}>
              Brak kompletów. Dodaj pierwszy komplet.
            </Text>
          ) : (
            komplety.map((k, index) => (
              <View key={index} style={styles.kompletCard}>
                <Text style={styles.kompletTitle}>
                  Komplet {index + 1}: {k.producent || 'Producent'}
                </Text>
                <Text style={styles.kompletDetail}>
                  Jednostki wewnętrzne: {k.internal_ids.length}, Agregaty:{' '}
                  {k.aggregate_ids.length}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
        <View style={styles.footer}>
          <SubmitButton
            title="Dodaj komplet"
            style={styles.addButton}
            onPress={handleAddKomplet}
          />
          <SubmitButton
            title="Dalej (narzuty)"
            style={styles.submitButton}
            onPress={handleDalej}
            disabled={komplety.length === 0}
          />
        </View>
      </Container>
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
    paddingTop: 40,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 16,
  },
  empty: {
    fontSize: 14,
    color: Colors.gray,
    fontStyle: 'italic',
    marginTop: 16,
  },
  kompletCard: {
    backgroundColor: Colors.backgroundTeal,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  kompletTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  kompletDetail: {
    fontSize: 13,
    color: Colors.grayerText,
  },
  footer: {
    paddingHorizontal: 16,
    marginVertical: 20,
    gap: 12,
  },
  addButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.teal,
  },
  submitButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.offersTeal,
  },
});
