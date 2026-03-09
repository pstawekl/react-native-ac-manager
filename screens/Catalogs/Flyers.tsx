import { useNavigation } from '@react-navigation/native';
import { ListItem } from '@rneui/base';
import { Avatar, Button, Text } from '@rneui/themed';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import { IconButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import EditIcon from '../../components/icons/EditIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import { openPdfFile } from '../../helpers/pdfOpener';
import useApi from '../../hooks/useApi';
import { CatalogsMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useCatalogs, { Flyer } from '../../providers/CatalogsProvider';
import usePermission from '../../providers/PermissionProvider';

type ProducerGroup = {
  name: string;
  flyers: Flyer[];
};

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

function RowRightContent({ onDelete }: { onDelete: () => void }) {
  return (
    <View style={styles.deleteWrapper}>
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
      .map(([name, flyersList]) => ({
        name,
        flyers: flyersList,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return producerArray;
  }, [flyers]);

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

  return (
    <View style={styles.container}>
      <ButtonsHeader />

      <ScrollView>
        {producers.length > 0 ? (
          <View style={styles.producersList}>
            {producers.map(producer => (
              <View key={producer.name} style={styles.producerSection}>
                <Text style={styles.producerName}>{producer.name}</Text>
                {producer.flyers.map(item => {
                  if (!item) return null;

                  const openFlyerLink = async () => {
                    if (item?.file) {
                      try {
                        await openPdfFile(item.file, {
                          onLoadingStart: () => setLoadingPdf(true),
                          onLoadingEnd: () => setLoadingPdf(false),
                        });
                      } catch (error) {
                        setLoadingPdf(false);
                        // eslint-disable-next-line no-console
                        console.error('Błąd w openFlyerLink:', error);
                      }
                    }
                  };

                  const odText = formatOdDate(item.od);

                  return (
                    <ListItem.Swipeable
                      key={item.id}
                      containerStyle={styles.itemContainer}
                      rightContent={
                        hasAccess(Scopes.manageDocumentation) ? (
                          <RowRightContent onDelete={() => onDelete(item.id)} />
                        ) : undefined
                      }
                      rightWidth={
                        hasAccess(Scopes.manageDocumentation) ? 80 : 0
                      }
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
                        {odText ? (
                          <ListItem.Subtitle style={styles.itemDateText}>
                            {odText}
                          </ListItem.Subtitle>
                        ) : null}
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
                })}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noFlyers}>Brak ulotek.</Text>
        )}
      </ScrollView>

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
  producersList: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 20,
  },
  producerSection: {
    gap: 4,
  },
  producerName: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 8,
  },
  itemContainer: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  avatarContainer: {
    backgroundColor: Colors.blue,
  },
  itemTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  itemDateText: {
    fontSize: 13,
    color: Colors.lightGray,
    marginTop: 2,
  },
  noFlyers: {
    textAlign: 'center',
  },
  deleteWrapper: {
    width: 80,
    height: 62,
    justifyContent: 'center',
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonContainer: {
    borderRadius: 0,
    alignItems: 'stretch',
  },
  buttonStyle: {
    height: 62,
    width: 80,
    borderRadius: 0,
  },
  buttonTitleStyle: {
    fontSize: 12,
  },
});
