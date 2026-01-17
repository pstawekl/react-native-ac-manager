import { Input, Overlay, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import { SubmitButton } from '../../components/Button';
import Colors from '../../consts/Colors';
import useMontazDates, { MontazProposal } from '../../hooks/useMontazDates';

function MontazProposals() {
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedOfertaId, setSelectedOfertaId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const {
    proposals,
    getPendingProposals,
    confirmMontazDate,
    rejectMontazDate,
    proposalsLoading,
    confirmDateLoading,
    rejectDateLoading,
  } = useMontazDates();

  const loadProposals = useCallback(async () => {
    await getPendingProposals();
  }, [getPendingProposals]);

  // Załaduj propozycje
  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleConfirm = useCallback(
    async (ofertaId: number) => {
      Alert.alert(
        'Potwierdzenie',
        'Czy na pewno chcesz potwierdzić ten termin montażu? Zostanie automatycznie utworzone zadanie w kalendarzu.',
        [
          {
            text: 'Anuluj',
            style: 'cancel',
          },
          {
            text: 'Potwierdź',
            onPress: async () => {
              try {
                const success = await confirmMontazDate(ofertaId);
                if (success) {
                  Alert.alert(
                    'Sukces',
                    'Termin został potwierdzony i dodany do kalendarza',
                  );
                  loadProposals(); // Odśwież listę
                } else {
                  Alert.alert('Błąd', 'Nie udało się potwierdzić terminu');
                }
              } catch (error) {
                Alert.alert(
                  'Błąd',
                  'Wystąpił błąd podczas potwierdzania terminu',
                );
              }
            },
          },
        ],
      );
    },
    [confirmMontazDate, loadProposals],
  );

  const handleRejectStart = useCallback((ofertaId: number) => {
    setSelectedOfertaId(ofertaId);
    setRejectionReason('');
    setRejectModalVisible(true);
  }, []);

  const handleRejectConfirm = useCallback(async () => {
    if (!selectedOfertaId) return;

    try {
      const success = await rejectMontazDate(selectedOfertaId, rejectionReason);
      if (success) {
        Alert.alert('Sukces', 'Termin został odrzucony');
        setRejectModalVisible(false);
        loadProposals(); // Odśwież listę
      } else {
        Alert.alert('Błąd', 'Nie udało się odrzucić terminu');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas odrzucania terminu');
    }
  }, [selectedOfertaId, rejectionReason, rejectMontazDate, loadProposals]);

  const renderProposalItem = useCallback(
    ({ item }: { item: MontazProposal }) => {
      const clientName =
        item.klient.nazwa_firmy ||
        `${item.klient.first_name} ${item.klient.last_name}`;

      return (
        <View style={styles.proposalCard}>
          <View style={styles.proposalHeader}>
            <Text style={styles.clientName}>{clientName}</Text>
            {item.nazwa_oferty && (
              <Text style={styles.offerName}>{item.nazwa_oferty}</Text>
            )}
          </View>

          <View style={styles.proposalBody}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Data:</Text>
              <Text style={styles.value}>
                {item.proposed_date
                  ? format(new Date(item.proposed_date), 'dd.MM.yyyy (EEEE)')
                  : 'Brak'}
              </Text>
            </View>

            {item.proposed_time && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Godzina:</Text>
                <Text style={styles.value}>{item.proposed_time}</Text>
              </View>
            )}

            {item.klient.numer_telefonu && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Telefon:</Text>
                <Text style={styles.value}>{item.klient.numer_telefonu}</Text>
              </View>
            )}

            {item.klient.miasto && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Adres:</Text>
                <Text style={styles.value}>
                  {item.klient.ulica} {item.klient.numer_domu},{' '}
                  {item.klient.miasto}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <SubmitButton
              title="Odrzuć"
              onPress={() => handleRejectStart(item.oferta_id)}
              style={[styles.actionButton, styles.rejectButton]}
              disabled={confirmDateLoading || rejectDateLoading}
            />
            <SubmitButton
              title="Akceptuj"
              onPress={() => handleConfirm(item.oferta_id)}
              style={[styles.actionButton, styles.confirmButton]}
              loading={confirmDateLoading}
              disabled={confirmDateLoading || rejectDateLoading}
            />
          </View>
        </View>
      );
    },
    [handleConfirm, handleRejectStart, confirmDateLoading, rejectDateLoading],
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {proposalsLoading ? (
          <ActivityIndicator size="large" color={Colors.white} />
        ) : (
          <FlatList
            data={proposals}
            renderItem={renderProposalItem}
            keyExtractor={item => item.oferta_id.toString()}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Brak oczekujących propozycji terminów
                </Text>
              </View>
            }
            refreshing={proposalsLoading}
            onRefresh={loadProposals}
          />
        )}
      </View>

      {/* Modal odrzucenia */}
      <Overlay
        isVisible={rejectModalVisible}
        onBackdropPress={() => setRejectModalVisible(false)}
        overlayStyle={styles.overlayStyle}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Odrzuć termin</Text>
          <Text style={styles.modalText}>
            Możesz podać powód odrzucenia terminu (opcjonalnie):
          </Text>
          <Input
            placeholder="Powód odrzucenia..."
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={3}
            containerStyle={styles.inputContainer}
          />
          <View style={styles.modalButtons}>
            <SubmitButton
              title="Anuluj"
              onPress={() => setRejectModalVisible(false)}
              style={[styles.modalButton, styles.cancelButton]}
            />
            <SubmitButton
              title="Odrzuć termin"
              onPress={handleRejectConfirm}
              style={[styles.modalButton, styles.confirmRejectButton]}
              loading={rejectDateLoading}
              disabled={rejectDateLoading}
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
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  proposalCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proposalHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 4,
  },
  offerName: {
    fontSize: 14,
    color: Colors.grayerText,
  },
  proposalBody: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.grayerText,
    width: 80,
  },
  value: {
    fontSize: 14,
    color: Colors.black,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    marginBottom: 0,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Colors.grayerText,
    fontSize: 16,
    textAlign: 'center',
  },
  overlayStyle: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 8,
    padding: 20,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: Colors.black,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
    color: Colors.grayerText,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    height: 50,
  },
  modalButton: {
    flex: 1,
    marginBottom: 0,
    height: 40,
  },
  cancelButton: {
    backgroundColor: Colors.grayerText,
  },
  confirmRejectButton: {
    backgroundColor: '#f44336',
  },
});

export default MontazProposals;
