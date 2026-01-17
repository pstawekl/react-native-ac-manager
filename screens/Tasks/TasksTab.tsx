/* eslint-disable camelcase */
import { useNavigation } from '@react-navigation/native';
import { Chip, Text } from '@rneui/themed';
import { format, parseISO } from 'date-fns';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlatList, Swipeable } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay';
import { useDispatch, useSelector } from 'react-redux';

import DropDownPicker from 'react-native-dropdown-picker';
import MultiSelectModal from '../../components/MultiSelectModal';

import { IconButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import DocumentIcon from '../../components/icons/DocumentIcon';
import TrashIcon from '../../components/icons/TrashIcon';
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

function RowLeftContent({ onEditPress }: { onEditPress: () => void }) {
  const translateX = useRef(new Animated.Value(150)).current;

  const animate = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  useEffect(() => {
    animate(0);
  }, []);

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        styles.taskEdit,
        { transform: [{ translateX }] },
      ]}
    >
      <IconButton
        icon={<DocumentIcon color="white" />}
        style={styles.buttonStyle}
        titleStyle={styles.buttonTitleStyle}
        onPress={onEditPress}
        withoutBackground
      />
    </Animated.View>
  );
}

function RowRightContent({ onDeletePress }: { onDeletePress: () => void }) {
  const translateX = useRef(new Animated.Value(150)).current;

  const animate = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  useEffect(() => {
    animate(0);
  }, []);

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        styles.taskDelete,
        { transform: [{ translateX }] },
      ]}
    >
      <IconButton
        icon={<TrashIcon color="white" />}
        style={styles.buttonStyle}
        titleStyle={styles.buttonTitleStyle}
        onPress={onDeletePress}
        withoutBackground
      />
    </Animated.View>
  );
}

function TaskRow({
  task,
  onDelete,
  onCloseAllSwipes,
  registerSwipeRef,
  isLast,
}: {
  task: Task;
  onDelete: (id: number) => void;
  onCloseAllSwipes: () => void;
  registerSwipeRef: (id: number, ref: any) => void;
  isLast: boolean;
}) {
  const { id, nazwa, typ, grupa, status, start_date, instalacja_info } = task;
  let statusColor;

  switch (status) {
    case 'wykonane':
      statusColor = Colors.statusDone;
      break;
    case 'niewykonane':
      statusColor = Colors.statusNotDone;
      break;
    case 'Zaplanowane':
      statusColor = Colors.statusPlanned;
      break;
    default:
      statusColor = Colors.statusOther;
      break;
  }

  const formattedDate = format(parseISO(start_date), 'dd.MM.yyyy HH:mm');
  const navigation = useNavigation<TasksMenuScreenProps['navigation']>();

  // Pobierz nazwę ekipy/pracownika
  const { teams, employees } = useStaff();
  const assignedName = useMemo(() => {
    if (!grupa) return null;
    if (grupa > 1) {
      // Ekipa
      const team = teams?.find(t => t.id === grupa);
      return team ? team.nazwa : `Ekipa ${grupa}`;
    }
    // Pracownik
    const employee = employees?.employees?.find(e => e.id === grupa);
    return employee
      ? `${employee.first_name} ${employee.last_name}`
      : `Pracownik ${grupa}`;
  }, [grupa, teams, employees]);

  // Pobierz adres klienta
  const clientAddress = useMemo(() => {
    if (!instalacja_info) return null;
    const parts = [
      instalacja_info.ulica,
      instalacja_info.numer_domu,
      instalacja_info.mieszkanie && `/${instalacja_info.mieszkanie}`,
      instalacja_info.kod_pocztowy,
      instalacja_info.miasto,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : null;
  }, [instalacja_info]);

  // Pobierz nazwę klienta
  const clientName = useMemo(() => {
    if (!instalacja_info) return null;
    return (
      instalacja_info.nazwa_firmy ||
      `${instalacja_info.first_name || ''} ${instalacja_info.last_name || ''
        }`.trim()
    );
  }, [instalacja_info]);

  const handleTaskDetails = () => {
    (navigation as any).navigate('TaskDetails', { task });
  };

  const handleEdit = () => {
    (navigation as any).navigate('AddForm', { task });
  };

  const handleDelete = () => {
    onDelete(id);
  };

  const swipeRefCallback = useCallback(
    (ref: any) => {
      if (ref) {
        registerSwipeRef(id, ref);
      }
    },
    [id, registerSwipeRef],
  );

  const renderLeftActions = () => {
    return <RowLeftContent onEditPress={handleEdit} />;
  };

  const renderRightActions = () => {
    return <RowRightContent onDeletePress={handleDelete} />;
  };

  return (
    <View style={[styles.swipeableContainer, !isLast && styles.listItemBorder]}>
      <Swipeable
        ref={swipeRefCallback}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        friction={2}
        leftThreshold={10}
        rightThreshold={10}
        onSwipeableOpen={direction => {
          if (direction === 'left') {
            handleEdit();
          } else if (direction === 'right') {
            handleDelete();
          }

          onCloseAllSwipes();
        }}
      >
        <TouchableOpacity
          style={styles.listItem}
          onPress={handleTaskDetails}
          activeOpacity={0.7}
        >
          <View style={styles.listItemContainer}>
            <View style={styles.listItemContent}>
              {/* Tytuł lub typ */}
              <Text style={styles.taskTitle}>
                {nazwa ||
                  typ.charAt(0).toUpperCase() + typ.slice(1).toLowerCase()}
              </Text>
              {/* Klient i adres */}
              {clientName && (
                <Text style={styles.taskSubtitle}>
                  {clientName}
                  {clientAddress && ` - ${clientAddress}`}
                </Text>
              )}
              {/* Przydzielona ekipa lub pracownik */}
              {assignedName && (
                <Text style={styles.taskSubtitle}>
                  {typ === 'szkolenie' ? 'Pracownik' : 'Ekipa'}: {assignedName}
                </Text>
              )}
            </View>
            <View style={styles.listItemRight}>
              <Text style={styles.listItemDate}>{formattedDate}</Text>
              <Chip
                title={status}
                color={statusColor}
                titleStyle={styles.statusTitle}
                buttonStyle={styles.statusChip}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
}

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

  // useForm dla MultiSelectModal (Typ, Status, Ekipa)
  const { control, watch, setValue } = useForm({
    defaultValues: {
      taskType: safeTaskFilters.taskType || [],
      taskStatus: safeTaskFilters.taskStatus || [],
      taskGroup: safeTaskFilters.taskGroup || [],
    },
  });

  // Watch form values and sync with Redux
  const watchedTaskType = watch('taskType');
  const watchedTaskStatus = watch('taskStatus');
  const watchedTaskGroup = watch('taskGroup');

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

  // Local state dla Sortowania (pozostaje jako DropDownPicker)
  const [localDateSort, setLocalDateSort] = useState<string>(
    safeTaskFilters.dateSort || 'nearest',
  );

  // State dla kontroli otwarcia dropdowna Sortowania
  const [openDateSort, setOpenDateSort] = useState(false);

  const [data, setData] = useState<Task[] | null>(null);
  const [dataToFilter, setDataToFilter] = useState<Task[] | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');

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
  const [filtersPanelVisible, setFiltersPanelVisible] = useState(false);

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

  // System zarządzania swipe'ami
  const swipeRefs = useRef<Map<number, any>>(new Map());

  // Funkcja do zamykania wszystkich swipe elementów
  const closeAllSwipes = useCallback(() => {
    swipeRefs.current.forEach((ref, taskId) => {
      if (ref && ref.close) {
        ref.close();
      }
    });
  }, []);

  // Funkcja do rejestrowania referencji swipe elementów
  const registerSwipeRef = useCallback((id: number, ref: any) => {
    if (ref) {
      swipeRefs.current.set(id, ref);
    }
  }, []);

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
    closeAllSwipes(); // Zamykamy wszystkie swipe'y po wywołaniu dialogu
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const toggleFilterModal = useCallback(() => {
    setFilterModalVisible(!filterModalVisible);
  }, [filterModalVisible]);

  const toggleFiltersPanel = useCallback(() => {
    setFiltersPanelVisible(prev => !prev);
  }, []);

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
      closeAllSwipes(); // Zamykamy swipe'y po filtrowaniu
    }
  }, [dataToFilter, searchValue, safeTaskFilters, closeAllSwipes]);

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

  return (
    <View style={styles.container}>
      <ButtonsHeader
        // onBackPress={navigation.goBack}
        searchValue={searchValue}
        onChangeSearchValue={setSearchValue}
        onFilterPress={toggleFiltersPanel}
      />
      {/* Filtry na górze widoku */}
      {filtersPanelVisible && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Typ</Text>
            <View style={styles.dropdownWrapper}>
              <MultiSelectModal
                name="taskType"
                control={control}
                options={[
                  { label: 'Oględziny', value: 'oględziny' },
                  { label: 'Montaż', value: 'montaż' },
                  { label: 'Szkolenie', value: 'szkolenie' },
                ]}
                placeholder="Wybierz typy..."
                customWidth={250}
                isBordered
                isSmall
                customHeight={34}
                noMargin
              />
            </View>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.dropdownWrapper}>
              <MultiSelectModal
                name="taskStatus"
                control={control}
                options={[
                  { label: 'Wykonane', value: 'wykonane' },
                  { label: 'Niewykonane', value: 'niewykonane' },
                  { label: 'Zaplanowane', value: 'Zaplanowane' },
                ]}
                placeholder="Wybierz statusy..."
                customWidth={250}
                isBordered
                isSmall
                customHeight={34}
                noMargin
              />
            </View>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Sortowanie</Text>
            <View style={styles.dropdownWrapper}>
              <DropDownPicker
                open={openDateSort}
                setOpen={setOpenDateSort}
                value={localDateSort}
                setValue={callback => {
                  const newValue = callback(localDateSort);
                  handleFilterChange('dateSort', newValue);
                }}
                items={[
                  { label: 'Najbliższa', value: 'nearest' },
                  { label: 'Najdalsza', value: 'farthest' },
                ]}
                style={styles.dropdownStyle}
                textStyle={styles.dropdownTextStyle}
                dropDownContainerStyle={styles.dropdownContainerStyle}
                zIndex={28}
                listMode="MODAL"
                modalAnimationType="slide"
              />
            </View>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Ekipa</Text>
            <View style={styles.dropdownWrapper}>
              <MultiSelectModal
                name="taskGroup"
                control={control}
                options={ekipaOptions}
                placeholder="Wybierz ekipy..."
                customWidth={250}
                isBordered
                isSmall
                customHeight={34}
                noMargin
              />
            </View>
          </View>
        </View>
      )}
      {/* Active filters display */}
      {/* TODO: Uncomment in future if needed
      {appliedFilters.length > 0 && (
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
      {/* <View style={styles.filterWrapper}>
        <Dropdown
          name="taskType"
          control={control}
          label="Rodzaj zadania"
          options={[
            { label: 'Wszystkie', value: '' },
            { label: 'Oględziny', value: 'oględziny' },
            { label: 'Montaż', value: 'montaż' },
            { label: 'Serwis', value: 'serwis' },
            { label: 'Szkolenie', value: 'szkolenie' },
          ]}
          dropDownDirection="BOTTOM"
          isBordered
          isThin
          zIndex={30}
          customWidth="80%"
          onChange={setTaskType}
        />
      </View> */}

      {data && data.length > 0 ? (
        <FlatList
          data={data}
          contentContainerStyle={styles.content}
          renderItem={({ item, index }) => (
            <TaskRow
              task={item}
              onDelete={onDelete}
              onCloseAllSwipes={closeAllSwipes}
              registerSwipeRef={registerSwipeRef}
              isLast={index === data.length - 1}
            />
          )}
          ItemSeparatorComponent={(<View style={styles.separator} />) as any}
          refreshing={loading && data.length > 0}
          onRefresh={() => getTasks && getTasks()}
        />
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
        backgroundColor={Colors.calendarPrimary}
      />

      {/* Modal filtrów - zakomentowany, może się przydać później */}
      {/* <TasksFiltersModal
        filters={baseFilters}
        visible={filterModalVisible}
        onClose={toggleFilterModal}
        onFilterPress={() => {}}
        control={control}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 10,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 70,
    zIndex: 10,
    gap: -4,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 100,
  },
  taskEdit: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    backgroundColor: Colors.buttons.editBg,
    color: Colors.white,
  },
  taskDelete: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: Colors.buttons.deleteBg,
    color: Colors.white,
  },
  buttonStyle: {
    flex: 1,
    overflow: 'hidden',
    height: 80,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 0,
    margin: 0,
    padding: 0,
    backgroundColor: Colors.transparent,
  },
  buttonTitleStyle: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    backgroundColor: Colors.transparent,
  },
  swipeableContainer: {
    height: 80,
    width: '100%',
  },
  listItem: {
    width: '100%',
    height: 100,
    zIndex: 10,
  },
  listItemContainer: {
    width: '100%',
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
  },
  listItemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
  },
  taskSubtitle: {
    fontSize: 14,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
  },
  listItemRight: {
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  listItemDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.grayerText,
    textAlign: 'right',
  },
  statusTitle: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  statusChip: {
    padding: 0,
    marginTop: 5,
    width: 120,
  },
  // modalOverlay: {
  //   flex: 1,
  //   backgroundColor: Colors.blackHalfOpacity,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // modalContent: {
  //   backgroundColor: Colors.white,
  //   borderRadius: 8,
  //   padding: 20,
  //   width: '90%',
  //   maxWidth: 500,
  // },
  // modalTitle: {
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   textAlign: 'center',
  // },
  // modalButtonGroup: {
  //   flexDirection: 'column',
  //   marginTop: 10,
  //   gap: 10,
  // },
  // modalButton: {
  //   padding: 10,
  //   borderRadius: 5,
  //   minWidth: 100,
  //   alignItems: 'center',
  // },
  // saveButton: {
  //   backgroundColor: Colors.red,
  // },
  // cancelButton: {
  //   backgroundColor: Colors.gray,
  // },
  // buttonText: {
  //   color: Colors.white,
  //   fontWeight: 'bold',
  // },
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
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
  },
  filtersContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayBorder,
    gap: 8,
    width: '100%',
    marginBottom: 15,
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 14,
    color: Colors.black,
  },
  dropdownWrapper: {
    width: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownStyle: {
    width: 250,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: Colors.white,
    minHeight: 34,
    marginBottom: 0,
  },
  dropdownTextStyle: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    color: Colors.black,
  },
  dropdownContainerStyle: {
    borderWidth: 1,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.white,
  },
});

export default TasksTab;
