import { useRoute } from '@react-navigation/native';
import { Avatar, Text } from '@rneui/themed';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import ButtonsHeader from '../../components/ButtonsHeader';
import DocumentIcon from '../../components/icons/DocumentIcon';
import Colors from '../../consts/Colors';
import { openPdfFile } from '../../helpers/pdfOpener';
import { CatalogsCatalogListScreenProps } from '../../navigation/types';

type Catalog = {
  ac_user: number;
  created_date: string;
  file: string;
  id: number;
  is_active: boolean;
  name: string;
  od?: string;
};

function CatalogItem({
  catalog,
  onPress,
}: {
  catalog: Catalog;
  onPress: () => void;
}) {
  // Formatuj datę "Od"
  const formatOdDate = (odDate?: string): string => {
    if (!odDate) return '';

    try {
      const date = new Date(odDate);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `Od ${day}/${month}/${year}`;
      }

      // Jeśli parsowanie nie działa, spróbuj wyciągnąć datę z stringa
      // Format może być DD/MM/YYYY lub YYYY-MM-DD
      const dateMatch = odDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        return `Od ${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
      }

      const isoMatch = odDate.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return `Od ${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
      }

      return `Od ${odDate}`;
    } catch {
      return `Od ${odDate}`;
    }
  };

  const statusText = catalog.is_active ? 'Aktualny' : 'Nieaktualny';
  const statusBgColor = catalog.is_active
    ? Colors.statusDone
    : Colors.grayBorder;
  const statusTextColor = catalog.is_active
    ? Colors.statusDoneText
    : Colors.lightGray;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <View style={styles.catalogCardContent}>
        <Avatar
          rounded
          size={48}
          icon={<DocumentIcon color={Colors.newPurple} size={24} />}
          containerStyle={styles.avatarContainer}
        />
        <View style={styles.catalogInfo}>
          <Text style={styles.catalogName}>{catalog.name}</Text>
          {catalog.od && (
            <Text style={styles.catalogDate}>{formatOdDate(catalog.od)}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
          <Text style={[styles.statusText, { color: statusTextColor }]}>
            {statusText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function CatalogListScreen({
  navigation,
}: CatalogsCatalogListScreenProps) {
  const route = useRoute();
  const { producer, year, catalogs } = (route.params as any) || {};
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleCatalogPress = async (catalog: Catalog) => {
    if (!catalog.file) {
      Alert.alert('Błąd', 'Brak ścieżki do pliku katalogu.');
      return;
    }
    try {
      await openPdfFile(catalog.file, {
        onLoadingStart: () => setLoadingPdf(true),
        onLoadingEnd: () => setLoadingPdf(false),
      });
    } catch (error) {
      setLoadingPdf(false);
      // eslint-disable-next-line no-console
      console.error('Błąd w openCatalogLink:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader
        onBackPress={navigation.goBack}
        title={`${producer || ''} ${year || ''}`.trim() || 'Katalogi'}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {catalogs && catalogs.length > 0 ? (
          <View style={styles.catalogsList}>
            {catalogs.map((catalog: Catalog) => (
              <CatalogItem
                key={catalog.id}
                catalog={catalog}
                onPress={() => handleCatalogPress(catalog)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak katalogów.</Text>
          </View>
        )}
      </ScrollView>

      <Spinner
        visible={loadingPdf}
        textContent="Pobieranie pliku PDF..."
        textStyle={{ color: Colors.gray }}
      />
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
  catalogsList: {
    gap: 12,
  },
  catalogCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  catalogCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatarContainer: {
    backgroundColor: `${Colors.newPurple}26`, // 26 = ~15% opacity
  },
  catalogInfo: {
    flex: 1,
  },
  catalogName: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 4,
  },
  catalogDate: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.lightGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
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
