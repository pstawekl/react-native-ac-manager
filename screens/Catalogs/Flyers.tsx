import { useNavigation } from '@react-navigation/native';
import { ListItem } from '@rneui/base';
import { Avatar, Button, Text } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import { IconButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import EditIcon from '../../components/icons/EditIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import { openPdfFile } from '../../helpers/pdfOpener';
import useApi from '../../hooks/useApi';
import { CatalogsMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useCatalogs from '../../providers/CatalogsProvider';
import usePermission from '../../providers/PermissionProvider';

type ProducerGroup = {
  name: string;
  count: number;
  flyers: Flyer[];
};

type YearGroup = {
  year: number;
  count: number;
  flyers: Flyer[];
};

function ProducerCard({
  producer,
  onPress,
}: {
  producer: ProducerGroup;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <View style={styles.producerCard}>
        <View style={styles.producerCardContent}>
          <View style={styles.producerCardText}>
            <Text style={styles.producerName}>{producer.name}</Text>
            <Text style={styles.producerCount}>
              {producer.count} {producer.count === 1 ? 'Ulotka' : 'Ulotek'}
            </Text>
          </View>
          <ArrowRightIcon color={Colors.black} size={20} />
        </View>
      </View>
    </Pressable>
  );
}

function YearCard({
  yearGroup,
  onPress,
}: {
  yearGroup: YearGroup;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <View style={styles.producerCard}>
        <View style={styles.producerCardContent}>
          <View style={styles.producerCardText}>
            <Text style={styles.producerName}>{yearGroup.year}</Text>
            <Text style={styles.producerCount}>
              {yearGroup.count} {yearGroup.count === 1 ? 'Ulotka' : 'Ulotek'}
            </Text>
          </View>
          <ArrowRightIcon color={Colors.black} size={20} />
        </View>
      </View>
    </Pressable>
  );
}

function RowRightContent({ onDelete }: { onDelete: () => void }) {
  return (
    <View>
      <Button
        iconPosition="top"
        title="Usuń"
        icon={{
          name: 'trash',
          type: 'font-awesome-5',
          color: Colors.white,
        }}
        containerStyle={styles.buttonContainer}
        buttonStyle={[styles.buttonStyle, styles.buttonDeleteStyle]}
        titleStyle={styles.buttonTitleStyle}
        onPress={onDelete}
      />
    </View>
  );
}

export default function Flyers() {
  const navigation = useNavigation<CatalogsMenuScreenProps['navigation']>();
  const { hasAccess } = usePermission();

  const { loadingFlyers, flyers, getFlyers } = useCatalogs();
  const { user, isUserAssembler } = useAuth();

  const { execute: deleteFlyer } = useApi({
    path: 'ulotka_delete',
  });

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Grupowanie ulotek według producenta (pierwsze słowo z nazwy)
  const producers = useMemo(() => {
    if (!flyers || flyers.length === 0) return [];

    const producerMap = new Map<string, Flyer[]>();

    flyers.forEach(flyer => {
      const producerName = flyer.name?.split(' ')[0] || 'Inne';

      if (!producerMap.has(producerName)) {
        producerMap.set(producerName, []);
      }
      producerMap.get(producerName)!.push(flyer);
    });

    const producerArray: ProducerGroup[] = Array.from(producerMap.entries())
      .map(([name, flyers]) => ({
        name,
        count: flyers.length,
        flyers,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return producerArray;
  }, [flyers]);

  // Grupowanie ulotek według roku dla wybranego producenta
  const yearGroups = useMemo(() => {
    if (!selectedProducer || !flyers || flyers.length === 0) return [];

    const producerFlyers =
      producers.find(p => p.name === selectedProducer)?.flyers || [];

    const yearMap = new Map<number, Flyer[]>();

    producerFlyers.forEach(flyer => {
      let year: number;
      try {
        const date = new Date(
          flyer.cteated_date || flyer.created_date || new Date(),
        );
        year = !isNaN(date.getTime())
          ? date.getFullYear()
          : new Date().getFullYear();
      } catch {
        year = new Date().getFullYear();
      }

      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(flyer);
    });

    const yearArray: YearGroup[] = Array.from(yearMap.entries())
      .map(([year, flyers]) => ({
        year,
        count: flyers.length,
        flyers,
      }))
      .sort((a, b) => b.year - a.year);

    return yearArray;
  }, [selectedProducer, producers, flyers]);

  // Lista ulotek dla wybranego producenta i roku
  const filteredFlyers = useMemo(() => {
    if (
      !selectedProducer ||
      selectedYear === null ||
      !flyers ||
      flyers.length === 0
    )
      return [];

    const producerFlyers =
      producers.find(p => p.name === selectedProducer)?.flyers || [];

    return producerFlyers.filter(flyer => {
      let year: number;
      try {
        const date = new Date(
          flyer.cteated_date || flyer.created_date || new Date(),
        );
        year = !isNaN(date.getTime())
          ? date.getFullYear()
          : new Date().getFullYear();
      } catch {
        return false;
      }
      return year === selectedYear;
    });
  }, [selectedProducer, selectedYear, producers, flyers]);

  const onDeleteConfirmed = () => {
    if (idToDelete !== null && getFlyers) {
      deleteFlyer({ data: { ulotka_id: idToDelete } });
      toggleOverlay();
      getFlyers();
    }
  };

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleOverlay();
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  useEffect(() => {
    if (getFlyers) {
      let data;

      if (isUserAssembler() && user?.ac_user) {
        data = { monter_id: user.ac_user };
      }

      getFlyers(data);
    }
  }, [getFlyers, isUserAssembler, user]);

  const handleProducerPress = (producer: ProducerGroup) => {
    setSelectedProducer(producer.name);
  };

  const handleYearPress = (yearGroup: YearGroup) => {
    setSelectedYear(yearGroup.year);
  };

  const handleBack = () => {
    if (selectedYear !== null) {
      setSelectedYear(null);
    } else if (selectedProducer !== null) {
      setSelectedProducer(null);
    }
  };

  const renderContent = () => {
    if (!selectedProducer) {
      // Widok producentów
      return (
        <>
          {producers.length > 0 ? (
            <View style={styles.producersList}>
              {producers.map(producer => (
                <ProducerCard
                  key={producer.name}
                  producer={producer}
                  onPress={() => handleProducerPress(producer)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.noFlyers}>Brak ulotek.</Text>
          )}
        </>
      );
    }

    if (selectedYear === null) {
      // Widok lat dla wybranego producenta
      return (
        <>
          {yearGroups.length > 0 ? (
            <View style={styles.producersList}>
              {yearGroups.map(yearGroup => (
                <YearCard
                  key={yearGroup.year}
                  yearGroup={yearGroup}
                  onPress={() => handleYearPress(yearGroup)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.noFlyers}>Brak ulotek.</Text>
          )}
        </>
      );
    }

    // Widok ulotek dla wybranego producenta i roku
    return (
      <>
        {filteredFlyers.length > 0 ? (
          filteredFlyers.map(item => {
            // Sprawdź czy item nie jest null/undefined
            if (!item) return null;

            const openFlyerLink = async () => {
              if (item?.file) {
                try {
                  await openPdfFile(item.file, {
                    onLoadingStart: () => setLoadingPdf(true),
                    onLoadingEnd: () => setLoadingPdf(false),
                  });
                } catch (error) {
                  // Błąd jest już obsłużony w openPdfFile
                  setLoadingPdf(false);
                  // eslint-disable-next-line no-console
                  console.error('Błąd w openFlyerLink:', error);
                }
              }
            };

            return (
              <ListItem.Swipeable
                key={item?.id || item?.file || Math.random().toString()}
                containerStyle={styles.itemContainer}
                rightContent={
                  hasAccess(Scopes.manageDocumentation) ? (
                    <RowRightContent onDelete={() => onDelete(item?.id)} />
                  ) : undefined
                }
                rightWidth={hasAccess(Scopes.manageDocumentation) ? 80 : 0}
                onPress={openFlyerLink}
              >
                <Avatar
                  rounded
                  size={41}
                  title={item?.file ? item.file[0] : '?'}
                  containerStyle={styles.avatarContainer}
                />
                <ListItem.Content>
                  <ListItem.Title style={styles.itemTitle}>
                    {item?.name ?? item?.file ?? 'Brak nazwy'}
                  </ListItem.Title>
                </ListItem.Content>
                {hasAccess(Scopes.manageDocumentation) && (
                  <IconButton
                    withoutBackground
                    onPress={e => {
                      e.stopPropagation();
                      navigation.navigate('EditFlyer', { flyer: item });
                    }}
                    icon={<EditIcon color={Colors.black} size={20} />}
                  />
                )}
              </ListItem.Swipeable>
            );
          })
        ) : (
          <Text style={styles.noFlyers}>Brak ulotek.</Text>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader
      // onBackPress={navigation.goBack}
      />
      {(selectedProducer || selectedYear !== null) && (
        <View style={styles.backButtonContainer}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ArrowLeftIcon color={Colors.black} size={20} />
            <Text style={styles.backButtonText}>
              {selectedYear !== null
                ? selectedProducer || 'Lata'
                : 'Wszyscy producenci'}
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView>{renderContent()}</ScrollView>

      <Spinner
        visible={loadingFlyers || loadingPdf}
        textContent={
          loadingPdf ? 'Pobieranie pliku PDF...' : 'Trwa pobieranie danych...'
        }
        textStyle={{ color: Colors.gray }}
      />
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć ulotkę ?"
      />

      {hasAccess(Scopes.addCatalogs) && (
        <FloatingActionButton
          onPress={() => navigation.navigate('AddFlyer')}
          backgroundColor={Colors.blue}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -50,
  },
  backButtonContainer: {
    paddingHorizontal: 18,
    paddingTop: 10,
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
  producersList: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 12,
  },
  producerCard: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  producerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  producerCardText: {
    flex: 1,
  },
  producerName: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 4,
  },
  producerCount: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.lightGray,
  },
  itemContainer: {
    marginBottom: -8,
    paddingVertical: 8,
  },
  avatarContainer: {
    backgroundColor: Colors.blue,
  },
  itemTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  noFlyers: {
    textAlign: 'center',
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    borderRadius: 0,
  },
  buttonStyle: {
    minHeight: '100%',
    width: 80,
    borderRadius: 0,
  },
  buttonTitleStyle: {
    fontSize: 12,
  },
});
