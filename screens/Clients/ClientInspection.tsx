/* eslint-disable react-native/no-inline-styles */
import { Route, useNavigation } from '@react-navigation/native';
import { Button } from '@rneui/themed';
import { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';

import { LinearGradient } from 'expo-linear-gradient';
import { SubmitButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import FilePicker, { File } from '../../components/FilePicker';
import { Dropdown, FormInput, Textarea } from '../../components/Input';
import Photo from '../../components/Photo';
import Colors from '../../consts/Colors';
import { getImageUrl } from '../../helpers/image';
import useApi from '../../hooks/useApi';

type InspectionSection = {
  rooms_m2: number | string | undefined;
  power_amount: number | string | undefined;
  typ_urzadzenia_wewnetrznego: string;
  miejsce_montazu: string;
  dlugosc_instalacji: number | string | undefined;
  prowadzenie_instalacji: string;
  prowadzenie_skroplin: string;
  device_photo?: { id: number; image: string } | undefined;
};

type ClientInspectionData = {
  rooms: number | undefined;
  device_amount: number;
  roomSections: InspectionSection[];
  deviceSections: InspectionSection[];
  miejsce_agregatu: string;
  podlaczenie_elektryki: string;
  miejsce_urzadzen_wew: string;
  obnizenie: number | undefined;
  uwagi: string;
  photo: File | undefined;
};

const defaultInspectionSection: InspectionSection = {
  rooms_m2: undefined,
  power_amount: undefined,
  typ_urzadzenia_wewnetrznego: '',
  miejsce_montazu: '',
  dlugosc_instalacji: undefined,
  prowadzenie_instalacji: '',
  prowadzenie_skroplin: '',
  device_photo: undefined,
};

const clientInspectDefaultData: ClientInspectionData = {
  rooms: 1,
  device_amount: 1,
  roomSections: [{ ...defaultInspectionSection }],
  deviceSections: [],
  miejsce_agregatu: '',
  podlaczenie_elektryki: '',
  miejsce_urzadzen_wew: '',
  obnizenie: undefined,
  uwagi: '',
  photo: undefined,
};

type InspectionPhoto = {
  id: number;
  image: string;
  created_date: string;
};

type InstallationDataResponse = {
  inspekcja?: Array<{
    rooms?: number;
    rooms_m2?: number;
    device_amount?: number;
    power_amount?: number;
    typ_urzadzenia_wewnetrznego?: string;
    miejsce_montazu?: string;
    dlugosc_instalacji?: number;
    prowadzenie_instalacji?: string;
    prowadzenie_skroplin?: string;
    miejsce_agregatu?: string;
    podlaczenie_elektryki?: string;
    miejsce_urzadzen_wew?: string;
    obnizenie?: number;
    uwagi?: string;
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
  const { control, handleSubmit, setValue, reset, watch, getValues } =
    useForm<ClientInspectionData>({
      defaultValues: clientInspectDefaultData,
    });
  const {
    fields: roomFields,
    replace: replaceRoomSections,
    append: appendRoomSection,
    remove: removeRoomSection,
  } = useFieldArray({
    control,
    name: 'roomSections',
  });
  const { fields: deviceFields, replace: replaceDeviceSections } =
    useFieldArray({
      control,
      name: 'deviceSections',
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

        const result = await addPhotoToGallery({ data: formData as any });

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

      reset(clientInspectDefaultData);

      if (res.inspekcja && res.inspekcja.length > 0) {
        const insp = res.inspekcja[0] as Record<string, unknown>;
        const apiSectionToForm = (item: Record<string, unknown>): InspectionSection => ({
          rooms_m2: item.rooms_m2 != null ? Number(item.rooms_m2) : undefined,
          power_amount: item.power_amount != null ? Number(item.power_amount) : undefined,
          typ_urzadzenia_wewnetrznego: item.typ_urzadzenia_wewnetrznego != null ? String(item.typ_urzadzenia_wewnetrznego) : '',
          miejsce_montazu: item.miejsce_montazu != null ? String(item.miejsce_montazu) : '',
          dlugosc_instalacji: item.dlugosc_instalacji != null ? Number(item.dlugosc_instalacji) : undefined,
          prowadzenie_instalacji: item.prowadzenie_instalacji != null ? String(item.prowadzenie_instalacji) : '',
          prowadzenie_skroplin: item.prowadzenie_skroplin != null ? String(item.prowadzenie_skroplin) : '',
        });

        const rawRoomSections = Array.isArray(insp.room_sections) ? insp.room_sections : [];
        const rawDeviceSections = Array.isArray(insp.device_sections) ? insp.device_sections : [];
        const hasRoomSections = rawRoomSections.length > 0;
        const hasDeviceSections = rawDeviceSections.length > 0;

        let rooms: number;
        let deviceAmount: number;
        let roomSections: InspectionSection[];
        let deviceSections: InspectionSection[];

        if (hasRoomSections) {
          rooms = rawRoomSections.length;
          roomSections = rawRoomSections.map((item: unknown) =>
            apiSectionToForm((item as Record<string, unknown>) || {}),
          );
        } else {
          rooms = insp.rooms != null ? Number(insp.rooms) : 1;
          const sectionFromFlat = (): InspectionSection => apiSectionToForm(insp);
          roomSections = Array.from(
            { length: Math.max(1, rooms) },
            (_, i) => (i === 0 ? sectionFromFlat() : { ...defaultInspectionSection }),
          );
        }

        if (hasDeviceSections) {
          deviceAmount = rawDeviceSections.length;
          deviceSections = rawDeviceSections.map((item: unknown) =>
            apiSectionToForm((item as Record<string, unknown>) || {}),
          );
        } else {
          deviceAmount = insp.device_amount != null ? Number(insp.device_amount) : 1;
          const sectionFromFlat = (): InspectionSection => apiSectionToForm(insp);
          deviceSections = Array.from(
            { length: Math.max(1, deviceAmount) },
            (_, i) => (i === 0 ? sectionFromFlat() : { ...defaultInspectionSection }),
          );
        }

        setValue('rooms', rooms);
        setValue('device_amount', deviceAmount);
        replaceRoomSections(roomSections);
        replaceDeviceSections(deviceSections);
        setValue(
          'miejsce_agregatu',
          insp.miejsce_agregatu != null ? String(insp.miejsce_agregatu) : '',
        );
        setValue(
          'podlaczenie_elektryki',
          insp.podlaczenie_elektryki != null
            ? String(insp.podlaczenie_elektryki)
            : '',
        );
        setValue(
          'miejsce_urzadzen_wew',
          insp.miejsce_urzadzen_wew != null
            ? String(insp.miejsce_urzadzen_wew)
            : '',
        );
        setValue(
          'obnizenie',
          insp.obnizenie != null ? Number(insp.obnizenie) : undefined,
        );
        setValue(
          'uwagi',
          insp.uwagi != null ? String(insp.uwagi) : '',
        );
      }

      if (res.photos && Array.isArray(res.photos)) {
        const allPhotos = res.photos as any[];
        const galleryPhotos: InspectionPhoto[] = allPhotos
          .filter((p: any) => p.device_section_index == null)
          .map((p: any) => ({
            id: p.id,
            image: p.image,
            created_date: p.created_date || new Date().toISOString(),
          }));
        setPhotos(galleryPhotos);

        const devicePhotos = allPhotos.filter(
          (p: any) => p.device_section_index != null,
        );
        if (devicePhotos.length > 0) {
          const currentDevices = getValues('deviceSections') ?? [];
          let updated = false;
          const next = currentDevices.map((section, idx) => {
            const dp = devicePhotos.find(
              (p: any) => p.device_section_index === idx,
            );
            if (dp) {
              updated = true;
              return { ...section, device_photo: { id: dp.id, image: dp.image } };
            }
            return section;
          });
          if (updated) replaceDeviceSections(next);
        }
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
      Alert.alert('Zdjęcie zostało usunięte');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
    }
  };

  const onSubmit = async (data: ClientInspectionData) => {
    const firstRoom = data.roomSections?.[0];
    const firstDevice = data.deviceSections?.[0];
    const toNum = (v: number | string | undefined) =>
      v !== undefined && v !== '' ? Number(v) : undefined;
    const sectionToApi = (s: InspectionSection) => ({
      rooms_m2: toNum(s.rooms_m2) ?? null,
      power_amount: toNum(s.power_amount) ?? null,
      typ_urzadzenia_wewnetrznego: s.typ_urzadzenia_wewnetrznego ?? '',
      miejsce_montazu: s.miejsce_montazu ?? '',
      dlugosc_instalacji: toNum(s.dlugosc_instalacji) ?? null,
      prowadzenie_instalacji: s.prowadzenie_instalacji ?? '',
      prowadzenie_skroplin: s.prowadzenie_skroplin ?? '',
    });

    try {
      const processedData = {
        rooms:
          data.roomSections && data.roomSections.length > 0
            ? data.roomSections.length
            : undefined,
        device_amount:
          data.roomSections && data.roomSections.length > 0
            ? data.roomSections.length
            : undefined,
        rooms_m2: toNum(firstRoom?.rooms_m2),
        power_amount: toNum(firstRoom?.power_amount ?? firstDevice?.power_amount),
        typ_urzadzenia_wewnetrznego:
          firstRoom?.typ_urzadzenia_wewnetrznego ??
          firstDevice?.typ_urzadzenia_wewnetrznego ??
          '',
        miejsce_montazu:
          firstRoom?.miejsce_montazu ?? firstDevice?.miejsce_montazu ?? '',
        dlugosc_instalacji: toNum(
          firstRoom?.dlugosc_instalacji ?? firstDevice?.dlugosc_instalacji,
        ),
        prowadzenie_instalacji:
          firstRoom?.prowadzenie_instalacji ??
          firstDevice?.prowadzenie_instalacji ??
          '',
        prowadzenie_skroplin:
          firstRoom?.prowadzenie_skroplin ??
          firstDevice?.prowadzenie_skroplin ??
          '',
        room_sections: (data.roomSections ?? []).map(sectionToApi),
        device_sections: [],
        miejsce_agregatu: data.miejsce_agregatu ?? '',
        podlaczenie_elektryki: data.podlaczenie_elektryki ?? '',
        miejsce_urzadzen_wew: data.miejsce_urzadzen_wew ?? '',
        obnizenie: toNum(data.obnizenie),
        uwagi: data.uwagi ?? '',
        instalacja_id: installationId,
      };

      const response = await execute({
        data: processedData as unknown as ClientInspectionData,
      });

      if ((response as any)?.status === 'Inspekcja updated') {
        Alert.alert('Zaktualizowano dane inspekcji');
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
    <KeyboardAvoidingView
      style={hideHeader ? styles.inspectionFormContainer : styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {!hideHeader && <ButtonsHeader onBackPress={navigation.goBack} />}
      <ScrollView
        style={
          hideHeader ? styles.inspectionScrollView : styles.scrollContainer
        }
        contentContainerStyle={{ gap: 10 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {hideHeader && <Text style={styles.inspectionTitle}>Oględziny</Text>}

        <View style={styles.roomsHeaderRow}>
          <Text style={styles.roomsHeaderTitle}>
            Pomieszczenia ({roomFields.length})
          </Text>
          <TouchableOpacity
            style={styles.roomsHeaderAddButton}
            onPress={() => appendRoomSection({ ...defaultInspectionSection })}
            activeOpacity={0.7}
          >
            <Text style={styles.roomsHeaderAddButtonText}>+ Dodaj pomieszczenie</Text>
          </TouchableOpacity>
        </View>

        {roomFields.map((field, index) => (
          <View key={field.id} style={styles.inspectionSection}>
            <View style={styles.roomHeaderRow}>
              <Text style={styles.roomHeaderTitle}>
                Pomieszczenie {index + 1}
              </Text>
              {roomFields.length > 1 && (
                <TouchableOpacity
                  style={styles.roomHeaderDeleteButton}
                  onPress={() => removeRoomSection(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roomHeaderDeleteButtonText}>Usuń</Text>
                </TouchableOpacity>
              )}
            </View>
            <FormInput
              label="Wielkość urządzenia / pomieszczenia (m²)"
              name={`roomSections.${index}.rooms_m2`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Moc"
              name={`roomSections.${index}.power_amount`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Typ urządzenia"
              name={`roomSections.${index}.typ_urzadzenia_wewnetrznego`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Miejsce montażu"
              name={`roomSections.${index}.miejsce_montazu`}
              control={control}
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Długość instalacji"
              name={`roomSections.${index}.dlugosc_instalacji`}
              control={control}
              numericOnly
              allowDecimal
              noPadding
              inspectionVariant
            />
            <FormInput
              label="Prowadzenie instalacji"
              name={`roomSections.${index}.prowadzenie_instalacji`}
              control={control}
              noPadding
              inspectionVariant
            />
          </View>
        ))}

        <Textarea
          label="Miejsce i sposób montażu agregatu"
          noPadding
          name="miejsce_agregatu"
          control={control}
          borderColor={Colors.black}
          textColor={Colors.black}
          labelColor={Colors.black}
          fontSize={16}
          labelFontSize={14}
          backgroundColor={Colors.white}
          height={20}
        />
        <FormInput
          label="Miejsce podłączenia elektryki"
          name="podlaczenie_elektryki"
          control={control}
          noPadding
          inspectionVariant
        />
        <FormInput
          label="Miejsce montażu urządzeń wewnętrznych"
          name="miejsce_urzadzen_wew"
          control={control}
          noPadding
          inspectionVariant
        />
        <FormInput
          label="Obniżenie jednostki naściennej przez np. sufit podwieszany, sztukaterię"
          name="obnizenie"
          control={control}
          numericOnly
          allowDecimal
          noPadding
          inspectionVariant
        />
        <Textarea
          label="Uwagi"
          noPadding
          name="uwagi"
          control={control}
          borderColor={Colors.black}
          textColor={Colors.black}
          labelColor={Colors.black}
          fontSize={16}
          labelFontSize={14}
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
    </KeyboardAvoidingView>
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
  roomsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roomsHeaderTitle: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  roomsHeaderAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.teal,
  },
  roomsHeaderAddButtonText: {
    fontSize: 12,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.white,
  },
  inspectionSection: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roomHeaderTitle: {
    fontSize: 15,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
  },
  roomHeaderDeleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.buttons.deleteBg,
  },
  roomHeaderDeleteButtonText: {
    fontSize: 11,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.white,
  },
  devicePhotoSection: {
    marginTop: 12,
  },
  devicePhotoLabel: {
    fontSize: 14,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 6,
  },
  devicePhotoPreview: {
    alignItems: 'center' as const,
  },
  devicePhotoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  devicePhotoDeleteBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: Colors.red,
    borderRadius: 6,
  },
  devicePhotoDeleteText: {
    color: '#fff',
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 13,
  },
  devicePhotoAddBtn: {
    borderWidth: 1,
    borderColor: Colors.gray,
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center' as const,
  },
  devicePhotoAddText: {
    color: Colors.gray,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
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
