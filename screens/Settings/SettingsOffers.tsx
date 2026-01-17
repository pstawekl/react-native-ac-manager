import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { Divider } from '@rneui/base';
import { LinearGradient } from 'expo-linear-gradient';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import Container from '../../components/Container';
import { Dropdown } from '../../components/Input';
import Colors from '../../consts/Colors';
import { SettingsOffersScreenProps } from '../../navigation/types';
import {
  RoundingMode,
  useOfferSettings,
} from '../../providers/OfferSettingsProvider';

export type OfferSettingsData = {
  rounding_mode: RoundingMode;
};

const roundingOptions = [
  { label: 'Bez zaokrąglania', value: 'none' as RoundingMode },
  { label: 'Do pełnych złotych (w górę)', value: 'full' as RoundingMode },
  { label: 'Do dziesiątek (w górę)', value: 'tens' as RoundingMode },
  { label: 'Do setek (w górę)', value: 'hundreds' as RoundingMode },
];

function SettingsOffers({ navigation }: SettingsOffersScreenProps) {
  const { control, handleSubmit, setValue } = useForm<OfferSettingsData>();
  const [visible, setVisible] = useState(false);
  const { settings, updateRoundingMode, loading } = useOfferSettings();

  const toggleOverlay = () => {
    setVisible(!visible);
  };

  useEffect(() => {
    if (settings) {
      setValue('rounding_mode', settings.roundingMode);
    }
  }, [settings, setValue]);

  const onSubmit = useCallback(
    async (data: OfferSettingsData) => {
      try {
        await updateRoundingMode(data.rounding_mode);
        Alert.alert('Sukces', 'Ustawienia ofert zostały zapisane.');
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się zapisać ustawień ofert.');
      }
    },
    [updateRoundingMode],
  );

  const onDeleteConfirmed = useCallback(async () => {
    try {
      await updateRoundingMode('none');
      Alert.alert('Sukces', 'Ustawienia zostały zresetowane.');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zresetować ustawień.');
    }
    toggleOverlay();
  }, [updateRoundingMode]);

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <ButtonsHeader onBackPress={navigation.goBack} />
        <ScrollView style={styles.scrollContainer}>
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
        </ScrollView>

        <View style={styles.buttonsContainer}>
          <ButtonGroup
            submitTitle="Zapisz"
            cancelTitle="Resetuj"
            onSubmitPress={handleSubmit(onSubmit)}
            onCancel={toggleOverlay}
            stretch={false}
            groupStyle={styles.buttonGroup}
            cancelStyle={styles.resetButton}
            cancelTitleStyle={styles.resetButtonTitle}
            submitStyle={styles.saveButton}
            submitTitleStyle={styles.saveButtonTitle}
          />
        </View>

        <ConfirmationOverlay
          visible={visible}
          onBackdropPress={toggleOverlay}
          onSubmit={onDeleteConfirmed}
          title="Czy na pewno chcesz zresetować ustawienia zaokrąglania?"
        />
      </Container>
    </LinearGradient>
  );
}

export default SettingsOffers;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.white,
    flex: 1,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
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
  buttonsContainer: {
    paddingHorizontal: 18,
    paddingBottom: 30,
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
  resetButton: {
    flex: 1,
    width: 140,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: Colors.white,
    borderColor: Colors.red,
    height: 48,
  },
  resetButtonTitle: {
    color: Colors.red,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: Colors.teal,
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
  },
});
