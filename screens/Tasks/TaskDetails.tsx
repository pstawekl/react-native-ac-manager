import { Button, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import Container from '../../components/Container';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useStaff from '../../providers/StaffProvider';
import useTasks from '../../providers/TasksProvider';

function TaskDetails({ navigation, route }: any) {
  const task = route?.params?.task;
  const fromClient = route?.params?.fromClient;
  const fromInstallation = route?.params?.fromInstallation;
  const clientId = route?.params?.clientId;
  const installationId = route?.params?.installationId;
  const [currentStatus, setCurrentStatus] = useState(
    task?.status || 'niewykonane',
  );
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { execute: getTasks } = useTasks();
  const { teams, employees } = useStaff();
  const { control, setValue } = useForm({
    defaultValues: {
      status: task?.status || 'niewykonane',
    },
  });

  const { execute: updateTaskStatus } = useApi({
    path: 'zadanie_edit',
  });

  const { execute: deleteTask } = useApi({
    path: 'zadanie_delete',
  });

  // Funkcja nawigacji wstecz zależna od kontekstu
  const handleGoBack = useCallback(() => {
    if (fromInstallation && installationId && clientId) {
      // Jeśli przyszliśmy z modułu instalacji, wracamy do zakładki Zadania tej instalacji
      navigation.navigate('Clients', {
        screen: 'Settings',
        params: {
          installationId: installationId.toString(),
          clientId: clientId.toString(),
          activeTab: 'zadania',
        },
      });
    } else if (fromClient && clientId) {
      // Jeśli przyszliśmy z modułu klientów, wracamy do zakładki Zadania tego klienta
      navigation.navigate('Clients', {
        screen: 'Menu',
        params: { clientId, activeTab: 'zadania' },
      });
    } else {
      // Standardowy powrót (do listy zadań w module Zadań)
      navigation.goBack();
    }
  }, [fromInstallation, fromClient, installationId, clientId, navigation]);

  // Pobierz nazwę ekipy/pracownika - musi być przed warunkiem return
  const assignedName = useMemo(() => {
    if (!task || !task.grupa) return null;
    const grupaId = task.grupa;
    if (grupaId > 1) {
      // Ekipa
      const team = teams?.find(t => t.id === grupaId);
      return team ? team.nazwa : `Ekipa ${grupaId}`;
    }
    // Pracownik
    const employee = employees?.employees?.find(e => e.id === grupaId);
    return employee
      ? `${employee.first_name} ${employee.last_name}`
      : `Pracownik ${grupaId}`;
  }, [task, teams, employees]);

  if (!task) {
    return (
      <Container style={styles.container}>
        <ButtonsHeader onBackPress={handleGoBack} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Nie znaleziono zadania</Text>
        </View>
      </Container>
    );
  }

  // Formatowanie daty i czasu
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy | HH:mm');
    } catch {
      return 'Nieprawidłowa data';
    }
  };

  // Funkcja do zapisywania zmian statusu
  const handleSaveStatus = async () => {
    try {
      // Przygotowanie pełnych danych zadania z nowym statusem
      const backendData = {
        zadanie_id: task.id,
        nazwa: task.nazwa,
        status: currentStatus,
        typ: task.typ,
        grupa: task.grupa,
        notatki: task.notatki || null,
        start_date: task.start_date,
        end_date: task.end_date,
        ...(task.instalacja && { instalacja: task.instalacja }),
      };

      const response = await updateTaskStatus({
        method: 'POST',
        data: backendData,
      });

      if (getTasks) {
        await getTasks();
      }

      // Powrót do poprzedniego ekranu po zapisaniu
      handleGoBack();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zaktualizować statusu zadania');
    }
  };

  // Funkcja do przejścia do klienta
  const handleGoToClient = () => {
    if (task.instalacja_info?.klient_id) {
      (navigation as any).navigate('Clients', {
        screen: 'Menu',
        params: { clientId: task.instalacja_info.klient_id },
      });
    }
  };

  // Funkcja do edycji zadania
  const handleEditTask = () => {
    (navigation as any).navigate('AddForm', {
      task,
      fromClient,
      fromInstallation,
      clientId,
      installationId,
    });
  };

  // Funkcja do usunięcia zadania
  const handleDeleteTask = async () => {
    try {
      await deleteTask({
        method: 'POST',
        data: { zadanie_id: task.id },
      });
      if (getTasks) {
        await getTasks();
      }
      setDeleteModalVisible(false);
      handleGoBack();
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć zadania');
    }
  };

  return (
    <LinearGradient
      colors={['#FF0C01', '#FF9C04']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <ButtonsHeader onBackPress={handleGoBack} />

          <View style={styles.content}>
            <View style={styles.rowContainer}>
              {/* Typ zadania */}
              <View style={styles.leftSection}>
                <Text style={styles.sectionTitle}>Typ zadania</Text>
                <Text style={styles.taskTitle}>
                  {task.typ.charAt(0).toUpperCase() +
                    task.typ.slice(1).toLowerCase()}
                </Text>
              </View>

              {/* Data i godzina */}
              <View style={styles.rightSection}>
                <Text style={styles.sectionTitle}>Data i godzina</Text>
                <Text style={styles.dateTimeText}>
                  {formatDateTime(task.start_date)
                    .toString()
                    .replaceAll('/', '.')}
                </Text>
              </View>
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Status</Text>
              <Dropdown
                name="status"
                control={control}
                label=""
                options={[
                  { label: 'Zaplanowane', value: 'Zaplanowane' },
                  { label: 'Wykonane', value: 'wykonane' },
                  { label: 'Niewykonane', value: 'niewykonane' },
                ]}
                dropDownDirection="TOP"
                isBordered
                customWidth="100%"
                onChange={value => {
                  setCurrentStatus(value);
                  setValue('status', value);
                }}
              />
            </View>

            {/* Przydzielony klient */}
            {task.instalacja_info && (
              <View style={styles.section}>
                <View style={styles.clientInfoContainer}>
                  {/* Nazwa/Imię nazwisko */}
                  <Text style={styles.clientInfoLabel}>Klient:</Text>
                  <Text style={styles.clientInfoValue}>
                    {task.instalacja_info.nazwa_firmy ||
                      `${task.instalacja_info.first_name} ${task.instalacja_info.last_name}`}
                  </Text>
                  {/* Przycisk Przejdź do klienta */}
                  {task.instalacja_info.klient_id && (
                    <Button
                      title="Przejdź do klienta"
                      buttonStyle={styles.clientButton}
                      titleStyle={styles.clientButtonTitle}
                      onPress={handleGoToClient}
                    />
                  )}

                  {/* Adres */}
                  {task.instalacja_info.ulica &&
                    task.instalacja_info.numer_domu && (
                      <View style={styles.clientInfoRow}>
                        <Text style={styles.clientInfoValue}>
                          {[
                            task.instalacja_info.ulica,
                            task.instalacja_info.numer_domu,
                            task.instalacja_info.mieszkanie &&
                            `/${task.instalacja_info.mieszkanie}`,
                            task.instalacja_info.kod_pocztowy,
                            task.instalacja_info.miasto,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        </Text>
                      </View>
                    )}

                  {/* NIP (tylko dla firm) */}
                  {task.instalacja_info.nip && (
                    <View style={styles.clientInfoRow}>
                      <Text style={styles.clientInfoLabel}>NIP:</Text>
                      <Text style={styles.clientInfoValue}>
                        {task.instalacja_info.nip}
                      </Text>
                    </View>
                  )}

                  {/* Adres montażu */}
                  <View style={styles.clientInfoRow}>
                    <Text style={styles.clientInfoLabel}>Instalacja:</Text>
                    <Text style={styles.clientInfoValue}>
                      {task.instalacja_info.name ||
                        'Taki sam jak adres klienta'}
                    </Text>
                  </View>

                  {/* Płatność */}
                  <View style={styles.clientInfoRow}>
                    <Text style={styles.clientInfoLabel}>Płatność:</Text>
                    <Text style={styles.clientInfoValue}>
                      {task.typ === 'montaż'
                        ? task.czy_faktura
                          ? 'Faktura wystawiona'
                          : 'Faktura nie wystawiona'
                        : task.typ === 'oględziny'
                          ? task.czy_oferta
                            ? 'Oferta dodana'
                            : 'Oferta nie dodana'
                          : 'Nie dotyczy'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Przydzielona ekipa/pracownik */}
            {task.grupa && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {task.typ === 'szkolenie'
                    ? 'Przydzielony pracownik'
                    : 'Przydzielona ekipa'}
                </Text>
                <View style={styles.assignedContainer}>
                  <View style={styles.assignedBadge}>
                    <Text style={styles.assignedText}>
                      {assignedName ||
                        (task.grupa > 1
                          ? `Ekipa ${task.grupa}`
                          : `Pracownik ${task.grupa}`)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Uwagi */}
            {task && task.notatki && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Uwagi</Text>
                <Text style={styles.notesText}>
                  {task.notatki && task.notatki.trim() !== ''
                    ? task.notatki
                    : 'Brak uwag.'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Przyciski na dole */}
        <View style={styles.footer}>
          {/* <View style={styles.footerButtonsRow}>
            <Button
              title="Edytuj zadanie"
              buttonStyle={styles.editButton}
              titleStyle={styles.editButtonTitle}
              onPress={handleEditTask}
            />
            <Button
              title="Usuń zadanie"
              buttonStyle={styles.deleteButton}
              titleStyle={styles.deleteButtonTitle}
              onPress={() => setDeleteModalVisible(true)}
            />
          </View> */}
          <ButtonGroup
            submitTitle="Zapisz"
            submitStyle={styles.saveButton}
            cancelTitle="Anuluj"
            cancelStyle={styles.cancelButton}
            cancelTitleStyle={styles.cancelButtonTitle}
            onSubmitPress={handleSaveStatus}
            onCancel={handleGoBack}
          />
        </View>

        {/* Modal potwierdzenia usunięcia */}
        <ConfirmationOverlay
          visible={deleteModalVisible}
          onBackdropPress={() => setDeleteModalVisible(false)}
          onSubmit={handleDeleteTask}
          title="Czy na pewno chcesz usunąć zadanie?"
          submitColor={Colors.red}
        />
      </Container>
    </LinearGradient>
  );
}

export default TaskDetails;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
  },
  taskTitle: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 16,
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  leftSection: {
    marginRight: 'auto',
  },
  rightSection: {
    marginLeft: 'auto',
  },
  dateTimeText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
  },
  section: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 15,
    color: Colors.grayText,
    fontFamily: 'Archivo_400Regular',
    marginBottom: 10,
  },
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedBadge: {
    backgroundColor: Colors.calendarPrimary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginLeft: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: `${Colors.gray}30`,
  },
  saveButton: {
    backgroundColor: Colors.red,
    height: 48,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: Colors.white,
    height: 48,
    borderRadius: 8,
    borderColor: Colors.gray,
    borderWidth: 1,
  },
  cancelButtonTitle: {
    color: Colors.black,
    fontSize: 13,
    fontFamily: 'Archivo_400Regular',
  },
  sectionTitle: {
    color: Colors.gray,
    fontSize: 15,
    fontFamily: 'Archivo_400Regular',
  },
  clientInfoContainer: {
    borderRadius: 8,
  },
  clientInfoRow: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  clientInfoLabel: {
    fontSize: 15,
    fontFamily: 'Archivo_400Regular',
    color: Colors.grayText,
    flex: 1,
  },
  clientInfoValue: {
    fontSize: 16,
    color: Colors.text,
    flex: 2,
  },
  clientButton: {
    backgroundColor: Colors.calendarPrimary,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
  },
  clientButtonTitle: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.calendarPrimary,
    borderRadius: 8,
    height: 48,
  },
  editButtonTitle: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.red,
    borderRadius: 8,
    height: 48,
  },
  deleteButtonTitle: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
  },
});
