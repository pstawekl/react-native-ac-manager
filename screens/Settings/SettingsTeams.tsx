/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigation } from '@react-navigation/native';
import { ListItem, Text } from '@rneui/themed';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';
// eslint-disable-next-line import/no-extraneous-dependencies
import { DraxProvider, DraxScrollView, DraxView } from 'react-native-drax';
import FloatingActionButton from '../../components/FloatingActionButton';
import DraggableGroupIcon from '../../components/icons/DraggableGroupIcon';
import UserIcon from '../../components/icons/UserIcon';
import Colors from '../../consts/Colors';
import { SettingsAddTeamScreenProps } from '../../navigation/types';
import useStaff from '../../providers/StaffProvider';

type EmployeeItem = {
  key: string;
  label: string;
  employeeId: number;
  teamId: number;
  teamName: string;
  color: string;
};

const colors = ['#FFA2A2', '#71C1EE', '#E7A2FF', '#BEDC68'];

function SettingsTeams() {
  // Wszystkie hooki na górze!
  const navigation = useNavigation<SettingsAddTeamScreenProps['navigation']>();
  const { getTeams, teamsLoading, teams, employees, updateEmployeeTeam } =
    useStaff();
  const [groupedEmployees, setGroupedEmployees] = useState<
    Record<number, EmployeeItem[]>
  >({});
  const [draggedEmployee, setDraggedEmployee] = useState<EmployeeItem | null>(
    null,
  );
  const [isDuringDrag, setIsDuringDrag] = useState<boolean>(false);

  useEffect(() => {
    if (getTeams) {
      getTeams();
    }
  }, [getTeams]);

  useEffect(() => {
    if (teams && employees) {
      const grouped: Record<number, EmployeeItem[]> = {};
      teams.forEach((team, idx) => {
        const teamEmployees = employees[team.nazwa] || [];
        grouped[team.id] = teamEmployees.map(emp => ({
          key: emp.id.toString(),
          label: `${emp.first_name} ${emp.last_name}`,
          employeeId: emp.id,
          teamId: team.id,
          teamName: team.nazwa,
          color: colors[idx % colors.length],
        }));
      });
      setGroupedEmployees(grouped);
    }
  }, [teams, employees]);

  // Drag & drop po kluczu (bez przekazywania całego obiektu)
  const handleReceiveEmployeeByKey = (
    employeeKey: string | null,
    targetTeamId: number,
  ) => {
    if (!employeeKey) return;
    // Znajdź pracownika po kluczu
    setIsDuringDrag(true);
    let found: EmployeeItem | undefined;
    let fromTeamId: number | undefined;
    Object.entries(groupedEmployees).forEach(([teamId, emps]) => {
      const emp = emps.find(e => e.key === employeeKey);
      if (emp) {
        found = emp;
        fromTeamId = Number(teamId);
      }
    });
    if (!found || fromTeamId === undefined || fromTeamId === targetTeamId)
      return;
    setGroupedEmployees(prev => {
      const newGrouped = { ...prev };
      newGrouped[fromTeamId!] = newGrouped[fromTeamId!].filter(
        e => e.key !== employeeKey,
      );
      newGrouped[targetTeamId] = [
        ...(newGrouped[targetTeamId] || []),
        { ...found!, teamId: targetTeamId },
      ];
      return newGrouped;
    });
    if (updateEmployeeTeam) {
      updateEmployeeTeam(found.employeeId, targetTeamId);
    }
    setIsDuringDrag(false);
  };

  if (teamsLoading) {
    return <Spinner />;
  }

  // Render ekipy z listą pracowników (drag & drop)
  const renderTeam = (team: { id: number; nazwa: string }, idx: number) => {
    const color = colors[idx % colors.length];
    const teamEmployees = groupedEmployees[team.id] || [];
    return (
      <View key={team.id} style={styles.team}>
        <ListItem containerStyle={styles.listItemContainer}>
          <View style={[styles.listItem, { backgroundColor: color }]}>
            <UserIcon color={Colors.white} />
          </View>
          <View>
            <Text style={styles.name}>{team.nazwa}</Text>
          </View>
        </ListItem>
        <DraxScrollView horizontal={false} style={styles.draxScrollView}>
          {teamEmployees.map((emp, i) => (
            <DraxView
              key={emp.key}
              style={styles.draxDraggable}
              draggingStyle={styles.draxDragging}
              dragReleasedStyle={styles.draxDragReleased}
              payload={emp.key}
              longPressDelay={150}
              onDragStart={() => setDraggedEmployee(emp)}
              onDragEnd={() => setDraggedEmployee(null)}
              receptive
              onReceiveDragDrop={({ dragged: { payload } }: any) =>
                handleReceiveEmployeeByKey(payload, team.id)
              }
            >
              <Pressable style={styles.item}>
                <View style={styles.employee}>
                  <View style={styles.employeeIcon}>
                    <UserIcon
                      color={Colors.white}
                      size={24}
                      viewBox="0 0 90 90"
                    />
                  </View>
                  <Text>{emp.label}</Text>
                </View>
                <DraggableGroupIcon />
              </Pressable>
            </DraxView>
          ))}
          {/* Dropzone na końcu ekipy, by umożliwić przenoszenie do pustej ekipy */}
          <DraxView
            style={[
              styles.draxTeamDropZone,
              isDuringDrag && styles.draxTeamDropZoneActive,
              !isDuringDrag && styles.draxTeamDropZoneInactive,
            ]}
            receivingStyle={styles.draxReceiving}
            receptive
            onReceiveDragDrop={({ dragged: { payload } }: any) =>
              handleReceiveEmployeeByKey(payload, team.id)
            }
          >
            {teamEmployees.length === 0 && (
              <Text style={styles.draxDropZone}>Przeciągnij tutaj</Text>
            )}
          </DraxView>
        </DraxScrollView>
      </View>
    );
  };

  // ---
  return (
    <DraxProvider>
      <View style={styles.container}>
        {teams?.length ? (
          <ScrollView>
            {teams.map((team, idx) => renderTeam(team, idx))}
          </ScrollView>
        ) : (
          <Text style={styles.noData}>Brak ekip.</Text>
        )}
        <Spinner
          visible={teamsLoading}
          textContent="Trwa pobieranie danych..."
          textStyle={{ color: Colors.gray }}
        />

        <FloatingActionButton
          onPress={() =>
            navigation.navigate('AddTeam' as never, { team: null } as never)
          }
          backgroundColor={Colors.primary}
        />
      </View>
    </DraxProvider>
  );
}

const styles = StyleSheet.create({
  draxTeamDropZone: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 8,
    padding: 4,
  },
  draxTeamDropZoneInactive: {
    minHeight: 0,
  },
  draxTeamDropZoneActive: {
    minHeight: 60,
  },
  draxDropZone: {
    textAlign: 'center',
    color: Colors.gray,
  },
  draxScrollView: {
    width: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  draxDraggable: {
    marginVertical: 5,
  },
  draxDragging: {
    opacity: 0.7,
  },
  draxDragReleased: {
    opacity: 1,
  },
  draxReceiving: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  container: {
    flex: 1,
  },
  team: {
    marginBottom: 12,
  },
  listItemContainer: {
    paddingBottom: 8,
    paddingTop: 0,
  },
  listItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 41,
    height: 41,
    borderRadius: 41,
  },
  name: {
    fontSize: 14,
    color: Colors.text,
  },
  noData: {
    textAlign: 'center',
  },
  buttonsHeader: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 46,
    paddingTop: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  employee: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 6,
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
  item: {
    marginVertical: 5,
    backgroundColor: Colors.draggableBackground,
    borderRadius: 6,
    height: 50,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
  },
  // activeItem: {
  //   backgroundColor: Colors.gray, // Podświetlenie aktywnego przeciąganego elementu
  //   display: 'flex',
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   borderRadius: 6,
  // },
  // draggableFlatList: {
  //   width: '100%',
  //   marginHorizontal: 15,
  //   paddingHorizontal: 0,
  //   justifyContent: 'center',
  //   alignContent: 'center',
  //   alignItems: 'center',
  // },
});

export default SettingsTeams;
