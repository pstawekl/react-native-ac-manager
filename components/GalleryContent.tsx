import React, { useEffect, useMemo, useState } from 'react';
import { Text } from '@rneui/themed';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

import Colors from '../consts/Colors';
import { getImageUrl } from '../helpers/image';
import { GalleryScreenProps } from '../navigation/types';
import useApi from '../hooks/useApi';
import useGallery, { PhotosResponse, Tag, TagsResponse } from '../providers/GalleryProvider';
import useStaff from '../providers/StaffProvider';
import ContextMenu from './ContextMenu';
import SimpleLightboxBasic from './SimpleLightboxBasic';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

type GalleryContentProps = {
  navigation: GalleryScreenProps['navigation'];
  tagQuery: string;
  onTagQueryChange: (query: string) => void;
  galleryType: 'public' | 'my_photos' | 'device_gallery';
};

function GalleryContent({
  navigation,
  tagQuery,
  onTagQueryChange,
  galleryType,
}: GalleryContentProps) {
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = (screenWidth - 30) / 2; // 30 = 3 marginów * 10px (lewa, prawa, środek)
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);

  const handleImagePress = (uri: string) => {
    // Znajdź ID zdjęcia na podstawie URI
    const photo = photos?.find(p => {
      const imageUrl = getImageUrl(p.image);
      return imageUrl === uri;
    });

    if (photo) {
      setSelectedImageUri(uri);
      setSelectedPhotoId(photo.id);
      setLightboxVisible(true);
    }
  };

  const handleImageLongPress = (uri: string) => {
    // Znajdź ID zdjęcia na podstawie URI
    const photo = photos?.find(p => {
      const imageUrl = getImageUrl(p.image);
      return imageUrl === uri;
    });

    if (photo) {
      setSelectedImageUri(uri);
      setSelectedPhotoId(photo.id);
      setContextMenuVisible(true);
    }
  };

  const handleEditImage = () => {
    setContextMenuVisible(false);
    navigation.navigate('Edit', { uri: selectedImageUri });
  };

  const handleDeleteImage = () => {
    setContextMenuVisible(false);

    Alert.alert(
      'Usuń zdjęcie',
      'Czy na pewno chcesz usunąć to zdjęcie? Ta operacja jest nieodwracalna.',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            if (selectedPhotoId && deletePhoto) {
              try {
                await deletePhoto(selectedPhotoId);
                Alert.alert('Sukces', 'Zdjęcie zostało usunięte');
              } catch (error) {
                Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia');
              }
            }
          },
        },
      ],
    );
  };

  const handleLightboxDelete = async (photoId: number) => {
    if (!deletePhoto) {
      return;
    }

    await deletePhoto(photoId);
    Alert.alert('Sukces', 'Zdjęcie zostało usunięte');
  };

  const { getTags, tags, deletePhoto } = useGallery();
  const { employees } = useStaff();

  // Własne API dla zdjęć - każdy GalleryContent ma własny stan
  const { execute: getPhotosApi, loading: photosLoading, result: photosResponse } =
    useApi<PhotosResponse, { gallery_type?: string }>({
      path: 'photo_list',
    });

  // Stan lokalny dla zdjęć
  const [photos, setPhotos] = useState<PhotosResponse['zdjecia'] | null>(null);

  const tagNameToTag = useMemo(() => {
    const map: Record<string, Tag> = {};
    if (tags) {
      tags.forEach(tag => {
        map[tag.name.trim().toLowerCase()] = tag;
      });
    }
    return map;
  }, [tags]);

  const filterMeta = useMemo(() => {
    const rawNames = tagQuery
      .split(',')
      .map(name => name.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const uniqueNames: string[] = [];
    rawNames.forEach(name => {
      const lower = name.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueNames.push(name);
      }
    });

    const ids: number[] = [];
    const recognized: Tag[] = [];
    const unknown: string[] = [];

    uniqueNames.forEach(name => {
      const tag = tagNameToTag[name.toLowerCase()];
      if (tag) {
        ids.push(tag.id);
        recognized.push(tag);
      } else {
        unknown.push(name);
      }
    });

    return {
      filterTagIds: ids,
      recognizedTags: recognized,
      unknownTags: unknown,
      hasQuery: uniqueNames.length > 0,
    };
  }, [tagNameToTag, tagQuery]);

  const { filterTagIds, recognizedTags, unknownTags, hasQuery } = filterMeta;

  const filteredPhotos = useMemo(() => {
    const basePhotos = photos ?? [];
    if (!hasQuery) {
      return basePhotos;
    }
    if (unknownTags.length > 0 || filterTagIds.length === 0) {
      return [];
    }

    return basePhotos.filter(photo =>
      filterTagIds.every(tagId => photo.tags.includes(tagId)),
    );
  }, [photos, hasQuery, unknownTags, filterTagIds]);

  // Aktualizuj lokalny stan gdy otrzymamy odpowiedź z API
  useEffect(() => {
    if (photosResponse?.zdjecia) {
      setPhotos(photosResponse.zdjecia);
    }
  }, [photosResponse]);

  // Pobieraj zdjęcia gdy zmieni się galleryType
  useEffect(() => {
    getPhotosApi({ method: 'POST', data: { gallery_type: galleryType } });
    if (getTags) {
      getTags();
    }
  }, [galleryType, getPhotosApi, getTags]);

  const urlArray = filteredPhotos
    .map(photo => {
      const imageUrl = getImageUrl(photo.image);
      return imageUrl;
    })
    .filter((url): url is string => url !== null); // Filter out null URLs with type guard

  return (
    <View style={styles.container}>
      {urlArray?.length ? (
        <FlatList<string>
          data={urlArray}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={[styles.imageContainer, { width: imageWidth }]}>
              <TouchableOpacity
                onPress={() => handleImagePress(item)}
                onLongPress={() => handleImageLongPress(item)}
                delayLongPress={500}
                activeOpacity={0.8}
                style={styles.imageWrapper}
              >
                <Image
                  source={{ uri: item }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item, index) => `photo-${index}`}
          contentContainerStyle={styles.flatListContainer}
        />
      ) : (
        <Text style={styles.noData}>Brak zdjęć w galerii</Text>
      )}

      <Spinner
        visible={photosLoading}
        textContent="Trwa pobieranie danych..."
        textStyle={{ color: Colors.gray }}
      />

      <ContextMenu
        title="Zarządzaj zdjęciem"
        visible={contextMenuVisible}
        onBackdropPress={() => setContextMenuVisible(false)}
        options={[
          {
            title: 'Edytuj',
            icon: <EditIcon color={Colors.black} size={20} />,
            onPress: handleEditImage,
          },
          {
            title: 'Usuń',
            icon: <TrashIcon color={Colors.red} size={20} />,
            onPress: handleDeleteImage,
            color: Colors.red,
          },
        ]}
      />

      <SimpleLightboxBasic
        visible={lightboxVisible}
        imageUri={selectedImageUri}
        photo={photos?.find(p => p.id === selectedPhotoId)}
        photoOwner={(() => {
          const selectedPhoto = photos?.find(p => p.id === selectedPhotoId);
          if (!selectedPhoto?.owner || !employees) return undefined;

          // Znajdź pracownika po ID właściciela
          for (const group of Object.values(employees)) {
            const employee = group.find(emp => emp.id === selectedPhoto.owner);
            if (employee) return employee;
          }
          return undefined;
        })()}
        tags={tags || undefined}
        onDeletePhoto={handleLightboxDelete}
        onClose={() => {
          setLightboxVisible(false);
          setSelectedPhotoId(null);
        }}
      />
    </View>
  );
}

export default GalleryContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flatListContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imageContainer: {
    marginLeft: 3,
    marginTop: 5,
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 150, // Stała wysokość dla wszystkich obrazów
    borderRadius: 8,
  },
  noData: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.gray,
  },
});
