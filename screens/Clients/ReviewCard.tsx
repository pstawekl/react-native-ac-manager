import { format, isToday, parseISO } from 'date-fns';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../consts/Colors';

export type Review = {
  id: number;
  data_przegladu?: string;
  created_date?: string;
  address?: {
    line1: string;
    line2: string;
    ulica?: string;
    numer_domu?: string;
    mieszkanie?: string;
    kod_pocztowy?: string;
    miasto?: string;
  };
  status?: string;
  ekipa?: string;
  ekipa_id?: number;
};

type ReviewCardProps = {
  review: Review;
  onPress: () => void;
};

export default function ReviewCard({ review, onPress }: ReviewCardProps) {
  // Formatowanie daty i czasu
  const formatDateTime = () => {
    let dateStr = review.data_przegladu || review.created_date;
    if (!dateStr) return 'Brak daty';

    try {
      const date = parseISO(dateStr);
      if (isToday(date)) {
        // Dla dzisiejszych dat: "Dziś HH:MM - HH:MM" (zakres czasu)
        const timeStr = format(date, 'HH:mm');
        return `Dziś ${timeStr}`;
      }

      // Dla innych dat: "DD/MM/YYYY | HH:MM"
      dateStr = format(date, 'dd/MM/yyyy');
      const timeStr = format(date, 'HH:mm');
      return `${dateStr} | ${timeStr}`;
    } catch (error) {
      return 'Brak daty';
    }
  };

  // Formatowanie adresu
  const addressLine1 = review.address?.line1 || '';
  const addressLine2 = review.address?.line2 || '';

  // Status
  const status = review.status || 'Zaplanowane';
  const statusBgColor =
    status === 'Wykonane' ? Colors.green : Colors.statusPlanned;
  const statusText = status;

  // Ekipa
  const ekipaNumber = review.ekipa_id || 1;

  return (
    <TouchableOpacity
      style={styles.reviewCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Tag "Oględziny" */}
      <View style={styles.reviewTagContainer}>
        <View style={styles.reviewTag}>
          <Text style={styles.reviewTagText}>Oględziny</Text>
        </View>
      </View>

      {/* Adres i data/czas */}
      <View style={styles.reviewContent}>
        <View style={styles.reviewLeft}>
          {addressLine1 ? (
            <Text style={styles.reviewAddressLine1}>{addressLine1}</Text>
          ) : null}
          {addressLine2 ? (
            <Text style={styles.reviewAddressLine2}>{addressLine2}</Text>
          ) : null}
        </View>
        <View style={styles.reviewRight}>
          <Text style={styles.reviewDateTime}>{formatDateTime()}</Text>
        </View>
      </View>

      {/* Ekipa i status */}
      <View style={styles.reviewFooter}>
        <View style={styles.reviewFooterLeft}>
          <View style={styles.reviewEkipaBadge}>
            <Text style={styles.reviewEkipaNumber}>{ekipaNumber}</Text>
          </View>
          <Text style={styles.reviewEkipaText}>Ekipa {ekipaNumber}</Text>
        </View>
        <View style={styles.reviewFooterRight}>
          <View
            style={[
              styles.reviewStatusBadge,
              { backgroundColor: statusBgColor },
            ]}
          >
            <Text style={styles.reviewStatusText}>{statusText}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewTagContainer: {
    marginBottom: 8,
  },
  reviewTag: {
    backgroundColor: Colors.greenWithOpacity,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  reviewTagText: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.green,
  },
  reviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewLeft: {
    flex: 1,
    marginRight: 12,
  },
  reviewAddressLine1: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
    marginBottom: 2,
  },
  reviewAddressLine2: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
  reviewRight: {
    alignItems: 'flex-end',
  },
  reviewDateTime: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  reviewFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewEkipaBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightRose,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reviewEkipaNumber: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.rose,
  },
  reviewEkipaText: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
  reviewFooterRight: {
    alignItems: 'flex-end',
  },
  reviewStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  reviewStatusText: {
    fontSize: 11,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.white,
    fontWeight: '700',
  },
});
