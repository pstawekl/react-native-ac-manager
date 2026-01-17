/* eslint-disable react-native/no-inline-styles */
import { Route, useNavigation } from '@react-navigation/native';
import { Button, Input } from '@rneui/themed';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import FilePicker, { File } from '../../components/FilePicker';
import { FormInput, Textarea } from '../../components/Input';
import Photo from '../../components/Photo';
import Colors from '../../consts/Colors';
import { getImageUrl } from '../../helpers/image';
import useApi from '../../hooks/useApi';

// Komponent dla pól numerycznych - blokuje nieprawidłowe znaki
function NumericInput({
  name,
  control,
  label,
  allowDecimal = false,
  noPadding = false,
}: {
  name: keyof ClientInspectionData;
  control: any;
  label: string;
  allowDecimal?: boolean;
  noPadding?: boolean;
}) {
  const handleTextChange = (
    text: string,
    onChange: (value: string) => void,
  ) => {
    // Usuń wszystkie znaki oprócz cyfr i opcjonalnie kropki/przecinka
    const regex = allowDecimal ? /^[0-9]*[.,]?[0-9]*$/ : /^[0-9]*$/;

    if (regex.test(text) || text === '') {
      // Zamień przecinek na kropkę dla spójności
      const normalizedText = text.replace(',', '.');
      onChange(normalizedText);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <Input
          label={label}
          value={value || ''}
          onChangeText={text => handleTextChange(text, onChange)}
          keyboardType="numeric"
          inputStyle={{
            fontFamily: 'Archivo_400Regular',
            borderWidth: 1,
            color: Colors.black,
            borderColor: Colors.borderInput,
            borderRadius: 10,
            height: 54,
            minHeight: 40,
            paddingHorizontal: 12,
            fontSize: 14,
            backgroundColor: Colors.white,
          }}
          inputContainerStyle={{
            borderBottomWidth: 0,
          }}
          containerStyle={{
            paddingHorizontal: noPadding ? 0 : 8,
            width: '100%',
          }}
          labelStyle={{
            fontFamily: 'Archivo_600SemiBold',
            marginTop: 0,
            marginBottom: 6,
            color: Colors.black,
            fontSize: 10,
            letterSpacing: 0.3,
            fontWeight: 'normal',
          }}
        />
      )}
    />
  );
}

type ClientInspectionData = {
  // Pola z pierwszego zdjęcia
  rooms: number | undefined; // Ilość chłodzonych pomieszczeń
  rooms_m2: number | undefined; // Wielkość chłodzonych pomieszczeń
  device_amount: number | undefined; // Ilość urządzeń
  power_amount: number | undefined; // Moc urządzeń
  typ_urzadzenia_wewnetrznego: string | undefined; // Typ urządzenia wewnętrznego
  miejsce_montazu: string | undefined; // Miejsce montażu
  dlugosc_instalacji: number | undefined; // Długość instalacji
  prowadzenie_instalacji: string | undefined; // Prowadzenie instalacji

  // Pola z drugiego zdjęcia
  prowadzenie_skroplin: string | undefined; // Prowadzenie skroplin
  miejsce_agregatu: string | undefined; // Miejsce i sposób montażu agregatu
  podlaczenie_elektryki: string | undefined; // Miejsce podłączenia elektryki
  miejsce_urzadzen_wew: string | undefined; // Miejsce montażu urządzeń wewnętrznych
  obnizenie: number | undefined; // Obniżenie jednostki naściennej
  uwagi: string | undefined; // Uwagi

  // Pole na zdjęcia
  photo: File | undefined;
};

const clientInspectDefaultData = {
  // Pola z pierwszego zdjęcia
  rooms: undefined,
  rooms_m2: undefined,
  device_amount: undefined,
  power_amount: undefined,
  typ_urzadzenia_wewnetrznego: '',
  miejsce_montazu: '',
  dlugosc_instalacji: undefined,
  prowadzenie_instalacji: '',

  // Pola z drugiego zdjęcia
  prowadzenie_skroplin: '',
  miejsce_agregatu: '',
  podlaczenie_elektryki: '',
  miejsce_urzadzen_wew: '',
  obnizenie: undefined,
  uwagi: '',

  // Pole na zdjęcia
  photo: undefined,
};

type InspectionPhoto = {
  id: number;
  image: string;
  created_date: string;
};

type InstallationDataResponse = {
  inspekcja?: Array<{
    miejsce_agregatu?: string;
    podlaczenie_elektryki?: string;
    miejsce_urzadzen_wew?: string;
    sposob_montazu?: string;
    uwagi_agregat?: string;
    uwagi_instalacja?: string;
    uwagi_elektryka?: string;
    uwagi_ogolne?: string;
  }>;
  photos?: Array<{
    id: number;
    image: string;
    created_date: string;
  }>;
};

function PhotoGallery({
  photos,
  onDeletePhoto,
}: {
  photos: InspectionPhoto[];
  onDeletePhoto: (id: number) => void;
}) {
  const renderPhoto = ({ item }: { item: InspectionPhoto }) => {
    const imageUrl = getImageUrl(item.image);

    if (!imageUrl) {
      return null;
    }

    return (
      <View style={styles.photoItem}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeletePhoto(item.id)}
        >
          <Button
            title="×"
            buttonStyle={styles.deleteButtonStyle}
            titleStyle={styles.deleteButtonTitle}
          />
        </TouchableOpacity>
        <Photo uri={imageUrl} style={styles.thumbnail} />
      </View>
    );
  };

  return (
    <View style={styles.photoGalleryContainer}>
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photoGalleryContent}
      />
    </View>
  );
}

function PhotoForm({
  control,
  onAddPhoto,
  photos,
  onDeletePhoto,
  currentPhoto,
}: {
  control: any;
  onAddPhoto: (photo: File) => void;
  photos: InspectionPhoto[];
  onDeletePhoto: (id: number) => void;
  currentPhoto: File | undefined;
}) {
  return (
    <View style={styles.photoContainer}>
      <FilePicker
        name="photo"
        type="image"
        variant="gray"
        control={control}
        title="Dodaj zdjęcie"
        label="Zdjęcia"
      />
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} onDeletePhoto={onDeletePhoto} />
      ) : (
        <Text
          style={{ color: Colors.gray, textAlign: 'center', marginTop: 10 }}
        >
          Brak zdjęć ({photos.length})
        </Text>
      )}
    </View>
  );
}

export default function ClientInspection({
  route: {
    params: { installationId, clientId },
  },
  hideHeader = false,
}: {
  route: Route<'Inspection', { installationId: string; clientId: string }>;
  hideHeader?: boolean;
}) {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const { control, handleSubmit, setValue, reset, watch } =
    useForm<ClientInspectionData>({
      defaultValues: clientInspectDefaultData,
    });
  const currentPhoto = watch('photo');
  const { execute } = useApi<object, ClientInspectionData>({
    path: 'inspekcja_edit',
  });
  const { execute: fetchInstallationData } = useApi<InstallationDataResponse>({
    path: 'installation_data',
  });
  const { execute: addPhotoToGallery } = useApi<object, FormData>({
    path: 'add_photo',
  });
  const { execute: deletePhoto } = useApi<object>({
    path: 'photo_delete',
  });

  const handleAddPhoto = useCallback(
    async (photo: File) => {
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        } as any);
        formData.append('instalacja_id', installationId);
        formData.append('klient', clientId);
        formData.append('inspekcja', 'true');

        const result = await addPhotoToGallery({ data: formData });

        if (result) {
          // Refresh photos list by fetching installation data again
          const refreshResponse = await fetchInstallationData({
            data: { instalacja_id: installationId },
          });

          if (
            refreshResponse?.photos &&
            Array.isArray(refreshResponse.photos)
          ) {
            const formattedPhotos: InspectionPhoto[] =
              refreshResponse.photos.map((photoItem: any) => ({
                id: photoItem.id,
                image: photoItem.image,
                created_date:
                  photoItem.created_date || new Date().toISOString(),
              }));
            setPhotos(formattedPhotos);
          } else {
            throw new Error('No data received');
          }
        }
      } catch (error) {
        Alert.alert('Błąd', 'Wystąpił błąd podczas dodawania zdjęcia');
      }
    },
    [addPhotoToGallery, fetchInstallationData, installationId, clientId],
  );

  const loadInspectionData = async () => {
    try {
      const res = await fetchInstallationData({
        data: { instalacja_id: installationId },
      });

      if (!res) {
        throw new Error('No data received');
      }

      // Wczytaj dane inspekcji
      if (res.inspekcja && res.inspekcja.length > 0) {
        const inspectionData = res.inspekcja[0];
        const fieldsToSet = Object.keys(clientInspectDefaultData);

        fieldsToSet.forEach((field: string) => {
          if (
            field !== 'photo' &&
            inspectionData[field as keyof typeof inspectionData]
          ) {
            setValue(
              field as keyof ClientInspectionData,
              String(inspectionData[field as keyof typeof inspectionData]) ||
              '',
            );
          }
        });
      } else {
        Alert.alert('Błąd', 'Nie udało się wczytać danych inspekcji');
      }

      // Wczytaj zdjęcia
      if (res.photos && Array.isArray(res.photos)) {
        const formattedPhotos: InspectionPhoto[] = res.photos.map(
          (photo: any) => ({
            id: photo.id,
            image: photo.image,
            created_date: photo.created_date || new Date().toISOString(),
          }),
        );
        setPhotos(formattedPhotos);
      } else {
        setPhotos([]);
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wczytać danych inspekcji');
    }
  };

  useEffect(() => {
    loadInspectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationId]);

  // Watch for new photo selection and automatically add it
  useEffect(() => {
    if (currentPhoto && currentPhoto.uri) {
      handleAddPhoto(currentPhoto);
    }
  }, [currentPhoto, handleAddPhoto]);

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await deletePhoto({ data: { photo_id: photoId } });
      setPhotos(photos.filter(p => p.id !== photoId));
      Alert.alert('Sukces', 'Zdjęcie zostało usunięte');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
    }
  };

  const onSubmit = async (data: ClientInspectionData) => {
    try {
      // Konwertuj pola numeryczne na odpowiednie typy
      const processedData = {
        ...data,
        // Konwertuj stringi na liczby dla pól numerycznych
        rooms: data.rooms ? Number(data.rooms) : undefined,
        rooms_m2: data.rooms_m2 ? Number(data.rooms_m2) : undefined,
        device_amount: data.device_amount
          ? Number(data.device_amount)
          : undefined,
        power_amount: data.power_amount ? Number(data.power_amount) : undefined,
        dlugosc_instalacji: data.dlugosc_instalacji
          ? Number(data.dlugosc_instalacji)
          : undefined,
        obnizenie: data.obnizenie ? Number(data.obnizenie) : undefined,
        instalacja_id: installationId,
      };

      const response = await execute({ data: processedData });

      if ((response as any)?.status === 'Inspekcja updated') {
        Alert.alert('Sukces', 'Zaktualizowano dane inspekcji');
        // Odśwież dane po zapisaniu
        await loadInspectionData();
      } else {
        Alert.alert(
          'Błąd',
          (response as any)?.error || 'Wystąpił błąd podczas zapisywania',
        );
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił błąd podczas zapisywania danych inspekcji');
    }
  };

  const content = (
    <View
      style={hideHeader ? styles.inspectionFormContainer : styles.container}
    >
      {!hideHeader && <ButtonsHeader onBackPress={navigation.goBack} />}
      <ScrollView
        style={
          hideHeader ? styles.inspectionScrollView : styles.scrollContainer
        }
        contentContainerStyle={{ gap: 10 }}
      >
        {hideHeader && <Text style={styles.inspectionTitle}>Oględziny</Text>}
        {/* Pola z pierwszego zdjęcia */}
        <NumericInput
          label="Ilość chłodzonych pomieszczeń"
          name="rooms"
          control={control}
          noPadding
        />
        <NumericInput
          label="Wielkość chłodzonych pomieszczeń (m²)"
          name="rooms_m2"
          control={control}
          allowDecimal
          noPadding
        />
        <NumericInput
          label="Ilość urządzeń"
          name="device_amount"
          control={control}
          noPadding
        />
        <NumericInput
          label="Moc urządzeń"
          name="power_amount"
          control={control}
          allowDecimal
          noPadding
        />
        <FormInput
          label="Typ urządzenia wewnętrznego"
          name="typ_urzadzenia_wewnetrznego"
          control={control}
          noPadding
        />
        <FormInput
          label="Miejsce montażu"
          name="miejsce_montazu"
          control={control}
          noPadding
        />
        <NumericInput
          label="Długość instalacji"
          name="dlugosc_instalacji"
          control={control}
          allowDecimal
          noPadding
        />
        <FormInput
          label="Prowadzenie instalacji"
          name="prowadzenie_instalacji"
          control={control}
          noPadding
        />

        {/* Pola z drugiego zdjęcia */}
        <FormInput
          label="Prowadzenie skroplin"
          name="prowadzenie_skroplin"
          control={control}
          noPadding
        />
        <Textarea
          label="Miejsce i sposób montażu agregatu"
          noPadding
          name="miejsce_agregatu"
          control={control}
          borderColor={Colors.black}
          textColor={Colors.black}
          labelColor={Colors.black}
          fontSize={14}
          labelFontSize={11}
          backgroundColor={Colors.white}
          height={20}
        />
        <FormInput
          label="Miejsce podłączenia elektryki"
          name="podlaczenie_elektryki"
          control={control}
          noPadding
        />
        <FormInput
          label="Miejsce montażu urządzeń wewnętrznych"
          name="miejsce_urzadzen_wew"
          control={control}
          noPadding
        />
        <NumericInput
          label="Obniżenie jednostki naściennej przez np. sufit podwieszany, sztukaterię"
          name="obnizenie"
          control={control}
          allowDecimal
          noPadding
        />
        <Textarea
          label="Uwagi"
          noPadding
          name="uwagi"
          control={control}
          borderColor={Colors.black}
          textColor={Colors.black}
          labelColor={Colors.black}
          fontSize={14}
          labelFontSize={11}
          backgroundColor={Colors.white}
          height={20}
        />
        <PhotoForm
          control={control}
          onAddPhoto={handleAddPhoto}
          photos={photos}
          onDeletePhoto={handleDeletePhoto}
          currentPhoto={currentPhoto}
        />
      </ScrollView>
      <View style={hideHeader ? styles.inspectionFooter : styles.footer}>
        <SubmitButton
          title="Zapisz zmiany"
          onPress={handleSubmit(onSubmit)}
          style={hideHeader ? styles.inspectionSubmitButton : undefined}
          titleStyle={
            hideHeader ? styles.inspectionSubmitButtonTitle : undefined
          }
        />
      </View>
    </View>
  );

  if (hideHeader) {
    return content;
  }

  return (
    <LinearGradient
      colors={['#36B130', '#6EDE2F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      {content}
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
    paddingTop: 40,
  },
  containerNoHeader: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  inspectionFormContainer: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    display: 'flex',
    flexDirection: 'column',
  },
  inspectionScrollView: {
    flex: 1,
    backgroundColor: Colors.homeScreenBackground,
    paddingHorizontal: 14,
    paddingTop: 20,
  },
  inspectionTitle: {
    fontSize: 16,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 12,
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  inspectionFooter: {
    width: '100%',
    backgroundColor: Colors.homeScreenBackground,
    paddingBottom: 20,
    paddingHorizontal: 14,
  },
  inspectionSubmitButton: {
    backgroundColor: Colors.green,
    minHeight: 48,
    height: 48,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    padding: 0,
    borderRadius: 60,
    width: '100%',
  },
  inspectionSubmitButtonTitle: {
    color: Colors.white,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  photoContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 30,
  },
  photoGalleryContainer: {
    marginTop: 10,
  },
  photoGalleryContent: {
    paddingHorizontal: 5,
  },
  photoItem: {
    marginHorizontal: 5,
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.divider,
  },
  deleteButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 1,
  },
  deleteButtonStyle: {
    backgroundColor: Colors.buttons.deleteBg,
    borderRadius: 12,
    width: 24,
    height: 24,
    padding: 0,
  },
  deleteButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
