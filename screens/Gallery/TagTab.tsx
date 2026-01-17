import { useNavigation } from '@react-navigation/native';
import { Chip, Text } from '@rneui/themed';
import { compact, find } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import { ButtonGroup, IconButton } from '../../components/Button';
import PlusIcon from '../../components/icons/PlusIcon';
import Colors from '../../consts/Colors';
import { getImageUrl } from '../../helpers/image';
import useApi from '../../hooks/useApi';
import { GalleryEditScreenProps } from '../../navigation/types';
import useGallery, { Tag } from '../../providers/GalleryProvider';
import DefaultSaveResponse from '../../types/DefaultSaveResponse';
import TagOverlay from './TagOverlay';

function TagTab({ uri }: { uri: string }) {
  const colors = ['primary', 'secondary', 'success', 'error', 'warning'];

  const { navigate } = useNavigation<GalleryEditScreenProps['navigation']>();
  const { photos, getPhotos, tags, getTags, tagsLoading } = useGallery();

  const photo = find(photos, { image: uri });

  const [visible, setVisible] = useState(false);
  const [photoTags, setPhotoTags] = useState<Tag[]>([]);

  const { execute, loading } = useApi<
    DefaultSaveResponse,
    { photo_id: number; tags: number[] }
  >({
    path: 'edit_photo',
  });

  const toggleOverlay = () => {
    setVisible(!visible);
  };

  useEffect(() => {
    if (getTags) {
      getTags();
    }
  }, [getTags]);

  useEffect(() => {
    if (photo?.tags.length) {
      setPhotoTags(compact(photo.tags.map(id => find(tags, { id }))));
    }
  }, [photo, tags]);

  const applyTags = (chosenTags: Tag[]) => {
    setPhotoTags(chosenTags);
  };

  const handleSave = async () => {
    if (photo) {
      const result = await execute({
        data: {
          photo_id: photo?.id,
          tags: photoTags.map(({ id }) => id),
        },
      });

      if (result?.status) {
        Alert.alert(result?.status);
      }

      // Odśwież dane zdjęć po zapisaniu tagów
      if (getPhotos) {
        await getPhotos();
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>Nazwa zdjęcia</Text>
        <Text style={styles.author}>Autor</Text>
      </View>

      <View style={styles.photoContainer}>
        <Image
          source={{ uri: getImageUrl(uri) || undefined }}
          style={styles.photo}
        />
      </View>

      <View style={styles.tagsContainer}>
        {photoTags.length ? (
          photoTags.map((tag, index) => (
            <Chip
              key={tag.id}
              title={tag.name}
              color={colors[index % colors.length]}
            />
          ))
        ) : (
          <Text>Brak tagów</Text>
        )}

        <IconButton
          withoutBackground
          onPress={toggleOverlay}
          icon={<PlusIcon size={24} color={Colors.black} />}
        />
      </View>

      <TagOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSave={applyTags}
        uri={uri}
      />

      <View style={styles.footer}>
        <ButtonGroup
          cancelTitle="Anuluj"
          submitTitle="Zapisz zmiany"
          submitStyle={styles.submitButton}
          onCancel={() => navigate('Gallery')}
          onSubmitPress={handleSave}
          loading={loading}
        />
      </View>

      <Spinner
        visible={tagsLoading}
        textContent="Trwa pobieranie danych..."
        textStyle={{ color: Colors.gray }}
      />
    </View>
  );
}

export default TagTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    flex: 0,
  },
  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  author: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  photoContainer: {
    flex: 1,
    marginVertical: 16,
    alignItems: 'center',
  },
  photo: {
    flex: 3,
    width: '100%',
    minHeight: 100,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
  },
  submitButton: {
    height: 34,
    padding: 0,
    backgroundColor: Colors.buttons.blue,
  },
});
