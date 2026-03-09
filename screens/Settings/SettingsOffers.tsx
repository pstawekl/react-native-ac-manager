import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Divider } from '@rneui/base';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import Container from '../../components/Container';
import { Dropdown, FormInput } from '../../components/Input';
import Colors from '../../consts/Colors';
import { SettingsOffersScreenProps } from '../../navigation/types';
import {
  RoundingMode,
  WorkScheduleItem,
  useOfferSettings,
} from '../../providers/OfferSettingsProvider';

export type OfferSettingsData = {
  rounding_mode: RoundingMode;
  montaz_buffer_days?: string;
};

const roundingOptions = [
  { label: 'Bez zaokrąglania', value: 'none' as RoundingMode },
  { label: 'Do pełnych złotych (w górę)', value: 'full' as RoundingMode },
  { label: 'Do dziesiątek (w górę)', value: 'tens' as RoundingMode },
  { label: 'Do setek (w górę)', value: 'hundreds' as RoundingMode },
];

const DAY_NAMES = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela',
];

const defaultWorkSchedules = (): WorkScheduleItem[] =>
  Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    start_time: weekday < 5 ? '08:00' : null,
    end_time: weekday < 5 ? '16:00' : null,
  }));

function SettingsOffers({ navigation }: SettingsOffersScreenProps) {
  const { control, handleSubmit, setValue } = useForm<OfferSettingsData>();
  const [visible, setVisible] = useState(false);
  const [bufferDays, setBufferDays] = useState(0);
  const [workSchedules, setWorkSchedules] =
    useState<WorkScheduleItem[]>(defaultWorkSchedules);
  const [draftReservationSystemEnabled, setDraftReservationSystemEnabled] =
    useState(true);
  const [draftReviewRemindersEnabled, setDraftReviewRemindersEnabled] =
    useState(true);
  const { settings, updateRoundingMode, updateOfferSettingsApi, loading } =
    useOfferSettings();

  const toggleOverlay = () => {
    setVisible(!visible);
  };

  useEffect(() => {
    if (settings) {
      setValue('rounding_mode', settings.roundingMode);
      setValue('montaz_buffer_days', String(settings.montazBufferDays));
      setBufferDays(settings.montazBufferDays);
      setDraftReservationSystemEnabled(settings.reservationSystemEnabled);
      setDraftReviewRemindersEnabled(settings.reviewRemindersEnabled);
      if (settings.workSchedules?.length === 7) {
        setWorkSchedules(
          settings.workSchedules
            .slice()
            .sort((a, b) => a.weekday - b.weekday)
            .map(ws => ({
              ...ws,
              start_time: ws.start_time ?? null,
              end_time: ws.end_time ?? null,
            })),
        );
      }
    }
  }, [settings, setValue]);

  const updateWorkDay = useCallback(
    (
      weekday: number,
      field: 'start_time' | 'end_time' | 'working',
      value: string | boolean,
    ) => {
      setWorkSchedules(prev => {
        const next = prev.map(ws =>
          ws.weekday === weekday
            ? field === 'working'
              ? value
                ? { ...ws, start_time: '08:00', end_time: '16:00' }
                : { ...ws, start_time: null, end_time: null }
              : { ...ws, [field]: value }
            : ws,
        );
        return next;
      });
    },
    [],
  );

  const onSubmit = useCallback(
    async (data: OfferSettingsData) => {
      try {
        await updateRoundingMode(data.rounding_mode);
        const buf = Math.min(
          90,
          Math.max(
            0,
            parseInt(String(data.montaz_buffer_days ?? bufferDays), 10) || 0,
          ),
        );
        await updateOfferSettingsApi(
          buf,
          workSchedules,
          draftReservationSystemEnabled,
          draftReviewRemindersEnabled,
        );
        setBufferDays(buf);
        Alert.alert('Ustawienia ofert zostały zapisane.');
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się zapisać ustawień ofert.');
      }
    },
    [
      updateRoundingMode,
      updateOfferSettingsApi,
      bufferDays,
      workSchedules,
      draftReservationSystemEnabled,
      draftReviewRemindersEnabled,
    ],
  );

  const onCancel = useCallback(() => {
    if (settings) {
      setDraftReservationSystemEnabled(settings.reservationSystemEnabled);
      setDraftReviewRemindersEnabled(settings.reviewRemindersEnabled);
      setBufferDays(settings.montazBufferDays);
      setValue('montaz_buffer_days', String(settings.montazBufferDays));
      setValue('rounding_mode', settings.roundingMode);
      if (settings.workSchedules?.length === 7) {
        setWorkSchedules(
          settings.workSchedules
            .slice()
            .sort((a, b) => a.weekday - b.weekday)
            .map(ws => ({
              ...ws,
              start_time: ws.start_time ?? null,
              end_time: ws.end_time ?? null,
            })),
        );
      }
    }
  }, [settings, setValue]);

  const onDeleteConfirmed = useCallback(async () => {
    try {
      await updateRoundingMode('none');
      await updateOfferSettingsApi(0, defaultWorkSchedules(), true, true);
      setBufferDays(0);
      setWorkSchedules(defaultWorkSchedules());
      Alert.alert('Ustawienia zostały zresetowane.');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zresetować ustawień.');
    }
    toggleOverlay();
  }, [updateRoundingMode, updateOfferSettingsApi]);

  return (
    <Container style={styles.container}>
      <ButtonsHeader onBackPress={navigation.goBack} title="Ustawienia ofert" />
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System rezerwacji terminów</Text>
          <Text style={styles.sectionDescription}>
            Gdy włączony, klient może wybierać i proponować terminy montażu po
            zaakceptowaniu oferty. Gdy wyłączony, przycisk wyboru terminu nie
            jest pokazywany.
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.workDayRow}>
            <Text style={styles.workDayText}>
              System rezerwacji terminów włączony
            </Text>
            <Switch
              value={draftReservationSystemEnabled}
              onValueChange={setDraftReservationSystemEnabled}
              trackColor={{
                false: Colors.lightGray,
                true: Colors.teal,
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Przypomnienia o przeglądach</Text>
          <Text style={styles.sectionDescription}>
            Gdy włączone, klienci otrzymają SMS i e-mail z przypomnieniem o
            zbliżającym się terminie przeglądu (np. 7 dni przed datą).
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.workDayRow}>
            <Text style={styles.workDayText}>
              Przypomnienia o przeglądach (SMS i e-mail)
            </Text>
            <Switch
              value={draftReviewRemindersEnabled}
              onValueChange={setDraftReviewRemindersEnabled}
              trackColor={{
                false: Colors.lightGray,
                true: Colors.teal,
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Bufor na pierwszy termin montażu
          </Text>
          <Text style={styles.sectionDescription}>
            Pierwszy dostępny termin montażu będzie możliwy po podanej liczbie
            dni od zaakceptowania oferty przez klienta (0–90).
          </Text>
          <Divider style={styles.divider} />
          <FormInput
            label="Liczba dni"
            name="montaz_buffer_days"
            control={control}
            keyboardType="number-pad"
            placeholder="0"
            isBordered
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Godziny pracy</Text>
          <Text style={styles.sectionDescription}>
            Dla każdego dnia tygodnia ustaw, w jakich godzinach firma pracuje.
            To jest brane pod uwagę przy proponowaniu dostępnych terminów na
            montaże.
          </Text>
          <Divider style={styles.divider} />
          {DAY_NAMES.map((dayName, idx) => {
            const ws = workSchedules.find(s => s.weekday === idx) ?? {
              weekday: idx,
              start_time: null,
              end_time: null,
            };
            const isWorking = ws.start_time != null && ws.end_time != null;
            return (
              <View key={idx} style={styles.workDayRow}>
                <View style={styles.workDayLabel}>
                  <Text style={styles.workDayText}>{dayName}</Text>
                  <Switch
                    value={isWorking}
                    onValueChange={v => updateWorkDay(idx, 'working', v)}
                    trackColor={{
                      false: Colors.lightGray,
                      true: Colors.teal,
                    }}
                  />
                </View>
                {isWorking && (
                  <View style={styles.timeRow}>
                    <TextInput
                      style={styles.timeInput}
                      value={ws.start_time ?? ''}
                      placeholder="08:00"
                      placeholderTextColor={Colors.gray}
                      onChangeText={t => updateWorkDay(idx, 'start_time', t)}
                    />
                    <Text style={styles.timeSeparator}>–</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={ws.end_time ?? ''}
                      placeholder="16:00"
                      placeholderTextColor={Colors.gray}
                      onChangeText={t => updateWorkDay(idx, 'end_time', t)}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zaokrąglanie kwot ofert</Text>
          <Text style={styles.sectionDescription}>
            Wybierz sposób zaokrąglania finalnych kwot w ofertach
          </Text>
          <Divider style={styles.divider} />

          <Dropdown
            label="Sposób zaokrąglania"
            name="rounding_mode"
            control={control}
            options={roundingOptions}
            isBordered
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              • Bez zaokrąglania - kwoty wyświetlane dokładnie
            </Text>
            <Text style={styles.infoText}>
              • Do pełnych złotych - np. 1234,67 zł → 1235 zł
            </Text>
            <Text style={styles.infoText}>
              • Do dziesiątek - np. 1234,67 zł → 1240 zł
            </Text>
            <Text style={styles.infoText}>
              • Do setek - np. 1234,67 zł → 1300 zł
            </Text>
          </View>
        </View>
        <ButtonGroup
          submitTitle="Zapisz"
          cancelTitle="Anuluj"
          onSubmitPress={handleSubmit(onSubmit)}
          onCancel={onCancel}
          stretch={false}
          groupStyle={styles.buttonGroup}
          cancelStyle={styles.cancelButton}
          cancelTitleStyle={styles.cancelButtonTitle}
          submitStyle={styles.saveButton}
          submitTitleStyle={styles.saveButtonTitle}
        />
      </ScrollView>

      {/* <View style={styles.buttonsContainer}>
        <Text style={styles.resetLink} onPress={toggleOverlay}>
          Resetuj do domyślnych
        </Text>
      </View> */}

      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz zresetować wszystkie ustawienia ofert (zaokrąglanie, bufor i godziny pracy)?"
      />
    </Container>
  );
}

export default SettingsOffers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: Colors.lightGray,
  },
  infoBox: {
    backgroundColor: Colors.invoiceFormTextContainer,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: Colors.grayText,
    marginBottom: 4,
  },
  workDayRow: {
    marginBottom: 12,
  },
  workDayLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  workDayText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Archivo_400Regular',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.black,
    minWidth: 70,
  },
  timeSeparator: {
    fontSize: 14,
    color: Colors.gray,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 30,
    backgroundColor: Colors.white,
  },
  cancelButton: {
    flex: 1,
    width: 140,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: Colors.transparent,
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
  saveButton: {
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
  saveButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    overflow: 'visible',
  },
});
