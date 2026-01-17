import { Button, Text } from '@rneui/themed';
import { parseISO } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert, Modal, StyleSheet, TextInput, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import DatePicker from '../../components/DatePicker';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useClients from '../../providers/ClientsProvider';
import useStaff from '../../providers/StaffProvider';
import useTasks from '../../providers/TasksProvider';
import { ClientInstallationsListResponse } from '../../types/clients.types';

type TaskData = {
  nazwa: string;
  miejsce_adres?: string;
  status: string;
  typ: string;
  task_date: Date;
  task_time: Date;
  klient_id: number;
  instalacja_id: number | null;
  grupa: number | null;
  notatki?: string;
};

function AddTaskForm({ navigation, route }: any) {
  const task = route?.params?.task;
  const fromClient = route?.params?.fromClient;
  const fromInstallation = route?.params?.fromInstallation;
  const fromClientId = route?.params?.clientId;
  const fromInstallationId = route?.params?.installationId;

  const [filteredClients, setFilteredClients] =
    useState<{ label: string; value: number }[]>();
  const [filteredInstallations, setFilteredInstallations] =
    useState<{ label: string; value: number }[]>();
  const [filteredTeams, setFilteredTeams] =
    useState<{ label: string; value: number }[]>();
  const [filteredEmployees, setFilteredEmployees] =
    useState<{ label: string; value: number }[]>();
  const [clientId, setClientId] = useState<number | null>(
    task?.klient_id ?? null,
  );
  const [installationId, setInstallationId] = useState<number | null>(
    task?.instalacja_id ?? null,
  );
  const [taskType, setTaskType] = useState<string | null>(task?.typ ?? null);
  const [taskTypes, setTaskTypes] = useState<
    { label: string; value: string }[]
  >([
    { label: 'Oględziny', value: 'oględziny' },
    { label: 'Montaż', value: 'montaż' },
    { label: 'Szkolenie', value: 'szkolenie' },
  ]);
  const [addTaskTypeModalVisible, setAddTaskTypeModalVisible] = useState(false);
  const [newTaskTypeName, setNewTaskTypeName] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { clients, getClients } = useClients();
  const { execute: getTasks } = useTasks();
  const { getTeams, teams, employees, getEmployees } = useStaff();
  const { result, execute, loading } = useApi<any>({
    path: 'zadanie_create',
  });
  const { result: editResult, execute: editTask } = useApi<any>({
    path: 'zadanie_edit',
  });
  const { result: installationsRes, execute: getInstallations } =
    useApi<ClientInstallationsListResponse>({
      path: 'installation_list',
    });

  // Funkcja nawigacji wstecz zależna od kontekstu
  const handleGoBack = useCallback(() => {
    if (fromInstallation && fromInstallationId && fromClientId) {
      // Jeśli przyszliśmy z modułu instalacji, wracamy do TaskDetails (jeśli edytowaliśmy)
      // lub do zakładki Zadania tej instalacji
      if (task?.id) {
        // Jeśli edytowaliśmy istniejące zadanie z modułu instalacji, wracamy do TaskDetails
        navigation.navigate('TaskDetails', {
          task,
          fromInstallation,
          installationId: fromInstallationId,
          clientId: fromClientId,
        });
      } else {
        // Jeśli dodawaliśmy nowe zadanie, wracamy do zakładki Zadania instalacji
        navigation.navigate('Clients', {
          screen: 'Settings',
          params: {
            installationId: fromInstallationId.toString(),
            clientId: fromClientId.toString(),
            activeTab: 'zadania',
          },
        });
      }
    } else if (fromClient && fromClientId) {
      // Jeśli przyszliśmy z modułu klientów, wracamy do TaskDetails (jeśli edytowaliśmy)
      // lub do zakładki Zadania tego klienta
      if (task?.id) {
        // Jeśli edytowaliśmy istniejące zadanie z modułu klientów, wracamy do TaskDetails
        navigation.navigate('TaskDetails', {
          task,
          fromClient,
          clientId: fromClientId,
        });
      } else {
        // Jeśli dodawaliśmy nowe zadanie, wracamy do zakładki Zadania klienta
        navigation.navigate('Clients', {
          screen: 'Menu',
          params: { clientId: fromClientId, activeTab: 'zadania' },
        });
      }
    } else {
      // Standardowy powrót (do listy zadań w module Zadań)
      navigation.navigate('Menu');
    }
  }, [fromInstallation, fromClient, fromInstallationId, fromClientId, task, navigation]);

  const taskDate = task ? parseISO(task?.start_date) : new Date();
  const taskTime = task ? parseISO(task?.start_date) : new Date();

  const { control, handleSubmit, setValue } = useForm<TaskData>({
    defaultValues: {
      nazwa: task?.nazwa ?? '',
      miejsce_adres: task?.miejsce_adres ?? '',
      status: task?.status ?? 'Zaplanowane',
      typ: task?.typ ?? 'szkolenie',
      task_date: taskDate,
      task_time: taskTime,
      klient_id: task?.klient_id ?? undefined,
      instalacja_id: task?.instalacja_id ?? undefined,
      grupa: task?.grupa ?? undefined,
      notatki: task?.notatki ?? '',
    },
  });
  const notatkiValue = useWatch({ control, name: 'notatki' });
  const nazwaValue = useWatch({ control, name: 'nazwa' });
  const miejsceAdresValue = useWatch({ control, name: 'miejsce_adres' });
  const klientIdValue = useWatch({ control, name: 'klient_id' });

  // Effect to clear client and installation when task type changes to 'szkolenie'
  useEffect(() => {
    if (taskType === 'szkolenie') {
      setClientId(null);
      setInstallationId(null);
      setValue('klient_id', null as any);
      setValue('instalacja_id', null);
      setFilteredInstallations([]);
    }
  }, [taskType, setValue]);

  // Initialize taskType from form when component loads
  useEffect(() => {
    if (task?.typ) {
      setTaskType(task.typ);
    }
  }, [task?.typ]);

  useEffect(() => {
    if (teams) {
      let teamsToDisplay: { label: string; value: number }[] = [];

      teams.forEach(item => {
        teamsToDisplay = [
          ...teamsToDisplay,
          { label: item.nazwa, value: item.id },
        ];
      });

      setFilteredTeams(teamsToDisplay);
    } else if (getTeams) {
      getTeams();
    }
  }, [teams, getTeams]);

  useEffect(() => {
    if (employees) {
      let employeesToDisplay: { label: string; value: number }[] = [];

      // Process teams of employees if they exist
      Object.keys(employees).forEach(key => {
        const possibleTeam = employees[key];
        if (Array.isArray(possibleTeam) && key !== 'employees') {
          possibleTeam.forEach(employee => {
            if (employee.first_name && employee.last_name && employee.id) {
              employeesToDisplay = [
                ...employeesToDisplay,
                {
                  label: `${employee.first_name} ${employee.last_name}`,
                  value: employee.id,
                },
              ];
            }
          });
        }
      });

      employees.employees?.forEach(item => {
        employeesToDisplay = [
          ...employeesToDisplay,
          { label: `${item.first_name} ${item.last_name}`, value: item.id },
        ];
      });

      setFilteredEmployees(employeesToDisplay);
    } else if (getEmployees) {
      getEmployees();
    }
  }, [employees, getEmployees, setFilteredEmployees]);

  useEffect(() => {
    if (clients) {
      let clientsToDisplay: { label: string; value: number }[] = [];

      clients.forEach(item => {
        clientsToDisplay = [
          ...clientsToDisplay,
          {
            label: `${
              item.rodzaj_klienta === 'firma' ? 'Firma:' : 'Osoba prywatna:'
            } ${
              item.rodzaj_klienta === 'firma'
                ? item.nazwa_firmy
                : `${item.first_name} ${item.last_name}`
            }`,
            value: item.id,
          },
        ];
      });

      setFilteredClients(clientsToDisplay);
    } else if (getClients) {
      getClients();
    }
  }, [clients, getClients]);

  // Ustaw wybranego klienta gdy zmienia się klient_id
  useEffect(() => {
    if (klientIdValue && clients) {
      const foundClient = clients.find(c => c.id === klientIdValue);
      setSelectedClient(foundClient || null);
    } else {
      setSelectedClient(null);
    }
  }, [klientIdValue, clients]);

  // Sprawdź czy powinno być widoczne pole Miejsce/Adres
  const shouldShowMiejsceAdres = useMemo(() => {
    if (!klientIdValue) return true; // Brak klienta - pokaż pole
    if (!selectedClient) return false; // Klient nie załadowany jeszcze
    // Sprawdź czy klient ma adres
    const hasAddress =
      selectedClient.ulica &&
      selectedClient.numer_domu &&
      selectedClient.miasto;
    return !hasAddress; // Jeśli nie ma adresu - pokaż pole
  }, [klientIdValue, selectedClient]);

  useEffect(() => {
    if (installationsRes) {
      let installationsToDisplay: { label: string; value: number }[] = [];

      installationsRes.installation_list.forEach(item => {
        installationsToDisplay = [
          ...installationsToDisplay,
          { label: `Instalacja ${item.id}`, value: item.id },
        ];
      });

      setFilteredInstallations(installationsToDisplay);
    }
  }, [installationsRes, setFilteredInstallations]);

  useEffect(() => {
    if (getInstallations && clientId) {
      getInstallations({
        method: 'POST',
        data: { klient_id: clientId },
      });
    } else {
      setFilteredInstallations([]);
    }
  }, [getInstallations, clientId]);

  // Nowy useEffect do obsługi edycji istniejącego zadania
  useEffect(() => {
    if (task) {
      // Jeśli zadanie ma instalacja_info (z rozszerzonej serializacji)
      if (task.instalacja_info && task.instalacja_info.klient_id) {
        setClientId(task.instalacja_info.klient_id);
        setValue('klient_id', task.instalacja_info.klient_id);

        setInstallationId(task.instalacja_info.id);
        setValue('instalacja_id', task.instalacja_info.id);
      }
      // Fallback - jeśli mamy tylko instalacja ID
      else if (task.instalacja) {
        setInstallationId(task.instalacja);
        setValue('instalacja_id', task.instalacja);
      }
    }
  }, [task, setValue]);

  useEffect(() => {
    if (result) {
      if (result.id) {
        Alert.alert('Zadanie dodane');
      } else {
        Alert.alert('Wystąpił błąd przy dodawaniu zadania');
      }
    }
    if (editResult) {
      if (editResult.id) {
        Alert.alert('Zmiany zapisane');
      } else {
        Alert.alert('Wystąpił błąd przy edycji');
      }
    }
  }, [result, editResult]);

  const onSubmit = (data: TaskData) => {
    // Walidacja: dla szkoleń nie powinno być klienta ani instalacji
    let klientId = data.klient_id;
    let instalacjaId = data.instalacja_id;

    if (data.typ === 'szkolenie') {
      klientId = null as any;
      instalacjaId = null;
    }

    // Walidacja: dla oględzin i montażu wymagany jest klient
    if ((data.typ === 'oględziny' || data.typ === 'montaż') && !klientId) {
      Alert.alert('Błąd', 'Dla tego typu zadania wymagany jest wybór klienta.');
      return;
    }

    // Łączenie daty i czasu w jeden obiekt Date
    const combinedDate = new Date(data.task_date);
    const timeDate = new Date(data.task_time);
    combinedDate.setHours(timeDate.getHours());
    combinedDate.setMinutes(timeDate.getMinutes());
    combinedDate.setSeconds(0);
    combinedDate.setMilliseconds(0);

    // Przygotowanie danych dla backendu
    const backendData = {
      nazwa: data.nazwa || null,
      status: data.status,
      typ: data.typ,
      grupa: data.grupa,
      notatki:
        data.notatki && data.notatki.trim() !== '' ? data.notatki.trim() : null,
      // Konwertuj połączoną datę na ISO string format wymagany przez Django
      start_date: combinedDate.toISOString(),
      end_date: combinedDate.toISOString(), // Używamy tej samej daty dla start i end
      // Przemapuj instalacja_id na instalacja jeśli istnieje (tylko dla montażu i oględzin)
      ...(instalacjaId &&
        data.typ !== 'szkolenie' && { instalacja: instalacjaId }),
    };

    if (task?.id) {
      editTask({
        data: { zadanie_id: task?.id, ...backendData },
      });
    } else {
      execute({
        data: backendData,
      });
    }
    getTasks();
    handleGoBack();
  };

  return (
    <LinearGradient
      colors={['#FF0C01', '#FF9C04']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ScrollView>
          <ButtonsHeader onBackPress={handleGoBack} />

          <View style={styles.formContainer}>
            {/* Pole Tytuł */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tytuł</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Tytuł zadania (opcjonalnie)"
                onChangeText={text => setValue('nazwa', text)}
                value={nazwaValue || ''}
              />
            </View>

            {/* Typ zadania z możliwością dodania własnego */}
            <View style={styles.taskTypeContainer}>
              <View style={styles.taskTypeHeader}>
                <Text style={styles.label}>Typ zadania</Text>
                <Button
                  title="+ Dodaj typ"
                  buttonStyle={styles.addTypeButton}
                  titleStyle={styles.addTypeButtonTitle}
                  onPress={() => setAddTaskTypeModalVisible(true)}
                />
              </View>
              <Dropdown
                name="typ"
                control={control}
                label=""
                options={taskTypes}
                isBordered
                isThin
                zIndex={9}
                onChange={setTaskType}
              />
            </View>

            {taskType === 'szkolenie' && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  ℹ️ Szkolenia nie wymagają przypisania klienta ani instalacji
                </Text>
              </View>
            )}
            {/* <FormInput
              label="Nazwa zadania"
              name="nazwa"
              control={control}
              noPadding
            /> */}

            {/* Data i czas jako dwie osobne kontrolki */}
            <View style={styles.pickerContainer}>
              <View style={styles.pickerControl}>
                <Text style={styles.label}>Data</Text>
                <DatePicker
                  name="task_date"
                  control={control}
                  mode="date"
                  color={Colors.red}
                />
              </View>
              <View style={styles.pickerControl}>
                <Text style={styles.label}>Godzina</Text>
                <DatePicker
                  name="task_time"
                  control={control}
                  mode="time"
                  color={Colors.red}
                />
              </View>
            </View>

            {/* Pole Miejsce/Adres - widoczne tylko gdy nie ma klienta lub klient nie ma adresu */}
            {shouldShowMiejsceAdres && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Miejsce/Adres</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Miejsce/Adres zadania"
                  onChangeText={text => setValue('miejsce_adres', text)}
                  value={miejsceAdresValue || ''}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}
            <Dropdown
              name="status"
              control={control}
              label="Status"
              options={[
                { label: 'Zaplanowane', value: 'Zaplanowane' },
                { label: 'Wykonane', value: 'wykonane' },
                { label: 'Niewykonane', value: 'niewykonane' },
              ]}
              isBordered
              isThin
              zIndex={8}
            />
            {filteredTeams && (
              <Dropdown
                name="grupa"
                control={control}
                label={
                  taskType === 'szkolenie'
                    ? 'Przydzielony pracownik'
                    : 'Przydzielona ekipa'
                }
                options={
                  taskType === 'szkolenie'
                    ? filteredEmployees ?? []
                    : filteredTeams ?? []
                }
                isBordered
                isThin
                zIndex={7}
              />
            )}
            {(taskType === 'montaż' || taskType === 'oględziny') &&
              filteredClients && (
                <Dropdown
                  label="Klient"
                  name="klient_id"
                  control={control}
                  options={filteredClients}
                  isBordered
                  isThin
                  zIndex={6}
                  onChange={(id: number) => {
                    setClientId(id);
                    setInstallationId(null);
                    setValue('instalacja_id', null);
                  }}
                />
              )}
            {(taskType === 'montaż' || taskType === 'oględziny') &&
              clientId &&
              filteredInstallations && (
                <Dropdown
                  label="Instalacja"
                  name="instalacja_id"
                  control={control}
                  options={filteredInstallations}
                  isBordered
                  isThin
                  zIndex={5}
                  onChange={setInstallationId}
                />
              )}
            <View style={styles.notesContainer}>
              <Text style={styles.label}>Notatki</Text>
              <TextInput
                multiline
                numberOfLines={3}
                style={styles.notesInput}
                placeholder="Notatki (opcjonalnie)"
                onChangeText={text => setValue('notatki', text)}
                value={notatkiValue || ''}
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <ButtonGroup
            loading={loading}
            submitTitle="Zapisz"
            submitStyle={styles.submitButton}
            cancelTitle="Anuluj"
            cancelTitleStyle={styles.cancelButtonTitle}
            cancelStyle={styles.cancelButton}
            onSubmitPress={handleSubmit(onSubmit)}
            onCancel={handleGoBack}
          />
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
              <Text style={styles.label}>Nazwa typu</Text>
              <TextInput
                style={styles.modalInput}
                value={newTaskTypeName}
                onChangeText={setNewTaskTypeName}
                placeholder="Wpisz nazwę typu zadania..."
                placeholderTextColor={Colors.gray}
              />
              <View style={styles.modalButtonGroup}>
                <Button
                  title="Dodaj"
                  buttonStyle={[styles.modalSaveButton, styles.modalButton]}
                  onPress={() => {
                    if (newTaskTypeName.trim()) {
                      const newType = {
                        label: newTaskTypeName.trim(),
                        value: newTaskTypeName.trim().toLowerCase(),
                      };
                      setTaskTypes([...taskTypes, newType]);
                      setNewTaskTypeName('');
                      setAddTaskTypeModalVisible(false);
                      setValue('typ', newType.value);
                      setTaskType(newType.value);
                    }
                  }}
                  titleStyle={styles.modalButtonText}
                />
                <Button
                  title="Anuluj"
                  buttonStyle={[styles.modalCancelButton, styles.modalButton]}
                  onPress={() => {
                    setAddTaskTypeModalVisible(false);
                    setNewTaskTypeName('');
                  }}
                  titleStyle={styles.modalButtonText}
                />
              </View>
            </View>
          </View>
        </Modal>
      </Container>
    </LinearGradient>
  );
}

export default AddTaskForm;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  formContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: -18,
  },
  footer: {
    marginBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  submitButton: {
    padding: 0,
    borderRadius: 15,
    backgroundColor: Colors.red,
    height: 48,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
    fontWeight: '400',
  },
  pickerContainer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 12,
    width: '100%',
    marginBottom: 30,
  },
  pickerControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  notesContainer: {
    marginTop: 10,
  },
  notesInput: {
    minHeight: 60,
    borderColor: Colors.black,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: Colors.white,
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    overflow: 'visible',
  },
  cancelButton: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.black,
  },
  infoContainer: {
    backgroundColor: Colors.orange,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  inputContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  textInput: {
    minHeight: 40,
    borderColor: Colors.black,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  taskTypeContainer: {
    marginTop: 10,
  },
  taskTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addTypeButton: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addTypeButtonTitle: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
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
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
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
  modalButtonGroup: {
    flexDirection: 'column',
    gap: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSaveButton: {
    backgroundColor: Colors.red,
  },
  modalCancelButton: {
    backgroundColor: Colors.gray,
  },
  modalButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});
