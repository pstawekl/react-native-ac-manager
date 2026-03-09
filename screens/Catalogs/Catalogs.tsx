import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import EditIcon from '../../components/icons/EditIcon';
import TextFileIcon from '../../components/icons/TextFileIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import { openPdfFile } from '../../helpers/pdfOpener';
import useApi from '../../hooks/useApi';
import { CatalogsMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useCatalogs, { Catalog } from '../../providers/CatalogsProvider';
import usePermission from '../../providers/PermissionProvider';

type CategoryGroup = {
  name: string;
  count: number;
  catalogs: Catalog[];
};

type ViewLevel = 'producers' | 'catalogs';

function CategoryCard({
  category,
  onPress,
}: {
  category: CategoryGroup;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <View style={styles.categoryCard}>
        <View style={styles.categoryCardContent}>
          <View style={styles.categoryCardText}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryCount}>
              {category.count}{' '}
              {category.count === 1 ? 'Dokument' : 'Dokumentów'}
            </Text>
          </View>
          <ArrowRightIcon color={Colors.black} size={20} />
        </View>
      </View>
    </Pressable>
  );
}

function formatOdDate(odDate?: string): string {
  if (!odDate) return '';

  try {
    const date = new Date(odDate);
    if (!Number.isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `obowiązuje od: ${day}/${month}/${year}`;
    }

    const isoMatch = odDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `obowiązuje od: ${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }

    return `obowiązuje od: ${odDate}`;
  } catch {
    return `obowiązuje od: ${odDate}`;
  }
}

function CatalogItemCard({
  catalog,
  onPress,
  onEdit,
  showEdit,
}: {
  catalog: Catalog;
  onPress: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
}) {
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
      <View style={styles.catalogItemCard}>
        <View style={styles.catalogItemCardContent}>
          <View style={styles.avatarContainer}>
            <TextFileIcon color={Colors.newPurple} size={24} />
          </View>
          <View style={styles.catalogInfo}>
            <Text style={styles.catalogName}>{catalog.name}</Text>
            {catalog.od && (
              <Text style={styles.catalogDate}>{formatOdDate(catalog.od)}</Text>
            )}
          </View>
          <View style={styles.rightContent}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusBgColor }]}
            >
              <Text style={[styles.statusText, { color: statusTextColor }]}>
                {statusText}
              </Text>
            </View>
            {showEdit && onEdit && (
              <Pressable
                onPress={e => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={styles.editButton}
              >
                <EditIcon color={Colors.black} size={20} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function Catalogs() {
  const navigation = useNavigation<CatalogsMenuScreenProps['navigation']>();
  const { hasAccess } = usePermission();

  const { loadingCatalogs, catalogs, getCatalogs } = useCatalogs();
  const { user, isUserAssembler } = useAuth();

  const { execute: deleteCatalog } = useApi({
    path: 'katalog_delete',
  });

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('producers');
  const [selectedProducer, setSelectedProducer] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!catalogs || catalogs.length === 0) return [];

    const categoryMap = new Map<string, Catalog[]>();

    catalogs.forEach(catalog => {
      const categoryName = catalog.name.split(' ')[0] || 'Inne';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(catalog);
    });

    const categoryArray: CategoryGroup[] = Array.from(categoryMap.entries())
      .map(([name, cats]) => ({
        name,
        count: cats.length,
        catalogs: cats,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return categoryArray;
  }, [catalogs]);

  const filteredCatalogs = useMemo(() => {
    if (!selectedProducer) return [];

    return (
      categories.find(cat => cat.name === selectedProducer)?.catalogs || []
    );
  }, [selectedProducer, categories]);

  const onDeleteConfirmed = async () => {
    if (!idToDelete) return;
    await deleteCatalog({ data: { katalog_id: idToDelete } });
    toggleOverlay();
    setIdToDelete(null);
    if (getCatalogs) {
      getCatalogs();
    }
  };

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleOverlay();
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const handleCategoryPress = (category: CategoryGroup) => {
    setSelectedProducer(category.name);
    setViewLevel('catalogs');
  };

  const handleBack = () => {
    setViewLevel('producers');
    setSelectedProducer(null);
  };

  const openCatalogLink = async (catalog: Catalog) => {
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

  useEffect(() => {
    if (getCatalogs) {
      let data;

      if (isUserAssembler()) {
        data = { monter_id: user!.ac_user };
      }

      getCatalogs(data);
    }
  }, [getCatalogs, isUserAssembler, user]);

  const renderContent = () => {
    if (viewLevel === 'producers') {
      return categories.length > 0 ? (
        <View style={styles.categoriesList}>
          {categories.map(category => (
            <CategoryCard
              key={category.name}
              category={category}
              onPress={() => handleCategoryPress(category)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak katalogów.</Text>
        </View>
      );
    }

    if (viewLevel === 'catalogs') {
      return filteredCatalogs.length > 0 ? (
        <View style={styles.catalogsList}>
          {filteredCatalogs.map(catalog => (
            <CatalogItemCard
              key={catalog.id}
              catalog={catalog}
              onPress={() => openCatalogLink(catalog)}
              onEdit={() => navigation.navigate('EditCatalog', { catalog })}
              showEdit={hasAccess(Scopes.manageDocumentation)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak katalogów.</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {viewLevel === 'catalogs' && (
        <View style={styles.backButtonContainer}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ArrowLeftIcon color={Colors.black} size={20} />
            <Text style={styles.backButtonText}>Wszyscy producenci</Text>
          </Pressable>
        </View>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>

      <Spinner
        visible={loadingCatalogs || loadingPdf}
        textContent={
          loadingPdf ? 'Pobieranie pliku PDF...' : 'Trwa pobieranie danych...'
        }
        textStyle={{ color: Colors.gray }}
      />
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć katalog ?"
      />

      {hasAccess(Scopes.manageDocumentation) && (
        <FloatingActionButton
          onPress={() => navigation.navigate('AddCatalog')}
          backgroundColor={Colors.newPurple}
        />
      )}
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
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryCardText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 4,
  },
  categoryCount: {
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
  backButtonContainer: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
    marginLeft: 4,
  },
  catalogsList: {
    gap: 12,
  },
  catalogItemCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  catalogItemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.newPurpleWithOpacity,
    justifyContent: 'center',
    alignItems: 'center',
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
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 4,
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
});
