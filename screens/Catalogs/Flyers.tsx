import { useNavigation } from '@react-navigation/native';
import { ListItem } from '@rneui/base';
import { Avatar, Button, Text } from '@rneui/themed';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
      <ButtonsHeader
        // onBackPress={navigation.goBack}
      />

      <ScrollView>
        {flyers && flyers.length > 0 ? (
          flyers?.map(item => {
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
                  <RowRightContent onDelete={() => onDelete(item?.id)} />
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
                </ListItem.Content>
              </ListItem.Swipeable>
            );
          })
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
