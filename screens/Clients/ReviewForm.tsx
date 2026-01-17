/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import { Divider } from '@rneui/base';
import { Text } from '@rneui/themed';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { ButtonGroup } from '../../components/Button';
import DatePicker from '../../components/DatePicker';
import FilePicker, { File } from '../../components/FilePicker';
import FilesIcon from '../../components/icons/FilesIcon';
import { Dropdown, Textarea } from '../../components/Input';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';

type ReviewData = {
  data_przegladu?: Date | string;
  kontrola_stanu_jedn_wew?: string;
  kontrola_stanu_jedn_zew?: string;
  kontrola_stanu_mocowania_agregatu?: string;
  czyszczenie_filtrow_jedn_wew?: string;
  czyszczenie_wymiennika_ciepla_wew?: string;
  czyszczenie_obudowy_jedn_wew?: string;
  czyszczenie_tacy_skroplin?: string;
  kontrola_droznosci_skroplin?: string;
  czyszczenie_obudowy_jedn_zew?: string;
  czyszczenie_wymiennika_ciepla_zew?: string;
  kontrola_szczelnosci?: string;
  kontrola_poprawnosci_dzialania?: string;
  kontrola_temperatury_nawiewu_wew?: string;
  diagnostyka_awari?: string;
  uwagi?: string;
  photos?: File | undefined;
};

type ReviewFormProps = {
  installationId: string;
  reviewId?: number | null;
  onSave?: () => void;
  onCancel?: () => void;
};

// Opcje dla dropdownów checklistów
const checklistOptions = [
  { label: 'Wybierz', value: '' },
  { label: 'OK', value: 'OK' },
  { label: 'Wymaga naprawy', value: 'Wymaga naprawy' },
  { label: 'Nie dotyczy', value: 'Nie dotyczy' },
  { label: 'Niedostępne', value: 'Niedostępne' },
];

const reviewDefaultValues: ReviewData = {
  data_przegladu: new Date(),
  kontrola_stanu_jedn_wew: '',
  kontrola_stanu_jedn_zew: '',
  kontrola_stanu_mocowania_agregatu: '',
  czyszczenie_filtrow_jedn_wew: '',
  czyszczenie_wymiennika_ciepla_wew: '',
  czyszczenie_obudowy_jedn_wew: '',
  czyszczenie_tacy_skroplin: '',
  kontrola_droznosci_skroplin: '',
  czyszczenie_obudowy_jedn_zew: '',
  czyszczenie_wymiennika_ciepla_zew: '',
  kontrola_szczelnosci: '',
  kontrola_poprawnosci_dzialania: '',
  kontrola_temperatury_nawiewu_wew: '',
  diagnostyka_awari: '',
  uwagi: '',
  photos: undefined,
};

// Style dla formularza przeglądu
const reviewStyles = StyleSheet.create({
  reviewFormContainer: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    display: 'flex',
    flexDirection: 'column',
  },
  reviewScrollView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
  },
  reviewScrollContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
  },
  reviewTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 20,
  },
  reviewSection: {
    marginBottom: 0,
  },
  addPhotoSection: {
    marginBottom: 20,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  reviewLabel: {
    fontSize: 10,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 6,
  },
  readOnlySection: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    marginTop: 20,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
  },
  readOnlyValue: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  readOnlyDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 0,
  },
  reviewCancelButton: {
    minHeight: 48,
    height: 48,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    borderWidth: 1,
    backgroundColor: Colors.transparent,
    borderColor: Colors.borderButton,
    flex: 1,
  },
  reviewCancelButtonTitle: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  reviewSubmitButton: {
    backgroundColor: Colors.green,
    minHeight: 48,
    height: 48,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    flex: 1,
  },
  reviewSubmitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  reviewButtonGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  pdfButton: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    height: 54,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  pdfButtonText: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
    marginLeft: 12,
  },
});

export default function ReviewProtocolForm({
  installationId,
  reviewId,
  onSave,
  onCancel,
}: ReviewFormProps) {
  const navigation = useNavigation();
  const { control, handleSubmit, setValue } = useForm<ReviewData>({
    defaultValues: reviewDefaultValues,
  });

  const [deviceData, setDeviceData] = useState<any>(null);

  const { execute: fetchReviewData } = useApi<{
    serwis: any;
    device: any;
    photos: any[];
  }>({
    path: 'przeglad_data',
  });

  const { execute: saveReview } = useApi<{
    status?: string;
    serwis_id?: number;
  }>({
    path: 'serwis_edit',
  });

  const { execute: addPhoto } = useApi<
    { status?: string; image_url?: string; photo_id?: number },
    FormData
  >({
    path: 'add_photo',
  });

  const { execute: getPhotoList } = useApi<{ zdjecia: any[] }>({
    path: 'photo_list',
  });

  const { execute: generatePDF } = useApi<{
    success?: boolean;
    html_content?: string;
  }>({
    path: 'generate_pdf',
  });

  const { execute: getMontageList } = useApi<any[]>({
    path: 'montaz_list',
  });

  const { execute: fetchMontageData } = useApi<any>({
    path: 'montaz_data',
  });

  // Wczytaj dane przeglądu jeśli reviewId jest podane, lub dane urządzenia z montażu dla nowych przeglądów
  useEffect(() => {
    const loadReviewData = async () => {
      if (reviewId) {
        try {
          const reviewData = await fetchReviewData({
            data: { serwis_id: reviewId },
          });

          if (reviewData) {
            // Ustaw dane urządzenia
            if (reviewData.device) {
              setDeviceData(reviewData.device);
            }

            // Ustaw wartości formularza
            if (reviewData.serwis) {
              const { serwis } = reviewData;
              if (serwis.data_przegladu) {
                setValue('data_przegladu', new Date(serwis.data_przegladu));
              }
              setValue(
                'kontrola_stanu_jedn_wew',
                serwis.kontrola_stanu_jedn_wew || '',
              );
              setValue(
                'kontrola_stanu_jedn_zew',
                serwis.kontrola_stanu_jedn_zew || '',
              );
              setValue(
                'kontrola_stanu_mocowania_agregatu',
                serwis.kontrola_stanu_mocowania_agregatu || '',
              );
              setValue(
                'czyszczenie_filtrow_jedn_wew',
                serwis.czyszczenie_filtrow_jedn_wew || '',
              );
              setValue(
                'czyszczenie_wymiennika_ciepla_wew',
                serwis.czyszczenie_wymiennika_ciepla_wew || '',
              );
              setValue(
                'czyszczenie_obudowy_jedn_wew',
                serwis.czyszczenie_obudowy_jedn_wew || '',
              );
              setValue(
                'czyszczenie_tacy_skroplin',
                serwis.czyszczenie_tacy_skroplin || '',
              );
              setValue(
                'kontrola_droznosci_skroplin',
                serwis.kontrola_droznosci_skroplin || '',
              );
              setValue(
                'czyszczenie_obudowy_jedn_zew',
                serwis.czyszczenie_obudowy_jedn_zew || '',
              );
              setValue(
                'czyszczenie_wymiennika_ciepla_zew',
                serwis.czyszczenie_wymiennika_ciepla_zew || '',
              );
              setValue(
                'kontrola_szczelnosci',
                serwis.kontrola_szczelnosci || '',
              );
              setValue(
                'kontrola_poprawnosci_dzialania',
                serwis.kontrola_poprawnosci_dzialania || '',
              );
              setValue(
                'kontrola_temperatury_nawiewu_wew',
                serwis.kontrola_temperatury_nawiewu_wew || '',
              );
              setValue('diagnostyka_awari', serwis.diagnostyka_awari || '');
              setValue('uwagi', serwis.uwagi || '');

              // Wczytaj zdjęcia - ustaw pierwsze zdjęcie w formularzu (FilePicker obsługuje jedno zdjęcie)
              if (reviewData.photos && reviewData.photos.length > 0) {
                const firstPhoto = reviewData.photos[0];
                setValue('photos', {
                  uri: firstPhoto.image,
                  name: `photo_${firstPhoto.id}.jpg`,
                  type: 'image/jpeg',
                } as File);
              } else {
                // Pobierz zdjęcia przez photo_list jeśli nie ma w odpowiedzi
                try {
                  const photoResponse = await getPhotoList({
                    data: { serwis_id: reviewId },
                  });
                  if (
                    photoResponse?.zdjecia &&
                    photoResponse.zdjecia.length > 0
                  ) {
                    const firstPhoto = photoResponse.zdjecia[0];
                    setValue('photos', {
                      uri: firstPhoto.image,
                      name: `photo_${firstPhoto.id}.jpg`,
                      type: 'image/jpeg',
                    } as File);
                  }
                } catch (error) {
                  console.error('Error loading photos:', error);
                }
              }
            }
          }
        } catch (error) {
          Alert.alert('Błąd', 'Nie udało się wczytać danych przeglądu');
        }
      } else {
        // Dla nowych przeglądów, pobierz dane urządzenia z montażu dla instalacji
        try {
          const montageList = await getMontageList({
            data: { instalacja_id: installationId },
          });

          if (
            montageList &&
            Array.isArray(montageList) &&
            montageList.length > 0
          ) {
            const montage = montageList[0];
            // Pobierz pełne dane montażu z urządzeniem
            try {
              const montageData = await fetchMontageData({
                data: { montaz_id: montage.id },
              });
              if (montageData?.device) {
                setDeviceData(montageData.device);
              }
            } catch (error) {
              console.error('Error fetching montage device data:', error);
            }
          }

          // Pobierz zdjęcia powiązane z instalacją (jeśli są)
          try {
            const photoResponse = await getPhotoList({
              data: { instalacja_id: installationId },
            });
            if (photoResponse?.zdjecia && photoResponse.zdjecia.length > 0) {
              // Ustaw pierwsze zdjęcie w formularzu
              const firstPhoto = photoResponse.zdjecia[0];
              setValue('photos', {
                uri: firstPhoto.image,
                name: `photo_${firstPhoto.id}.jpg`,
                type: 'image/jpeg',
              } as File);
            }
          } catch (error) {
            console.error('Error loading photos for installation:', error);
          }
        } catch (error) {
          console.error('Error loading device data from montage:', error);
        }
      }
    };

    loadReviewData();
  }, [
    reviewId,
    fetchReviewData,
    setValue,
    installationId,
    getMontageList,
    fetchMontageData,
    getPhotoList,
  ]);

  const handleGeneratePDF = async () => {
    try {
      if (!reviewId) {
        Alert.alert('Błąd', 'Najpierw zapisz przegląd');
        return;
      }

      const result = await generatePDF({
        data: {
          type: 'przeglad',
          serwis_id: reviewId,
        },
      });

      if (result?.html_content) {
        // Tutaj można otworzyć PDF w przeglądarce lub zapisać
        Alert.alert('Sukces', 'PDF został wygenerowany');
      } else {
        Alert.alert('Błąd', 'Nie udało się wygenerować PDF');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas generowania PDF');
    }
  };

  // Obsługa zdjęć - zdjęcia będą zapisywane przez FilePicker do formularza
  // i następnie w onSubmit zostaną zapisane do bazy

  const uploadPhoto = async (
    photo: File,
    serwisId?: number | null,
    installationIdParam?: string | null,
  ): Promise<number | null> => {
    if (!photo || !photo.uri) {
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      } as any);

      // Użyj installationIdParam jeśli podane, w przeciwnym razie użyj installationId z props
      const finalInstallationId = installationIdParam || installationId;
      if (finalInstallationId) {
        formData.append('instalacja_id', finalInstallationId);
      }

      // Dodaj serwis_id jeśli jest podane
      if (serwisId) {
        formData.append('serwis_id', serwisId.toString());
      }

      const result = await addPhoto({ data: formData });
      return result?.photo_id || null;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const onSubmit = async (data: ReviewData) => {
    try {
      // Wyodrębnij zdjęcia z danych przed zapisaniem
      const photoToUpload = data.photos;
      const dataWithoutPhotos = { ...data };
      delete dataWithoutPhotos.photos;

      const reviewData = {
        ...dataWithoutPhotos,
        instalacja_id: Number(installationId),
        typ: 'przeglad',
        serwis_id: reviewId || undefined,
        data_przegladu: data.data_przegladu
          ? typeof data.data_przegladu === 'string'
            ? data.data_przegladuokui
            : (data.data_przegladu as Date).toISOString()
          : undefined,
      };

      const response = await saveReview({ data: reviewData });

      if (response) {
        const savedReviewId =
          reviewId || response.serwis_id || (response as any).id;

        // Zapisz zdjęcie jeśli jest
        if (photoToUpload) {
          if (savedReviewId) {
            // Jeśli mamy serwis_id, zapisz zdjęcie z oboma parametrami
            await uploadPhoto(photoToUpload, savedReviewId, installationId);
          } else if (installationId) {
            // Jeśli nie ma jeszcze serwis_id, zapisz zdjęcie tylko z instalacja_id
            await uploadPhoto(photoToUpload, null, installationId);
          }
        } else if (photoToUpload && installationId) {
          // Jeśli nie ma jeszcze serwis_id, zapisz zdjęcie tylko z instalacja_id
          await uploadPhoto(photoToUpload, null, installationId);
        }

        if (
          response.status === 'Przegląd updated' ||
          response.status === 'Serwis updated'
        ) {
          Alert.alert('Sukces', 'Dane przeglądu zostały zapisane pomyślnie');
          if (onSave) {
            onSave();
          }
        } else if (response.error) {
          Alert.alert('Błąd', JSON.stringify(response.error));
        } else {
          Alert.alert('Sukces', 'Dane przeglądu zostały zapisane');
        }
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania danych przeglądu');
    }
  };

  // Formatowanie mocy urządzenia
  const formatPower = (power: number | string | null | undefined): string => {
    if (!power) return '';
    if (typeof power === 'string') return power;
    return `${power.toFixed(2)} kW`;
  };

  return (
    <View style={reviewStyles.reviewFormContainer}>
      <ScrollView
        style={reviewStyles.reviewScrollView}
        contentContainerStyle={reviewStyles.reviewScrollContent}
      >
        <Text style={reviewStyles.reviewTitle}>Przegląd</Text>

        {/* Data przeglądu */}
        <View style={reviewStyles.reviewSection}>
          <Text style={reviewStyles.reviewLabel}>Data przeglądu</Text>
          <DatePicker
            name="data_przegladu"
            control={control}
            color={Colors.borderInput}
          />
        </View>

        {/* Sekcja read-only - dane jednostki */}
        <View style={reviewStyles.readOnlySection}>
          <View style={reviewStyles.readOnlyRow}>
            <Text style={reviewStyles.readOnlyLabel}>Nazwa jednostki:</Text>
            <Text style={reviewStyles.readOnlyValue}>
              {deviceData?.nazwa_modelu ||
                deviceData?.nazwa_jedn_wew ||
                deviceData?.nazwa_jedn_zew ||
                '-'}
            </Text>
          </View>
          <Divider style={reviewStyles.readOnlyDivider} />
          <View style={reviewStyles.readOnlyRow}>
            <Text style={reviewStyles.readOnlyLabel}>
              Nazwa jednostki wewnętrznej:
            </Text>
            <Text style={reviewStyles.readOnlyValue}>
              {deviceData?.nazwa_jedn_wew || '-'}
            </Text>
          </View>
          <Divider style={reviewStyles.readOnlyDivider} />
          <View style={reviewStyles.readOnlyRow}>
            <Text style={reviewStyles.readOnlyLabel}>
              Nazwa jednostki zewnętrznej:
            </Text>
            <Text style={reviewStyles.readOnlyValue}>
              {deviceData?.nazwa_jedn_zew || '-'}
            </Text>
          </View>
          <Divider style={reviewStyles.readOnlyDivider} />
          <View style={reviewStyles.readOnlyRow}>
            <Text style={reviewStyles.readOnlyLabel}>
              Moc nominalna chłodzenia:
            </Text>
            <Text style={reviewStyles.readOnlyValue}>
              {formatPower(deviceData?.moc_chlodnicza)}
            </Text>
          </View>
          <Divider style={reviewStyles.readOnlyDivider} />
          <View style={reviewStyles.readOnlyRow}>
            <Text style={reviewStyles.readOnlyLabel}>
              Moc nominalna grzania:
            </Text>
            <Text style={reviewStyles.readOnlyValue}>
              {formatPower(deviceData?.moc_grzewcza)}
            </Text>
          </View>
        </View>

        {/* Sekcja checklistów */}
        <View style={reviewStyles.reviewSection}>
          <Text style={reviewStyles.reviewSectionTitle}>Przegląd</Text>

          <Dropdown
            name="kontrola_stanu_jedn_wew"
            control={control}
            label="Kontrola stanu technicznego jednostki wewnętrznej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="kontrola_stanu_jedn_zew"
            control={control}
            label="Kontrola stanu technicznego jednostki zewnętrznej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="kontrola_stanu_mocowania_agregatu"
            control={control}
            label="Kontrola stanu mocowania agregatu"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="czyszczenie_filtrow_jedn_wew"
            control={control}
            label="Czyszczenie filtrów jednostki wewnętrznej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="czyszczenie_wymiennika_ciepla_wew"
            control={control}
            label="Czyszczenie wymiennika ciepła jednostki wewnętrznej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="czyszczenie_obudowy_jedn_wew"
            control={control}
            label="Czyszczenie obudowy jednostki wewnętrznej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="czyszczenie_tacy_skroplin"
            control={control}
            label="Czyszczenie tacy skroplin oraz odpływu skroplin"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="kontrola_droznosci_skroplin"
            control={control}
            label="Kontrola drożności odpływu skroplin"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="czyszczenie_obudowy_jedn_zew"
            control={control}
            label="Czyszczenie obudowy jednostki zewnętrznej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="czyszczenie_wymiennika_ciepla_zew"
            control={control}
            label="Czyszczenie wymiennika ciepła jednostki zewnętrznej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="kontrola_szczelnosci"
            control={control}
            label="Kontrola szczelności instalacji chłodniczej"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="kontrola_poprawnosci_dzialania"
            control={control}
            label="Kontrola poprawności działania urządzenia"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="kontrola_temperatury_nawiewu_wew"
            control={control}
            label="Kontrola temperatury nawiewu jednostki wewnętrznej (chłodzenie/grzanie)"
            options={checklistOptions}
            isBordered
          />

          <Dropdown
            name="diagnostyka_awari"
            control={control}
            label="Diagnostyka awarii urządzeń"
            options={checklistOptions}
            isBordered
          />
        </View>

        {/* Pole uwagi */}
        <View style={reviewStyles.reviewSection}>
          <Textarea name="uwagi" control={control} label="Uwagi" noPadding />
        </View>

        {/* Przycisk Wygeneruj PDF */}
        <View style={reviewStyles.reviewSection}>
          <TouchableOpacity
            style={reviewStyles.pdfButton}
            onPress={handleGeneratePDF}
            activeOpacity={0.7}
          >
            <FilesIcon color={Colors.black} size={24} />
            <Text style={reviewStyles.pdfButtonText}>Wygeneruj PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Przycisk Dodaj zdjęcie/a */}
        <View
          style={(reviewStyles.reviewSection, reviewStyles.addPhotoSection)}
        >
          <FilePicker
            name="photos"
            type="image"
            variant="gray"
            control={control}
            title="Dodaj zdjęcie/a"
            isGoToCamera
          />
        </View>

        <ButtonGroup
          cancelTitle="Anuluj"
          cancelStyle={reviewStyles.reviewCancelButton}
          cancelTitleStyle={reviewStyles.reviewCancelButtonTitle}
          submitTitleStyle={reviewStyles.reviewSubmitButtonTitle}
          stretch
          submitTitle="Zastosuj"
          submitStyle={reviewStyles.reviewSubmitButton}
          onCancel={() => {
            if (onCancel) {
              onCancel();
            } else {
              navigation.goBack();
            }
          }}
          onSubmitPress={handleSubmit(onSubmit)}
          groupStyle={reviewStyles.reviewButtonGroup}
        />
      </ScrollView>
    </View>
  );
}
