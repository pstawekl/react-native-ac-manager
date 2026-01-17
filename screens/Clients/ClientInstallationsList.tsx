/* eslint-disable react-native/no-inline-styles */
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Button, ListItem, Overlay, Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import FloatingActionButton from '../../components/FloatingActionButton';
import ArrowRightIcon from '../../components/icons/ArrowRightIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import SettingIcon from '../../components/icons/SettingIcon';
import { FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import {
  ClientInstallationsListScreenProps,
  ClientListScreenProps,
} from '../../navigation/types';
import {
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';

function RowLeftContent({ onEdit }: { onEdit: () => void }) {
  return (
    <Button
      iconPosition="top"
      title="Edytuj"
      icon={{ name: 'file', type: 'font-awesome-5', color: Colors.white }}
      containerStyle={styles.buttonContainer}
      buttonStyle={[styles.buttonStyle, { backgroundColor: Colors.primary }]}
      titleStyle={styles.buttonTitleStyle}
      onPress={onEdit}
    />
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

const ClientInstallationsListRow = memo(
  ({
    item,
    clientId,
    onDelete,
    onEdit,
  }: {
    item: ClientsInstallationListItem;
    clientId?: string;
    onDelete: (id: number) => void;
    onEdit: (item: ClientsInstallationListItem) => void;
  }) => {
    const { navigate } = useNavigation<ClientListScreenProps['navigation']>();

    return (
      <ListItem.Swipeable
        key={item.id}
        style={styles.rowItem}
        onPress={() =>
          navigate('Settings', { installationId: item.id, clientId })
        }
        leftContent={<RowLeftContent onEdit={() => onEdit(item)} />}
        rightContent={<RowRightContent onDelete={() => onDelete(item.id)} />}
        leftWidth={80}
        rightWidth={80}
      >
        <ListItem.Content style={styles.clientInstallationsListRow}>
          <View style={styles.clientInstallationsListRowLeft}>
            <SettingIcon color={Colors.primary} />
            <ListItem.Title style={styles.clientInstallationsListRowTitle}>
              {item.name ?? `Instalacja ${item.id}`}
            </ListItem.Title>
          </View>
          <ListItem.Subtitle>
            <ArrowRightIcon color={Colors.black} />
          </ListItem.Subtitle>
        </ListItem.Content>
      </ListItem.Swipeable>
    );
  },
);

const EmptyInstallationsRow = memo(
  ({ onAddPress }: { onAddPress: () => void }) => {
    return (
      <ListItem style={styles.rowItem} onPress={onAddPress}>
        <ListItem.Content style={styles.clientInstallationsListRow}>
          <View style={styles.clientInstallationsListRowLeft}>
            <SettingIcon color={Colors.primary} />
            <ListItem.Title style={styles.clientInstallationsListRowTitle}>
              Dodaj instalację
            </ListItem.Title>
          </View>
          <ListItem.Subtitle>
            <PlusIcon color={Colors.primary} size={20} />
          </ListItem.Subtitle>
        </ListItem.Content>
      </ListItem>
    );
  },
);

function InstallationsDeleteOverlay({
  visible,
  onBackdropPress,
  onDelete,
}: {
  visible: boolean;
  onBackdropPress: () => void;
  onDelete: () => void;
}) {
  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
    >
      <Text>Czy na pewno chcesz usunąć instalację ?</Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 12,
          gap: 12,
        }}
      >
        <SubmitButton
          title="Nie"
          style={styles.continueButton}
          onPress={onBackdropPress}
        />
        <SubmitButton
          title="Tak"
          style={styles.continueButton}
          onPress={onDelete}
        />
      </View>
    </Overlay>
  );
}

function InstallationsEditOverlay({
  visible,
  onBackdropPress,
  onEdit,
  itemToEdit,
}: {
  visible: boolean;
  onBackdropPress: () => void;
  onEdit: ({ name }: { name: string }) => void;
  itemToEdit: ClientsInstallationListItem | null;
}) {
  const { control, handleSubmit, setValue } = useForm<{
    name: string;
  }>({ defaultValues: { name: 'Instalacja' } });

  useEffect(() => {
    if (itemToEdit) {
      setValue('name', itemToEdit.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemToEdit]);

  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
    >
      <View>
        <FormInput
          label="Nazwa instalacji"
          name="name"
          control={control}
          isThin
        />
        <SubmitButton
          title="Zapisz"
          style={styles.continueButton}
          onPress={handleSubmit(onEdit)}
        />
      </View>
    </Overlay>
  );
}

function InstallationsCreateOverlay({
  visible,
  onBackdropPress,
  onAdd,
}: {
  visible: boolean;
  onBackdropPress: () => void;
  onAdd: ({ name }: { name: string }) => void;
}) {
  const { control, handleSubmit } = useForm<{
    name: string;
  }>({ defaultValues: { name: 'Instalacja' } });

  return (
    <Overlay
      isVisible={visible}
      onBackdropPress={onBackdropPress}
      overlayStyle={styles.overlay}
    >
      <View>
        <FormInput
          label="Nazwa instalacji"
          name="name"
          control={control}
          isThin
        />
        <SubmitButton
          title="Dodaj"
          style={styles.continueButton}
          onPress={handleSubmit(onAdd)}
        />
      </View>
    </Overlay>
  );
}

export default function ClientInstallationsList({
  route,
}: ClientInstallationsListScreenProps) {
  const { clientId } = route.params;
  const [installationsList, setInstallationsList] = useState<
    ClientsInstallationListItem[]
  >([]);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [installationToEdit, setInstallationToEdit] =
    useState<ClientsInstallationListItem | null>(null);
  const { goBack } = useNavigation<ClientListScreenProps['navigation']>();
  const isFocused = useIsFocused();

  const { result, execute } = useApi<ClientInstallationsListResponse>({
    path: 'installation_list',
  });

  const { execute: addInstallation } = useApi<ClientInstallationsListResponse>({
    path: 'installation_create',
  });

  const { execute: deleteInstallation, loading: isDeleteLoading } = useApi({
    path: 'installation_delete',
  });

  const onDeleteConfirmed = async () => {
    if (idToDelete) {
      try {
        await deleteInstallation({ data: { installation_id: idToDelete } });
        await fetchInstallationList();
        Alert.alert('Sukces', 'Instalacja została usunięta');
        toggleDeleteOverlay();
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się usunąć instalacji');
      }
    }
  };

  const onEditConfirmed = async ({ name }: { name: string }) => {
    // TODO nie ma endpointu na edycję nazwy instalacji
    // await editInstallation({ instalacja_id: installationToEdit.id, name });
    fetchInstallationList();
    toggleEditOverlay();
    setInstallationToEdit(null);
  };

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleDeleteOverlay();
  };

  const onEdit = (item: ClientsInstallationListItem) => {
    setInstallationToEdit(item);
    toggleEditOverlay();
  };

  const toggleAddOverlay = useCallback(() => {
    setAddVisible(!addVisible);
  }, [addVisible]);
  const toggleDeleteOverlay = useCallback(() => {
    setDeleteVisible(!deleteVisible);
  }, [deleteVisible]);
  const toggleEditOverlay = useCallback(() => {
    setEditVisible(!editVisible);
  }, [editVisible]);

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      if (!clientId || Number.isNaN(Number(clientId))) {
        Alert.alert('Błąd', 'Nieprawidłowy ID klienta');
        return;
      }

      const result = await addInstallation({
        data: { klient_id: Number(clientId), name },
      });
      await fetchInstallationList();
      Alert.alert('Sukces', 'Instalacja została dodana');
      toggleAddOverlay();
    } catch (error) {
      Alert.alert(
        'Błąd',
        'Nie udało się dodać instalacji. Sprawdź czy klient istnieje.',
      );
    }
  };

  const fetchInstallationList = useCallback(() => {
    if (isFocused && clientId) {
      return execute({ data: { klient_id: Number(clientId) } });
    }
  }, [clientId, execute, isFocused]);

  useEffect(() => {
    fetchInstallationList();
  }, [fetchInstallationList]);

  useEffect(() => {
    if (result) {
      setInstallationsList(result.installation_list || []);
    }
  }, [result]);

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <ButtonsHeader onBackPress={goBack} />
        {installationsList.length > 0 ? (
          <FlashList
            data={installationsList}
            renderItem={({ item }) => (
              <ClientInstallationsListRow
                item={item}
                clientId={clientId.toString()}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            )}
            estimatedItemSize={60}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.listContainer}>
            <EmptyInstallationsRow onAddPress={toggleAddOverlay} />
          </View>
        )}
        <InstallationsDeleteOverlay
          visible={deleteVisible}
          onBackdropPress={toggleDeleteOverlay}
          onDelete={onDeleteConfirmed}
        />
        <InstallationsEditOverlay
          visible={editVisible}
          onBackdropPress={toggleEditOverlay}
          onEdit={onEditConfirmed}
          itemToEdit={installationToEdit}
        />
        <InstallationsCreateOverlay
          visible={addVisible}
          onBackdropPress={toggleAddOverlay}
          onAdd={onSubmit}
        />
      </ScrollView>

      <FloatingActionButton
        onPress={toggleAddOverlay}
        backgroundColor={Colors.green}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  scrollView: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    height: '100%',
  },
  rowItem: {
    width: '100%',
    height: 50,
  },
  overlay: {
    padding: 12,
    width: '95%',
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  continueButton: {
    height: 34,
    borderRadius: 4,
    backgroundColor: Colors.teal,
    padding: 0,
  },
  buttonContainer: {
    borderRadius: 0,
    // IOS fix for clipping backgroundColor
    height: '95%',
  },
  buttonStyle: {
    minHeight: '100%',
    width: 80,
    borderRadius: 0,
  },
  buttonTitleStyle: {
    fontSize: 12,
  },
  buttonDeleteStyle: {
    backgroundColor: Colors.buttons.deleteBg,
  },
  clientInstallationsListRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientInstallationsListRowLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clientInstallationsListRowTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  listContainer: {
    paddingHorizontal: 2,
  },
});
