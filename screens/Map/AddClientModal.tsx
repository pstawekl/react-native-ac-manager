import { Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dimensions, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton } from '../../components/Button';
import CloseIcon from '../../components/icons/CloseIcon';
import PlusIcon from '../../components/icons/PlusIcon';
import Colors from '../../consts/Colors';
import {
  getClientDisplayPrimary,
  getClientDisplaySecondary,
} from '../../helpers/clientDisplay';
import { Client } from '../../providers/ClientsProvider';

function AddClientModal({
  clients,
  visible,
  onClose,
  onClientPress,
}: {
  clients: Client[];
  visible: boolean;
  onClose: () => void;
  onClientPress: (clientId: number) => void;
}) {
  useEffect(() => {
    if (visible) {
      console.log('[Map/AddClientModal] opened', {
        clientsCount: clients?.length ?? 0,
        clientIds: clients?.map(c => c.id) ?? [],
      });
    }
  }, [visible, clients]);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      cost: '',
    },
  });

  const windowHeight = Dimensions.get('window').height;
  const TAB_BAR_HEIGHT = 75;
  const modalHeight = windowHeight - TAB_BAR_HEIGHT;

  const addClientStyles = StyleSheet.create({
    modalOverlay: {
      justifyContent: 'flex-start' as const,
    },
    modalContent: {
      top: 0,
      height: modalHeight,
    },
    clientList: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '90%',
      width: '100%',
    },
    clientListItem: {
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      minHeight: 60,
      width: '100%',
    },
    clientListItemTextWrap: {
      flex: 1,
      marginRight: 8,
    },
    clientListItemPrimary: {
      fontSize: 16,
      fontWeight: '500',
      color: Colors.black,
    },
    clientListItemSecondary: {
      fontSize: 12,
      color: Colors.companyText,
      marginTop: 2,
    },
    headerButtonsStyles: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, addClientStyles.modalOverlay]}>
        <View style={[styles.modalContent, addClientStyles.modalContent]}>
          <View style={addClientStyles.headerButtonsStyles}>
            <Text style={styles.modalTitle}>Dodaj klienta</Text>
            <IconButton
              icon={<CloseIcon color={Colors.black} />}
              onPress={onClose}
              withoutBackground
            />
          </View>
          <ScrollView contentContainerStyle={addClientStyles.clientList}>
            <FlashList<Client>
              data={clients || []}
              renderItem={({ item }) => {
                const primary = getClientDisplayPrimary(item);
                const secondary = getClientDisplaySecondary(item);
                return (
                  <View style={addClientStyles.clientListItem}>
                    <View style={addClientStyles.clientListItemTextWrap}>
                      <Text style={addClientStyles.clientListItemPrimary}>
                        {primary}
                      </Text>
                      {secondary ? (
                        <Text style={addClientStyles.clientListItemSecondary}>
                          {secondary}
                        </Text>
                      ) : null}
                    </View>
                    <IconButton
                      icon={<PlusIcon color={Colors.black} />}
                      onPress={() => {
                        console.log(
                          '[Map/AddClientModal] user selected client',
                          { clientId: item.id, name: primary },
                        );
                        onClientPress(item.id);
                      }}
                      withoutBackground
                    />
                  </View>
                );
              }}
              estimatedItemSize={70}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 20,
  },
});

export default AddClientModal;
