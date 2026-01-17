import { useNavigation } from '@react-navigation/native';
import { Button, ListItem, Text } from '@rneui/themed';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import ButtonsHeader from '../../components/ButtonsHeader';
import FloatingActionButton from '../../components/FloatingActionButton';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import UserIcon from '../../components/icons/UserIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { SettingsAddEmployeeScreenProps } from '../../navigation/types';
import useStaff from '../../providers/StaffProvider';

type EmployeeProps = {
  id: number;
  name: string;
  color: string;
  team: string;
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

function Employee({
  id,
  name,
  color,
  team,
  onDelete,
  onPress,
}: EmployeeProps & { onDelete: (id: number) => void; onPress: () => void }) {
  return (
    <ListItem.Swipeable
      containerStyle={styles.employeeContainer}
      rightContent={<RowRightContent onDelete={() => onDelete(id)} />}
      rightWidth={80}
      onPress={onPress}
    >
      <View style={styles.employee}>
        <UserIcon color={Colors.white} />
      </View>
      <View>
        <Text style={styles.employeeName}>{name}</Text>
        <Text style={[styles.employeeTeam, { color }]}>
          {team !== 'ungrouped' && ''}
          {team === 'ungrouped' ? 'Nieprzypisany' : team} (Pracownik)
        </Text>
      </View>
    </ListItem.Swipeable>
  );
}

function SettingsEmployees() {
  const navigation =
    useNavigation<SettingsAddEmployeeScreenProps['navigation']>();
  const { employees, getEmployees } = useStaff();
  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const flattenedEmployees = useMemo(() => {
    if (!employees) return [];
    return Object.keys(employees).flatMap(group =>
      employees[group].map(employee => ({
        ...employee,
        group,
      })),
    );
  }, [employees]);

  const { execute: removeEmployee } = useApi({
    path: 'remove_user',
  });

  const onDeleteConfirmed = async () => {
    if (idToDelete && getEmployees) {
      await removeEmployee({ id_user: idToDelete });
      toggleOverlay();
      getEmployees();
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
    if (getEmployees) {
      getEmployees();
    }
  }, [getEmployees]);

  return (
    <View style={styles.container}>
      <ButtonsHeader
        style={styles.buttonsHeader}
      />
      {employees ? (
        <FlatList
          data={flattenedEmployees}
          renderItem={({ item }) => (
            <Employee
              key={item.id}
              id={item.id}
              name={`${item.first_name} ${item.last_name}`}
              team={item.group}
              color="#FFA2A2"
              onDelete={onDelete}
              onPress={() =>
                navigation.navigate('AddEmployee', { employee: item })
              }
            />
          )}
          keyExtractor={item => item.id.toString()}
        />
      ) : (
        <Text style={styles.noData}>Brak pracowników.</Text>
      )}
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć pracownika ?"
      />

      <FloatingActionButton
        onPress={() =>
          navigation.navigate('AddEmployee', { employee: null })
        }
        backgroundColor={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  employeeContainer: {
    paddingBottom: 6,
    paddingTop: 0,
  },
  employee: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 41,
    height: 41,
    borderRadius: 41,
    backgroundColor: Colors.avatarContainer,
  },
  employeeName: {
    fontSize: 14,
    color: Colors.text,
  },
  employeeTeam: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  noData: {
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
  buttonsHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 20,
  },
});

export default SettingsEmployees;
