import { useNavigation } from '@react-navigation/native';
import { Avatar, Button, ListItem, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import { IconButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import DownloadIcon from '../../components/icons/DownloadIcon';
import EditIcon from '../../components/icons/EditIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import { openPdfFile } from '../../helpers/pdfOpener';
import useApi from '../../hooks/useApi';
import { CatalogsMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useCatalogs, { PriceListItem } from '../../providers/CatalogsProvider';
import usePermission from '../../providers/PermissionProvider';

type ProducerGroup = {
  name: string;
  count: number;
  priceLists: PriceListItem[];
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
              {producer.count} {producer.count === 1 ? 'Cennik' : 'Cenników'}
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
  );
}

function PriceListElement({
  priceList,
  onDelete,
  onEdit,
  showEdit,
  onLoadingStart,
  onLoadingEnd,
  canManage,
}: {
  priceList: PriceListItem;
  onDelete: (id: number) => void;
  onEdit?: () => void;
  showEdit?: boolean;
  onLoadingStart: () => void;
  onLoadingEnd: () => void;
  canManage: boolean;
}) {
  const openPriceListLink = async () => {
    if (!priceList.file) {
      Alert.alert('Błąd', 'Brak ścieżki do pliku cennika.');
      return;
    }
    try {
      await openPdfFile(priceList.file, {
        onLoadingStart,
        onLoadingEnd,
      });
    } catch (error) {
      // Błąd jest już obsłużony w openPdfFile
      onLoadingEnd();
      console.error('Błąd w openPriceListLink:', error);
    }
  };

  return (
    <ListItem.Swipeable
      key={priceList.file}
      containerStyle={styles.itemInnerContainer}
      rightContent={
        canManage ? (
          <RowRightContent onDelete={() => onDelete(priceList.id)} />
        ) : undefined
      }
      rightWidth={canManage ? 80 : 0}
    >
      <Avatar
        rounded
        size={41}
        icon={{ name: 'file-pdf', type: 'font-awesome-5' }}
        containerStyle={styles.avatarContainer}
      />
      <ListItem.Content>
        <ListItem.Title>
          {priceList.name}{' '}
          {format(new Date(priceList.created_date), 'dd/MM/yyyy')}
        </ListItem.Title>
        <ListItem.Subtitle
          style={
            priceList.is_active
              ? styles.itemSubtitle
              : styles.itemSubtitleExpired
          }
        >
          {priceList.is_active ? 'Aktualny' : 'Nieaktualny'}{' '}
        </ListItem.Subtitle>
      </ListItem.Content>
      <View style={styles.actionsContainer}>
        {showEdit && onEdit && (
          <IconButton
            withoutBackground
            onPress={onEdit}
            icon={<EditIcon color={Colors.black} size={20} />}
          />
        )}
        <IconButton
          withoutBackground
          onPress={openPriceListLink}
          icon={<DownloadIcon color={Colors.black} size={20} />}
        />
      </View>
    </ListItem.Swipeable>
  );
}

export default function PriceList() {
  const navigation = useNavigation<CatalogsMenuScreenProps['navigation']>();
  const { hasAccess } = usePermission();

  const { loadingPriceList, priceList, getPriceList } = useCatalogs();
  const { user, isUserAssembler } = useAuth();

  const { execute: deletePriceListItem } = useApi({
    path: 'cennik_delete',
  });

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<string | null>(null);

  // Grupowanie cenników według producenta (pierwsze słowo z nazwy)
  const producers = useMemo(() => {
    if (!priceList || priceList.length === 0) return [];

    const producerMap = new Map<string, PriceListItem[]>();

    priceList.forEach(item => {
      const producerName = item.name.split(' ')[0] || 'Inne';

      if (!producerMap.has(producerName)) {
        producerMap.set(producerName, []);
      }
      producerMap.get(producerName)!.push(item);
    });

    const producerArray: ProducerGroup[] = Array.from(producerMap.entries())
      .map(([name, priceLists]) => ({
        name,
        count: priceLists.length,
        priceLists,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return producerArray;
  }, [priceList]);

  // Lista cenników dla wybranego producenta
  const filteredPriceLists = useMemo(() => {
    if (!selectedProducer || !priceList || priceList.length === 0) return [];

    return producers.find(p => p.name === selectedProducer)?.priceLists || [];
  }, [selectedProducer, producers, priceList]);

  const onDeleteConfirmed = async () => {
    if (!idToDelete) return;
    await deletePriceListItem({ data: { cennik_id: idToDelete } });
    toggleOverlay();
    setIdToDelete(null);
    if (getPriceList) {
      getPriceList();
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
    if (getPriceList) {
      let data;

      if (isUserAssembler()) {
        data = { monter_id: user!.ac_user };
      }

      getPriceList(data);
    }
  }, [getPriceList, isUserAssembler, user]);

  const handleProducerPress = (producer: ProducerGroup) => {
    setSelectedProducer(producer.name);
  };

  const handleBack = () => {
    setSelectedProducer(null);
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader
      // onBackPress={navigation.goBack}
      />
      {selectedProducer && (
        <View style={styles.backButtonContainer}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ArrowLeftIcon color={Colors.black} size={20} />
            <Text style={styles.backButtonText}>Wszyscy producenci</Text>
          </Pressable>
        </View>
      )}

      <ScrollView>
        {selectedProducer ? (
          <>
            {filteredPriceLists.length > 0 ? (
              filteredPriceLists.map(item => (
                <View key={item.id}>
                  <PriceListElement
                    priceList={item}
                    onDelete={onDelete}
                    onEdit={() =>
                      navigation.navigate('EditPriceList', { priceList: item })
                    }
                    showEdit={hasAccess(Scopes.manageDocumentation)}
                    onLoadingStart={() => setLoadingPdf(true)}
                    onLoadingEnd={() => setLoadingPdf(false)}
                    canManage={hasAccess(Scopes.manageDocumentation)}
                  />
                </View>
              ))
            ) : (
              <Text style={styles.noPriceLists}>Brak cenników.</Text>
            )}
          </>
        ) : (
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
              <Text style={styles.noPriceLists}>Brak cenników.</Text>
            )}
          </>
        )}
      </ScrollView>

      <Spinner
        visible={loadingPriceList || loadingPdf}
        textContent={
          loadingPdf ? 'Pobieranie pliku PDF...' : 'Trwa pobieranie danych...'
        }
        textStyle={{ color: Colors.gray }}
      />
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć cennik ?"
      />

      {hasAccess(Scopes.manageDocumentation) && (
        <FloatingActionButton
          onPress={() => navigation.navigate('AddPriceList')}
          backgroundColor={Colors.purple}
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
  itemInnerContainer: {
    paddingVertical: 0,
    marginBottom: -8,
  },
  avatarContainer: {
    backgroundColor: Colors.purple,
  },
  itemSubtitle: {
    color: Colors.primary,
  },
  itemSubtitleExpired: {
    color: Colors.lightRed,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noPriceLists: {
    textAlign: 'center',
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonContainer: {
    borderRadius: 0,
    alignItems: 'flex-end',
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
