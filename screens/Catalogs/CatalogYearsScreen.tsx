import { useRoute } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Shadow } from 'react-native-shadow-2';

import ButtonsHeader from '../../components/ButtonsHeader';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import Colors from '../../consts/Colors';
import { CatalogsCatalogYearsScreenProps } from '../../navigation/types';

type Catalog = {
  ac_user: number;
  created_date: string;
  file: string;
  id: number;
  is_active: boolean;
  name: string;
  od?: string;
};

type YearGroup = {
  year: number;
  count: number;
  catalogs: Catalog[];
};

function YearCard({
  yearGroup,
  producer,
  onPress,
}: {
  yearGroup: YearGroup;
  producer: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <Shadow
        style={styles.yearCard}
        startColor={Colors.cardShadow}
        endColor="#FFFFFF00"
        distance={4}
      >
        <View style={styles.yearCardContent}>
          <View style={styles.yearCardText}>
            <Text style={styles.yearName}>{yearGroup.year}</Text>
            <Text style={styles.yearCount}>
              {yearGroup.count}{' '}
              {yearGroup.count === 1 ? 'Dokument' : 'Dokumentów'}
            </Text>
          </View>
          <ArrowRightIcon color={Colors.black} size={20} />
        </View>
      </Shadow>
    </Pressable>
  );
}

export default function CatalogYearsScreen({
  navigation,
}: CatalogsCatalogYearsScreenProps) {
  const route = useRoute();
  const { producer, catalogs } = (route.params as any) || {};

  // Grupowanie katalogów według roku na podstawie pola "od"
  const yearGroups = useMemo(() => {
    if (!catalogs || catalogs.length === 0) return [];

    const yearMap = new Map<number, Catalog[]>();

    catalogs.forEach((catalog: Catalog) => {
      let year: number;
      
      if (catalog.od) {
        // Parsuj datę z pola "od" (format może być różny: YYYY-MM-DD, DD/MM/YYYY, etc.)
        try {
          const date = new Date(catalog.od);
          if (!isNaN(date.getTime())) {
            year = date.getFullYear();
          } else {
            // Jeśli parsowanie nie działa, spróbuj wyciągnąć rok z stringa
            const yearMatch = catalog.od.match(/\b(19|20)\d{2}\b/);
            year = yearMatch ? parseInt(yearMatch[0], 10) : new Date().getFullYear();
          }
        } catch {
          // Fallback: użyj bieżącego roku
          year = new Date().getFullYear();
        }
      } else {
        // Jeśli nie ma pola "od", użyj roku z created_date
        try {
          const date = new Date(catalog.created_date);
          year = !isNaN(date.getTime()) ? date.getFullYear() : new Date().getFullYear();
        } catch {
          year = new Date().getFullYear();
        }
      }

      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(catalog);
    });

    // Konwertuj na tablicę i posortuj malejąco (najnowsze lata na górze)
    const yearArray: YearGroup[] = Array.from(yearMap.entries())
      .map(([year, catalogs]) => ({
        year,
        count: catalogs.length,
        catalogs,
      }))
      .sort((a, b) => b.year - a.year);

    return yearArray;
  }, [catalogs]);

  const handleYearPress = (yearGroup: YearGroup) => {
    navigation.navigate('CatalogList' as any, {
      producer,
      year: yearGroup.year,
      catalogs: yearGroup.catalogs,
    });
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader
        onBackPress={navigation.goBack}
        title={producer || 'Katalogi'}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {yearGroups.length > 0 ? (
          <View style={styles.yearsList}>
            {yearGroups.map(yearGroup => (
              <YearCard
                key={yearGroup.year}
                yearGroup={yearGroup}
                producer={producer}
                onPress={() => handleYearPress(yearGroup)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak katalogów.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
  },
  yearsList: {
    gap: 12,
  },
  yearCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  yearCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  yearCardText: {
    flex: 1,
  },
  yearName: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 4,
  },
  yearCount: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.lightGray,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.lightGray,
    textAlign: 'center',
  },
});
