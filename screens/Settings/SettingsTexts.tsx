/* eslint-disable react-native/no-inline-styles */
import { Control, useForm, UseFormSetValue, useWatch } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import { FormInput, Textarea } from '../../components/Input';
import Switch from '../../components/Switch';
import Colors from '../../consts/Colors';
import { SettingsTextsScreenProps } from '../../navigation/types';

type TextData = {
  invoiceText: string;
  offerText: string;
  offerInstallationReportText: string;
  offerServiceReportText: string;
  invoiceHeader: string;
  offerHeader: string;
  offerInstallationReportHeader: string;
  offerServiceReportHeader: string;
  isInvoiceTextEnabled: boolean;
  isOfferTextEnabled: boolean;
  isOfferInstallationReportTextEnabled: boolean;
  isOfferServiceReportTextEnabled: boolean;
};

type SettingsTextNameProps =
  | 'invoiceText'
  | 'offerText'
  | 'offerInstallationReportText'
  | 'offerServiceReportText';

type SettingsTextEnabledProps =
  | 'isInvoiceTextEnabled'
  | 'isOfferTextEnabled'
  | 'isOfferInstallationReportTextEnabled'
  | 'isOfferServiceReportTextEnabled';

type HeaderNameProps =
  | 'invoiceHeader'
  | 'offerHeader'
  | 'offerInstallationReportHeader'
  | 'offerServiceReportHeader';

type SettingsTextComponentProps = {
  label: string;
  name: SettingsTextNameProps;
  headerName: HeaderNameProps;
  control: Control<TextData>;
  enabledProps: SettingsTextEnabledProps;
  setValue: UseFormSetValue<TextData>;
};

function SettingsTextComponent({
  label,
  name,
  headerName,
  control,
  enabledProps,
  setValue,
}: SettingsTextComponentProps) {
  const isTextComponentEnabled = useWatch({
    control,
    name: enabledProps,
  });
  const [isEnabled, setIsEnabled] = useState(isTextComponentEnabled);

  useEffect(() => {
    setValue(enabledProps, isEnabled);
  }, [isEnabled, setValue, enabledProps]);

  return (
    <View style={styles.textComponent}>
      <View
        style={isEnabled ? styles.enabledTextHeader : styles.disabledTextHeader}
      >
        <Text
          style={
            isEnabled ? styles.enabledTextCaption : styles.disabledTextCaption
          }
        >
          {label}
        </Text>
        <Switch value={isEnabled} onValueChange={setIsEnabled} />
      </View>
      <FormInput
        label="Nagłówek"
        control={control}
        name={headerName}
        disabled={!isEnabled}
      />
      <Textarea
        label="Treść wiadomości"
        name={name}
        control={control}
        disabled={!isEnabled}
      />
    </View>
  );
}

function SettingsTexts({ navigation }: SettingsTextsScreenProps) {
  const { control, handleSubmit, setValue } = useForm<TextData>({
    defaultValues: {
      invoiceText:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ultricies pharetra metus bibendum elementum. Sed feugiat enim non nisl tempor, id hendrerit odio tristique.',
      offerText:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ultricies pharetra metus bibendum elementum. Sed feugiat enim non nisl tempor, id hendrerit odio tristique.',
      offerInstallationReportText:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ultricies pharetra',
      offerServiceReportText:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ultricies pharetra',
    },
  });

  const onSubmit = () => {
    // TODO
  };

  const onError = () => {
    // TODO
  };

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container} keyboardVerticalOffset={135}>
        <ButtonsHeader onBackPress={navigation.goBack} />

        <ScrollView style={styles.scrollContainer}>
          <View>
            <SettingsTextComponent
              label="Szablon ofertowy"
              name="offerText"
              control={control}
              headerName="invoiceHeader"
              enabledProps="isOfferTextEnabled"
              setValue={setValue}
            />
            <SettingsTextComponent
              label="Szablon do faktur"
              name="invoiceText"
              control={control}
              headerName="offerHeader"
              enabledProps="isInvoiceTextEnabled"
              setValue={setValue}
            />
            <SettingsTextComponent
              label="Szablon do protokołów z montażu"
              name="offerInstallationReportText"
              control={control}
              headerName="offerInstallationReportHeader"
              enabledProps="isOfferInstallationReportTextEnabled"
              setValue={setValue}
            />
            <SettingsTextComponent
              label="Szablon do protokołów z serwisu"
              name="offerServiceReportText"
              control={control}
              headerName="offerServiceReportHeader"
              enabledProps="isOfferServiceReportTextEnabled"
              setValue={setValue}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <ButtonGroup
            submitTitle="Zapisz"
            cancelTitle="Anuluj"
            onSubmitPress={() => handleSubmit(onSubmit, onError)}
            onCancel={navigation.goBack}
            stretch={false}
            groupStyle={styles.buttonGroup}
            cancelStyle={styles.cancelButton}
            cancelTitleStyle={styles.cancelButtonTitle}
            submitStyle={styles.submitButton}
            submitTitleStyle={styles.submitButtonTitle}
          />
        </View>
      </Container>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopRightRadius: 35,
    borderTopLeftRadius: 35,
  },
  scrollContainer: {
    paddingHorizontal: 6,
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
  textComponent: {
    backgroundColor: Colors.white,
    padding: 16,
    marginBottom: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
  },
  enabledTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  disabledTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  enabledTextCaption: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  disabledTextCaption: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.gray,
  },
});

export default SettingsTexts;
