import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format, parseISO } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Overlay } from '@rneui/themed';

import { IconButton, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import { Dropdown } from '../../components/Input';
import CloseIcon from '../../components/icons/CloseIcon';
import Colors from '../../consts/Colors';
import { getClientDisplayPrimary } from '../../helpers/clientDisplay';
import useApi from '../../hooks/useApi';
import useClients from '../../providers/ClientsProvider';
import {
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';
import { PrzegladyParamList } from '../../navigation/types';
import ReviewCard, { Review } from '../Clients/ReviewCard';

type ReviewWithIds = Review & { klient_id?: number; instalacja_id?: number };

export default function PrzegladyMenu() {
  const navigation = useNavigation<StackNavigationProp<PrzegladyParamList>>();
  const [reviews, setReviews] = useState<ReviewWithIds[]>([]);
  const [loading, setLoading] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [clientId, setClientId] = useState<number | null>(null);
  const [installationId, setInstallationId] = useState<number | null>(null);
  const { clients, getClients } = useClients();

  const {
    result: reviewsResult,
    execute: fetchReviews,
    loading: apiLoading,
  } = useApi<{ przeglady: ReviewWithIds[] }>({
    path: 'przeglad_list',
  });

  const { result: installationsRes, execute: getInstallations } =
    useApi<ClientInstallationsListResponse>({
      path: 'installation_list',
    });

  const loadReviews = useCallback(() => {
    if (fetchReviews) {
      fetchReviews({ data: {} });
    }
  }, [fetchReviews]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      loadReviews();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [navigation, loadReviews]);

  useEffect(() => {
    if (reviewsResult !== undefined) {
      if (reviewsResult?.przeglady) {
        setReviews(reviewsResult.przeglady);
      } else {
        setReviews([]);
      }
      setLoading(false);
    }
  }, [reviewsResult]);

  useEffect(() => {
    if (getClients) getClients();
  }, [getClients]);

  useEffect(() => {
    if (overlayVisible && clientId) {
      getInstallations({ data: { klient_id: clientId } });
    } else {
      setInstallationId(null);
    }
  }, [overlayVisible, clientId, getInstallations]);

  const installations: ClientsInstallationListItem[] =
    installationsRes?.installation_list ?? [];
  const clientOptions =
    clients?.map(c => ({
      label: getClientDisplayPrimary(c),
      value: c.id,
    })) ?? [];
  const installationOptions = installations.map(inst => ({
    label: inst.name || `Instalacja ${inst.id}`,
    value: inst.id,
  }));

  const { control, watch, setValue, reset } = useForm<{
    client?: number | null;
    installation?: number | null;
  }>({
    defaultValues: { client: undefined, installation: undefined },
  });

  const watchedClient = watch('client');
  const watchedInstallation = watch('installation');

  useEffect(() => {
    if (watchedClient !== undefined) setClientId(watchedClient ?? null);
  }, [watchedClient]);
  useEffect(() => {
    if (watchedInstallation !== undefined)
      setInstallationId(watchedInstallation ?? null);
  }, [watchedInstallation]);

  const openAddOverlay = () => {
    reset({ client: undefined, installation: undefined });
    setClientId(null);
    setInstallationId(null);
    setOverlayVisible(true);
  };

  const closeOverlay = () => setOverlayVisible(false);

  const handleAddPrzeglad = () => {
    if (!installationId) return;
    closeOverlay();
    navigation.navigate('ReviewForm', {
      installationId: String(installationId),
      clientId: clientId ?? undefined,
    });
  };

  const handleReviewPress = (review: ReviewWithIds) => {
    const instId = review.instalacja_id ?? (review as any).instalacja_id;
    if (!instId) return;
    navigation.navigate('ReviewForm', {
      installationId: String(instId),
      reviewId: review.id,
      clientId: review.klient_id,
    });
  };

  const groupedReviews = reviews.reduce(
    (acc, review) => {
      const dateStr = review.data_przegladu || review.created_date;
      if (!dateStr) {
        const noDateKey = 'Brak daty';
        if (!acc[noDateKey]) acc[noDateKey] = [];
        acc[noDateKey].push(review);
        return acc;
      }
      try {
        const date = parseISO(dateStr);
        const year = format(date, 'yyyy');
        if (!acc[year]) acc[year] = [];
        acc[year].push(review);
      } catch {
        const noDateKey = 'Brak daty';
        if (!acc[noDateKey]) acc[noDateKey] = [];
        acc[noDateKey].push(review);
      }
      return acc;
    },
    {} as Record<string, ReviewWithIds[]>,
  );

  const sortedYears = Object.keys(groupedReviews).sort((a, b) => {
    if (a === 'Brak daty') return 1;
    if (b === 'Brak daty') return -1;
    return parseInt(b, 10) - parseInt(a, 10);
  });

  return (
    <View style={styles.container}>
      <ButtonsHeader
        onBackPress={() => navigation.goBack()}
        title="Przeglądy"
        onAddPress={openAddOverlay}
      />

      {loading && apiLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Ładowanie przeglądów...</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Brak przeglądów.</Text>
          <Text style={styles.emptySubtext}>
            Dodaj przegląd przyciskiem w prawym górnym rogu.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {sortedYears.map(year => (
            <View key={year} style={styles.yearGroup}>
              <Text style={styles.yearHeader}>{year}</Text>
              {groupedReviews[year].map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onPress={() => handleReviewPress(review)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <Overlay
        isVisible={overlayVisible}
        onBackdropPress={closeOverlay}
        overlayStyle={styles.overlay}
      >
        <View style={styles.overlayContent}>
          <View style={styles.overlayHeader}>
            <Text style={styles.overlayHeaderTitle}>Dodaj przegląd</Text>
            <View style={styles.overlayHeaderButton}>
              <IconButton
                withoutBackground
                onPress={closeOverlay}
                icon={<CloseIcon color={Colors.black} size={22} />}
              />
            </View>
          </View>

          <View style={styles.overlayBody}>
            <Dropdown
              control={control}
              name="client"
              label="Klient"
              options={clientOptions}
              placeholder="Wybierz klienta"
              isBordered
            />
            <Dropdown
              control={control}
              name="installation"
              label="Instalacja"
              options={installationOptions}
              placeholder="Wybierz instalację"
              disabled={!clientId}
              isBordered
            />
            <SubmitButton
              title="Dodaj przegląd"
              onPress={handleAddPrzeglad}
              disabled={!installationId}
              style={styles.overlaySubmitButton}
            />
          </View>
        </View>
      </Overlay>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.grayText,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.grayText,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.grayerText,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  yearGroup: {
    marginBottom: 24,
  },
  yearHeader: {
    fontSize: 18,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 12,
  },
  overlay: {
    padding: 0,
    width: '95%',
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  overlayContent: {},
  overlayHeader: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    textAlign: 'left',
  },
  overlayHeaderButton: {
    width: 44,
  },
  overlayBody: {
    padding: 20,
    paddingTop: 8,
  },
  overlaySubmitButton: {
    height: 48,
    borderRadius: 15,
    backgroundColor: Colors.teal,
    padding: 0,
    marginTop: 20,
  },
});
