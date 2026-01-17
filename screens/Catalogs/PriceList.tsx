import { useNavigation } from '@react-navigation/native';
import { Avatar, Button, ListItem, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import { IconButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import DownloadIcon from '../../components/icons/DownloadIcon';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import { openPdfFile } from '../../helpers/pdfOpener';
import useApi from '../../hooks/useApi';
import { CatalogsMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useCatalogs, { PriceListItem } from '../../providers/CatalogsProvider';
import usePermission from '../../providers/PermissionProvider';

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
  onLoadingStart,
  onLoadingEnd,
}: {
  priceList: PriceListItem;
  onDelete: (id: number) => void;
  onLoadingStart: () => void;
  onLoadingEnd: () => void;
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
      rightContent={<RowRightContent onDelete={() => onDelete(priceList.id)} />}
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
      <IconButton
        withoutBackground
        onPress={openPriceListLink}
        icon={<DownloadIcon color={Colors.black} size={20} />}
      />
    </ListItem.Swipeable>
  );
}

export default function PriceList() {
  const navigation = useNavigation<CatalogsMenuScreenProps['navigation']>();
  const { hasAccess } = usePermission();

  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredPriceList, setFilteredPriceList] = useState<
    PriceListItem[] | null
  >(null);
  const { loadingPriceList, priceList, getPriceList } = useCatalogs();
  const { user, isUserAssembler } = useAuth();

  const { execute: deletePriceListItem } = useApi({
    path: 'cennik_delete',
  });

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const onDeleteConfirmed = () => {
    if (idToDelete && getPriceList) {
      deletePriceListItem({ cennik_id: idToDelete });
      toggleOverlay();
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

  useEffect(() => {
    if (priceList) {
      setFilteredPriceList(priceList);
    }
  }, [priceList]);

  useEffect(() => {
    // TODO
  }, [searchValue]);

  return (
    <View style={styles.container}>
      <ButtonsHeader
        // onBackPress={navigation.goBack}
        searchValue={searchValue}
        onChangeSearchValue={setSearchValue}
      />

      <ScrollView>
        {filteredPriceList?.length ? (
          <View />
        ) : (
          <Text style={styles.noPriceLists}>Brak cenników.</Text>
        )}
        {filteredPriceList?.map(item => (
          <View key={item.id}>
            <PriceListElement
              priceList={item}
              onDelete={onDelete}
              onLoadingStart={() => setLoadingPdf(true)}
              onLoadingEnd={() => setLoadingPdf(false)}
            />
          </View>
        ))}
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

      {hasAccess(Scopes.addCatalogs) && (
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
