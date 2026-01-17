import { useNavigation } from '@react-navigation/native';
import { ListItem } from '@rneui/base';
import { Avatar, Button, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import { openPdfFile } from '../../helpers/pdfOpener';
import useApi from '../../hooks/useApi';
import { CatalogsMenuScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useCatalogs from '../../providers/CatalogsProvider';
import usePermission from '../../providers/PermissionProvider';

type Catalog = {
  ac_user: number;
  created_date: string;
  file: string;
  id: number;
  is_active: boolean;
  name: string;
};

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

function CatalogRow({
  catalog,
  onDelete,
  onLoadingStart,
  onLoadingEnd,
}: {
  catalog: Catalog;
  onDelete: (id: number) => void;
  onLoadingStart: () => void;
  onLoadingEnd: () => void;
}) {
  const openCatalogLink = async () => {
    if (!catalog.file) {
      Alert.alert('Błąd', 'Brak ścieżki do pliku katalogu.');
      return;
    }
    try {
      await openPdfFile(catalog.file, {
        onLoadingStart,
        onLoadingEnd,
      });
    } catch (error) {
      // Błąd jest już obsłużony w openPdfFile
      onLoadingEnd();
      // eslint-disable-next-line no-console
      console.error('Błąd w openCatalogLink:', error);
    }
  };

  return (
    <ListItem.Swipeable
      key={catalog.id}
      containerStyle={styles.itemContainer}
      rightContent={<RowRightContent onDelete={() => onDelete(catalog.id)} />}
      leftWidth={80}
      rightWidth={80}
      onPress={openCatalogLink}
    >
      <Avatar
        rounded
        size={41}
        icon={{ name: 'file-pdf', type: 'font-awesome-5' }}
        containerStyle={styles.avatarContainer}
      />
      <ListItem.Content>
        <ListItem.Title>{catalog.name}</ListItem.Title>
        <ListItem.Subtitle>
          Data wydania: {format(new Date(catalog.created_date), 'dd/MM/yyyy')}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem.Swipeable>
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

  const onDeleteConfirmed = () => {
    if (idToDelete && getCatalogs) {
      deleteCatalog({ katalog_id: idToDelete });
      toggleOverlay();
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

  useEffect(() => {
    if (getCatalogs) {
      let data;

      if (isUserAssembler()) {
        data = { monter_id: user!.ac_user };
      }

      getCatalogs(data);
    }
  }, [getCatalogs, isUserAssembler, user]);

  return (
    <View style={styles.container}>
      <ButtonsHeader
        // onBackPress={navigation.goBack}
      />

      <ScrollView>
        {catalogs?.length ? (
          catalogs.map(item => (
            <CatalogRow
              key={item.id}
              catalog={item}
              onDelete={onDelete}
              onLoadingStart={() => setLoadingPdf(true)}
              onLoadingEnd={() => setLoadingPdf(false)}
            />
          ))
        ) : (
          <Text style={styles.noCatalogs}>Brak katalogów.</Text>
        )}
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

      {hasAccess(Scopes.addCatalogs) && (
        <FloatingActionButton
          onPress={() => navigation.navigate('AddCatalog')}
          backgroundColor={Colors.blue}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    marginBottom: -8,
    paddingVertical: 8,
  },
  avatarContainer: {
    backgroundColor: Colors.blue,
  },
  noCatalogs: {
    textAlign: 'center',
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonContainer: {
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
