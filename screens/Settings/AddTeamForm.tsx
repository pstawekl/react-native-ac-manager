/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Text } from '@rneui/themed';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ButtonGroup } from '../../components/Button';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import Container from '../../components/Container';
import DraggableGroupIcon from '../../components/icons/DraggableGroupIcon';
import UserIcon from '../../components/icons/UserIcon';
import { FormColorPicker, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useStaff, { Employee } from '../../providers/StaffProvider';
import DefaultSaveResponse from '../../types/DefaultSaveResponse';

type TeamData = {
  nazwa: string;
  color: string;
};

type DraggableData = {
  id: string;
  name: string;
  color: string;
};

type DraggableGroups = {
  chef: DraggableData[];
  pickedEmployees: DraggableData[];
  avaibleEmployees: DraggableData[];
};

type DraggingItem = {
  item: DraggableData;
  fromList: 'chef' | 'pickedEmployees' | 'avaibleEmployees';
};

function AddTeamForm({ navigation, route }: any) {
  const [dragData, setDragData] = useState<DraggableGroups>({
    chef: [],
    pickedEmployees: [],
    avaibleEmployees: [],
  });
  const [draggingItem, setDraggingItem] = useState<DraggingItem | null>(null);
  const { team = null } = route.params ?? {};
  const { getTeams, employees, getEmployees } = useStaff();
  const [listedEmployees, setListedEmployees] = useState<Employee[] | null>(
    null,
  );
  const { execute: createTeam, loading } = useApi<DefaultSaveResponse>({
    path: 'add_group',
  });
  const { execute: editTeam } = useApi({
    path: 'group_edit',
  });
  const [visible, setVisible] = useState(false);

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  useEffect(() => {
    if (getEmployees) {
      getEmployees();
    }
  }, [getEmployees]);

  useEffect(() => {
    if (employees) {
      if (!team || !team.nazwa) {
        setDragData({
          chef: [],
          pickedEmployees: [],
          avaibleEmployees:
            employees?.ungrouped?.map(item => ({
              id: item?.id?.toString() ?? '',
              name: `${item?.first_name ?? ''} ${item?.last_name ?? ''}`,
              color: '',
            })) ?? [],
        });
      } else {
        setDragData({
          chef:
            employees?.[team.nazwa]
              ?.filter(item => team?.user_ids?.includes(item?.id))
              ?.map(item => ({
                id: item?.id?.toString() ?? '',
                name: `${item?.first_name ?? ''} ${item?.last_name ?? ''}`,
                color: '',
              })) ?? [],
          pickedEmployees:
            employees?.[team.nazwa]
              ?.filter(item => team?.user_ids?.includes(item?.id))
              ?.map(item => ({
                id: item?.id?.toString() ?? '',
                name: `${item?.first_name ?? ''} ${item?.last_name ?? ''}`,
                color: '',
              })) ?? [],
          avaibleEmployees:
            employees?.ungrouped?.map(item => ({
              id: item?.id?.toString() ?? '',
              name: `${item?.first_name ?? ''} ${item?.last_name ?? ''}`,
              color: '',
            })) ?? [],
        });
      }
    }
  }, [employees, team]);

  useEffect(() => {
    if (employees && team?.user_ids?.length > 0 && team.nazwa) {
      setListedEmployees(
        employees[team.nazwa].filter(item => team.user_ids.includes(item.id)),
      );
    }
  }, [employees, team]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamData>({
    defaultValues: {
      nazwa: team?.nazwa ?? '',
      color: team?.color ?? '',
    },
  });

  const moveItemBetweenLists = (
    draggedItem: DraggableData,
    fromList: 'chef' | 'pickedEmployees' | 'avaibleEmployees',
    toList: 'chef' | 'pickedEmployees' | 'avaibleEmployees',
  ) => {
    setDragData(prevData => {
      const newFromList = prevData[fromList].filter(
        (i: DraggableData) => i.id !== draggedItem.id,
      );
      const newToList = [...prevData[toList], draggedItem];

      return {
        ...prevData,
        [fromList]: newFromList,
        [toList]: newToList,
      };
    });
    setDraggingItem(null);
  };

  const screenWidth = Dimensions.get('window').width;
  const itemWidth = screenWidth * 0.8;

  const renderLists = () => {
    const allData = [
      ...dragData.chef.map(item => ({ ...item, list: 'chef' })),
      ...dragData.pickedEmployees.map(item => ({
        ...item,
        list: 'pickedEmployees',
      })),
      ...dragData.avaibleEmployees.map(item => ({
        ...item,
        list: 'avaibleEmployees',
      })),
    ];

    return (
      <>
        <Text style={styles.groupTitle}>Szef ekipy</Text>

        <DraggableFlatList
          data={allData}
          contentContainerStyle={styles.draggableFlatList}
          onDragEnd={({ from, to, data }) => {
            const movedItem = data[to];
            const targetList = movedItem.list;
            const sourceList = data[from].list;

            if (targetList !== sourceList) {
              const item = {
                id: movedItem.id,
                name: movedItem.name,
                color: movedItem.color,
                list: targetList,
              };

              moveItemBetweenLists(
                item,
                sourceList as 'chef' | 'pickedEmployees' | 'avaibleEmployees',
                targetList as 'chef' | 'pickedEmployees' | 'avaibleEmployees',
              );
            }
          }}
          keyExtractor={item => item.id}
          renderItem={({ item, drag, isActive }) => {
            if (item.list !== 'chef') return null;

            return (
              <Pressable
                style={[
                  styles.item,
                  isActive && styles.activeItem,
                  { width: itemWidth },
                ]}
                onLongPress={drag}
              >
                <View style={styles.employeeTitle}>
                  <View style={styles.employeeIcon}>
                    <UserIcon
                      color={Colors.white}
                      size={24}
                      viewBox="0 0 90 90"
                    />
                  </View>
                  <Text>{item.name}</Text>
                </View>
                <DraggableGroupIcon />
              </Pressable>
            );
          }}
        />

        <Text style={styles.groupTitle}>Pracownicy</Text>
        <DraggableFlatList
          data={allData}
          contentContainerStyle={styles.draggableFlatList}
          onDragEnd={({ from, to, data }) => {
            const movedItem = data[to];
            const targetList = movedItem.list;
            const sourceList = data[from].list;

            if (targetList !== sourceList) {
              const item = {
                id: movedItem.id,
                name: movedItem.name,
                color: movedItem.color,
                list: targetList,
              };

              moveItemBetweenLists(
                item,
                sourceList as 'chef' | 'pickedEmployees' | 'avaibleEmployees',
                targetList as 'chef' | 'pickedEmployees' | 'avaibleEmployees',
              );
            }
          }}
          keyExtractor={item => item.id}
          renderItem={({ item, drag, isActive }) => {
            if (item.list !== 'pickedEmployees') return null;

            return (
              <Pressable
                style={[
                  styles.item,
                  isActive && styles.activeItem,
                  { width: itemWidth },
                ]}
                onLongPress={drag}
              >
                <View style={styles.employeeTitle}>
                  <View style={styles.employeeIcon}>
                    <UserIcon
                      color={Colors.white}
                      size={24}
                      viewBox="0 0 90 90"
                    />
                  </View>
                  <Text>{item.name}</Text>
                </View>
                <DraggableGroupIcon />
              </Pressable>
            );
          }}
        />

        <Text style={styles.groupTitle}>Dostępni pracownicy</Text>
        <DraggableFlatList
          data={allData}
          contentContainerStyle={styles.draggableFlatList}
          onDragEnd={({ from, to, data }) => {
            const movedItem = data[to];
            const targetList = movedItem.list;
            const sourceList = data[from].list;

            if (targetList !== sourceList) {
              const item = {
                id: movedItem.id,
                name: movedItem.name,
                color: movedItem.color,
                list: targetList,
              };

              moveItemBetweenLists(
                item,
                sourceList as 'chef' | 'pickedEmployees' | 'avaibleEmployees',
                targetList as 'chef' | 'pickedEmployees' | 'avaibleEmployees',
              );
            }
          }}
          keyExtractor={item => item.id}
          renderItem={({ item, drag, isActive }) => {
            if (item.list !== 'avaibleEmployees') return null;

            return (
              <Pressable
                style={[
                  styles.item,
                  isActive && styles.activeItem,
                  { width: itemWidth },
                ]}
                onLongPress={drag}
              >
                <View style={styles.employeeTitle}>
                  <View style={styles.employeeIcon}>
                    <UserIcon
                      color={Colors.white}
                      size={24}
                      viewBox="0 0 90 90"
                    />
                  </View>
                  <Text>{item.name}</Text>
                </View>
                <DraggableGroupIcon />
              </Pressable>
            );
          }}
        />
      </>
    );
  };

  const onSubmit = async (data: TeamData) => {
    if (!team) {
      const response = await createTeam(data);

      if (response?.status === 'Group added') {
        Alert.alert('Ekipa dodana.');
        if (getTeams) {
          getTeams();
        }
      }
    } else {
      const newEmployees: number[] = [];

      if (listedEmployees) {
        listedEmployees.forEach(item => newEmployees.push(item.id));
      }
      const response = await editTeam({
        group_id: team.id,
        nazwa: data.nazwa ?? '',
        user_ids: newEmployees,
      });
      Alert.alert('Zmiany zapisane');
      if (getTeams) {
        getTeams();
      }
      navigation.goBack();
    }
  };

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Container style={styles.groupContainer}>
            <Text style={styles.groupTitle}>Informacje podstawowe</Text>
            <FormColorPicker
              label="Wybierz kolor ekipy"
              name="color"
              control={control}
            />
            <FormInput
              label="Nazwa ekipy"
              name="nazwa"
              control={control}
              error={errors?.nazwa}
              rules={{ required: 'Pole wymagane' }}
              noPadding
            />
          </Container>

          {renderLists()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ButtonGroup
          loading={loading}
          submitTitle="Zapisz"
          cancelTitle="Anuluj"
          onSubmitPress={toggleOverlay}
          onCancel={navigation.goBack}
          stretch={false}
          groupStyle={styles.buttonGroup}
          cancelStyle={styles.cancelButton}
          cancelTitleStyle={styles.cancelButtonTitle}
          submitStyle={styles.submitButton}
          submitTitleStyle={styles.submitButtonTitle}
        />
      </View>

      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={handleSubmit(onSubmit)}
        title="Czy na pewno chcesz zapisać zmiany ?"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 20,
  },
  groupTitle: {
    color: Colors.grayTitle,
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    paddingBottom: 10,
    borderBottomColor: Colors.separator,
    borderBottomWidth: 2,
    marginBottom: 20,
  },
  linearGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 30,
    paddingBottom: 150,
    backgroundColor: Colors.white,
  },
  employeeTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  employeeIcon: {
    borderRadius: 50,
    height: 30,
    width: 30,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.employeeIconBackground,
  },
  buttonGroup: {
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
    gap: 20,
    paddingVertical: 30,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -7 },
    shadowOpacity: 0.2,
    shadowRadius: 90,
    elevation: 5,
    overflow: 'visible',
    zIndex: 1000,
    width: '100%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    minHeight: 130,
    zIndex: 1000,
  },
  item: {
    marginVertical: 5,
    backgroundColor: Colors.draggableBackground,
    height: 50,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  activeItem: {
    backgroundColor: Colors.gray, // Podświetlenie aktywnego przeciąganego elementu
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 6,
  },
  draggableFlatList: {
    width: '100%',
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    paddingTop: 0,
    minHeight: 50,
  },
  cancelButton: {
    flex: 1,
    width: 140,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.black,
    height: 48,
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    overflow: 'visible',
  },
  submitButton: {
    backgroundColor: Colors.green,
    flex: 1,
    width: 190,
    height: 48,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 50,
    paddingRight: 50,
    borderRadius: 15,
  },
  submitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    overflow: 'visible',
  },
});

export default AddTeamForm;
