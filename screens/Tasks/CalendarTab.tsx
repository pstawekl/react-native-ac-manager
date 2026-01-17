/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigation } from '@react-navigation/native';
import { Button, Chip, Text } from '@rneui/themed';
import { format } from 'date-fns';
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
} from 'react-native-reanimated';

import { useForm, useWatch } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import ButtonsHeader from '../../components/ButtonsHeader';
// import CalendarModeSelector from '../../components/CalendarModeSelector'; // Zakomentowane - może się przydać później
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
import { filtersStateToFilterArray } from './filterUtils';

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

type FilterOption = {
  label: string;
  value: string;
};

type FilterTypes =
  | 'dateSort'
  | 'dateFilter'
  // | 'yearFilter'
  | 'taskType'
  | 'taskStatus'
  | 'taskGroup';

// Funkcje pomocnicze do generowania opcji daty
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
  // Znajdź pierwszy poniedziałek roku
  const firstMonday = new Date(startDate);
  const dayOfWeek = firstMonday.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  firstMonday.setDate(startDate.getDate() + diff);

  // Generuj tygodnie do końca roku
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

// Funkcje pomocnicze do formatowania dat - przeniesione poza komponent dla lepszej wydajności
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

const formatPolishMonth = (date: Date) => {
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
  calendarType: 'day' | 'week' | 'month';
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

  // Konwertuj taskTypeValue na tablicę jeśli nie jest tablicą
  const selectedTaskTypes = useMemo(() => {
    if (Array.isArray(taskTypeValue)) {
      return taskTypeValue;
    }
    if (taskTypeValue && typeof taskTypeValue === 'string') {
      return [taskTypeValue];
    }
    return [];
  }, [taskTypeValue]);

  // Generuj opcje daty w zależności od typu kalendarza
  const dateOptions = useMemo(() => {
    switch (calendarType) {
      case 'day':
        return generateDayOptions(currentYear);
      case 'week':
        return generateWeekOptions(currentYear);
      case 'month':
        return generateMonthOptions(currentYear);
      default:
        return [];
    }
  }, [calendarType, currentYear]);

  // Ustaw wartość filtra daty gdy modal się otwiera lub zmienia się typ kalendarza
  // Użyj wartości z Redux jeśli istnieje, w przeciwnym razie użyj domyślnej
  useEffect(() => {
    if (visible) {
      const getDefaultDateFilter = (mode: 'day' | 'week' | 'month'): string => {
        const today = new Date();
        switch (mode) {
          case 'day':
            return format(today, 'yyyy-MM-dd');
          case 'week': {
            // Znajdź pierwszy dzień tygodnia (poniedziałek)
            const monday = new Date(today);
            const day = monday.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            monday.setDate(today.getDate() + diff);
            return format(monday, 'yyyy-MM-dd');
          }
          case 'month':
            return format(today, 'yyyy-MM');
          default:
            return '';
        }
      };

      // Użyj wartości z Redux jeśli istnieje, w przeciwnym razie użyj domyślnej
      const dateFilterValue =
        calendarFilters.dateFilter || getDefaultDateFilter(calendarType);
      setValue('dateFilter', dateFilterValue);

      // Ustaw również pozostałe wartości z Redux
      setValue('dateSort', calendarFilters.dateSort || 'nearest');
      setValue('taskType', calendarFilters.taskType || []);
      setValue('taskStatus', calendarFilters.taskStatus || 'wszystkie');
      setValue('taskGroup', calendarFilters.taskGroup || []);
    }
  }, [visible, calendarType, calendarFilters, setValue]);

  // Load teams and employees only once when modal becomes visible
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

  // Compute ekipa options directly based on selectedTaskTypes
  const ekipaOptions = useMemo(() => {
    const unassignedOption = {
      label: 'Nieprzydzielone',
      value: 'nieprzydzielone',
    };

    // Jeśli nie wybrano żadnego typu lub wybrano wszystkie typy
    if (selectedTaskTypes.length === 0) {
      return [unassignedOption, ...teamOptions, ...employeeOptions];
    }

    // Sprawdź czy wybrane typy zawierają typy wymagające ekip lub pracowników
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

  // Memoizuj handleSubmit
  const handleSubmit = useCallback(() => {
    const formValues = control._formValues;

    // Aktualizuj Redux state bezpośrednio
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

    // Dla kompatybilności wstecznej - konwertuj na Filter[] i wywołaj callback
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
                  : 'Miesiąc'}
            </Text>
            <Dropdown
              name="dateFilter"
              control={control}
              options={dateOptions}
            />
            {/* Ukryty filtr "Sortuj wg." - zakomentowany na żądanie */}
            {/* <Text style={calendarClientStyles.label}>Sortuj wg.</Text>
            <Dropdown
              name="dateSort"
              control={control}
              options={[
                { label: 'Data (Najbliższa)', value: 'nearest' },
                { label: 'Data (Najdalsza)', value: 'farthest' },
              ]}
            /> */}
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

      {/* Modal do dodawania nowego typu zadania */}
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
                    // TODO: Wywołać API backend do zapisania nowego typu
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

type Filters = {
  dateFilter: string;
  dateSort: string;
  // yearFilter: string | null;
  taskType: (string | number)[];
  taskStatus: string;
  taskGroup: (string | number)[];
};

type CalendarTabProps = {
  appliedFilters: Filter[];
  setAppliedFilters: (filters: Filter[]) => void;
};

function CalendarTab({ appliedFilters, setAppliedFilters }: CalendarTabProps) {
  const dispatch = useDispatch();
  const calendarFilters = useSelector(
    (state: RootState) => state.calendarFilters,
  );
  const viewMode = calendarFilters.calendarMode;
  const navigation = useNavigation();
  const [calendarFiltersVisible, setCalendarFiltersVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [eventTasks, setEventTasks] = useState<any>();
  const { result: tasks, loading, execute } = useTasks();
  const prevEventTasksByDateRef = useRef<string>('');

  // Funkcja do generowania domyślnej wartości filtra daty w zależności od typu kalendarza
  const getDefaultDateFilter = (mode: 'day' | 'week' | 'month'): string => {
    const today = new Date();
    switch (mode) {
      case 'day':
        return format(today, 'yyyy-MM-dd');
      case 'week': {
        // Znajdź pierwszy dzień tygodnia (poniedziałek)
        const monday = new Date(today);
        const day = monday.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        monday.setDate(today.getDate() + diff);
        return format(monday, 'yyyy-MM-dd');
      }
      case 'month':
        return format(today, 'yyyy-MM');
      default:
        return '';
    }
  };

  const { control, setValue } = useForm<Filters>({
    defaultValues: {
      dateFilter: calendarFilters.dateFilter || getDefaultDateFilter(viewMode),
      dateSort: calendarFilters.dateSort || 'nearest',
      // yearFilter: undefined,
      taskType: calendarFilters.taskType || [],
      taskStatus: calendarFilters.taskStatus || 'wszystkie',
      taskGroup: calendarFilters.taskGroup || [],
    },
  });

  // Synchronizuj formularz z Redux state
  useEffect(() => {
    setValue(
      'dateFilter',
      calendarFilters.dateFilter || getDefaultDateFilter(viewMode),
    );
    setValue('dateSort', calendarFilters.dateSort || 'nearest');
    setValue('taskType', calendarFilters.taskType || []);
    setValue('taskStatus', calendarFilters.taskStatus || 'wszystkie');
    setValue('taskGroup', calendarFilters.taskGroup || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    calendarFilters.dateFilter,
    calendarFilters.dateSort,
    calendarFilters.taskType,
    calendarFilters.taskStatus,
    calendarFilters.taskGroup,
    viewMode,
  ]);

  // Synchronizuj currentDate z dateFilter dla widoku tygodnia
  useEffect(() => {
    if (viewMode === 'week' && calendarFilters.dateFilter) {
      // dateFilter dla tygodnia to pierwszy dzień tygodnia (poniedziałek)
      setCurrentDate(calendarFilters.dateFilter);
    } else if (viewMode === 'day' && calendarFilters.dateFilter) {
      // dateFilter dla dnia to konkretna data
      setCurrentDate(calendarFilters.dateFilter);
    } else if (viewMode === 'month' && calendarFilters.dateFilter) {
      // dateFilter dla miesiąca to format yyyy-MM, ustawiamy pierwszy dzień miesiąca
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

  // Formularz do zarządzania typem kalendarza przez dropdown
  const calendarModeForm = useForm<{ calendarMode: 'day' | 'week' | 'month' }>({
    defaultValues: {
      calendarMode: 'month',
    },
  });

  const selectedCalendarMode = useWatch({
    control: calendarModeForm.control,
    name: 'calendarMode',
  });

  // Synchronizuj viewMode z wartością z formularza i aktualizuj domyślny filtr daty
  useEffect(() => {
    if (selectedCalendarMode) {
      dispatch(setCalendarMode(selectedCalendarMode));
      // Ustaw domyślną wartość filtra daty dla nowego typu kalendarza
      const defaultDate = getDefaultDateFilter(selectedCalendarMode);
      dispatch(setDateFilter(defaultDate));
      setValue('dateFilter', defaultDate);
    }
  }, [selectedCalendarMode, setValue, dispatch]);

  // Synchronizuj formularz z viewMode przy inicjalizacji - tylko raz przy mount
  useEffect(() => {
    calendarModeForm.setValue('calendarMode', viewMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const baseFilters = useMemo<Filter[]>(() => {
    return filtersStateToFilterArray(calendarFilters);
  }, [calendarFilters]);

  // Animowane wartości
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);

  // Funkcje do zmiany miesiąca z animacją - zmemoizowane
  const changeMonthWithAnimation = useCallback(
    (direction: 'next' | 'prev') => {
      // Animacja wyjścia - kalendarz znika z małym przesunięciem
      fadeAnim.value = withTiming(0, { duration: 200 });
      slideAnim.value = withTiming(direction === 'next' ? -30 : 30, {
        duration: 200,
      });

      // Po animacji wyjścia, zmień miesiąc i animuj wejście
      setTimeout(() => {
        const currentDateObj = new Date(currentDate);
        if (direction === 'next') {
          currentDateObj.setMonth(currentDateObj.getMonth() + 1);
        } else {
          currentDateObj.setMonth(currentDateObj.getMonth() - 1);
        }

        // Upewnij się, że dzień jest prawidłowy dla nowego miesiąca
        // Jeśli dzień nie istnieje w nowym miesiącu (np. 31 lutego), ustaw na 1
        const maxDaysInMonth = new Date(
          currentDateObj.getFullYear(),
          currentDateObj.getMonth() + 1,
          0,
        ).getDate();
        if (currentDateObj.getDate() > maxDaysInMonth) {
          currentDateObj.setDate(1);
        }

        setCurrentDate(format(currentDateObj, 'yyyy-MM-dd'));

        // Reset pozycji dla animacji wejścia - kalendarz wchodzi z przeciwnej strony
        slideAnim.value = direction === 'next' ? 30 : -30;

        // Animacja wejścia - kalendarz pojawia się płynnie
        fadeAnim.value = withTiming(1, { duration: 200 });
        slideAnim.value = withTiming(0, { duration: 200 });
      }, 200);
    },
    [currentDate, fadeAnim, slideAnim],
  );

  // Obsługa gestów swipe - zmemoizowane
  const onSwipeGesture = useCallback(
    (event: any) => {
      const { translationX, state } = event.nativeEvent;

      // Sprawdzamy czy gest się zakończył
      if (state === State.END) {
        const minSwipeDistance = 50;

        if (Math.abs(translationX) > minSwipeDistance) {
          if (translationX > 0) {
            // Swipe w prawo - poprzedni miesiąc
            changeMonthWithAnimation('prev');
          } else {
            // Swipe w lewo - następny miesiąc
            changeMonthWithAnimation('next');
          }
        }
      }
    },
    [changeMonthWithAnimation],
  );

  // Pobierz zadania tylko raz przy mount - nie przy każdej zmianie execute
  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zmemoizuj filtrowanie i przetwarzanie zadań
  // Używamy szczegółowych wartości z calendarFilters zamiast całego obiektu
  const { filteredTasks, eventTasksByDate } = useMemo(() => {
    if (!tasks) {
      return { filteredTasks: [], eventTasksByDate: {} };
    }

    let filteredTasks = [...tasks];

    // Apply filters from Redux - użyj wartości bezpośrednio
    const { dateFilter } = calendarFilters;
    const { dateSort } = calendarFilters;
    const { taskType } = calendarFilters;
    const { taskStatus } = calendarFilters;
    const { taskGroup } = calendarFilters;

    // Apply dateFilter
    if (dateFilter && dateFilter.trim() !== '') {
      const filterDate = dateFilter;
      if (viewMode === 'day') {
        // Filtruj po konkretnym dniu
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = format(new Date(task.start_date), 'yyyy-MM-dd');
          return taskDate === filterDate;
        });
      } else if (viewMode === 'week') {
        // Filtruj po tygodniu (zadania w zakresie tygodnia)
        const weekStart = new Date(filterDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredTasks = filteredTasks.filter(task => {
          const taskDate = new Date(task.start_date);
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
      } else if (viewMode === 'month') {
        // Filtruj po miesiącu
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

    // Apply taskType filter
    if (taskType && taskType.length > 0) {
      filteredTasks = filteredTasks.filter(task =>
        taskType.some(
          (val: string | number) =>
            val.toString().toLowerCase() === task.typ?.toLowerCase(),
        ),
      );
    }

    // Apply taskStatus filter
    if (taskStatus && taskStatus !== 'wszystkie') {
      filteredTasks = filteredTasks.filter(task => task.status === taskStatus);
    }

    // Apply taskGroup filter
    if (taskGroup && taskGroup.length > 0) {
      filteredTasks = filteredTasks.filter(task => {
        // Sprawdź czy zadanie jest nieprzydzielone i czy "nieprzydzielone" jest wybrane
        if (!task.grupa) {
          return taskGroup.includes('nieprzydzielone');
        }
        // Sprawdź czy grupa zadania jest w wybranej liście
        return taskGroup.some(
          (val: string | number) =>
            val.toString() === task.grupa?.toString() || val === task.grupa,
        );
      });
    }

    // Apply dateSort
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
          id: task.id, // Dodane id
          start: task.start_date,
          end: task.end_date || task.start_date, // Używaj end_date jeśli istnieje
          title: task.nazwa,
          summary: `${task.typ} - ${task.nazwa}`, // Dodane summary
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

  // Ustaw eventTasks tylko gdy się zmieni - użyj useRef do przechowywania poprzedniej wartości
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

  // Animowany styl dla kalendarza
  const animatedCalendarStyle = useAnimatedStyle(() => {
    'worklet';

    return {
      opacity: fadeAnim.value,
      transform: [{ translateX: slideAnim.value }] as any,
    };
  });

  // Przygotowanie markedDates dla kalendarza
  const markedDates = useMemo(() => {
    if (!eventTasks) return {};

    const marked: any = {};

    Object.keys(eventTasks).forEach(date => {
      const dayTasks = eventTasks[date];
      if (dayTasks && dayTasks.length > 0) {
        // Sprawdź czy jakieś zadanie jest wykonane
        const hasCompletedTask = dayTasks.some(
          (task: any) => task.status === 'wykonane',
        );
        const hasIncompleteTask = dayTasks.some(
          (task: any) => task.status === 'niewykonane',
        );

        marked[date] = {
          marked: true,
          // Główna kropka - kolor według statusu najważniejszego zadania
          dotColor: hasCompletedTask
            ? Colors.statusDone
            : hasIncompleteTask
              ? Colors.statusNotDone
              : Colors.statusPlanned,
          // Dla dni z wieloma zadaniami - dodaj wyróżnienie
          ...(dayTasks.length > 1 && {
            selected: true,
            selectedColor: `${Colors.calendarPrimary}20`,
            selectedTextColor: Colors.calendarPrimary,
          }),
        };
      }
    });

    return marked;
  }, [eventTasks]);

  return (
    <View style={styles.container}>
      <View style={styles.calendarHeader}>
        <ButtonsHeader
          // onBackPress={navigation.goBack}
          onFilterPress={() => setCalendarFiltersVisible(true)}
        />
        <View style={styles.calendarModeDropdown}>
          <Dropdown
            name="calendarMode"
            control={calendarModeForm.control}
            options={[
              { label: 'Dzień', value: 'day' },
              { label: 'Tydzień', value: 'week' },
              { label: 'Miesiąc', value: 'month' },
            ]}
            customWidth={150}
            isSmall
          />
        </View>
        {/* Zakomentowany stary switch - może się przydać później
        <CalendarModeSelector
          selectedMode={viewMode}
          onModeChange={mode => dispatch(setCalendarMode(mode))}
        />
        */}
        {/* Active filters display */}
        {/* TODO: Uncomment in future if needed
        {baseFilters.length > 0 && (
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScrollContainer}
            >
              {appliedFilters
                .filter(filter => filter.value && filter.value !== 'wszystkie' && filter.value !== 'nearest' && filter.value !== '' && filter.value.trim() !== '')
                .map((filter, index) => (
                  <Chip
                    key={index}
                    title={`${getFilterLabel(filter.type)}: ${getFilterValueLabel(filter.type, filter.value)}`}
                    size="sm"
                    buttonStyle={styles.filterChip}
                    titleStyle={styles.filterChipText}
                    onPress={() => removeFilter(filter)}
                  />
                ))}
            </ScrollView>
          </View>
        )}
        */}
      </View>
      {/* Renderuj kalendarz tylko gdy dane są załadowane */}
      {!loading && tasks !== null && (
        <>
          {viewMode === 'day' && (
            <CalendarProvider date={currentDate} showTodayButton>
              <>
                {/* Timeline view dla dziennego widoku - zawsze wyświetlany */}
                <View style={styles.timelineContainer}>
                  {/* Header z tygodniem */}
                  <View style={styles.weekHeader}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.weekScrollContainer}
                    >
                      {getWeekDays(currentDate).map((day, index) => {
                        const dayString = format(day, 'yyyy-MM-dd');
                        const isSelected = dayString === currentDate;
                        const isToday =
                          dayString === format(new Date(), 'yyyy-MM-dd');
                        const hasTask =
                          eventTasks &&
                          eventTasks[dayString] &&
                          eventTasks[dayString].length > 0;

                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.weekDay,
                              isSelected && styles.weekDaySelected,
                              isToday && !isSelected && styles.weekDayToday,
                            ]}
                            onPress={() => setCurrentDate(dayString)}
                          >
                            <Text
                              style={[
                                styles.weekDayName,
                                isSelected && styles.weekDayNameSelected,
                              ]}
                            >
                              {formatWeekDay(day)}
                            </Text>
                            <Text
                              style={[
                                styles.weekDayNumber,
                                isSelected && styles.weekDayNumberSelected,
                                hasTask &&
                                !isSelected &&
                                styles.weekDayNumberWithTask,
                              ]}
                            >
                              {format(day, 'dd')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Timeline z godzinami */}
                  <ScrollView style={styles.timelineScrollView}>
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                      // Znajdź zadania dla tej godziny (jeśli istnieją)
                      const tasksAtHour =
                        eventTasks && eventTasks[currentDate]
                          ? eventTasks[currentDate].filter((task: any) => {
                            // Sprawdź czy task.start jest prawidłowy
                            if (
                              !task.start ||
                              isNaN(new Date(task.start).getTime())
                            ) {
                              console.warn(
                                'Nieprawidłowa data zadania:',
                                task,
                              );
                              return false;
                            }
                            const taskHour = new Date(task.start).getHours();
                            return taskHour === hour;
                          })
                          : [];

                      return (
                        <View key={hour} style={styles.timelineHour}>
                          {/* Godzina po lewej */}
                          <View style={styles.timelineHourLabel}>
                            <Text style={styles.timelineHourText}>
                              {hour}:00
                            </Text>
                          </View>

                          {/* Linia czasowa */}
                          <View style={styles.timelineHourContent}>
                            <View style={styles.timelineHourLine} />

                            {/* Zadania w tej godzinie (jeśli istnieją) */}
                            {tasksAtHour.map((task: any, index: number) => (
                              <TouchableOpacity
                                key={`${hour}-${index}`}
                                style={[
                                  styles.timelineTask,
                                  { backgroundColor: `${task.color}20` },
                                ]}
                                onPress={() => {
                                  const originalTask = tasks?.find(
                                    t => t.id === task.id,
                                  );
                                  if (originalTask) {
                                    (navigation as any).navigate(
                                      'TaskDetails',
                                      {
                                        task: originalTask,
                                      },
                                    );
                                  } else {
                                    Alert.alert(
                                      'Błąd',
                                      'Nie znaleziono oryginalnego zadania',
                                    );
                                  }
                                }}
                              >
                                <Text style={styles.timelineTaskTitle}>
                                  {task.title}
                                </Text>
                                <Text style={styles.timelineTaskType}>
                                  {task.type}
                                </Text>
                                <Text style={styles.timelineTaskTime}>
                                  {task.start &&
                                    !isNaN(new Date(task.start).getTime())
                                    ? format(new Date(task.start), 'HH:mm')
                                    : 'Brak czasu'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Zachowaj Timeline jako backup
              <Timeline
                styles={timelineProps.styles}
                events={eventTasks[currentDate] || []}
                showNowIndicator={false}
                onEventPress={event => {
                  (navigation as any).navigate('AddForm', { event });
                  setCurrentDate(event.start);
                  dispatch(setCalendarMode('day'));
                }}
              /> */}
                {/* <WeekCalendar showScrollIndicator={false} />
              <TimelineList
                events={eventTasks}
                timelineProps={timelineProps}
                showNowIndicator={false}
                initialTime={{ hour: 9, minutes: 0 }}
              /> */}
              </>
            </CalendarProvider>
          )}
          {viewMode === 'week' && (
            <View style={styles.weekViewContainer}>
              {/* Wiersze z dniami tygodnia */}
              <ScrollView style={styles.weekViewScroll}>
                {getWeekDays(currentDate).map((day, dayIndex) => {
                  const dayString = format(day, 'yyyy-MM-dd');
                  const isToday =
                    dayString === format(new Date(), 'yyyy-MM-dd');
                  const dayName = formatWeekDay(day);
                  const dayNumber = format(day, 'dd');
                  const monthName = formatPolishMonth(day);
                  const dayTasks =
                    eventTasks && eventTasks[dayString]
                      ? [...eventTasks[dayString]].sort((a: any, b: any) => {
                        const timeA = a.start
                          ? new Date(a.start).getTime()
                          : 0;
                        const timeB = b.start
                          ? new Date(b.start).getTime()
                          : 0;
                        return timeA - timeB;
                      })
                      : [];

                  return (
                    <View
                      key={dayIndex}
                      style={[
                        styles.weekViewDayRow,
                        isToday && styles.weekViewDayRowToday,
                      ]}
                    >
                      {/* Header dnia */}
                      <View style={styles.weekViewDayRowHeader}>
                        <Text style={styles.weekViewDayName}>{dayName}</Text>
                        <Text style={styles.weekViewDayNumber}>
                          {dayNumber}
                        </Text>
                        <Text style={styles.weekViewDayMonth}>{monthName}</Text>
                      </View>

                      {/* Zadania dla tego dnia - poziomy scroll */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.weekViewDayTasksRow}
                        contentContainerStyle={
                          styles.weekViewDayTasksRowContent
                        }
                      >
                        {dayTasks.length > 0 ? (
                          dayTasks.map((task: Task, taskIndex: number) => (
                            <TouchableOpacity
                              key={task.id}
                              style={styles.weekViewTaskItem}
                              onPress={() => {
                                const originalTask = tasks?.find(
                                  t => t.id === task.id,
                                );
                                if (originalTask) {
                                  (navigation as any).navigate('TaskDetails', {
                                    task: originalTask,
                                  });
                                } else {
                                  Alert.alert(
                                    'Błąd',
                                    'Nie znaleziono oryginalnego zadania',
                                  );
                                }
                              }}
                            >
                              <View style={styles.weekViewTaskHeader}>
                                <Text style={styles.weekViewTaskTime}>
                                  {task.start &&
                                    !Number.isNaN(new Date(task.start).getTime())
                                    ? format(new Date(task.start), 'HH:mm')
                                    : 'Brak czasu'}
                                </Text>
                                <Chip
                                  title={task.type}
                                  size="sm"
                                  buttonStyle={styles.weekViewTaskTypeChip}
                                  titleStyle={styles.weekViewTaskTypeText}
                                />
                              </View>
                              <Text
                                style={styles.weekViewTaskTitle}
                                numberOfLines={2}
                              >
                                {task.title}
                              </Text>
                              {task.notatki && task.notatki.trim() !== '' && (
                                <Text
                                  style={styles.weekViewTaskNotes}
                                  numberOfLines={2}
                                >
                                  {task.notatki}
                                </Text>
                              )}
                            </TouchableOpacity>
                          ))
                        ) : (
                          <View style={styles.weekViewEmptyDay}>
                            <Text style={styles.weekViewEmptyDayText}>
                              Brak zadań
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
          {viewMode === 'month' && (
            <View style={styles.monthlyCalendarContainer}>
              {/* Tytuł miesiąca - bez przycisków nawigacji */}
              <View style={styles.monthNavigation}>
                <Animated.Text
                  style={[styles.monthTitle, animatedCalendarStyle]}
                >
                  {formatPolishDate(new Date(currentDate))}
                </Animated.Text>
              </View>

              <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
                <Animated.View style={animatedCalendarStyle}>
                  <Calendar
                    key={format(new Date(currentDate), 'yyyy-MM')} // Wymusza re-render przy zmianie miesiąca
                    current={currentDate}
                    minDate="2020-01-01"
                    maxDate="2030-12-31"
                    markedDates={markedDates}
                    onDayPress={(day: any) => {
                      setCurrentDate(day.dateString);
                      dispatch(setCalendarMode('day'));
                    }}
                    theme={{
                      todayTextColor: Colors.white,
                      todayBackgroundColor: Colors.calendarPrimary,
                      selectedDayBackgroundColor: Colors.calendarTimelineTask,
                      arrowColor: 'transparent', // Ukrywamy strzałki bo mamy własne
                      monthTextColor: 'transparent', // Ukrywamy tytuł bo mamy własny
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
            </View>
          )}
        </>
      )}
      <CalendarFiltersModal
        visible={calendarFiltersVisible}
        onClose={() => {
          setCalendarFiltersVisible(false);
        }}
        onFilterPress={() => { }} // Redux actions są już wywoływane w handleSubmit
        filters={baseFilters}
        control={control}
        calendarType={viewMode}
        setValue={setValue}
      />
      {/* Spinner widoczny tylko podczas ładowania danych */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  buttonsHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  calendarHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
  },
  calendarModeDropdown: {
    minWidth: 150,
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
  monthlyCalendarContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
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
  // Style dla widoku dziennego
  dailyTasksContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  dailyTasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  tasksList: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskContent: {
    flex: 1,
    paddingRight: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
  },
  taskNotes: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 5,
    fontStyle: 'italic',
  },
  taskTime: {
    fontSize: 12,
    color: Colors.calendarPrimary,
    marginTop: 5,
    fontWeight: 'bold',
  },
  taskStatusChip: {
    padding: 5,
    borderRadius: 15,
  },
  taskStatusTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  noTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  noTasksText: {
    fontSize: 16,
    color: Colors.grayText,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  // Style dla timeline view
  timelineContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  timelineHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.gray}30`,
    backgroundColor: Colors.white,
  },
  timelineDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  timelineScrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  timelineHour: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  timelineHourLabel: {
    width: 60,
    paddingTop: 8,
    paddingLeft: 15,
    backgroundColor: Colors.white,
  },
  timelineHourText: {
    fontSize: 14,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
  },
  timelineHourContent: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 5,
    position: 'relative',
  },
  timelineHourLine: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 15,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  timelineTask: {
    backgroundColor: `${Colors.calendarPrimary}20`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.calendarPrimary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineTaskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  timelineTaskType: {
    fontSize: 12,
    color: Colors.calendarPrimary,
    fontFamily: 'Poppins_400Regular',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  timelineTaskTime: {
    fontSize: 12,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
  },
  // Style dla widoku tygodnia
  weekHeader: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.gray}30`,
    paddingVertical: 10,
  },
  weekScrollContainer: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  weekDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    minWidth: 50,
  },
  weekDaySelected: {
    backgroundColor: Colors.calendarPrimary,
  },
  weekDayToday: {
    backgroundColor: `${Colors.calendarPrimary}20`,
  },
  weekDayName: {
    fontSize: 12,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 4,
  },
  weekDayNameSelected: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  weekDayNumber: {
    fontSize: 16,
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
  },
  weekDayNumberSelected: {
    color: Colors.white,
  },
  weekDayNumberWithTask: {
    color: Colors.calendarPrimary,
    fontWeight: 'bold',
  },
  filtersContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filtersScrollContainer: {
    paddingRight: 10,
  },
  filterChip: {
    backgroundColor: Colors.calendarPrimary,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 5,
  },
  weekTimelineHour: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  weekTimelineDaysContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  weekTimelineDayColumn: {
    flex: 1,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  // Style dla nowego widoku tygodnia (dni jako wiersze)
  weekViewContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  weekViewScroll: {
    flex: 1,
  },
  weekViewDayRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  weekViewDayRowToday: {
    backgroundColor: `${Colors.calendarPrimary}10`,
  },
  weekViewDayRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
    gap: 8,
  },
  weekViewDayName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  weekViewDayNumber: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  weekViewDayMonth: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    textTransform: 'capitalize',
  },
  weekViewDayTasksRow: {
    flex: 1,
  },
  weekViewDayTasksRowContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  weekViewTaskItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.calendarPrimary,
    minWidth: 200,
    maxWidth: 250,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weekViewTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weekViewTaskTime: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
  },
  weekViewTaskTypeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  weekViewTaskTypeText: {
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.calendarPrimary,
  },
  weekViewTaskTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    marginBottom: 2,
  },
  weekViewTaskNotes: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    fontStyle: 'italic',
    marginTop: 2,
  },
  weekViewEmptyDay: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  weekViewEmptyDayText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
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
});
