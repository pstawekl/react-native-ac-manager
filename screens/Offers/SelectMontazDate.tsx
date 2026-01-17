import { useNavigation, useRoute } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Colors from '../../consts/Colors';
import useMontazDates, { AvailableDate } from '../../hooks/useMontazDates';

type RouteParams = {
  ofertaId: number;
};

function SelectMontazDate() {
  const route = useRoute();
  const navigation = useNavigation();
  const { ofertaId } = route.params as RouteParams;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  const {
    availableDates,
    getAvailableDates,
    proposeMontazDate,
    availableDatesLoading,
    proposeDateLoading,
  } = useMontazDates();

  // Załaduj dostępne terminy
  useEffect(() => {
    const loadDates = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      await getAvailableDates(today);
    };
    loadDates();
  }, [getAvailableDates]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handlePropose = useCallback(async () => {
    if (!selectedDate) {
      Alert.alert('Błąd', 'Proszę wybrać termin');
      return;
    }

    try {
      const success = await proposeMontazDate(
        ofertaId,
        selectedDate,
        selectedTime,
      );

      if (success) {
        Alert.alert(
          'Sukces',
          'Propozycja terminu została wysłana. Oczekuj na potwierdzenie przez montera.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert('Błąd', 'Nie udało się zaproponować terminu');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas proponowania terminu');
    }
  }, [selectedDate, selectedTime, ofertaId, proposeMontazDate, navigation]);

  const renderDateItem = useCallback(
    ({ item }: { item: AvailableDate }) => {
      const isSelected = selectedDate === item.date;

      return (
        <TouchableOpacity
          style={[styles.dateItem, isSelected && styles.dateItemSelected]}
          onPress={() => handleDateSelect(item.date)}
        >
          <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
            {item.day_name}
          </Text>
          <Text
            style={[
              styles.dateValueText,
              isSelected && styles.dateTextSelected,
            ]}
          >
            {format(new Date(item.date), 'dd.MM.yyyy')}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedDate, handleDateSelect],
  );

  const timeOptions = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
  ];

  return (
    <View style={styles.linearGradient}>
      <View style={styles.container}>
        <ButtonsHeader
          onBackPress={() => navigation.goBack()}
          title="Wybierz termin montażu"
        />

        <View style={styles.content}>
          <Text style={styles.infoText}>
            Wybierz dogodny termin montażu. Zaproponowany termin zostanie wysłany
            do montera do akceptacji.
          </Text>

          {availableDatesLoading ? (
            <ActivityIndicator size="large" color={Colors.offersTeal} />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Dostępne dni:</Text>
              <FlatList
                data={availableDates}
                renderItem={renderDateItem}
                keyExtractor={item => item.date}
                contentContainerStyle={styles.datesList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Brak dostępnych terminów w najbliższym czasie
                  </Text>
                }
              />

              {selectedDate && (
                <>
                  <Text style={styles.sectionTitle}>Preferowana godzina:</Text>
                  <View style={styles.timeContainer}>
                    {timeOptions.map(time => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeButton,
                          selectedTime === time && styles.timeButtonSelected,
                        ]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            selectedTime === time && styles.timeTextSelected,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <SubmitButton
            title="Zaproponuj termin"
            onPress={handlePropose}
            disabled={!selectedDate || proposeDateLoading}
            loading={proposeDateLoading}
            style={styles.submitButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoText: {
    color: Colors.grayerText,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  datesList: {
    paddingBottom: 16,
  },
  dateItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateItemSelected: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.offersTeal,
  },
  dateText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: '500',
  },
  dateValueText: {
    fontSize: 16,
    color: Colors.grayerText,
  },
  dateTextSelected: {
    color: Colors.offersTeal,
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeButton: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeButtonSelected: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.offersTeal,
  },
  timeText: {
    fontSize: 14,
    color: Colors.black,
  },
  timeTextSelected: {
    color: Colors.offersTeal,
    fontWeight: 'bold',
  },
  emptyText: {
    color: Colors.grayerText,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    padding: 16,
  },
  submitButton: {
    marginBottom: 0,
  },
});

export default SelectMontazDate;

