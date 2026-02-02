import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import Colors from '../consts/Colors';
import { Task } from '../providers/TasksProvider';

interface Team {
  id: number;
  nazwa: string;
}

interface ScheduleTableProps {
  tasks: Task[];
  teams: Team[];
  startDate: Date;
  endDate: Date;
  onTaskPress?: (task: Task) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8:00 to 23:00

const TEAM_COLORS = [
  '#FFB3D9', // Light pink for Team 1
  '#B3F5D1', // Light green for Team 2
  '#FFD4B3', // Light orange for Team 3
  '#B5D3F7', // Light blue for Team 4
  '#FFE4B5', // Light yellow for Team 5
  '#DDA0DD', // Light purple for Team 6
];

function ScheduleTable({
  tasks,
  teams,
  startDate,
  endDate,
  onTaskPress,
}: ScheduleTableProps): JSX.Element {
  // Get all unique team IDs from tasks
  const teamIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(task => {
      if (task.grupa) {
        ids.add(task.grupa.toString());
      } else {
        ids.add('unassigned');
      }
    });
    // Also add teams that might not have tasks
    teams.forEach(team => ids.add(team.id.toString()));

    return Array.from(ids).sort((a, b) => {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
      return parseInt(a) - parseInt(b);
    });
  }, [tasks, teams]);

  // Create color map for teams
  const teamColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    teamIds.forEach((id, index) => {
      map[id] = TEAM_COLORS[index % TEAM_COLORS.length];
    });
    return map;
  }, [teamIds]);

  // Group tasks by hour and team
  const tasksByHourAndTeam = useMemo(() => {
    const grouped: Record<number, Record<string, Task[]>> = {};

    // Filter tasks within date range
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.start_date);
      return taskDate >= startDate && taskDate <= endDate;
    });

    filteredTasks.forEach(task => {
      const taskDate = new Date(task.start_date);
      const hour = taskDate.getHours();
      const teamId = task.grupa?.toString() || 'unassigned';

      if (!grouped[hour]) {
        grouped[hour] = {};
      }
      if (!grouped[hour][teamId]) {
        grouped[hour][teamId] = [];
      }
      grouped[hour][teamId].push(task);
    });

    return grouped;
  }, [tasks, startDate, endDate]);

  const getTeamName = (teamId: string): string => {
    if (teamId === 'unassigned') return 'Nieprzydzielone';
    const team = teams.find(t => t.id.toString() === teamId);
    return team ? team.nazwa : `Ekipa ${teamId}`;
  };

  const renderTaskCard = (task: Task, teamColor: string) => {
    return (
      <TouchableOpacity
        key={task.id}
        style={[styles.taskCard, { backgroundColor: teamColor }]}
        onPress={() => onTaskPress?.(task)}
      >
        <Text style={styles.taskType} numberOfLines={1}>
          {task.typ}
        </Text>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.nazwa}
        </Text>
      </TouchableOpacity>
    );
  };

  if (teamIds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Brak zadań do wyświetlenia</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* Header row with team names */}
          <View style={styles.headerRow}>
            <View style={styles.timeColumnHeader} />
            {teamIds.map(teamId => (
              <View key={teamId} style={styles.teamColumnHeader}>
                <Text style={[styles.teamHeaderText, { color: teamColorMap[teamId] }]}>
                  {getTeamName(teamId)}
                </Text>
              </View>
            ))}
          </View>

          {/* Scrollable content */}
          <ScrollView style={styles.bodyScrollView} showsVerticalScrollIndicator={false}>
            {HOURS.map(hour => {
              const hourString = `${hour.toString().padStart(2, '0')}:00`;
              const hourTasks = tasksByHourAndTeam[hour] || {};

              return (
                <View key={hour} style={styles.hourRow}>
                  {/* Time cell */}
                  <View style={styles.timeCell}>
                    <Text style={styles.timeText}>{hourString}</Text>
                  </View>

                  {/* Team task cells */}
                  {teamIds.map(teamId => {
                    const teamTasks = hourTasks[teamId] || [];
                    const teamColor = teamColorMap[teamId];
                    const visibleTasks = teamTasks.slice(0, 2);
                    const hiddenCount = Math.max(0, teamTasks.length - 2);

                    return (
                      <View
                        key={teamId}
                        style={[styles.teamTaskCell, { backgroundColor: '#f8f8f8' }]}
                      >
                        {visibleTasks.map(task => renderTaskCard(task, teamColor))}
                        {hiddenCount > 0 && (
                          <TouchableOpacity
                            style={[styles.moreTasksCard, { backgroundColor: teamColor }]}
                            onPress={() => {
                              Alert.alert(
                                'Zadania',
                                `${teamTasks.length} zadań dla ${getTeamName(teamId)} o godzinie ${hourString}`
                              );
                            }}
                          >
                            <Text style={styles.moreTasksText}>
                              +{hiddenCount} Zadania
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  tableContainer: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#d0d0d0',
    backgroundColor: Colors.white,
  },
  timeColumnHeader: {
    width: 70,
    height: 50,
  },
  teamColumnHeader: {
    width: 150,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  teamHeaderText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  bodyScrollView: {
    flex: 1,
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeCell: {
    width: 70,
    paddingTop: 8,
    paddingLeft: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  teamTaskCell: {
    width: 150,
    padding: 8,
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  taskCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  taskType: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    marginBottom: 3,
  },
  taskTitle: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  moreTasksCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  moreTasksText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
  },
});

export default ScheduleTable;
