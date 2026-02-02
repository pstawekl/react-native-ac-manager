/* eslint-disable camelcase */
import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { format, parseISO, isSameDay, isToday, isTomorrow } from 'date-fns';
import { pl } from 'date-fns/locale';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay';
import { useDispatch, useSelector } from 'react-redux';

import DropDownPicker from 'react-native-dropdown-picker';
import MultiSelectModal from '../../components/MultiSelectModal';
import { Button } from '@rneui/themed';

import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { TasksMenuScreenProps } from '../../navigation/types';
import useStaff from '../../providers/StaffProvider';
import useTasks, { Task } from '../../providers/TasksProvider';
import { RootState } from '../../store';
import {
  setDateSort,
  setTaskGroup,
  setTaskStatus,
  setTaskType,
} from '../../store/taskFiltersSlice';
import { Filter } from './TasksMenu';
import TaskCard from './TaskCard';

type FilterOption = {
  label: string;
  value: string;
};

type FilterTypes =
  | 'dateSort'
  // | 'yearFilter'
  | 'taskType'
  | 'taskStatus'
  | 'taskGroup';

// type Filter = {
//   name: string;
//   value: string;
//   type: FilterTypes;
// };

const addClientStyles = StyleSheet.create({
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

// TasksFiltersModal - zakomentowany, może się przydać później
// const TasksFiltersModal = memo(function TasksFiltersModal({
//   filters,
//   visible,
//   onClose,
//   onFilterPress,
//   control,
// }: {
//   filters: Filter[];
//   visible: boolean;
//   onClose: () => void;
//   onFilterPress: (filters: Filter[]) => void;
//   control: any;
// }) {
//   const dispatch = useDispatch();
//   const [selectedTaskType, setSelectedTaskType] = useState<string>('');
//   const [teamOptions, setTeamOptions] = useState<FilterOption[]>([]);
//   const [employeeOptions, setEmployeeOptions] = useState<FilterOption[]>([]);
//   const [hasLoadedData, setHasLoadedData] = useState<boolean>(false);

//   const { teams, getTeams, employees, getEmployees } = useStaff();
//   // const taskTypeValue = useWatch({ control, name: 'taskType' });

//   // Load teams and employees only once when modal becomes visible
//   useEffect(() => {
//     if (visible && !hasLoadedData) {
//       if (getTeams) {
//         getTeams();
//       }
//       if (getEmployees) {
//         getEmployees();
//       }
//       setHasLoadedData(true);
//     }
//     if (!visible) {
//       setHasLoadedData(false);
//     }
//   }, [visible]);
//
//   useEffect(() => {
//     if (teams && teams.length > 0) {
//       const options = teams.map(team => ({
//         label: team.nazwa,
//         value: team.id.toString(),
//       }));
//       setTeamOptions(options);
//     }
//   }, [teams]);
//
//   useEffect(() => {
//     if (employees && employees.employees && employees.employees.length > 0) {
//       const options = employees.employees.map(employee => ({
//         label: `${employee.first_name} ${employee.last_name}`,
//         value: employee.id.toString(),
//       }));
//       setEmployeeOptions(options);
//     }
//   }, [employees]);
//
//   useEffect(() => {
//     if (filters && filters.length > 0) {
//       // Ustaw wartości w formularzu na podstawie przekazanych filtrów
//       const taskTypeFilter = filters.find(f => f.type === 'taskType');
//       if (taskTypeFilter) {
//         setSelectedTaskType(taskTypeFilter.value);
//       }
//     }
//   }, [filters]);
//
//   // Update selectedTaskType when form value changes
//   useEffect(() => {
//     if (taskTypeValue) {
//       setSelectedTaskType(taskTypeValue);
//     }
//   }, [taskTypeValue]);
//
//   // Compute ekipa options directly based on selectedTaskType
//   const ekipaOptions = useMemo(() => {
//     const allOption = { label: 'Wszystkie', value: 'wszystkie' };
//
//     switch (selectedTaskType) {
//       case '':
//       case 'wszystkie':
//         return [allOption, ...teamOptions, ...employeeOptions];
//       case 'oględziny':
//       case 'montaż':
//         return [allOption, ...teamOptions];
//       case 'szkolenie':
//         return [allOption, ...employeeOptions];
//       default:
//         return [allOption];
//     }
//   }, [selectedTaskType, teamOptions, employeeOptions]);
//
//   // Memoizuj handleSubmit
//   const handleSubmit = useCallback(() => {
//     // Pobierz wartości z formularza i przekształć na filtry
//     const formValues = control._formValues; // Pobierz obecne wartości formularza
//
//     // Aktualizuj Redux state bezpośrednio
//     if (formValues.dateSort) {
//       dispatch(setDateSort(formValues.dateSort as string));
//     }
//     if (formValues.taskType) {
//       dispatch(setTaskType([formValues.taskType as string]));
//     }
//     if (formValues.taskStatus) {
//       dispatch(setTaskStatus(formValues.taskStatus as string));
//     }
//     if (formValues.taskGroup && formValues.taskGroup !== 'wszystkie') {
//       dispatch(setTaskGroup([formValues.taskGroup as string]));
//     } else {
//       dispatch(setTaskGroup([]));
//     }
//
//     // Dla kompatybilności wstecznej - konwertuj na Filter[] i wywołaj callback
//     const newFilters: Filter[] = [
//       {
//         name: 'dateSort',
//         value: formValues.dateSort || 'nearest',
//         type: 'dateSort',
//       },
//       // { name: 'yearFilter', value: formValues.yearFilter || '', type: 'yearFilter' },
//       { name: 'taskType', value: formValues.taskType || '', type: 'taskType' },
//       {
//         name: 'taskStatus',
//         value: formValues.taskStatus || 'wszystkie',
//         type: 'taskStatus',
//       },
//       {
//         name: 'taskGroup',
//         value: formValues.taskGroup || 'wszystkie',
//         type: 'taskGroup',
//       },
//     ];
//
//     if (onFilterPress) {
//       onFilterPress(newFilters);
//     }
//     onClose();
//   }, [control, onFilterPress, onClose, dispatch]);
//
//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={[styles.modalContent, addClientStyles.modalContent]}>
//           <View style={addClientStyles.headerButtonsStyles}>
//             <Text style={styles.modalTitle}>Filtry zadań</Text>
//           </View>
//           <ScrollView contentContainerStyle={addClientStyles.clientList}>
//             <Text style={addClientStyles.label}>Sortuj wg.</Text>
//             <Dropdown
//               name="dateSort"
//               control={control}
//               options={[
//                 { label: 'Data (Najbliższa)', value: 'nearest' },
//                 { label: 'Data (Najdalsza)', value: 'farthest' },
//               ]}
//             />
//             {/* <Text style={addClientStyles.label}>Rok</Text>
//             <DatePicker
//               name="yearFilter"
//               control={control}
//               mode="date"
//             /> */}
//             <Text style={addClientStyles.label}>Typ</Text>
//             <Dropdown
//               control={control}
//               name="taskType"
//               options={[
//                 { label: 'Wszystkie', value: '' },
//                 { label: 'Oględziny', value: 'oględziny' },
//                 { label: 'Montaż', value: 'montaż' },
//                 { label: 'Szkolenie', value: 'szkolenie' },
//               ]}
//             />
//             <Text style={addClientStyles.label}>Status</Text>
//             <Dropdown
//               control={control}
//               name="taskStatus"
//               options={[
//                 { label: 'Wszystkie', value: 'wszystkie' },
//                 { label: 'Wykonane', value: 'wykonane' },
//                 { label: 'Niewykonane', value: 'niewykonane' },
//                 { label: 'Zaplanowane', value: 'Zaplanowane' },
//               ]}
//             />
//             <Text style={addClientStyles.label}>Ekipa</Text>
//             <Dropdown
//               control={control}
//               name="taskGroup"
//               options={ekipaOptions}
//             />
//           </ScrollView>
//
//           <View style={styles.modalButtonGroup}>
//             <Button
//               title="Zastosuj"
//               buttonStyle={[styles.saveButton, styles.modalButton]}
//               onPress={handleSubmit}
//               titleStyle={styles.buttonText}
//             />
//             <Button
//               title="Anuluj"
//               buttonStyle={[styles.cancelButton, styles.modalButton]}
//               onPress={onClose}
//               titleStyle={styles.buttonText}
//             />
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// });

// Helper functions for week calendar
const getWeekDays = (date: string) => {
  const current = new Date(date);
  const monday = new Date(current);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    weekDays.push(dayDate);
  }
  return weekDays;
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

// Helper function to format date header
const formatDateHeader = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Dziś, ${format(date, 'd MMMM yyyy', { locale: pl })}`;
    } else if (isTomorrow(date)) {
      return `Jutro, ${format(date, 'd MMMM yyyy', { locale: pl })}`;
    } else {
      const dayName = format(date, 'EEEE', { locale: pl });
      return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${format(date, 'd MMMM yyyy', { locale: pl })}`;
    }
  } catch {
    return dateString;
  }
};

// TaskFiltersModal Component
const TasksFiltersModal = React.memo(function TasksFiltersModal({
  visible,
  onClose,
  control,
  localDateSort,
  setLocalDateSort,
  handleFilterChange,
  ekipaOptions,
}: {
  visible: boolean;
  onClose: () => void;
  control: any;
  localDateSort: string;
  setLocalDateSort: (value: string) => void;
  handleFilterChange: (filterName: 'dateSort', value: any) => void;
  ekipaOptions: FilterOption[];
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtry zadań</Text>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalLabel}>Typ</Text>
            <MultiSelectModal
              name="taskType"
              control={control}
              options={[
                { label: 'Oględziny', value: 'oględziny' },
                { label: 'Montaż', value: 'montaż' },
                { label: 'Szkolenie', value: 'szkolenie' },
              ]}
              placeholder="Wybierz typy..."
              customWidth={300}
              isBordered
              customHeight={40}
              noMargin
            />

            <Text style={styles.modalLabel}>Status</Text>
            <MultiSelectModal
              name="taskStatus"
              control={control}
              options={[
                { label: 'Wykonane', value: 'wykonane' },
                { label: 'Niewykonane', value: 'niewykonane' },
                { label: 'Zaplanowane', value: 'Zaplanowane' },
              ]}
              placeholder="Wybierz statusy..."
              customWidth={300}
              isBordered
              customHeight={40}
              noMargin
            />

            <Text style={styles.modalLabel}>Sortowanie</Text>
            <Dropdown
              name="dateSort"
              control={control}
              options={[
                { label: 'Najbliższa', value: 'nearest' },
                { label: 'Najdalsza', value: 'farthest' },
              ]}
              customWidth="100%"
              isBordered
            />

            <Text style={styles.modalLabel}>Ekipa</Text>
            <MultiSelectModal
              name="taskGroup"
              control={control}
              options={ekipaOptions}
              placeholder="Wybierz ekipy..."
              customWidth={300}
              isBordered
              customHeight={40}
              noMargin
            />
          </ScrollView>

          <View style={styles.modalButtonGroup}>
            <Button
              title="Zamknij"
              buttonStyle={styles.closeButton}
              onPress={onClose}
              titleStyle={styles.buttonText}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
});

type Filters = {
  dateSort: string;
  // yearFilter: string | null;
  taskType: string;
  taskStatus: string;
  taskGroup: string | null;
};

type TasksTabProps = {
  appliedFilters: Filter[];
  setAppliedFilters: (filters: Filter[]) => void;
};

function TasksTab({ appliedFilters, setAppliedFilters }: TasksTabProps) {
  const dispatch = useDispatch();
  const taskFilters = useSelector((state: RootState) => state.taskFilters);
  const navigation = useNavigation<TasksMenuScreenProps['navigation']>();
  const { teams, getTeams, employees, getEmployees } = useStaff();
  const [teamOptions, setTeamOptions] = useState<FilterOption[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<FilterOption[]>([]);

  // Zabezpieczenie przed błędami gdy Redux state nie jest jeszcze gotowy
  const safeTaskFilters = useMemo(() => {
    return (
      taskFilters || {
        dateSort: 'nearest',
        taskType: [],
        taskStatus: [],
        taskGroup: [],
      }
    );
  }, [taskFilters]);

  // useForm dla MultiSelectModal (Typ, Status, Ekipa) i Dropdown (Sortowanie)
  const { control, watch, setValue } = useForm({
    defaultValues: {
      taskType: safeTaskFilters.taskType || [],
      taskStatus: safeTaskFilters.taskStatus || [],
      taskGroup: safeTaskFilters.taskGroup || [],
      dateSort: safeTaskFilters.dateSort || 'nearest',
    },
  });

  // Watch form values and sync with Redux
  const watchedTaskType = watch('taskType');
  const watchedTaskStatus = watch('taskStatus');
  const watchedTaskGroup = watch('taskGroup');
  const watchedDateSort = watch('dateSort');

  // Ref to track if update is from form (to avoid loops)
  const isUpdatingFromForm = useRef(false);

  // Sync form values with Redux when they change
  useEffect(() => {
    if (Array.isArray(watchedTaskType) && !isUpdatingFromForm.current) {
      const currentRedux = safeTaskFilters.taskType || [];
      // Only update if different to avoid loops
      if (
        JSON.stringify([...watchedTaskType].sort()) !==
        JSON.stringify([...currentRedux].sort())
      ) {
        isUpdatingFromForm.current = true;
        dispatch(setTaskType(watchedTaskType));
        setTimeout(() => {
          isUpdatingFromForm.current = false;
        }, 0);
      }
    }
  }, [watchedTaskType, dispatch, safeTaskFilters.taskType]);

  useEffect(() => {
    if (Array.isArray(watchedTaskStatus) && !isUpdatingFromForm.current) {
      const currentRedux = safeTaskFilters.taskStatus || [];
      // Only update if different to avoid loops
      if (
        JSON.stringify([...watchedTaskStatus].sort()) !==
        JSON.stringify([...currentRedux].sort())
      ) {
        isUpdatingFromForm.current = true;
        dispatch(setTaskStatus(watchedTaskStatus));
        setTimeout(() => {
          isUpdatingFromForm.current = false;
        }, 0);
      }
    }
  }, [watchedTaskStatus, dispatch, safeTaskFilters.taskStatus]);

  useEffect(() => {
    if (Array.isArray(watchedTaskGroup) && !isUpdatingFromForm.current) {
      const currentRedux = safeTaskFilters.taskGroup || [];
      // Only update if different to avoid loops
      if (
        JSON.stringify([...watchedTaskGroup].sort()) !==
        JSON.stringify([...currentRedux].sort())
      ) {
        isUpdatingFromForm.current = true;
        dispatch(setTaskGroup(watchedTaskGroup));
        setTimeout(() => {
          isUpdatingFromForm.current = false;
        }, 0);
      }
    }
  }, [watchedTaskGroup, dispatch, safeTaskFilters.taskGroup]);

  useEffect(() => {
    if (watchedDateSort && !isUpdatingFromForm.current) {
      const currentRedux = safeTaskFilters.dateSort || 'nearest';
      if (watchedDateSort !== currentRedux) {
        isUpdatingFromForm.current = true;
        dispatch(setDateSort(watchedDateSort));
        setLocalDateSort(watchedDateSort);
        setTimeout(() => {
          isUpdatingFromForm.current = false;
        }, 0);
      }
    }
  }, [watchedDateSort, dispatch, safeTaskFilters.dateSort]);

  // Sync Redux to form when Redux changes externally (e.g., resetFilters)
  useEffect(() => {
    if (
      !isUpdatingFromForm.current &&
      Array.isArray(safeTaskFilters.taskType)
    ) {
      const currentForm = watchedTaskType || [];
      if (
        JSON.stringify([...safeTaskFilters.taskType].sort()) !==
        JSON.stringify([...currentForm].sort())
      ) {
        setValue('taskType', safeTaskFilters.taskType);
      }
    }
  }, [safeTaskFilters.taskType, setValue, watchedTaskType]);

  useEffect(() => {
    if (
      !isUpdatingFromForm.current &&
      Array.isArray(safeTaskFilters.taskStatus)
    ) {
      const currentForm = watchedTaskStatus || [];
      if (
        JSON.stringify([...safeTaskFilters.taskStatus].sort()) !==
        JSON.stringify([...currentForm].sort())
      ) {
        setValue('taskStatus', safeTaskFilters.taskStatus);
      }
    }
  }, [safeTaskFilters.taskStatus, setValue, watchedTaskStatus]);

  useEffect(() => {
    if (
      !isUpdatingFromForm.current &&
      Array.isArray(safeTaskFilters.taskGroup)
    ) {
      const currentForm = watchedTaskGroup || [];
      if (
        JSON.stringify([...safeTaskFilters.taskGroup].sort()) !==
        JSON.stringify([...currentForm].sort())
      ) {
        setValue('taskGroup', safeTaskFilters.taskGroup);
      }
    }
  }, [safeTaskFilters.taskGroup, setValue, watchedTaskGroup]);

  useEffect(() => {
    if (!isUpdatingFromForm.current) {
      const currentRedux = safeTaskFilters.dateSort || 'nearest';
      if (watchedDateSort !== currentRedux) {
        setValue('dateSort', currentRedux);
        setLocalDateSort(currentRedux);
      }
    }
  }, [safeTaskFilters.dateSort, setValue, watchedDateSort]);

  // Local state dla Sortowania
  const [localDateSort, setLocalDateSort] = useState<string>(
    safeTaskFilters.dateSort || 'nearest',
  );

  const [data, setData] = useState<Task[] | null>(null);
  const [dataToFilter, setDataToFilter] = useState<Task[] | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  const { result: tasks, execute: getTasks, loading } = useTasks();

  // Load teams and employees
  useEffect(() => {
    if (getTeams) {
      getTeams();
    }
    if (getEmployees) {
      getEmployees();
    }
  }, [getTeams, getEmployees]);

  useEffect(() => {
    if (teams && teams.length > 0) {
      const options = teams.map(team => ({
        label: team.nazwa,
        value: team.id.toString(),
      }));
      setTeamOptions(options);
    }
  }, [teams]);

  useEffect(() => {
    if (employees && employees.employees && employees.employees.length > 0) {
      const options = employees.employees.map(employee => ({
        label: `${employee.first_name} ${employee.last_name}`,
        value: employee.id.toString(),
      }));
      setEmployeeOptions(options);
    }
  }, [employees]);

  // Compute ekipa options based on selected task types
  const ekipaOptions = useMemo(() => {
    const selectedTypes = Array.isArray(watchedTaskType) ? watchedTaskType : [];
    const hasOględziny = selectedTypes.includes('oględziny');
    const hasMontaż = selectedTypes.includes('montaż');
    const hasSzkolenie = selectedTypes.includes('szkolenie');
    const hasAnyType = selectedTypes.length > 0;

    // Jeśli nie wybrano żadnego typu lub wybrano wszystkie typy, pokaż wszystkie opcje
    if (!hasAnyType || ((hasOględziny || hasMontaż) && hasSzkolenie)) {
      return [...teamOptions, ...employeeOptions];
    }

    // Jeśli tylko oględziny lub montaż - tylko ekipy
    if ((hasOględziny || hasMontaż) && !hasSzkolenie) {
      return teamOptions;
    }

    // Jeśli tylko szkolenie - tylko pracownicy
    if (hasSzkolenie && !hasOględziny && !hasMontaż) {
      return employeeOptions;
    }

    return [...teamOptions, ...employeeOptions];
  }, [watchedTaskType, teamOptions, employeeOptions]);
  const { execute: deleteTask } = useApi({
    path: 'zadanie_delete',
  });

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Konwertuj Redux state na Filter[] dla kompatybilności (dla modala - zakomentowany)
  // const baseFilters = useMemo<Filter[]>(() => {
  //   return filtersStateToFilterArray(taskFilters);
  // }, [taskFilters]);

  // Helper functions for filter display
  const getFilterLabel = (type: string) => {
    switch (type) {
      case 'taskType':
        return 'Typ';
      case 'taskStatus':
        return 'Status';
      case 'taskGroup':
        return 'Ekipa';
      // case 'yearFilter': return 'Rok';
      case 'dateSort':
        return 'Sortowanie';
      default:
        return type;
    }
  };

  const getFilterValueLabel = (type: string, value: string) => {
    switch (type) {
      case 'taskType':
        switch (value) {
          case 'oględziny':
            return 'Oględziny';
          case 'montaż':
            return 'Montaż';
          case 'szkolenie':
            return 'Szkolenie';
          default:
            return value;
        }
      case 'taskStatus':
        switch (value) {
          case 'wykonane':
            return 'Wykonane';
          case 'niewykonane':
            return 'Niewykonane';
          case 'Zaplanowane':
            return 'Zaplanowane';
          default:
            return value;
        }
      // case 'yearFilter':
      //   return new Date(value).getFullYear().toString();
      case 'dateSort':
        return value === 'farthest' ? 'Najdalsza' : 'Najbliższa';
      default:
        return value;
    }
  };

  const removeFilter = (filterToRemove: Filter) => {
    // Usuń filtr z Redux
    switch (filterToRemove.type) {
      case 'dateSort':
        dispatch(setDateSort('nearest'));
        break;
      case 'taskType':
        dispatch(setTaskType([]));
        break;
      case 'taskStatus':
        dispatch(setTaskStatus([]));
        break;
      case 'taskGroup':
        dispatch(setTaskGroup([]));
        break;
      default:
        break;
    }
  };

  const onDeleteConfirmed = async () => {
    if (idToDelete) {
      await deleteTask({
        method: 'POST',
        data: { zadanie_id: idToDelete },
      });
      toggleOverlay();
      getTasks();
    }
  };

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleOverlay();
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const toggleFilterModal = useCallback(() => {
    setFilterModalVisible(!filterModalVisible);
  }, [filterModalVisible]);

  useEffect(() => {
    if (getTasks) {
      getTasks();
    }
  }, [getTasks]);

  useEffect(() => {
    if (tasks) {
      const filteredAndSortedTasks = tasks
        .filter(task => task.start_date)
        .sort(
          (a, b) =>
            Number(parseISO(b.start_date)) - Number(parseISO(a.start_date)),
        );
      setDataToFilter(filteredAndSortedTasks);
      setData(filteredAndSortedTasks);
    }
  }, [tasks]);

  // Filter by search value and applied filters
  useEffect(() => {
    if (dataToFilter) {
      let filteredData = [...dataToFilter];

      // Apply filters from Redux
      const filters = safeTaskFilters;

      // Apply taskType filter
      if (filters.taskType && filters.taskType.length > 0) {
        filteredData = filteredData.filter(task =>
          filters.taskType.some(
            (val: string | number) =>
              val.toString().toLowerCase() === task.typ?.toLowerCase(),
          ),
        );
      }

      // Apply taskStatus filter
      if (
        filters.taskStatus &&
        Array.isArray(filters.taskStatus) &&
        filters.taskStatus.length > 0
      ) {
        filteredData = filteredData.filter(task =>
          filters.taskStatus.some(
            (val: string | number) =>
              val.toString().toLowerCase() === task.status?.toLowerCase(),
          ),
        );
      }

      // Apply taskGroup filter
      if (filters.taskGroup && filters.taskGroup.length > 0) {
        filteredData = filteredData.filter(task => {
          // Sprawdź czy zadanie jest nieprzydzielone i czy "nieprzydzielone" jest wybrane
          if (!task.grupa) {
            return filters.taskGroup.includes('nieprzydzielone');
          }
          // Sprawdź czy grupa zadania jest w wybranej liście
          return filters.taskGroup.some(
            (val: string | number) =>
              val.toString() === task.grupa?.toString() || val === task.grupa,
          );
        });
      }

      // Filter by selected date
      if (selectedDate) {
        filteredData = filteredData.filter(task => {
          const taskDate = format(parseISO(task.start_date), 'yyyy-MM-dd');
          return taskDate === selectedDate;
        });
      }

      // Apply dateSort
      if (filters.dateSort === 'farthest') {
        filteredData.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );
      } else {
        filteredData.sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
        );
      }

      // Filter by search value
      if (searchValue.trim()) {
        filteredData = filteredData.filter(
          task =>
            task.nazwa?.toLowerCase().includes(searchValue.toLowerCase()) ||
            task.typ?.toLowerCase().includes(searchValue.toLowerCase()) ||
            task.notatki?.toLowerCase().includes(searchValue.toLowerCase()),
        );
      }

      setData(filteredData);
    }
  }, [dataToFilter, searchValue, safeTaskFilters, selectedDate]);

  // Handle filter changes (tylko dla Sortowania, reszta przez useForm)
  const handleFilterChange = useCallback(
    (filterName: 'dateSort', value: any) => {
      if (filterName === 'dateSort') {
        setLocalDateSort(value);
        dispatch(setDateSort(value));
      }
    },
    [dispatch],
  );

  // Week days for calendar
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  return (
    <View style={styles.container}>
      <ButtonsHeader
        searchValue={searchValue}
        onChangeSearchValue={setSearchValue}
        onFilterPress={toggleFilterModal}
      />

      {/* Week Calendar */}
      <View style={styles.weekCalendarContainer}>
        <Text style={styles.monthYearText}>
          {formatPolishMonth(new Date(selectedDate))} {format(new Date(selectedDate), 'yyyy')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekDaysScroll}
        >
          {weekDays.map((day, index) => {
            const dayString = format(day, 'yyyy-MM-dd');
            const isSelected = dayString === selectedDate;
            const isCurrentDay = isToday(day);

            return (
              <TouchableOpacity
                key={index}
                style={styles.weekDayContainer}
                onPress={() => setSelectedDate(dayString)}
              >
                <Text style={[
                  styles.weekDayName,
                  isSelected && styles.weekDayNameSelected
                ]}>
                  {formatWeekDayShort(day)}
                </Text>
                <View style={[
                  styles.weekDayCircle,
                  isSelected && styles.weekDayCircleSelected
                ]}>
                  <Text style={[
                    styles.weekDayNumber,
                    isSelected && styles.weekDayNumberSelected
                  ]}>
                    {format(day, 'dd')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected date header */}
      {data && data.length > 0 && (
        <Text style={styles.dateHeader}>
          {formatDateHeader(selectedDate)}
        </Text>
      )}

      {data && data.length > 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.cardsContainer}>
            {data.map((task, index) => (
              <View key={task.id}>
                <TaskCard task={task} onDelete={onDelete} />
                {index < data.length - 1 && <View style={styles.cardDivider} />}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        !loading && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              {data?.length === 0
                ? 'Brak zadań do wyświetlenia'
                : 'Ładowanie...'}
            </Text>
          </View>
        )
      )}
      <Spinner
        visible={loading && (!data || data.length === 0)}
        textContent="Ładowanie zadań..."
        textStyle={{ color: Colors.gray }}
      />
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć zadanie ?"
        submitColor={Colors.red}
      />

      <FloatingActionButton
        onPress={() => (navigation as any).navigate('AddForm')}
        backgroundColor="#FF6B35"
      />

      <TasksFiltersModal
        visible={filterModalVisible}
        onClose={toggleFilterModal}
        control={control}
        localDateSort={localDateSort}
        setLocalDateSort={setLocalDateSort}
        handleFilterChange={handleFilterChange}
        ekipaOptions={ekipaOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  weekCalendarContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthYearText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 12,
  },
  weekDaysScroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  weekDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  weekDayName: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 6,
  },
  weekDayNameSelected: {
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
  },
  weekDayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  weekDayCircleSelected: {
    backgroundColor: '#FF6B35',
  },
  weekDayNumber: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
  },
  weekDayNumberSelected: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  content: {
    paddingTop: 8,
    paddingBottom: 80,
  },
  dateHeader: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  cardsContainer: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollContent: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    marginTop: 8,
    marginBottom: 4,
  },
  modalButtonGroup: {
    marginTop: 20,
    gap: 10,
  },
  closeButton: {
    backgroundColor: Colors.calendarPrimary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.white,
  },
});

export default TasksTab;
