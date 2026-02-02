/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { Button, Chip, Text } from '@rneui/themed';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity as RNTouchableOpacity,
} from 'react-native';
import {
  Calendar,
  CalendarProvider,
  PackedEvent,
  TimelineProps,
} from 'react-native-calendars';
import {
  PanGestureHandler,
  State,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { useForm, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import ButtonsHeader from '../../components/ButtonsHeader';
import FloatingActionButton from '../../components/FloatingActionButton';
import { Dropdown } from '../../components/Input';
import MultiSelectModal from '../../components/MultiSelectModal';
import Colors from '../../consts/Colors';
import useStaff from '../../providers/StaffProvider';
import useTasks, { Task } from '../../providers/TasksProvider';
import { RootState } from '../../store';
import {
  setCalendarMode,
  setDateFilter,
  setDateSort,
  setTaskGroup,
  setTaskStatus,
  setTaskType,
} from '../../store/calendarFiltersSlice';
import { Filter } from './TasksMenu';
import { BlurView } from 'expo-blur';

import { filtersStateToFilterArray } from './filterUtils';
import ExpandableCalendarModeSelector from '../../components/ExpandableCalendarModeSelector';
import ScheduleWithDatePicker from '../../components/ScheduleWithDatePicker';

// ===== TYPY I STAŁE =====

type FilterOption = {
  label: string;
  value: string;
};

type FilterTypes =
  | 'dateSort'
  | 'dateFilter'
  | 'taskType'
  | 'taskStatus'
  | 'taskGroup';

type Filters = {
  dateFilter: string;
  dateSort: string;
  taskType: (string | number)[];
  taskStatus: string;
  taskGroup: (string | number)[];
};

type CalendarTabProps = {
  appliedFilters: Filter[];
  setAppliedFilters: (filters: Filter[]) => void;
  showHeader?: boolean;
};

const MENU_HEIGHT = 100;
const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 23;
const TIMELINE_HOURS_COUNT = TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1;
const MAX_VISIBLE_TASKS_PER_CELL = 2;

// Kolory dla ekip - zgodne ze screenem
const TEAM_COLORS = [
  '#FFB3D9', // Jasnoróżowy dla Ekipa 1
  '#B3F5D1', // Jasnozielony dla Ekipa 2
  '#FFD4B3', // Jasnopomarańczowy dla Ekipa 3
  '#B5D3F7',
  '#FFE4B5',
  '#DDA0DD',
];

const YearMonth = memo(({ year, month, onSelect }: any) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <View>
      <Text style={{ fontWeight: '600' }}>
        {formatPolishMonthNominative(new Date(year, month))}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: offset }).map((_, i) => (
          <View key={i} style={{ width: '14.28%', height: 18 }} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <TouchableOpacity
              key={day}
              style={{ width: '14.28%', alignItems: 'center' }}
              onPress={() =>
                onSelect(
                  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                )
              }
            >
              <Text style={{ fontSize: 11 }}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});


// Funkcja do ściemniania koloru dla lewej ramki
const darkenColor = (color: string, percent: number = 30): string => {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent / 100));
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent / 100));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// ===== KOMPONENTY POMOCNICZE =====

const EventItem = memo(function EventItem({
                                            event,
                                          }: {
  event: PackedEvent & { notatki?: string };
}) {
  const statusColor = useMemo(() => {
    switch (event.status) {
      case 'wykonane':
        return Colors.statusDone;
      case 'niewykonane':
        return Colors.statusNotDone;
      case 'Zaplanowane':
        return Colors.statusPlanned;
      default:
        return Colors.statusOther;
    }
  }, [event.status]);

  return (
    <TouchableOpacity>
      <View>
        <Text style={styles.eventTitle}>
          {event.type} - {event.title}
        </Text>
        {event.notatki && event.notatki.trim() !== '' && (
          <Text style={styles.eventNotes}>Notatki: {event.notatki}</Text>
        )}
      </View>
      <View style={styles.eventRight}>
        <Chip
          title={event.status}
          color={statusColor}
          buttonStyle={styles.eventStatusChip}
          titleStyle={styles.eventStatusTitle}
        />
      </View>
    </TouchableOpacity>
  );
});

// ===== FUNKCJE POMOCNICZE =====

const generateDayOptions = (year: number): FilterOption[] => {
  const options: FilterOption[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (
    let date = new Date(startDate);
    date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const label = format(date, 'dd.MM.yyyy');
    options.push({ label, value: dateStr });
  }

  return options;
};

const generateWeekOptions = (year: number): FilterOption[] => {
  const options: FilterOption[] = [];
  const startDate = new Date(year, 0, 1);
  const firstMonday = new Date(startDate);
  const dayOfWeek = firstMonday.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  firstMonday.setDate(startDate.getDate() + diff);

  for (
    let weekStart = new Date(firstMonday);
    weekStart.getFullYear() <= year;
  ) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    if (weekEnd.getFullYear() > year) {
      break;
    }

    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'dd.MM');
    const label = `${format(weekStart, 'dd.MM')} - ${weekEndStr}`;
    options.push({ label, value: weekStartStr });

    weekStart.setDate(weekStart.getDate() + 7);
  }

  return options;
};

const generateMonthOptions = (year: number): FilterOption[] => {
  const polishMonths = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
  ];

  return polishMonths.map((month, index) => {
    const monthNum = index + 1;
    const value = `${year}-${monthNum.toString().padStart(2, '0')}`;
    return { label: `${month} ${year}`, value };
  });
};

const formatPolishDate = (date: Date) => {
  const polishMonths = [
    'styczeń',
    'luty',
    'marzec',
    'kwiecień',
    'maj',
    'czerwiec',
    'lipiec',
    'sierpień',
    'wrzesień',
    'październik',
    'listopad',
    'grudzień',
  ];

  const month = polishMonths[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${year}`;
};

const formatWeekDay = (date: Date) => {
  const days = [
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota',
    'Niedziela',
  ];
  return days[date.getDay() === 0 ? 6 : date.getDay() - 1];
};

const formatWeekDayShort = (date: Date) => {
  const days = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];
  return days[date.getDay() === 0 ? 6 : date.getDay() - 1];
};

const formatPolishMonth = (date: Date) => {
  const polishMonths = [
    'Stycznia',
    'Lutego',
    'Marca',
    'Kwietnia',
    'Maja',
    'Czerwca',
    'Lipca',
    'Sierpnia',
    'Września',
    'Października',
    'Listopada',
    'Grudnia',
  ];
  return polishMonths[date.getMonth()];
};

const formatPolishMonthNominative = (date: Date) => {
  const polishMonths = [
    'Styczeń',
    'Luty',
    'Marzec',
    'Kwiecień',
    'Maj',
    'Czerwiec',
    'Lipiec',
    'Sierpień',
    'Wrzesień',
    'Październik',
    'Listopad',
    'Grudzień',
  ];
  return polishMonths[date.getMonth()];
};

const getWeekDays = (date: string) => {
  const current = new Date(date);
  const monday = new Date(current);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);
  }
  return weekDays;
};

const getWeekRange = (date: Date) => {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(date.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { start: monday, end: sunday };
};

// ===== KOMPONENT TIMELINE DLA DNIA =====

interface DayTimelineProps {
  currentDate: string;
  eventTasks: Record<string, any[]>;
  tasks: Task[] | null;
  teams: any[] | null;
  navigation: any;
}

const DayTimeline = memo(function DayTimeline({
                                                currentDate,
                                                eventTasks,
                                                tasks,
                                                teams,
                                                navigation,
                                              }: DayTimelineProps) {
  const { tasksByHourAndTeam, teamIds, teamColors } = useMemo(() => {
    const dayTasks = eventTasks?.[currentDate] || [];
    const tasksByHourAndTeam: Record<number, Record<string, any[]>> = {};
    const allTeamIds = new Set<string>();

    dayTasks.forEach((task: any) => {
      if (task.start) {
        const taskHour = new Date(task.start).getHours();
        const originalTask = tasks?.find(t => t.id === task.id);
        const teamId = originalTask?.grupa?.toString() || 'unassigned';

        allTeamIds.add(teamId);

        if (!tasksByHourAndTeam[taskHour]) {
          tasksByHourAndTeam[taskHour] = {};
        }
        if (!tasksByHourAndTeam[taskHour][teamId]) {
          tasksByHourAndTeam[taskHour][teamId] = [];
        }
        tasksByHourAndTeam[taskHour][teamId].push(task);
      }
    });

    const teamIds = Array.from(allTeamIds).sort((a, b) => {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
      return parseInt(a) - parseInt(b);
    });

    const teamColors: Record<string, string> = {};
    teamIds.forEach((id, index) => {
      teamColors[id] = TEAM_COLORS[index % TEAM_COLORS.length];
    });

    return { tasksByHourAndTeam, teamIds, teamColors };
  }, [currentDate, eventTasks, tasks]);

  const hours = useMemo(
    () => Array.from({ length: TIMELINE_HOURS_COUNT }, (_, i) => i + TIMELINE_START_HOUR),
    []
  );

  const getTeamName = useCallback(
    (teamId: string) => {
      const team = teams?.find(t => t.id.toString() === teamId);
      if (team) return team.nazwa;
      if (teamId === 'unassigned') return 'Nieprzydzielone';
      return `Ekipa ${teamId}`;
    },
    [teams]
  );

  const renderTask = useCallback(
    (task: any, teamColor: string, index: number) => {
      const originalTask = tasks?.find(t => t.id === task.id);

      return (
        <RNTouchableOpacity
          key={task.id || index}
          style={[styles.columnTaskCard, { backgroundColor: teamColor, borderLeftColor: darkenColor(teamColor) }]}
          onPress={() => {
            if (originalTask) {
              navigation.navigate('TaskDetails', { task: originalTask });
            } else {
              Alert.alert('Błąd', 'Nie znaleziono oryginalnego zadania');
            }
          }}
        >
          <Text style={styles.columnTaskType}>{task.type}</Text>
          <Text style={styles.columnTaskTitle} numberOfLines={1}>
            {task.title}
          </Text>
        </RNTouchableOpacity>
      );
    },
    [tasks, navigation]
  );

  const renderGroupedTask = useCallback(
    (teamId: string, hour: number, teamColor: string, hiddenCount: number, totalCount: number) => {
      const hourString = `${hour.toString().padStart(2, '0')}:00`;
      const teamName = getTeamName(teamId);

      return (
        <RNTouchableOpacity
          style={[
            styles.columnTaskCard,
            styles.groupedTaskCard,
            { backgroundColor: teamColor, borderLeftColor: darkenColor(teamColor) },
          ]}
          onPress={() => {
            Alert.alert(
              'Zadania',
              `${totalCount} zadań dla ${teamName} o godzinie ${hourString}`
            );
          }}
        >
          <Text style={styles.groupedTaskText}>+{hiddenCount} Zadania</Text>
        </RNTouchableOpacity>
      );
    },
    [getTeamName]
  );

  if (teamIds.length === 0) {
    return (
      <View style={styles.emptyTimelineContainer}>
        <Text style={styles.emptyTimelineText}>Brak zadań na ten dzień</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalScrollContent}
    >
      <View style={styles.columnTimelineContainer}>
        <View style={styles.timelineHeaderRow}>
          <View style={styles.timeColumnHeader} />
          {teamIds.map(teamId => (
            <View key={teamId} style={styles.ekipaColumnHeader}>
              <Text
                style={[
                  styles.ekipaHeaderText,
                  { color: teamColors[teamId] },
                ]}
              >
                {getTeamName(teamId)}
              </Text>
            </View>
          ))}
        </View>

        {hours.map(hour => {
          const hourString = `${hour.toString().padStart(2, '0')}:00`;

          return (
            <View key={hour} style={styles.columnTimelineRow}>
              <View style={styles.columnTimeCell}>
                <Text style={styles.columnTimeText}>{hourString}</Text>
              </View>

              {teamIds.map(teamId => {
                const teamTasks = tasksByHourAndTeam[hour]?.[teamId] || [];
                const taskColor = teamColors[teamId];
                const visibleTasks = teamTasks.slice(0, MAX_VISIBLE_TASKS_PER_CELL);
                const hiddenCount = Math.max(0, teamTasks.length - MAX_VISIBLE_TASKS_PER_CELL);

                return (
                  <View key={teamId} style={styles.ekipaTaskColumn}>
                    {visibleTasks.map((task, index) =>
                      renderTask(task, taskColor, index)
                    )}

                    {hiddenCount > 0 &&
                      renderGroupedTask(teamId, hour, taskColor, hiddenCount, teamTasks.length)}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
});

// ===== KOMPONENT SIMPLE TIMELINE (BEZ GODZIN) DLA TYGODNIA/MIESIĄCA =====

const SimpleTimeline = memo(function SimpleTimeline({
                                                      currentDate,
                                                      eventTasks,
                                                      tasks,
                                                      teams,
                                                      navigation,
                                                    }: DayTimelineProps) {
  const { tasksByTeam, teamIds, teamColors } = useMemo(() => {
    const dayTasks = eventTasks?.[currentDate] || [];
    const tasksByTeam: Record<string, any[]> = {};
    const allTeamIds = new Set<string>();

    dayTasks.forEach((task: any) => {
      const originalTask = tasks?.find(t => t.id === task.id);
      const teamId = originalTask?.grupa?.toString() || 'unassigned';

      allTeamIds.add(teamId);

      if (!tasksByTeam[teamId]) {
        tasksByTeam[teamId] = [];
      }
      tasksByTeam[teamId].push(task);
    });

    const teamIds = Array.from(allTeamIds).sort((a, b) => {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
      return parseInt(a) - parseInt(b);
    });

    const teamColors: Record<string, string> = {};
    teamIds.forEach((id, index) => {
      teamColors[id] = TEAM_COLORS[index % TEAM_COLORS.length];
    });

    return { tasksByTeam, teamIds, teamColors };
  }, [currentDate, eventTasks, tasks]);

  const getTeamName = useCallback(
    (teamId: string) => {
      const team = teams?.find(t => t.id.toString() === teamId);
      if (team) return team.nazwa;
      if (teamId === 'unassigned') return 'Nieprzydzielone';
      return `Ekipa ${teamId}`;
    },
    [teams]
  );

  const renderTask = useCallback(
    (task: any, teamColor: string, index: number) => {
      const originalTask = tasks?.find(t => t.id === task.id);

      return (
        <RNTouchableOpacity
          key={task.id || index}
          style={[styles.columnTaskCard, { backgroundColor: teamColor, borderLeftColor: darkenColor(teamColor) }]}
          onPress={() => {
            if (originalTask) {
              navigation.navigate('TaskDetails', { task: originalTask });
            } else {
              Alert.alert('Błąd', 'Nie znaleziono oryginalnego zadania');
            }
          }}
        >
          <Text style={styles.columnTaskType}>{task.type}</Text>
          <Text style={styles.columnTaskTitle} numberOfLines={1}>
            {task.title}
          </Text>
        </RNTouchableOpacity>
      );
    },
    [tasks, navigation]
  );

  if (teamIds.length === 0) {
    return (
      <View style={styles.emptyTimelineContainer}>
        <Text style={styles.emptyTimelineText}>Brak zadań na ten dzień</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalScrollContent}
    >
      <View style={styles.columnTimelineContainer}>
        <View style={styles.timelineHeaderRow}>
          {teamIds.map(teamId => (
            <View key={teamId} style={styles.ekipaColumnHeaderSimple}>
              <Text
                style={[
                  styles.ekipaHeaderText,
                  { color: teamColors[teamId] },
                ]}
              >
                {getTeamName(teamId)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.simpleTimelineRow}>
          {teamIds.map(teamId => {
            const teamTasks = tasksByTeam[teamId] || [];
            const taskColor = teamColors[teamId];

            return (
              <View key={teamId} style={styles.ekipaTaskColumnSimple}>
                {teamTasks.map((task, index) =>
                  renderTask(task, taskColor, index)
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
});

// ===== MODAL FILTRÓW =====

const calendarClientStyles = StyleSheet.create({
  modalContent: {
    height: '80%',
  },
  clientList: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
  },
  headerButtonsStyles: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

const CalendarFiltersModal = memo(function CalendarFiltersModal({
                                                                  filters,
                                                                  visible,
                                                                  onClose,
                                                                  onFilterPress,
                                                                  control,
                                                                  calendarType,
                                                                  setValue,
                                                                }: {
  filters: Filter[];
  visible: boolean;
  onClose: () => void;
  onFilterPress: (filters: Filter[]) => void;
  control: any;
  calendarType: 'day' | 'week' | 'month' | 'year';
  setValue: any;
}) {
  const dispatch = useDispatch();
  const calendarFilters = useSelector(
    (state: RootState) => state.calendarFilters,
  );
  const [teamOptions, setTeamOptions] = useState<FilterOption[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<FilterOption[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);
  const [taskTypes, setTaskTypes] = useState<FilterOption[]>([
    { label: 'Oględziny', value: 'oględziny' },
    { label: 'Montaż', value: 'montaż' },
    { label: 'Przegląd', value: 'przegląd' },
    { label: 'Serwis', value: 'serwis' },
  ]);
  const [addTaskTypeModalVisible, setAddTaskTypeModalVisible] = useState(false);
  const [newTaskTypeName, setNewTaskTypeName] = useState('');

  const { teams, getTeams, employees, getEmployees } = useStaff();
  const taskTypeValue = useWatch({ control, name: 'taskType' });
  const currentYear = new Date().getFullYear();

  const selectedTaskTypes = useMemo(() => {
    if (Array.isArray(taskTypeValue)) {
      return taskTypeValue;
    }
    if (taskTypeValue && typeof taskTypeValue === 'string') {
      return [taskTypeValue];
    }
    return [];
  }, [taskTypeValue]);

  const dateOptions = useMemo(() => {
    switch (calendarType) {
      case 'day':
        return generateDayOptions(currentYear);
      case 'week':
        return generateWeekOptions(currentYear);
      case 'month':
      case 'year':
        return generateMonthOptions(currentYear);
      default:
        return [];
    }
  }, [calendarType, currentYear]);

  useEffect(() => {
    if (visible) {
      const getDefaultDateFilter = (
        mode: 'day' | 'week' | 'month' | 'year',
      ): string => {
        const today = new Date();
        switch (mode) {
          case 'day':
            return format(today, 'yyyy-MM-dd');
          case 'week': {
            const monday = new Date(today);
            const day = monday.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            monday.setDate(today.getDate() + diff);
            return format(monday, 'yyyy-MM-dd');
          }
          case 'month':
          case 'year':
            return format(today, 'yyyy-MM');
          default:
            return '';
        }
      };

      const dateFilterValue =
        calendarFilters.dateFilter || getDefaultDateFilter(calendarType);
      setValue('dateFilter', dateFilterValue);
      setValue('dateSort', calendarFilters.dateSort || 'nearest');
      setValue('taskType', calendarFilters.taskType || []);
      setValue('taskStatus', calendarFilters.taskStatus || 'wszystkie');
      setValue('taskGroup', calendarFilters.taskGroup || []);
    }
  }, [visible, calendarType, calendarFilters, setValue]);

  useEffect(() => {
    if (visible && !hasLoadedData) {
      if (getTeams) {
        getTeams();
      }
      if (getEmployees) {
        getEmployees();
      }
      setHasLoadedData(true);
    }
    if (!visible) {
      setHasLoadedData(false);
    }
  }, [visible]);

  useEffect(() => {
    if (teams && teams.length > 0) {
      const teamOptions = teams.map(team => ({
        label: team.nazwa,
        value: team.id.toString(),
      }));
      setTeamOptions(teamOptions);
    }
  }, [teams]);

  useEffect(() => {
    if (employees && employees.employees && employees.employees.length > 0) {
      const employeeOptions = employees.employees.map(employee => ({
        label: `${employee.first_name} ${employee.last_name}`,
        value: employee.id.toString(),
      }));
      setEmployeeOptions(employeeOptions);
    }
  }, [employees]);

  const ekipaOptions = useMemo(() => {
    const unassignedOption = {
      label: 'Nieprzydzielone',
      value: 'nieprzydzielone',
    };

    if (selectedTaskTypes.length === 0) {
      return [unassignedOption, ...teamOptions, ...employeeOptions];
    }

    const hasTeamTypes = selectedTaskTypes.some(
      type =>
        type.toString().toLowerCase() === 'oględziny' ||
        type.toString().toLowerCase() === 'montaż' ||
        type.toString().toLowerCase() === 'przegląd' ||
        type.toString().toLowerCase() === 'serwis',
    );
    const hasEmployeeTypes = selectedTaskTypes.some(
      type => type.toString().toLowerCase() === 'szkolenie',
    );

    if (hasTeamTypes && hasEmployeeTypes) {
      return [unassignedOption, ...teamOptions, ...employeeOptions];
    }
    if (hasTeamTypes) {
      return [unassignedOption, ...teamOptions];
    }
    if (hasEmployeeTypes) {
      return [unassignedOption, ...employeeOptions];
    }

    return [unassignedOption];
  }, [selectedTaskTypes, teamOptions, employeeOptions]);

  const handleSubmit = useCallback(() => {
    const formValues = control._formValues;

    if (formValues.dateFilter) {
      dispatch(setDateFilter(formValues.dateFilter as string));
    }
    if (formValues.dateSort) {
      dispatch(setDateSort(formValues.dateSort as string));
    }
    if (formValues.taskType) {
      dispatch(
        setTaskType(
          Array.isArray(formValues.taskType) ? formValues.taskType : [],
        ),
      );
    }
    if (formValues.taskStatus) {
      dispatch(setTaskStatus(formValues.taskStatus as string));
    }
    if (formValues.taskGroup) {
      dispatch(
        setTaskGroup(
          Array.isArray(formValues.taskGroup) ? formValues.taskGroup : [],
        ),
      );
    }

    const newFilters: Filter[] = [
      {
        name: 'dateFilter',
        value: (formValues.dateFilter || '') as string,
        type: 'dateFilter',
      },
      {
        name: 'dateSort',
        value: (formValues.dateSort || 'nearest') as string,
        type: 'dateSort',
      },
      {
        name: 'taskType',
        value: (Array.isArray(formValues.taskType)
          ? JSON.stringify(formValues.taskType)
          : '[]') as string,
        type: 'taskType',
      },
      {
        name: 'taskStatus',
        value: (formValues.taskStatus || 'wszystkie') as string,
        type: 'taskStatus',
      },
      {
        name: 'taskGroup',
        value: (Array.isArray(formValues.taskGroup)
          ? JSON.stringify(formValues.taskGroup)
          : '[]') as string,
        type: 'taskGroup',
      },
    ];

    if (onFilterPress) {
      onFilterPress(newFilters);
    }
    onClose();
  }, [control, onFilterPress, onClose, dispatch]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, calendarClientStyles.modalContent]}>
          <View style={calendarClientStyles.headerButtonsStyles}>
            <Text style={styles.modalTitle}>Filtry</Text>
          </View>
          <ScrollView contentContainerStyle={calendarClientStyles.clientList}>
            <Text style={calendarClientStyles.label}>
              {calendarType === 'day'
                ? 'Dzień'
                : calendarType === 'week'
                  ? 'Tydzień'
                  : calendarType === 'year'
                    ? 'Rok'
                    : 'Miesiąc'}
            </Text>
            <Dropdown
              name="dateFilter"
              control={control}
              options={dateOptions}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={calendarClientStyles.label}>Typ zadania</Text>
              <Button
                title="+ Dodaj typ"
                buttonStyle={{
                  backgroundColor: Colors.teal,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 4,
                }}
                titleStyle={{
                  fontSize: 12,
                  fontFamily: 'Archivo_600SemiBold',
                }}
                onPress={() => setAddTaskTypeModalVisible(true)}
              />
            </View>
            <MultiSelectModal
              name="taskType"
              control={control}
              options={taskTypes}
              placeholder="Wybierz typy zadań..."
            />
            <Text style={calendarClientStyles.label}>Status</Text>
            <Dropdown
              control={control}
              name="taskStatus"
              options={[
                { label: 'Wszystkie', value: 'wszystkie' },
                { label: 'Do zrobienia', value: 'niewykonane' },
                { label: 'Zrobione', value: 'wykonane' },
                { label: 'Niezaplanowane', value: 'Zaplanowane' },
              ]}
            />
            <Text style={calendarClientStyles.label}>Ekipa</Text>
            <MultiSelectModal
              name="taskGroup"
              control={control}
              options={ekipaOptions}
              placeholder="Wybierz ekipy..."
            />
          </ScrollView>

          <View style={styles.modalButtonGroup}>
            <Button
              title="Zastosuj"
              buttonStyle={[styles.saveButton, styles.modalButton]}
              onPress={handleSubmit}
              titleStyle={styles.buttonText}
            />
            <Button
              title="Anuluj"
              buttonStyle={[styles.cancelButton, styles.modalButton]}
              onPress={onClose}
              titleStyle={styles.buttonText}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={addTaskTypeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAddTaskTypeModalVisible(false);
          setNewTaskTypeName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dodaj nowy typ zadania</Text>
            <Text style={calendarClientStyles.label}>Nazwa typu</Text>
            <TextInput
              style={styles.calendarFilterInput}
              value={newTaskTypeName}
              onChangeText={setNewTaskTypeName}
              placeholder="Wpisz nazwę typu zadania..."
              placeholderTextColor={Colors.gray}
            />
            <View style={styles.modalButtonGroup}>
              <Button
                title="Dodaj"
                buttonStyle={[styles.saveButton, styles.modalButton]}
                onPress={() => {
                  if (newTaskTypeName.trim()) {
                    const newType = {
                      label: newTaskTypeName.trim(),
                      value: newTaskTypeName.trim().toLowerCase(),
                    };
                    setTaskTypes([...taskTypes, newType]);
                    setNewTaskTypeName('');
                    setAddTaskTypeModalVisible(false);
                  }
                }}
                titleStyle={styles.buttonText}
              />
              <Button
                title="Anuluj"
                buttonStyle={[styles.cancelButton, styles.modalButton]}
                onPress={() => {
                  setAddTaskTypeModalVisible(false);
                  setNewTaskTypeName('');
                }}
                titleStyle={styles.buttonText}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
});

// ===== GŁÓWNY KOMPONENT =====

function CalendarTab({ appliedFilters, setAppliedFilters, showHeader = true }: CalendarTabProps) {
  const dispatch = useDispatch();
  const calendarFilters = useSelector(
    (state: RootState) => state.calendarFilters,
  );
  const viewMode = calendarFilters.calendarMode;
  const navigation = useNavigation();
  const [calendarFiltersVisible, setCalendarFiltersVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks' | 'schedule'>('calendar');
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [eventTasks, setEventTasks] = useState<any>();
  const { result: tasks, loading, execute } = useTasks();
  const { teams } = useStaff();
  const prevEventTasksByDateRef = useRef<string>('');

  const [isModeMenuExpanded, setIsModeMenuExpanded] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

  const modeMenuHeight = useSharedValue(0);
  const modeMenuOpacity = useSharedValue(0);

  const calendarHeight = useSharedValue(0);
  const calendarOpacity = useSharedValue(0);

  const getDefaultDateFilter = (
    mode: 'day' | 'week' | 'month' | 'year',
  ): string => {
    const today = new Date();
    switch (mode) {
      case 'day':
        return format(today, 'yyyy-MM-dd');
      case 'week': {
        const monday = new Date(today);
        const day = monday.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        monday.setDate(today.getDate() + diff);
        return format(monday, 'yyyy-MM-dd');
      }
      case 'month':
      case 'year':
        return format(today, 'yyyy-MM');
      default:
        return '';
    }
  };

  const { control, setValue } = useForm<Filters>({
    defaultValues: {
      dateFilter: calendarFilters.dateFilter || getDefaultDateFilter(viewMode),
      dateSort: calendarFilters.dateSort || 'nearest',
      taskType: calendarFilters.taskType || [],
      taskStatus: calendarFilters.taskStatus || 'wszystkie',
      taskGroup: calendarFilters.taskGroup || [],
    },
  });

  useEffect(() => {
    setValue(
      'dateFilter',
      calendarFilters.dateFilter || getDefaultDateFilter(viewMode),
    );
    setValue('dateSort', calendarFilters.dateSort || 'nearest');
    setValue('taskType', calendarFilters.taskType || []);
    setValue('taskStatus', calendarFilters.taskStatus || 'wszystkie');
    setValue('taskGroup', calendarFilters.taskGroup || []);
  }, [
    calendarFilters.dateFilter,
    calendarFilters.dateSort,
    calendarFilters.taskType,
    calendarFilters.taskStatus,
    calendarFilters.taskGroup,
    viewMode,
  ]);

  useEffect(() => {
    if (viewMode === 'week' && calendarFilters.dateFilter) {
      setCurrentDate(calendarFilters.dateFilter);
    } else if (viewMode === 'day' && calendarFilters.dateFilter) {
      setCurrentDate(calendarFilters.dateFilter);
    } else if (
      (viewMode === 'month' || viewMode === 'year') &&
      calendarFilters.dateFilter
    ) {
      const [year, month] = calendarFilters.dateFilter.split('-');
      if (year && month) {
        const firstDayOfMonth = format(
          new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1),
          'yyyy-MM-dd',
        );
        setCurrentDate(firstDayOfMonth);
      }
    }
  }, [viewMode, calendarFilters.dateFilter]);

  const handleCalendarModeChange = useCallback(
    (mode: 'day' | 'week' | 'month' | 'year') => {
      dispatch(setCalendarMode(mode));
      const defaultDate = getDefaultDateFilter(
        mode === 'year' ? 'month' : mode,
      );
      dispatch(setDateFilter(defaultDate));
      setValue('dateFilter', defaultDate);
    },
    [dispatch, setValue],
  );

  const baseFilters = useMemo<Filter[]>(() => {
    return filtersStateToFilterArray(calendarFilters);
  }, [calendarFilters]);

  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);

  const changeMonthWithAnimation = useCallback(
    (direction: 'next' | 'prev') => {
      fadeAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withTiming(direction === 'next' ? -30 : 30, {
        duration: 200,
      });

      setTimeout(() => {
        const currentDateObj = new Date(currentDate);
        if (direction === 'next') {
          currentDateObj.setMonth(currentDateObj.getMonth() + 1);
        } else {
          currentDateObj.setMonth(currentDateObj.getMonth() - 1);
        }

        const maxDaysInMonth = new Date(
          currentDateObj.getFullYear(),
          currentDateObj.getMonth() + 1,
          0,
        ).getDate();
        if (currentDateObj.getDate() > maxDaysInMonth) {
          currentDateObj.setDate(1);
        }

        setCurrentDate(format(currentDateObj, 'yyyy-MM-dd'));

        slideAnim.value = direction === 'next' ? 30 : -30;

        fadeAnim.value = withTiming(1, { duration: 200 });
        slideAnim.value = withTiming(0, { duration: 200 });
      }, 200);
    },
    [currentDate, fadeAnim, slideAnim],
  );

  const onSwipeGesture = useCallback(
    (event: any) => {
      const { translationX, state } = event.nativeEvent;

      if (state === State.END) {
        const threshold = 50;

        if (translationX < -threshold) {
          changeMonthWithAnimation('next');
        } else if (translationX > threshold) {
          changeMonthWithAnimation('prev');
        }
      }
    },
    [changeMonthWithAnimation],
  );

  useEffect(() => {
    execute();
  }, []);

  const { filteredTasks, eventTasksByDate } = useMemo(() => {
    if (!tasks) {
      return { filteredTasks: [], eventTasksByDate: {} };
    }

    let filteredTasks = [...tasks];

    const { dateFilter } = calendarFilters;
    const { dateSort } = calendarFilters;
    const { taskType } = calendarFilters;
    const { taskStatus } = calendarFilters;
    const { taskGroup } = calendarFilters;

    if (dateFilter && dateFilter.trim() !== '') {
      const filterDate = dateFilter;
      if (viewMode === 'day') {
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = format(new Date(task.start_date), 'yyyy-MM-dd');
          return taskDate === filterDate;
        });
      } else if (viewMode === 'week') {
        const weekStart = new Date(filterDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.start_date);
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
      } else if (viewMode === 'month' || viewMode === 'year') {
        const [year, month] = filterDate.split('-');
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.start_date);
          return (
            taskDate.getFullYear() === parseInt(year, 10) &&
            taskDate.getMonth() + 1 === parseInt(month, 10)
          );
        });
      }
    }

    if (taskType && taskType.length > 0) {
      filteredTasks = filteredTasks.filter(task =>
        taskType.some(
          (val: string | number) =>
            val.toString().toLowerCase() === task.typ?.toLowerCase(),
        ),
      );
    }

    if (taskStatus && taskStatus !== 'wszystkie') {
      filteredTasks = filteredTasks.filter(task => task.status === taskStatus);
    }

    if (taskGroup && taskGroup.length > 0) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.grupa) {
          return taskGroup.includes('nieprzydzielone');
        }
        return taskGroup.some(
          (val: string | number) =>
            val.toString() === task.grupa?.toString() || val === task.grupa,
        );
      });
    }

    if (dateSort === 'farthest') {
      filteredTasks.sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      );
    } else {
      filteredTasks.sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
      );
    }

    const eventTasksByDate: Record<string, any[]> = filteredTasks.reduce(
      (acc, task) => {
        const date = format(new Date(task.start_date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: task.id,
          start: task.start_date,
          end: task.end_date || task.start_date,
          title: task.nazwa,
          summary: `${task.typ} - ${task.nazwa}`,
          type: task.typ,
          status: task.status,
          notatki: task.notatki,
          color:
            task.status === 'wykonane'
              ? Colors.statusDone
              : task.status === 'niewykonane'
                ? Colors.statusNotDone
                : task.status === 'Zaplanowane'
                  ? Colors.statusPlanned
                  : Colors.statusOther,
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return { filteredTasks, eventTasksByDate };
  }, [
    tasks,
    calendarFilters.dateFilter,
    calendarFilters.dateSort,
    calendarFilters.taskType,
    calendarFilters.taskStatus,
    calendarFilters.taskGroup,
    viewMode,
  ]);

  useEffect(() => {
    const newEventTasksString = JSON.stringify(eventTasksByDate);

    if (prevEventTasksByDateRef.current !== newEventTasksString) {
      prevEventTasksByDateRef.current = newEventTasksString;
      setEventTasks(eventTasksByDate);
    }
  }, [eventTasksByDate]);

  const daysMap: Record<'day' | 'week' | 'month', number> = useMemo(
    () => ({
      day: 1,
      week: 7,
      month: 30,
    }),
    [],
  );

  const renderEventCallback = useCallback(
    (event: PackedEvent) => <EventItem event={event} />,
    [],
  );

  const timelineProps: Partial<TimelineProps> = useMemo(
    () => ({
      format24h: true,
      start: 0,
      end: 23,
      overlapEventsSpacing: 8,
      rightEdgeSpacing: 14,
      numberOfDays: daysMap[viewMode],
      showNowIndicator: false,
      styles: {
        event: {
          paddingLeft: 0,
          paddingTop: 0,
          paddingRight: 0,
          margin: 0,
          width: '100%',
          height: '100%',
        },
      },
      renderEvent: renderEventCallback,
    }),
    [daysMap, viewMode, renderEventCallback],
  );

  const screenWidth = useMemo(() => Dimensions.get('window').width, []);

  const animatedCalendarStyle = useAnimatedStyle(() => {
    'worklet';

    return {
      opacity: fadeAnim.value,
      transform: [{ translateX: slideAnim.value }] as any,
    };
  });

  const onSwipeDownGesture = useCallback(
    (event: any) => {
      const { translationY, state } = event.nativeEvent;

      if (state === State.ACTIVE) {
        if (translationY > 0 && !isModeMenuExpanded) {
          modeMenuHeight.value = Math.min(translationY, MENU_HEIGHT);
          modeMenuOpacity.value = Math.min(translationY / MENU_HEIGHT, 1);
        } else if (translationY < 0 && isModeMenuExpanded) {
          modeMenuHeight.value = Math.max(MENU_HEIGHT + translationY, 0);
          modeMenuOpacity.value = Math.max((MENU_HEIGHT + translationY) / MENU_HEIGHT, 0);
        }
      }

      if (state === State.END) {
        const threshold = 30;

        if (!isModeMenuExpanded && translationY > threshold) {
          modeMenuHeight.value = withSpring(MENU_HEIGHT, { damping: 18, stiffness: 180 });
          modeMenuOpacity.value = withSpring(1);
          setIsModeMenuExpanded(true);
        } else if (isModeMenuExpanded && translationY < -threshold) {
          modeMenuHeight.value = withSpring(0, { damping: 18, stiffness: 180 });
          modeMenuOpacity.value = withSpring(0);
          setIsModeMenuExpanded(false);
        } else {
          if (isModeMenuExpanded) {
            modeMenuHeight.value = withSpring(MENU_HEIGHT, { damping: 18, stiffness: 180 });
            modeMenuOpacity.value = withSpring(1);
          } else {
            modeMenuHeight.value = withSpring(0, { damping: 18, stiffness: 180 });
            modeMenuOpacity.value = withSpring(0);
          }
        }
      }
    },
    [isModeMenuExpanded, modeMenuHeight, modeMenuOpacity],
  );

  const onCalendarSwipeGesture = useCallback(
    (event: any) => {
      const { translationY, state } = event.nativeEvent;
      const CALENDAR_HEIGHT = 350;

      if (state === State.ACTIVE) {
        if (translationY > 0 && !isCalendarExpanded) {
          calendarHeight.value = Math.min(translationY, CALENDAR_HEIGHT);
          calendarOpacity.value = Math.min(translationY / CALENDAR_HEIGHT, 1);
        } else if (translationY < 0 && isCalendarExpanded) {
          calendarHeight.value = Math.max(CALENDAR_HEIGHT + translationY, 0);
          calendarOpacity.value = Math.max((CALENDAR_HEIGHT + translationY) / CALENDAR_HEIGHT, 0);
        }
      }

      if (state === State.END) {
        const threshold = 50;

        if (!isCalendarExpanded && translationY > threshold) {
          calendarHeight.value = withSpring(CALENDAR_HEIGHT, { damping: 18, stiffness: 180 });
          calendarOpacity.value = withSpring(1);
          setIsCalendarExpanded(true);
        } else if (isCalendarExpanded && translationY < -threshold) {
          calendarHeight.value = withSpring(0, { damping: 18, stiffness: 180 });
          calendarOpacity.value = withSpring(0);
          setIsCalendarExpanded(false);
        } else {
          if (isCalendarExpanded) {
            calendarHeight.value = withSpring(CALENDAR_HEIGHT, { damping: 18, stiffness: 180 });
            calendarOpacity.value = withSpring(1);
          } else {
            calendarHeight.value = withSpring(0, { damping: 18, stiffness: 180 });
            calendarOpacity.value = withSpring(0);
          }
        }
      }
    },
    [isCalendarExpanded, calendarHeight, calendarOpacity],
  );

  const animatedModeMenuStyle = useAnimatedStyle(() => ({
    height: modeMenuHeight.value,
    opacity: modeMenuOpacity.value,
    overflow: 'hidden',
  }));

  const animatedCalendarExpandStyle = useAnimatedStyle(() => {
    return {
      height: calendarHeight.value,
      opacity: calendarOpacity.value,
      overflow: 'hidden',
    };
  });

  // Funkcja do zaznaczania tygodnia w widoku TYDZIEŃ
  const getMarkedDatesForWeek = useCallback((weekStartDate: string) => {
    const marked: any = {};
    const weekStart = new Date(weekStartDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = format(date, 'yyyy-MM-dd');

      marked[dateString] = {
        selected: true,
        selectedColor: Colors.calendarPrimary,
        selectedTextColor: Colors.white,
      };
    }

    return marked;
  }, []);

  const markedDates = useMemo(() => {
    if (viewMode !== 'week') return {};

    const base = new Date(currentDate);
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(base);
    monday.setDate(base.getDate() + diff);

    const result: any = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const key = format(d, 'yyyy-MM-dd');

      result[key] = {
        color: Colors.calendarPrimary, // 🔥 TEN PASEK
        textColor: '#fff',
        startingDay: i === 0,
        endingDay: i === 6,
      };
    }

    return result;
  }, [viewMode, currentDate]);


  // Tytuł nagłówka w zależności od trybu
  const headerTitle = useMemo(() => {
    const date = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        // "Piątek, 9 Grudnia"
        return `${formatWeekDay(date)}, ${format(date, 'd')} ${formatPolishMonth(date)}`;

      case 'week': {
        const { start, end } = getWeekRange(date);

        const sameMonth = start.getMonth() === end.getMonth();

        return sameMonth
          ? `${format(start, 'd')} - ${format(end, 'd')} ${formatPolishMonth(start)}`
          : `${format(start, 'd')} ${formatPolishMonth(start)} – ${format(end, 'd')} ${formatPolishMonth(end)}`;
      }


      case 'month':
        // "Grudzień 2025"
        return `${formatPolishMonthNominative(date)} ${format(date, 'yyyy')}`;

      case 'year':
        // "2025"
        return format(date, 'yyyy');

      default:
        return '';
    }
  }, [viewMode, currentDate]);

  return (
    <View style={styles.container}>
      <View style={styles.orangeTopBorder} />

      {/* ZAWARTOŚĆ - TYLKO KALENDARZ */}
      {activeTab === 'calendar' && !loading && tasks !== null && (
        <>
          {/* WIDOK DZIEŃ - pokazuje TYDZIEŃ z zaznaczonym dniem */}
          {viewMode === 'day' && (
            <View style={styles.dayViewContainer}>
              {/* Tytuł: "Piątek, 9 Grudnia" */}
              <View style={styles.dayViewHeader}>
                <Text style={styles.dayViewDateText}>{headerTitle}</Text>
              </View>

              <Animated.View style={[styles.modeButtonsAnimated, animatedModeMenuStyle]}>

              {/* PRZYCISKI TRYBU KALENDARZA */}
              <View style={styles.modeButtonsContainer}>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('day')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'day' && styles.modeButtonCircleActive]}>
                    {viewMode === 'day' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="black" strokeWidth={4} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Dzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('week')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'week' && styles.modeButtonCircleActive]}>
                    {viewMode === 'week' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path
  d="M6.49484 13.5837H6.50383"
  stroke="black"
  strokeWidth={2}
  strokeLinecap="round"
/>
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 13.5837H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Tydzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('month')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'month' && styles.modeButtonCircleActive]}>
                    {viewMode === 'month' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Miesiąc</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('year')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'year' && styles.modeButtonCircleActive]}>
                    {viewMode === 'year' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Wybierz rok</Text>
                </RNTouchableOpacity>
              </View>

              </Animated.View>

              <View style={styles.modeButtonsDivider} />


              {/* Tydzień z datami - JEDEN DZIEŃ zaznaczony */}
              <PanGestureHandler onHandlerStateChange={onSwipeDownGesture}>
                <Animated.View>
                  <View style={styles.dayStrip}>
                    {getWeekDays(currentDate).map((day, index) => {
                      const dayString = format(day, 'yyyy-MM-dd');
                      const isSelected = dayString === currentDate;

                      return (
                        <RNTouchableOpacity
                          key={index}
                          style={[
                            styles.dayEllipse,
                            isSelected && styles.dayEllipseActive,
                          ]}
                          onPress={() => {
                            setCurrentDate(dayString);
                            dispatch(setDateFilter(dayString));
                            setValue('dateFilter', dayString);
                          }}
                        >
                          <Text
                            style={[
                              styles.dayEllipseName,
                              isSelected && styles.dayEllipseNameActive,
                            ]}
                          >
                            {formatWeekDayShort(day)}.
                          </Text>

                          <Text
                            style={[
                              styles.dayEllipseNumber,
                              isSelected && styles.dayEllipseNumberActive,
                            ]}
                          >
                            {format(day, 'dd')}
                          </Text>
                        </RNTouchableOpacity>

                      );
                    })}
                  </View>

                  <View style={styles.swipeHandleContainer}>
                    <View style={styles.swipeHandle} />
                  </View>
                </Animated.View>
              </PanGestureHandler>

              {/* Timeline z kolumnami ekip */}
              <ScrollView style={styles.dayViewTimelineContainer}>
                <DayTimeline
                  currentDate={currentDate}
                  eventTasks={eventTasks}
                  tasks={tasks}
                  teams={teams}
                  navigation={navigation}
                />
              </ScrollView>
            </View>
          )}

          {/* WIDOK TYDZIEŃ - pokazuje TABELĘ z kolumnami ekip POZIOMO */}
          {viewMode === 'week' && (
            <View style={styles.weekViewContainer}>
              {/* Tytuł z nawigacją: "14 - 20 Grudnia" */}
              <View style={styles.weekHeaderWithNav}>

                <Text style={styles.dayViewDateText}>{headerTitle}</Text>

              </View>

              {/* PRZYCISKI TRYBU KALENDARZA */}
              <View style={styles.modeButtonsContainer}>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('day')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'day' && styles.modeButtonCircleActive]}>
                    {viewMode === 'day' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="black" strokeWidth={4} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Dzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('week')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'week' && styles.modeButtonCircleActive]}>
                    {viewMode === 'week' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path
  d="M6.49484 13.5837H6.50383"
  stroke="black"
  strokeWidth={2}
  strokeLinecap="round"
/>
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 13.5837H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Tydzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('month')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'month' && styles.modeButtonCircleActive]}>
                    {viewMode === 'month' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Miesiąc</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('year')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'year' && styles.modeButtonCircleActive]}>
                    {viewMode === 'year' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Wybierz rok</Text>
                </RNTouchableOpacity>
              </View>

              <View style={styles.modeButtonsDivider} />

              {/* Kalendarz miesiąca z zaznaczonym tygodniem - ZWIJANY */}
              <Animated.View style={animatedCalendarExpandStyle}>
                <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
                  <Animated.View style={animatedCalendarStyle}>
                    <Calendar
                      current={currentDate}
                      firstDay={1}
                      hideArrows
                      disableMonthChange
                      markingType="period"
                      markedDates={markedDates}
                      onDayPress={(day) => {
                        if (viewMode === 'week') {
                          setCurrentDate(day.dateString);
                          dispatch(setDateFilter(day.dateString));
                          setValue('dateFilter', day.dateString);
                        }
                      }}
                      theme={{
                        todayTextColor: '#000',

                        // 🔥 USUWAMY WSZYSTKO CO ROBI KÓŁKA
                        selectedDayBackgroundColor: 'transparent',
                        selectedDayTextColor: '#fff',
                        todayBackgroundColor: 'transparent',

                        textDayFontFamily: 'Poppins_400Regular',
                        textDayHeaderFontFamily: 'Poppins_600SemiBold',
                      }}
                    />

                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>

              {/* Szary pasek do chowania kalendarza - TERAZ POD KALENDARZEM */}
              <PanGestureHandler onHandlerStateChange={onCalendarSwipeGesture}>
                <Animated.View style={styles.swipeHandleContainer}>
                  <View style={styles.swipeHandle} />
                </Animated.View>
              </PanGestureHandler>

              {/* TABELA Z KOLUMNAMI EKIP */}
              <ScrollView style={styles.weekTableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.weekTable}>
                    {/* Nagłówek tabeli z nazwami ekip */}
                    {(() => {
                      // Zbierz wszystkie ekipy z całego tygodnia
                      const weekDays = getWeekDays(currentDate);
                      const allTeamIds = new Set<string>();

                      weekDays.forEach(day => {
                        const dateString = format(day, 'yyyy-MM-dd');
                        const dayTasks = eventTasks?.[dateString] || [];
                        dayTasks.forEach((task: any) => {
                          const originalTask = tasks?.find(t => t.id === task.id);
                          const teamId = originalTask?.grupa?.toString() || 'unassigned';
                          allTeamIds.add(teamId);
                        });
                      });

                      const teamIds = Array.from(allTeamIds).sort((a, b) => {
                        if (a === 'unassigned') return 1;
                        if (b === 'unassigned') return -1;
                        return parseInt(a) - parseInt(b);
                      });

                      const teamColors: Record<string, string> = {};
                      teamIds.forEach((id, index) => {
                        teamColors[id] = TEAM_COLORS[index % TEAM_COLORS.length];
                      });

                      const getTeamName = (teamId: string) => {
                        const team = teams?.find(t => t.id.toString() === teamId);
                        if (team) return team.nazwa;
                        if (teamId === 'unassigned') return 'Nieprzydzielone';
                        return `Ekipa ${teamId}`;
                      };

                      return (
                        <>
                          <View style={styles.weekTableHeaderRow}>
                            <View style={styles.weekTableDateColumn} />
                            {teamIds.map(teamId => (
                              <View key={teamId} style={styles.weekTableTeamColumn}>
                                <Text style={[styles.weekTableTeamHeader, { color: teamColors[teamId] }]}>
                                  {getTeamName(teamId)}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {/* Wiersze dla każdego dnia */}
                          {weekDays.map(day => {
                            const dateString = format(day, 'yyyy-MM-dd');
                            const date = new Date(dateString);
                            const dayName = formatWeekDay(date);
                            const isToday = dateString === format(new Date(), 'yyyy-MM-dd');

                            // Grupuj zadania według ekip dla tego dnia
                            const dayTasks = eventTasks?.[dateString] || [];
                            const tasksByTeam: Record<string, any[]> = {};

                            dayTasks.forEach((task: any) => {
                              const originalTask = tasks?.find(t => t.id === task.id);
                              const teamId = originalTask?.grupa?.toString() || 'unassigned';
                              if (!tasksByTeam[teamId]) {
                                tasksByTeam[teamId] = [];
                              }
                              tasksByTeam[teamId].push(task);
                            });

                            return (
                              <View key={dateString} style={styles.weekTableRow}>
                                {/* Kolumna z datą */}
                                <View style={styles.weekTableDateCell}>
                                  <Text style={[styles.weekTableDayName, isToday && styles.weekTableDayNameToday]}>
                                    {dayName}
                                  </Text>
                                  <Text style={[styles.weekTableDate, isToday && styles.weekTableDateToday]}>
                                    {format(date, 'dd.MM.yyyy')}
                                  </Text>
                                </View>

                                {/* Kolumny z zadaniami dla każdej ekipy */}
                                {teamIds.map(teamId => {
                                  const teamTasks = tasksByTeam[teamId] || [];
                                  const teamColor = teamColors[teamId];

                                  return (
                                    <View key={teamId} style={styles.weekTableTaskCell}>
                                      {teamTasks.map((task, index) => {
                                        const originalTask = tasks?.find(t => t.id === task.id);
                                        return (
                                          <RNTouchableOpacity
                                            key={task.id || index}
                                            style={[styles.weekTableTaskCard, { backgroundColor: teamColor, borderLeftColor: darkenColor(teamColor) }]}
                                            onPress={() => {
                                              if (originalTask) {
                                                navigation.navigate('TaskDetails', { task: originalTask });
                                              }
                                            }}
                                          >
                                            <Text style={styles.weekTableTaskType}>{task.type}</Text>
                                            <Text style={styles.weekTableTaskTitle} numberOfLines={1}>
                                              {task.title}
                                            </Text>
                                          </RNTouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  );
                                })}
                              </View>
                            );
                          })}
                        </>
                      );
                    })()}
                  </View>
                </ScrollView>
              </ScrollView>
            </View>
          )}

          {/* WIDOK MIESIĄC - pokazuje TABELĘ z kolumnami ekip POZIOMO */}
          {viewMode === 'month' && (
            <View style={styles.monthlyCalendarContainer}>
              {/* Tytuł: "Grudzień 2025" */}
              <View style={styles.monthNavigation}>
                <Animated.Text
                  style={[styles.monthTitle, animatedCalendarStyle]}
                >
                  {headerTitle}
                </Animated.Text>
              </View>

              {/* PRZYCISKI TRYBU KALENDARZA */}
              <View style={styles.modeButtonsContainer}>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('day')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'day' && styles.modeButtonCircleActive]}>
                    {viewMode === 'day' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="black" strokeWidth={4} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Dzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('week')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'week' && styles.modeButtonCircleActive]}>
                    {viewMode === 'week' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path
  d="M6.49484 13.5837H6.50383"
  stroke="black"
  strokeWidth={2}
  strokeLinecap="round"
/>
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 13.5837H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Tydzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('month')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'month' && styles.modeButtonCircleActive]}>
                    {viewMode === 'month' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Miesiąc</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('year')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'year' && styles.modeButtonCircleActive]}>
                    {viewMode === 'year' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Wybierz rok</Text>
                </RNTouchableOpacity>
              </View>

              <View style={styles.modeButtonsDivider} />

              {/* Kalendarz miesiąca z zaznaczonym dniem - ZWIJANY */}
              <Animated.View style={animatedCalendarExpandStyle}>
                <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
                  <Animated.View style={animatedCalendarStyle}>
                    <Calendar
                      key={format(new Date(currentDate), 'yyyy-MM')}
                      current={currentDate}
                      minDate="2020-01-01"
                      maxDate="2030-12-31"
                      markedDates={markedDates}
                      onDayPress={(day: any) => {
                        setCurrentDate(day.dateString);
                        dispatch(setDateFilter(day.dateString));
                        setValue('dateFilter', day.dateString);
                      }}
                      theme={{
                        todayTextColor: Colors.white,
                        todayBackgroundColor: Colors.calendarPrimary,
                        selectedDayBackgroundColor: Colors.calendarPrimary,
                        selectedDayTextColor: Colors.white,
                        arrowColor: 'transparent',
                        monthTextColor: 'transparent',
                        textDayFontFamily: 'Poppins_400Regular',
                        textMonthFontFamily: 'Poppins_600SemiBold',
                        textDayHeaderFontFamily: 'Poppins_600SemiBold',
                        weekVerticalMargin: 1,
                      }}
                      firstDay={1}
                      hideArrows
                      disableMonthChange
                    />
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>

              {/* Szary pasek do chowania kalendarza - TERAZ POD KALENDARZEM */}
              <PanGestureHandler onHandlerStateChange={onCalendarSwipeGesture}>
                <Animated.View style={styles.swipeHandleContainer}>
                  <View style={styles.swipeHandle} />
                </Animated.View>
              </PanGestureHandler>

              {/* TABELA Z KOLUMNAMI EKIP */}
              <ScrollView style={styles.monthTableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.monthTable}>
                    {/* Nagłówek tabeli z nazwami ekip */}
                    {(() => {
                      // Zbierz wszystkie ekipy z całego miesiąca
                      const allTeamIds = new Set<string>();
                      const daysWithTasks = Object.keys(eventTasks || {}).sort();

                      daysWithTasks.forEach(dateString => {
                        const dayTasks = eventTasks?.[dateString] || [];
                        dayTasks.forEach((task: any) => {
                          const originalTask = tasks?.find(t => t.id === task.id);
                          const teamId = originalTask?.grupa?.toString() || 'unassigned';
                          allTeamIds.add(teamId);
                        });
                      });

                      const teamIds = Array.from(allTeamIds).sort((a, b) => {
                        if (a === 'unassigned') return 1;
                        if (b === 'unassigned') return -1;
                        return parseInt(a) - parseInt(b);
                      });

                      const teamColors: Record<string, string> = {};
                      teamIds.forEach((id, index) => {
                        teamColors[id] = TEAM_COLORS[index % TEAM_COLORS.length];
                      });

                      const getTeamName = (teamId: string) => {
                        const team = teams?.find(t => t.id.toString() === teamId);
                        if (team) return team.nazwa;
                        if (teamId === 'unassigned') return 'Nieprzydzielone';
                        return `Ekipa ${teamId}`;
                      };

                      if (teamIds.length === 0) {
                        return (
                          <View style={styles.emptyTimelineContainer}>
                            <Text style={styles.emptyTimelineText}>Brak zadań w tym miesiącu</Text>
                          </View>
                        );
                      }

                      return (
                        <>
                          <View style={styles.monthTableHeaderRow}>
                            <View style={styles.monthTableDateColumn} />
                            {teamIds.map(teamId => (
                              <View key={teamId} style={styles.monthTableTeamColumn}>
                                <Text style={[styles.monthTableTeamHeader, { color: teamColors[teamId] }]}>
                                  {getTeamName(teamId)}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {/* Wiersze dla każdego dnia z zadaniami */}
                          {daysWithTasks.map(dateString => {
                            const date = new Date(dateString);
                            const dayName = formatWeekDay(date);
                            const isToday = dateString === format(new Date(), 'yyyy-MM-dd');

                            // Grupuj zadania według ekip dla tego dnia
                            const dayTasks = eventTasks?.[dateString] || [];
                            const tasksByTeam: Record<string, any[]> = {};

                            dayTasks.forEach((task: any) => {
                              const originalTask = tasks?.find(t => t.id === task.id);
                              const teamId = originalTask?.grupa?.toString() || 'unassigned';
                              if (!tasksByTeam[teamId]) {
                                tasksByTeam[teamId] = [];
                              }
                              tasksByTeam[teamId].push(task);
                            });

                            return (
                              <View key={dateString} style={styles.monthTableRow}>
                                {/* Kolumna z datą */}
                                <View style={[styles.monthTableDateCell, isToday && styles.monthTableDateCellToday]}>
                                  <Text style={[styles.monthTableDayName, isToday && styles.monthTableDayNameToday]}>
                                    {dayName}
                                  </Text>
                                  <Text style={[styles.monthTableDate, isToday && styles.monthTableDateToday]}>
                                    {format(date, 'dd.MM.yyyy')}
                                  </Text>
                                </View>

                                {/* Kolumny z zadaniami dla każdej ekipy */}
                                {teamIds.map(teamId => {
                                  const teamTasks = tasksByTeam[teamId] || [];
                                  const teamColor = teamColors[teamId];

                                  return (
                                    <View key={teamId} style={styles.monthTableTaskCell}>
                                      {teamTasks.map((task, index) => {
                                        const originalTask = tasks?.find(t => t.id === task.id);
                                        return (
                                          <RNTouchableOpacity
                                            key={task.id || index}
                                            style={[styles.monthTableTaskCard, { backgroundColor: teamColor, borderLeftColor: darkenColor(teamColor) }]}
                                            onPress={() => {
                                              if (originalTask) {
                                                navigation.navigate('TaskDetails', { task: originalTask });
                                              }
                                            }}
                                          >
                                            <Text style={styles.monthTableTaskType}>{task.type}</Text>
                                            <Text style={styles.monthTableTaskTitle} numberOfLines={1}>
                                              {task.title}
                                            </Text>
                                          </RNTouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  );
                                })}
                              </View>
                            );
                          })}
                        </>
                      );
                    })()}
                  </View>
                </ScrollView>
              </ScrollView>
            </View>
          )}

          {/* WIDOK ROK - pokazuje WIDOK ROCZNY ze wszystkimi miesiącami */}
          {viewMode === 'year' && (
            <ScrollView style={{ flex: 1, backgroundColor: Colors.white }}>
              <Text style={styles.yearLabel}>
                {format(new Date(currentDate), 'yyyy')}
              </Text>

              <View style={styles.modeButtonsContainer}>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('day')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'day' && styles.modeButtonCircleActive]}>
                    {viewMode === 'day' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M8.973 11H9.027" stroke="black" strokeWidth={4} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Dzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('week')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'week' && styles.modeButtonCircleActive]}>
                    {viewMode === 'week' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                      <Path
                        d="M6.49484 13.5837H6.50383"
                        stroke="black"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.4962 9.41667H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M11.4962 13.5837H11.5052" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 9.41667H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                      <Path d="M6.49484 13.5837H6.50383" stroke="black" strokeWidth={2} strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Tydzień</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('month')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'month' && styles.modeButtonCircleActive]}>
                    {viewMode === 'month' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Miesiąc</Text>
                </RNTouchableOpacity>
                <RNTouchableOpacity
                  style={styles.modeButton}
                  onPress={() => handleCalendarModeChange('year')}
                >
                  <View style={[styles.modeButtonCircle, viewMode === 'year' && styles.modeButtonCircleActive]}>
                    {viewMode === 'year' ? <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="#fff"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="#fff" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="#fff" strokeLinecap="round" />
                    </Svg> : <Svg width={26} height={26} viewBox="0 0 18 18" fill="none">
                      <Path d="M6 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M12 1.5V3.75" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M2.625 6.81738H15.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                      <Path
                        d="M15.75 12.75C15.75 15 14.625 16.5 12 16.5H6C3.375 16.5 2.25 15 2.25 12.75V6.375C2.25 4.125 3.375 2.625 6 2.625H12C14.625 2.625 15.75 4.125 15.75 6.375V12.75Z"
                        stroke="black"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path d="M11.771 10.2754H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M11.771 12.5254H11.7778" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 10.2754H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M8.99661 12.5254H9.00335" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 10.2754H6.22747" stroke="black" strokeLinecap="round" />
                      <Path d="M6.22073 12.5254H6.22747" stroke="black" strokeLinecap="round" />
                    </Svg>}
                  </View>
                  <Text style={styles.modeButtonText}>Wybierz rok</Text>
                </RNTouchableOpacity>
              </View>

              <View style={styles.modeButtonsDivider} />

              <View style={styles.yearGrid}>
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const year = new Date(currentDate).getFullYear();
                  const monthDate = new Date(year, monthIndex, 1);

                  return (
                    <View key={monthIndex} style={styles.yearMonthCell}>
                      {/* NAZWA MIESIĄCA */}
                      <Text style={styles.yearMonthTitle}>
                        {formatPolishMonthNominative(monthDate)}
                      </Text>



                      {/* MINI KALENDARZ */}
                      <Calendar
                        current={format(monthDate, 'yyyy-MM-dd')}
                        hideArrows
                        hideExtraDays
                        disableMonthChange
                        firstDay={1}
                        onDayPress={(day) => {
                          setCurrentDate(day.dateString);
                          dispatch(setCalendarMode('day'));
                          dispatch(setDateFilter(day.dateString));
                          setValue('dateFilter', day.dateString);
                        }}
                        theme={{
                          'stylesheet.calendar.header': {
                            header: { height: 0 },
                            dayHeader: { height: 0, opacity: 0 },
                            week: { marginTop: 0 },
                          },

                          'stylesheet.day.basic': {
                            base: {
                              height: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                          },

                          textDayFontFamily: 'Poppins_400Regular',
                          textDayFontSize: 11,
                          todayTextColor: Colors.calendarPrimary,
                          selectedDayBackgroundColor: Colors.calendarPrimary,
                          selectedDayTextColor: '#fff',
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

        </>
      )}

      {/* ZAWARTOŚĆ - HARMONOGRAM - USUNIĘTE (teraz tylko calendar i tasks) */}

      <CalendarFiltersModal
        visible={calendarFiltersVisible}
        onClose={() => {
          setCalendarFiltersVisible(false);
        }}
        onFilterPress={() => {}}
        filters={baseFilters}
        control={control}
        calendarType={viewMode}
        setValue={setValue}
      />

      <Spinner
        visible={loading || tasks === null}
        textContent="Ładowanie zadań..."
        textStyle={{ color: Colors.gray }}
      />

      <FloatingActionButton
        onPress={() => (navigation as any).navigate('AddForm')}
        backgroundColor={Colors.calendarPrimary}
      />
    </View>
  );
}

export default CalendarTab;

// ===== STYLE =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // GŁÓWNY NAGŁÓWEK
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 32,
    color: Colors.black,
    fontWeight: '300',
  },
  mainHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  swipeHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: Colors.white,
  },
  swipeHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c0c0c0',
  },
  filterButton: {
    padding: 8,
  },
  filterButtonText: {
    fontSize: 24,
    color: Colors.black,
  },
  // PRZYCISKI TRYBU KALENDARZA
  modeButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    justifyContent: 'space-around',
  },
  modeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  modeButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonCircleActive: {
    backgroundColor: Colors.calendarPrimary,
  },
  modeButtonIcon: {
    fontSize: 28,
    color: '#666',
  },
  modeButtonIconActive: {
    color: Colors.white,
  },
  modeButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#000',
  },
  // ZAKŁADKI
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  tabTextActive: {
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF6B35',
  },
  // TYDZIEŃ - NOWE STYLE
  newWeekHeader: {
    backgroundColor: Colors.white,
    paddingTop: 4,
    paddingBottom: 2,
  },
  newWeekRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  newWeekDay: {
    flex: 1,                 // ❗ RÓWNE SEGMENTY
    alignItems: 'center',
    justifyContent: 'center',
  },
  newWeekDayName: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
  },
  newWeekDayNameSelected: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  newWeekDayCircle: {
    width: 40,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  newWeekDayCircleSelected: {
    backgroundColor: Colors.calendarPrimary,
  },
  newWeekDayNumber: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
  },
  newWeekDayNumberSelected: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  // TIMELINE Z KOLUMNAMI
  columnTimelineContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    minWidth: '100%',
  },
  horizontalScrollContent: {
    flexGrow: 1,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#d0d0d0',
    backgroundColor: Colors.white,
  },
  timeColumnHeader: {
    width: 70,
    height: 50,
  },
  ekipaColumnHeader: {
    width: 150,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  ekipaColumnHeaderSimple: {
    width: 150,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  ekipaHeaderText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  columnTimelineRow: {
    flexDirection: 'row',
    minHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  simpleTimelineRow: {
    flexDirection: 'row',
    minHeight: 100,
  },
  columnTimeCell: {
    width: 70,
    paddingTop: 8,
    paddingLeft: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
  },
  columnTimeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  ekipaTaskColumn: {
    width: 150,
    padding: 8,
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  ekipaTaskColumnSimple: {
    width: 150,
    padding: 8,
    gap: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  // KARTY ZADAŃ
  columnTaskCard: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
  },
  columnTaskType: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  columnTaskTitle: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    flex: 1,
  },
  groupedTaskCard: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  groupedTaskText: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    textAlign: 'center',
  },
  // POZOSTAŁE STYLE
  eventRight: {
    marginLeft: 'auto',
  },
  eventTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.white,
  },
  eventNotes: {
    fontStyle: 'italic',
    color: Colors.grayText,
    fontSize: 12,
    marginTop: 2,
  },
  eventStatusTitle: {
    fontSize: 12,
  },
  eventStatusChip: {
    padding: 0,
    marginTop: 5,
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
    textAlign: 'center',
  },
  modalButtonGroup: {
    flexDirection: 'column',
    marginTop: 10,
    gap: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.calendarPrimary,
  },
  cancelButton: {
    backgroundColor: Colors.gray,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  // WIDOK MIESIĄC
  monthlyCalendarContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  monthNavigation: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
  },
  dayViewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  dayViewHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },
  weekHeaderWithNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },

  orangeTopBorder: {
    height: 2,
    backgroundColor: Colors.calendarPrimary,
    width: '100%',
  },
  weekNavButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavArrow: {
    fontSize: 32,
    color: Colors.calendarPrimary,
    fontWeight: '300',
  },
  dayViewDateText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  dayViewTimelineContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  calendarFilterInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: Colors.white,
    fontFamily: 'Archivo_400Regular',
    fontSize: 14,
    color: Colors.black,
  },
  monthEventsListContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 10,
  },
  // TABELA MIESIĄCA
  monthTableContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  monthTable: {
    flex: 1,
  },
  monthTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
    backgroundColor: '#fff',
  },
  monthTableDateColumn: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
  },
  monthTableTeamColumn: {
    width: 150,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTableTeamHeader: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  monthTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 80,
  },
  monthTableDateCell: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    justifyContent: 'center',
  },
  monthTableDateCellToday: {
    backgroundColor: '#fff5f5',
  },
  monthTableDayName: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  monthTableDayNameToday: {
    color: Colors.calendarPrimary,
  },
  monthTableDate: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    marginTop: 2,
  },
  monthTableDateToday: {
    color: Colors.calendarPrimary,
  },
  monthTableTaskCell: {
    width: 150,
    padding: 8,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  monthTableTaskCard: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
  },
  monthTableTaskType: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  monthTableTaskTitle: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    flex: 1,
  },
  monthDaySection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthDayHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  monthDayHeaderToday: {
    backgroundColor: Colors.calendarPrimary,
  },
  monthDayName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  monthDayNameToday: {
    color: Colors.white,
  },
  monthDayDate: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    marginTop: 2,
  },
  monthDayDateToday: {
    color: Colors.white,
  },
  monthDayTimeline: {
    height: 600,
    backgroundColor: Colors.white,
  },
  // WIDOK TYDZIEŃ
  weekViewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  expandHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  expandHandle: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c0c0c0',
  },
  // TABELA TYGODNIA
  weekTableContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  weekTable: {
    flex: 1,
  },
  weekTableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
    backgroundColor: '#fff',
  },
  weekTableDateColumn: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
  },
  weekTableTeamColumn: {
    width: 150,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekTableTeamHeader: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  weekTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 80,
  },
  weekTableDateCell: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#d0d0d0',
    justifyContent: 'center',
  },
  weekTableDayName: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  weekTableDayNameToday: {
    color: Colors.calendarPrimary,
  },
  weekTableDate: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    marginTop: 2,
  },
  weekTableDateToday: {
    color: Colors.calendarPrimary,
  },
  weekTableTaskCell: {
    width: 150,
    padding: 8,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  weekTableTaskCard: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 4,
  },
  weekTableTaskType: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  weekTableTaskTitle: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    flex: 1,
  },
  tasksPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  tasksPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
  },
  // WIDOK ROCZNY
  yearViewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  yearViewScrollContainer: {
    flex: 1,
  },
  yearViewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  yearMonthContainer: {
    width: '50%',
    padding: 4,
  },
  yearMonthTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  // PUSTY TIMELINE
  emptyTimelineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTimelineText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
  },

  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
  },

  yearMonthCell: {
    width: '50%',        // 🔥 2 kolumny
    padding: 0,
  },

  yearMonthTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    textAlign: 'left',   // 🔥 DO LEWEJ
    marginBottom: 4,
  },

  yearLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },

  yearMonthCell: {
    width: '50%',          // 2 kolumny
    padding: 8,
  },

  yearMonthTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    textAlign: 'left',
    marginBottom: 4,
  },

  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },

  dayEllipse: {
    width: 44,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayEllipseActive: {
    backgroundColor: Colors.calendarPrimary,
  },

  dayEllipseName: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
    marginBottom: 2,
  },

  dayEllipseNameActive: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },

  dayEllipseNumber: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#000',
  },

  dayEllipseNumberActive: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },

  modeButtonsDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginTop: 30,
    marginBottom: 10,
  },

  // PUSTY TIMELINE
  emptyTimelineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: '#FAFAFA',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyTimelineText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});