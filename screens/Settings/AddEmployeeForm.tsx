/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-native/no-inline-styles */
import { Divider } from '@rneui/base';
import { useCallback, useEffect, useState } from 'react';
import { Control, useForm, useWatch } from 'react-hook-form';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';

import { LinearGradient } from 'expo-linear-gradient';
import { ButtonGroup, SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import Container from '../../components/Container';
import UserIcon from '../../components/icons/UserIcon';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import useStaff, { Team } from '../../providers/StaffProvider';

type EmployeeData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  code: string;
  phone: string;
  group_id: number;
  type: string;
};

type TeamsListProps = {
  teams: Team[];
  control: Control<EmployeeData, any>;
  setValue: (name: keyof EmployeeData, value: any) => void;
};

function TeamsList({ teams, control, setValue }: TeamsListProps): JSX.Element {
  const colors = ['#FFA2A2', '#71C1EE', '#E7A2FF', '#BEDC68'];
  const watchedGroupId = useWatch({
    control,
    name: 'group_id',
  });
  const [groupId, setGroupId] = useState<number | undefined>(watchedGroupId);

  useEffect(() => {
    setGroupId(watchedGroupId);
  }, [watchedGroupId]);

  useEffect(() => {
    if (groupId !== watchedGroupId) {
      setValue('group_id', groupId);
    }
  }, [groupId, setValue, watchedGroupId]);

  if (teams.length === 0 || !teams || !control) {
    return <Text>Brak ekip</Text>;
  }

  return (
    <View style={styles.teamsContainer}>
      <Text style={styles.groupTitle}>Przydziel do ekipy</Text>
      <Divider style={styles.divider} />
      <View style={styles.teamsScrollContainer}>
        {teams.map((team, index) => (
          <Pressable
            key={team.id}
            style={
              groupId === team.id
                ? styles.checkedTeamContainer
                : styles.teamContainer
            }
          >
            <View style={styles.teamTitle}>
              <View
                style={[
                  styles.groupIcon,
                  { backgroundColor: colors[index % colors.length] },
                ]}
              >
                <UserIcon viewBox="0 0 90 90" color={Colors.white} />
              </View>
              <Text>{team.nazwa}</Text>
            </View>
            <SubmitButton
              title={groupId === team.id ? 'Usuń z ekipy' : 'Przydziel'}
              onPress={() => {
                const currentGroupId = groupId;
                if (currentGroupId === team.id) {
                  setGroupId(undefined);
                } else {
                  setGroupId(team.id);
                }
              }}
              style={
                groupId === team.id
                  ? styles.checkedAssignButton
                  : styles.assignButton
              }
              titleStyle={
                groupId === team.id
                  ? styles.checkedAssignButtonTitle
                  : styles.assignButtonTitle
              }
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AddEmployeeForm({ navigation, route }: any): JSX.Element {
  const { employee } = route.params;
  const { getEmployees, getTeams, teams } = useStaff();
  const { execute, loading } = useApi<{
    Status: string;
    error: string;
  }>({
    path: 'create_monter',
  });

  const { execute: editEmployee } = useApi({
    path: 'change_child_data',
  });

  const [visible, setVisible] = useState(false);

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EmployeeData>({
    defaultValues: {
      first_name: employee?.first_name ?? '',
      last_name: employee?.last_name ?? '',
      street: employee?.ulica ?? '',
      code: employee?.kod_pocztowy ?? '',
      city: employee?.miasto ?? '',
      email: employee?.email ?? '',
      phone: employee?.numer_telefonu ?? '',
      group_id: employee?.group_id ?? undefined,
    },
  });

  useEffect(() => {
    if (getTeams) {
      getTeams();
    }
  }, [getTeams]);

  const onSubmit = async (data: EmployeeData) => {
    if (!employee) {
      const response = await execute(data);
      if (response?.Status === 'User Created') {
        toggleOverlay();
        Alert.alert('Pracownik dodany.');
        if (getEmployees) {
          getEmployees();
        }
        navigation.goBack();
      } else {
        Alert.alert('Błąd', response?.error);
      }
    } else {
      await editEmployee({
        ...data,
        group: data.group_id,
        user_id: employee.ac_user,
      });
      toggleOverlay();
      Alert.alert('Pracownik zapisany');
      if (getEmployees) {
        getEmployees();
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
      <ScrollView style={styles.main}>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <Container style={styles.container}>
          <View style={styles.contentContainer}>
            <View style={styles.block}>
              <Text style={styles.groupTitle}>Informacje podstawowe</Text>
              <Divider style={styles.divider} />
              <View>
                <View style={styles.formContainer}>
                  <FormInput
                    name="first_name"
                    control={control}
                    label="Imię"
                    noPadding
                    error={errors.first_name}
                    rules={{ required: 'Imię jest wymagane' }}
                  />
                  <FormInput
                    name="last_name"
                    control={control}
                    label="Nazwisko"
                    noPadding
                    error={errors.last_name}
                    rules={{ required: 'Nazwisko jest wymagane' }}
                  />
                </View>
                <FormInput
                  name="email"
                  control={control}
                  label="E-mail"
                  noPadding
                  error={errors.email}
                  rules={{
                    required: 'E-mail jest wymagany',
                    pattern: {
                      value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      message: 'Nieprawidłowy adres e-mail',
                    },
                  }}
                />
                <Dropdown
                  name="type"
                  control={control}
                  label="Typ"
                  options={[
                    { label: 'Pracownik', value: 'employee' },
                    { label: 'Kierownik', value: 'manager' },
                    { label: 'Monter', value: 'monter' },
                  ]}
                  isBordered
                  isThin
                />
                {teams && (
                  <TeamsList
                    teams={teams}
                    control={control}
                    setValue={setValue}
                  />
                )}
              </View>
            </View>
          </View>
        </Container>
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

export default AddEmployeeForm;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 14,
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
    backgroundColor: Colors.white,
  },
  main: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    overflow: 'scroll',
  },
  divider: {
    marginTop: 6,
    marginBottom: 20,
    height: 1,
    backgroundColor: Colors.separator,
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  block: { marginVertical: 14 },
  groupTitle: {
    color: Colors.grayTitle,
    fontSize: 16,
    marginBottom: 8,
  },
  groupIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 41,
    height: 41,
    borderRadius: 41,
  },
  teamsContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 360,
  },
  teamsScrollContainer: {
    flexGrow: 0,
  },
  teamContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 10,
    backgroundColor: Colors.draggableBackground,
    borderRadius: 6,
    maxHeight: 350,
    overflow: 'scroll',
  },
  teamTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkedTeamContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 10,
    backgroundColor: Colors.draggableBackground,
    borderColor: Colors.green,
    borderWidth: 1,
    borderRadius: 6,
    maxHeight: 350,
    overflow: 'scroll',
  },
  assignButton: {
    width: 88,
    height: 36,
    padding: 0,
    borderRadius: 6,
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.black,
  },
  assignButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
  },
  checkedAssignButton: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
    borderRadius: 6,
  },
  checkedAssignButtonTitle: {
    color: Colors.white,
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
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 130, // Add padding to account for footer
  },
});
