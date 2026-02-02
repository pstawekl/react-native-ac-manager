/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';

import FloatingActionButton from '../../components/FloatingActionButton';
import DraggableGroupIcon from '../../components/icons/DraggableGroupIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import { FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';

type SurchargeItemType = {
  name: string;
  cost: string | null;
  itemId: number | null;
  order: number;
};

type FormData = {
  surcharges: SurchargeItemType[];
};

type EditModalProps = {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: (data: { name: string; cost: string }) => Promise<void>;
  initialData: { name: string; cost: string | null };
};

const EditSurchargeModal = memo(function EditSurchargeModal({
  visible,
  onClose,
  onDelete,
  onSave,
  initialData,
}: EditModalProps) {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: initialData.name,
      cost: initialData.cost || '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    reset({
      name: initialData.name,
      cost: initialData.cost || '',
    });
  }, [initialData, reset]);

  const handleSave = useCallback(
    async (data: { name: string; cost: string }) => {
      await onSave(data);
      onClose();
    },
    [onSave, onClose],
  );

  const onSubmit = handleSubmit(handleSave);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edytuj narzut</Text>

          <FormInput
            name="name"
            control={control}
            label="Nazwa narzutu"
            textColor="#737373"
            color={Colors.grayBorder}
          />

          <FormInput
            name="cost"
            control={control}
            label="Cena netto"
            textColor="#737373"
            color={Colors.grayBorder}
            keyboardType="numeric"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Text style={styles.buttonText}>Usuń</Text>
            </TouchableOpacity>

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={onSubmit}
              >
                <Text style={styles.buttonText}>Zapisz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const AddSurchargeModal = memo(function AddSurchargeModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; cost: string }) => void;
}) {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      cost: '',
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      reset({ name: '', cost: '' });
    }
  }, [visible, reset]);

  const handleSave = useCallback(
    (data: { name: string; cost: string }) => {
      onSave(data);
      onClose();
    },
    [onSave, onClose],
  );

  const onSubmit = handleSubmit(handleSave);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Dodaj narzut</Text>

          <FormInput
            name="name"
            control={control}
            label="Nazwa narzutu"
            textColor="#737373"
            color={Colors.grayBorder}
          />

          <FormInput
            name="cost"
            control={control}
            label="Cena netto"
            textColor="#737373"
            color={Colors.grayBorder}
            keyboardType="numeric"
          />

          <View style={styles.modalButtonGroup}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Anuluj</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={onSubmit}
            >
              <Text style={styles.buttonText}>Zapisz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

type SurchargeItemProps = {
  name: string;
  cost: string | null;
  onEditPress: () => void;
  index: number;
  removeItem: (index: number) => void;
};

const SurchargeItem = memo(function SurchargeItem({
  name,
  cost,
  onEditPress,
  index,
  drag,
  isActive,
  removeItem,
}: SurchargeItemProps & {
  drag: () => void;
  isActive: boolean;
}): any {
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = useCallback(() => {
    return (
      <TouchableOpacity style={styles.swipeEdit} onPress={onEditPress}>
        <Text style={styles.swipeEditText}>Edytuj</Text>
      </TouchableOpacity>
    );
  }, [onEditPress]);

  const renderRightActions = useCallback(() => {
    return (
      <View style={styles.swipeDelete}>
        <TrashIcon color={Colors.white} />
      </View>
    );
  }, []);

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableOpen={direction => {
        if (direction === 'left') {
          onEditPress();
        } else if (index !== -1) {
          removeItem(index);
        }

        swipeableRef.current?.close();
      }}
    >
      <Pressable
        style={[styles.itemContent, isActive && styles.activeItem]}
        onLongPress={drag}
      >
        <Text style={styles.itemText}>{name}</Text>
        <Text style={styles.itemText}>{cost}</Text>
        <DraggableGroupIcon />
      </Pressable>
    </Swipeable>
  );
});

function SettingsSurcharge() {
  const navigation = useNavigation();

  const { control, setValue } = useForm<FormData>();
  const { fields, append, remove, move } = useFieldArray<FormData>({
    control,
    name: 'surcharges',
  });
  const { execute: addSurcharge } = useApi({
    path: 'narzut_add',
  });
  const { execute: editSurcharge } = useApi({
    path: 'narzut_edit',
  });
  const { execute: deleteSurcharge } = useApi({
    path: 'narzut_delete',
  });
  const { result: surchargesList, execute: fetchSurcharges } = useApi<
    { id: number; name: string; owner: number; value: number; order: number }[]
  >({
    path: 'narzut_list',
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    index: number;
    data: SurchargeItemType;
  } | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Track if surcharges have been loaded to prevent duplicates
  const surchargesLoadedRef = useRef(false);
  const loadedSurchargeIdsRef = useRef<Set<number>>(new Set());

  // Fetch surcharges only once on mount
  useEffect(() => {
    if (fetchSurcharges && !surchargesLoadedRef.current) {
      surchargesLoadedRef.current = true;
      fetchSurcharges();
    }
  }, [fetchSurcharges]);

  // Load surcharges into form only once, preventing duplicates
  useEffect(() => {
    if (surchargesList && surchargesList.length > 0) {
      // Sort surcharges by order
      const sortedSurcharges = [...surchargesList].sort(
        (a, b) => a.order - b.order,
      );

      // Check if we've already loaded these surcharges
      const newSurcharges = sortedSurcharges.filter(
        surcharge => !loadedSurchargeIdsRef.current.has(surcharge.id),
      );

      if (newSurcharges.length > 0) {
        // Add only new surcharges that haven't been loaded
        const itemsToAdd: SurchargeItemType[] = [];
        newSurcharges.forEach(item => {
          if (!loadedSurchargeIdsRef.current.has(item.id)) {
            itemsToAdd.push({
              name: item.name,
              cost: String(item.value),
              itemId: item.id,
              order: item.order,
            });
            loadedSurchargeIdsRef.current.add(item.id);
          }
        });

        // Add all items at once
        itemsToAdd.forEach(item => {
          append(item);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surchargesList]);

  const handleEditPress = useCallback(
    (index: number) => {
      setEditingItem({ index, data: fields[index] });
      setEditModalVisible(true);
    },
    [fields],
  );

  const handleEditSave = useCallback(
    async (data: { name: string; cost: string }) => {
      if (editingItem) {
        try {
          const response = await editSurcharge({
            data: {
              narzut_id: editingItem.data.itemId,
              name: data.name,
              value: data.cost,
              order: editingItem.data.order,
            },
          });

          if (response) {
            const updatedFields = [...fields];
            updatedFields[editingItem.index] = {
              ...updatedFields[editingItem.index],
              name: data.name,
              cost: data.cost,
            };
            setValue('surcharges', updatedFields);
          } else {
            Alert.alert('Błąd', 'Nie udało się zaktualizować narzutu.');
          }
        } catch (error) {
          Alert.alert('Błąd', 'Wystąpił błąd podczas aktualizacji narzutu.');
        }
      }
    },
    [editingItem, fields, setValue, editSurcharge],
  );

  const handleAddSurcharge = useCallback(
    async (data: { name: string; cost: string }) => {
      try {
        const response = await addSurcharge({
          data: {
            name: data.name,
            value: data.cost,
            order: fields.length + 1,
          },
        });

        if (
          response &&
          typeof response === 'object' &&
          'id' in response &&
          response.id
        ) {
          append({
            name: data.name,
            cost: data.cost,
            itemId: response.id,
            order: fields.length + 1,
          });
          loadedSurchargeIdsRef.current.add(response.id);
        } else {
          Alert.alert('Błąd', 'Nie udało się dodać narzutu.');
        }
      } catch (error) {
        console.error('Add surcharge error:', error);
        Alert.alert('Błąd', 'Wystąpił błąd podczas dodawania narzutu.');
      }
    },
    [addSurcharge, fields.length, append],
  );

  const removeItem = useCallback(
    async (index: number) => {
      if (index !== -1 && index >= 0) {
        const field = fields[index];
        if (field?.itemId) {
          try {
            await deleteSurcharge({ data: { narzut_id: field.itemId } });
            loadedSurchargeIdsRef.current.delete(field.itemId);
            remove(index);
          } catch (error) {
            Alert.alert('Błąd', 'Nie udało się usunąć narzutu.');
          }
        }
      }
    },
    [fields, remove, deleteSurcharge],
  );

  return (
    <View style={styles.container}>
      <AddSurchargeModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleAddSurcharge}
      />

      <Text style={styles.title}>Podstawowe informacje</Text>

      <View style={styles.scrollContainer}>
        {fields.length ? (
          <DraggableFlatList
            data={fields}
            onDragEnd={({ from, to }) => {
              move(from, to);
            }}
            keyExtractor={(item, index) =>
              item.itemId?.toString() || `item-${index}`
            }
            renderItem={({ item, drag, isActive }) => {
              const index = fields.findIndex(field => field.id === item.id);
              return (
                <SurchargeItem
                  name={item.name}
                  cost={item.cost}
                  onEditPress={() => handleEditPress(index)}
                  removeItem={removeItem}
                  drag={drag}
                  isActive={isActive}
                  index={item.itemId ?? -1}
                />
              );
            }}
          />
        ) : (
          <Text style={styles.noDataText}>Brak narzutów.</Text>
        )}
      </View>

      {editingItem && (
        <EditSurchargeModal
          visible={editModalVisible}
          onClose={() => {
            setEditModalVisible(false);
            setEditingItem(null);
          }}
          onDelete={async () => {
            if (editingItem.data.itemId) {
              try {
                await deleteSurcharge({
                  data: { narzut_id: editingItem.data.itemId },
                });
                loadedSurchargeIdsRef.current.delete(editingItem.data.itemId);
                remove(editingItem.index);
                setEditModalVisible(false);
                setEditingItem(null);
              } catch (error) {
                Alert.alert('Błąd', 'Nie udało się usunąć narzutu.');
              }
            }
          }}
          onSave={handleEditSave}
          initialData={{
            name: editingItem.data.name,
            cost: editingItem.data.cost,
          }}
        />
      )}

      <FloatingActionButton
        onPress={() => setAddModalVisible(true)}
        backgroundColor={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deviceBackground,
  },
  scrollContainer: {
    paddingHorizontal: 6,
  },
  noDataText: {
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'left',
    paddingHorizontal: 16,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 6,
    marginVertical: 4,
    marginHorizontal: 8,
    height: 60,
  },
  activeItem: {
    backgroundColor: Colors.gray,
  },
  itemText: {
    fontSize: 16,
    color: Colors.black,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    marginTop: 20,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  deleteButton: {
    backgroundColor: Colors.red,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  swipeEdit: {
    backgroundColor: Colors.editYellow,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 60,
    borderRadius: 6,
    marginVertical: 4,
  },
  swipeEditText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  swipeDelete: {
    backgroundColor: Colors.logout,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 60,
    borderRadius: 6,
    marginVertical: 4,
  },
});

export default SettingsSurcharge;
