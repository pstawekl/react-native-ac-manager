import { useNavigation } from '@react-navigation/native';
import { Avatar } from '@rneui/base';
import { Button, ListItem, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import Colors from '../../consts/Colors';
import { Scopes } from '../../consts/Permissions';
import useApi, { ASSETS_BASE_URL } from '../../hooks/useApi';
import { CertificatesScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useCerts from '../../providers/CertsProvider';
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

export default function Trainings() {
  const { navigate, goBack } =
    useNavigation<CertificatesScreenProps['navigation']>();
  const { trainings, getTrainings, trainingsLoading } = useCerts();
  const { user, isUserAssembler } = useAuth();
  const { hasAccess } = usePermission();
  const { execute: deleteTraining } = useApi({
    path: 'szkolenie_delete',
  });

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const onDeleteConfirmed = () => {
    if (idToDelete && getTrainings) {
      deleteTraining({ data: { szkolenie_id: idToDelete } });
      toggleOverlay();
      getTrainings();
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
    if (getTrainings) {
      let data;

      if (isUserAssembler()) {
        data = { monter_id: user!.ac_user };
      }

      getTrainings(data);
    }
  }, [getTrainings, isUserAssembler, user]);

  return (
    <View style={styles.container}>
      <ScrollView>
        {trainings?.length ? (
          trainings.map(item => {
            const openTrainingLink = () => {
              if (item.file) {
                const catalogLink = ASSETS_BASE_URL + item.file;
                Linking.openURL(catalogLink).catch(err => console.log(err));
              }
            };

            const participantsLabel =
              item.participants && item.participants.length
                ? item.participants
                    .map(p => `${p.first_name} ${p.last_name}`.trim())
                    .join(', ')
                : null;

            const companyLabel =
              item.company_user != null
                ? `${item.company_user.first_name} ${item.company_user.last_name}`.trim()
                : null;

            const subtitleParts: string[] = [];
            subtitleParts.push(
              `Data wydania: ${format(
                new Date(item.created_date),
                'dd/MM/yyyy',
              )}`,
            );
            if (participantsLabel) {
              subtitleParts.push(`Uczestnicy: ${participantsLabel}`);
            }
            if (companyLabel) {
              subtitleParts.push(`Firma: ${companyLabel}`);
            }

            return (
              <ListItem.Swipeable
                key={item.id}
                containerStyle={styles.itemContainer}
                rightContent={
                  hasAccess(Scopes.manageDocumentation) ? (
                    <RowRightContent onDelete={() => onDelete(item.id)} />
                  ) : undefined
                }
                leftWidth={80}
                rightWidth={hasAccess(Scopes.manageDocumentation) ? 80 : 0}
                onPress={openTrainingLink}
              >
                <Avatar
                  rounded
                  size={41}
                  icon={{
                    name: item.file ? 'file-pdf' : 'chalkboard-teacher',
                    type: 'font-awesome-5',
                  }}
                  containerStyle={styles.avatarContainer}
                />
                <ListItem.Content>
                  <ListItem.Title>{item.name ?? item.file}</ListItem.Title>
                  <ListItem.Subtitle>
                    {subtitleParts.join(' | ')}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem.Swipeable>
            );
          })
        ) : (
          <Text style={styles.noData}>Brak szkoleń.</Text>
        )}
      </ScrollView>

      <Spinner
        visible={trainingsLoading}
        textContent="Trwa pobieranie danych..."
        textStyle={{ color: Colors.gray }}
      />
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć szkolenie ?"
      />

      {hasAccess(Scopes.manageDocumentation) && (
        <FloatingActionButton
          onPress={() => navigate('AddTraining')}
          backgroundColor={Colors.primary}
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
    paddingVertical: 8,
    height: 50,
  },
  buttonContainer: {
    borderRadius: 0,
  },
  buttonStyle: {
    minHeight: '100%',
    width: 80,
    borderRadius: 0,
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  buttonTitleStyle: {
    fontSize: 12,
  },
  noData: {
    textAlign: 'center',
  },
  avatarContainer: {
    backgroundColor: Colors.buttons.deleteBg,
  },
});
