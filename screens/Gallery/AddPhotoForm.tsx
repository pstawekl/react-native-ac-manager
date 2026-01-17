import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { ButtonGroup } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import Container from '../../components/Container';
import FilePicker, { File } from '../../components/FilePicker';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { GalleryAddScreenProps } from '../../navigation/types';
import useAuth from '../../providers/AuthProvider';
import useGallery from '../../providers/GalleryProvider';

type PhotoData = {
  image: File | null;
};

function AddPhotoForm({ navigation }: GalleryAddScreenProps) {
  const { getPhotos } = useGallery();
  const { user, token } = useAuth();
  const { control, handleSubmit } = useForm<PhotoData>({
    defaultValues: {
      image: null,
    },
  });

  const { result, execute, loading, error } = useApi<object, FormData>({
    path: 'add_photo',
  });

  useEffect(() => {
    if (result && getPhotos) {
      getPhotos();
      navigation.navigate('Gallery'); // auto-navigate after upload
    }

    if (error) {
      Alert.alert('Błąd', `Nie udało się dodać zdjęcia: ${error}`);
    }
  }, [result, error, getPhotos, navigation]);

  const onSubmit = (data: PhotoData) => {
    if (!data.image) {
      Alert.alert('Błąd', 'Wybierz zdjęcie przed zapisaniem.');
      return;
    }

    if (!token) {
      Alert.alert('Błąd', 'Brak autoryzacji. Zaloguj się ponownie.');
      return;
    }

    // Upewnij się, że type jest prawidłowym MIME type
    let imageType = data.image.type;
    if (!imageType || imageType === 'image') {
      // Fallback na podstawie rozszerzenia nazwy pliku lub domyślnie JPEG
      if (data.image.name?.toLowerCase().includes('.png')) {
        imageType = 'image/png';
      } else {
        imageType = 'image/jpeg';
      }
    }

    const requestData = new FormData();
    requestData.append('image', {
      uri: data.image.uri,
      name: data.image.name,
      type: imageType,
    } as any);

    execute({ data: requestData });
  };

  return (
    <LinearGradient
      colors={['#1345AE', '#2774ca']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <Container style={styles.container}>
        <View style={styles.formContainer}>
          <ButtonsHeader
            onBackPress={navigation.goBack}
            style={styles.buttonsHeader}
            title="Dodaj zdjęcie"
          />
          <FilePicker
            name="image"
            type="image"
            control={control}
            label="Dodaj plik"
            color={Colors.buttons.blue}
          />
        </View>
        <View style={styles.buttonsGroup}>
          <ButtonGroup
            loading={loading}
            submitTitle="Zapisz"
            submitStyle={styles.submitButton}
            cancelTitle="Anuluj"
            onSubmitPress={handleSubmit(onSubmit)}
            onCancel={() => navigation.navigate('Gallery')}
          />
        </View>
      </Container>
    </LinearGradient>
  );
}

export default AddPhotoForm;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingBottom: 10,
    paddingTop: 40,
  },
  submitButton: {
    height: 34,
    padding: 0,
    borderRadius: 4,
    backgroundColor: Colors.buttons.blue,
  },
  formContainer: {
    display: 'flex',
    gap: 10,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginHorizontal: 20,
  },
  buttonsHeader: {
    height: 50,
  },
  buttonsGroup: {
    marginHorizontal: 20,
  },
});
