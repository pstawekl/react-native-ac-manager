import DateTimePicker from '@react-native-community/datetimepicker';
import { Text } from '@rneui/themed';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import ButtonsHeader from '../../components/ButtonsHeader';
import { Dropdown } from '../../components/Input';
import useApi from '../../hooks/useApi';
import useClients from '../../providers/ClientsProvider';
import useStaff from '../../providers/StaffProvider';
import useTasks from '../../providers/TasksProvider';
import {
  ClientInstallationsListResponse,
  ClientsInstallationListItem,
} from '../../types/clients.types';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type TaskData = {
  nazwa: string;
  status: string;
  typ: string;
  tytul: string;
  task_date: Date;
  task_time: Date;

  klient_id?: number;
  typ_klienta: 'firma' | 'prywatny';

  nazwa_firmy?: string;
  nip_firmy?: string;

  klient_ulica?: string;
  klient_numer_domu?: string;
  klient_numer_mieszkania?: string;
  klient_kod_pocztowy?: string;
  klient_miasto?: string;

  instalacja_id?: number | null;
  montaz_ulica?: string;
  montaz_numer_domu?: string;
  montaz_numer_mieszkania?: string;
  montaz_miasto?: string;

  grupa?: number | null;
  telefon_pracownika?: string;

  faktura_wystawiona?: string;
  forma_rozliczenia?: string;
};

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

export default function AddTaskForm({ navigation, route }: any) {
  const task = route?.params?.task;

  const { clients, getClients } = useClients();
  const { teams, getTeams } = useStaff();
  const { execute: getTasks } = useTasks();
  const { execute, loading } = useApi({ path: 'zadanie_create' });
  const {
    result: installationsResult,
    execute: fetchInstallations,
    loading: installationsLoading,
  } = useApi<ClientInstallationsListResponse>({ path: 'installation_list' });

  const taskDate = task ? parseISO(task.start_date) : new Date();
  const taskTime = task ? parseISO(task.start_date) : new Date();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { control, handleSubmit, setValue } = useForm<TaskData>({
    defaultValues: {
      nazwa: '',
      status: 'Zaplanowane',
      typ: 'montaż',
      tytul: '',
      task_date: taskDate,
      task_time: taskTime,
      typ_klienta: 'prywatny',
      forma_rozliczenia: 'faktura',
    },
  });

  const watchedDate = useWatch({ control, name: 'task_date' });
  const watchedTime = useWatch({ control, name: 'task_time' });
  const clientType = useWatch({ control, name: 'typ_klienta' });
  const watchedKlientId = useWatch({ control, name: 'klient_id' });

  /* ------------------------------------------------------------------------ */
  /*                                EFFECTS                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    getClients();
    getTeams();
  }, []);

  // 🔥 KLUCZ: przełącznik klienta
  useEffect(() => {
    if (clientType === 'prywatny') {
      setValue('nazwa_firmy', '');
      setValue('nip_firmy', '');
    }
  }, [clientType, setValue]);

  // Pobierz instalacje po wyborze klienta; przy zmianie klienta wyczyść instalację
  useEffect(() => {
    if (watchedKlientId) {
      setValue('instalacja_id', null);
      fetchInstallations({ data: { klient_id: Number(watchedKlientId) } });
    }
  }, [watchedKlientId, setValue, fetchInstallations]);

  /* ------------------------------------------------------------------------ */
  /*                                 SUBMIT                                   */
  /* ------------------------------------------------------------------------ */

  const onSubmit = (data: TaskData) => {
    const combined = new Date(data.task_date);
    combined.setHours(data.task_time.getHours());
    combined.setMinutes(data.task_time.getMinutes());
    combined.setSeconds(0);

    const backendData = {
      nazwa: data.tytul || data.nazwa || null,
      status: data.status,
      typ: data.typ,

      klient: data.klient_id ?? null,
      instalacja: data.instalacja_id ?? null,

      grupa: data.grupa ?? null,

      telefon_pracownika: data.telefon_pracownika ?? null,

      faktura_wystawiona: data.faktura_wystawiona ?? null,
      forma_rozliczenia: data.forma_rozliczenia ?? null,

      notatki:
        data.notatki && data.notatki.trim() !== '' ? data.notatki.trim() : null,

      start_date: combined.toISOString(),
      end_date: combined.toISOString(),
    };

    execute({ data: backendData });

    getTasks();
    navigation.goBack();
  };

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.container}>
      <ButtonsHeader
        title="Nowe zadanie"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Stwórz nowe zadanie</Text>

        {/* ------------------------- TYP / TYTUŁ ------------------------- */}

        <Text style={styles.label}>Typ zadania</Text>
        <Dropdown
          name="typ"
          control={control}
          options={[
            { label: 'Montaż', value: 'montaż' },
            { label: 'Oględziny', value: 'oględziny' },
            { label: 'Szkolenie', value: 'szkolenie' },
          ]}
          isBordered
          containerStyle={styles.formControl}
        />

        <Text style={styles.label}>Tytuł</Text>
        <TextInput
          style={styles.formControl}
          placeholder="Wpisz tytuł zadania"
          onChangeText={t => setValue('tytul', t)}
        />

        {/* ------------------------- DATA / GODZINA ------------------------- */}

        <Text style={styles.label}>Data</Text>
        <TouchableOpacity
          style={styles.formControl}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.value}>{format(watchedDate, 'dd.MM.yyyy')}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Godzina</Text>
        <TouchableOpacity
          style={styles.formControl}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.value}>{format(watchedTime, 'HH:mm')}</Text>
        </TouchableOpacity>

        {/* ------------------------- DANE KLIENTA ------------------------- */}

        <Text style={styles.sectionHeader}>Dane klienta</Text>

        <Text style={styles.label}>Klient</Text>
        <Dropdown
          name="klient_id"
          control={control}
          options={
            clients?.map(c => ({
              label:
                c.rodzaj_klienta === 'firma'
                  ? `Firma: ${c.nazwa_firmy}`
                  : `Osoba prywatna: ${c.first_name} ${c.last_name}`,
              value: c.id,
            })) ?? []
          }
          isBordered
          containerStyle={styles.formControl}
        />

        {/* ------------------------- SWITCH ------------------------- */}

        <Text style={styles.label}>Typ klienta</Text>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              clientType === 'firma' && styles.switchActive,
            ]}
            onPress={() => setValue('typ_klienta', 'firma')}
          >
            <Text>Firma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              clientType === 'prywatny' && styles.switchActive,
            ]}
            onPress={() => setValue('typ_klienta', 'prywatny')}
          >
            <Text>Klient prywatny</Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------- FIRMA (WARUNKOWO) ------------------------- */}

        {clientType === 'firma' && (
          <>
            <Text style={styles.label}>Nazwa firmy</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('nazwa_firmy', t)}
            />

            <Text style={styles.label}>NIP firmy</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('nip_firmy', t)}
            />
          </>
        )}

        {/* ------------------------- ADRES KLIENTA ------------------------- */}

        <Text style={styles.label}>Ulica</Text>
        <TextInput
          style={styles.formControl}
          onChangeText={t => setValue('klient_ulica', t)}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Numer domu</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('klient_numer_domu', t)}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Numer mieszkania*</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('klient_numer_mieszkania', t)}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Kod pocztowy</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('klient_kod_pocztowy', t)}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Miasto</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('klient_miasto', t)}
            />
          </View>
        </View>

        {/* ------------------------- ADRES MONTAŻU ------------------------- */}

        <Text style={styles.sectionHeader}>Adres montażu</Text>

        {watchedKlientId ? (
          <>
            <Text style={styles.label}>Instalacja</Text>
            <Dropdown
              name="instalacja_id"
              control={control}
              options={(installationsResult?.installation_list ?? []).map(
                (i: ClientsInstallationListItem) => ({
                  label: i.name ?? `Instalacja ${i.id}`,
                  value: i.id,
                }),
              )}
              isBordered
              containerStyle={styles.formControl}
              disabled={installationsLoading}
            />
          </>
        ) : null}

        <Text style={styles.label}>Ulica</Text>
        <TextInput
          style={styles.formControl}
          onChangeText={t => setValue('montaz_ulica', t)}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Numer domu</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('montaz_numer_domu', t)}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Numer mieszkania*</Text>
            <TextInput
              style={styles.formControl}
              onChangeText={t => setValue('montaz_numer_mieszkania', t)}
            />
          </View>
        </View>

        <Text style={styles.label}>Miasto</Text>
        <TextInput
          style={styles.formControl}
          onChangeText={t => setValue('montaz_miasto', t)}
        />

        {/* ------------------------- EKIPA ------------------------- */}

        <Text style={styles.sectionHeader}>Adres montażu</Text>

        <Text style={styles.label}>Przydziel ekipę</Text>
        <Dropdown
          name="grupa"
          control={control}
          options={teams?.map(t => ({ label: t.nazwa, value: t.id })) ?? []}
          isBordered
          containerStyle={styles.formControl}
        />

        <Text style={styles.label}>Numer telefonu do firmy/pracownika</Text>
        <TextInput
          style={styles.formControl}
          onChangeText={t => setValue('telefon_pracownika', t)}
        />

        <Text style={styles.label}>Czy została wystawiona faktura</Text>
        <Dropdown
          name="faktura_wystawiona"
          control={control}
          options={[
            { label: 'Wybierz', value: '' },
            { label: 'Tak', value: 'tak' },
            { label: 'Nie', value: 'nie' },
          ]}
          isBordered
          containerStyle={styles.formControl}
        />

        <Text style={styles.label}>Forma rozliczenia</Text>
        <Dropdown
          name="forma_rozliczenia"
          control={control}
          options={[
            { label: 'Faktura', value: 'faktura' },
            { label: 'Gotówka', value: 'gotowka' },
            { label: 'Przelew', value: 'przelew' },
          ]}
          isBordered
          containerStyle={styles.formControl}
        />

        {/* ------------------------- NOTATKI ------------------------- */}

        <Text style={styles.sectionHeader}>Uwagi</Text>

        <TextInput
          style={styles.notesInput}
          placeholder="Uwagi / notatki do zadania"
          multiline
          numberOfLines={4}
          onChangeText={t => setValue('notatki', t)}
        />
      </ScrollView>

      {/* ------------------------- FOOTER ------------------------- */}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Anuluj</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveBtn}
          disabled={loading}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.saveText}>Zastosuj</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------- PICKERS ------------------------- */}

      {showDatePicker && (
        <DateTimePicker
          value={watchedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            setShowDatePicker(false);
            if (d) setValue('task_date', d);
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={watchedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, t) => {
            setShowTimePicker(false);
            if (t) setValue('task_time', t);
          }}
        />
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 140 },
  title: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', marginBottom: 16 },
  sectionHeader: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 16,
    marginBottom: 6,
  },
  label: { fontSize: 12, marginBottom: 4 },
  formControl: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: { fontSize: 14 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#ECECEC',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  switchBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#FFFFFF',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    backgroundColor: '#fff',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 16 },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { fontSize: 16, color: '#fff' },
  notesInput: {
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
});
