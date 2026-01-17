import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

import { Text } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import ButtonsHeader from '../../components/ButtonsHeader';
import ContextMenu from '../../components/ContextMenu';
import FloatingActionButton from '../../components/FloatingActionButton';
import EditIcon from '../../components/icons/EditIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import SimpleLightboxBasic from '../../components/SimpleLightboxBasic';
import Colors from '../../consts/Colors';
import { getImageUrl } from '../../helpers/image';
import { GalleryScreenProps } from '../../navigation/types';
import useGallery, { Tag } from '../../providers/GalleryProvider';

function GalleryScreen({ navigation }: GalleryScreenProps) {
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = (screenWidth - 30) / 2; // 30 = 3 marginów * 10px (lewa, prawa, środek)
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [tagQuery, setTagQuery] = useState('');

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

  const { getPhotos, getTags, photosLoading, photos, tags, deletePhoto } =
    useGallery();

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

  useEffect(() => {
    if (getPhotos) {
      getPhotos();
    }
    if (getTags) {
      getTags();
    }
  }, [getPhotos, getTags]);

  const urlArray = filteredPhotos
    .map(photo => {
      const imageUrl = getImageUrl(photo.image);
      return imageUrl;
    })
    .filter((url): url is string => url !== null); // Filter out null URLs with type guard

  return (
    <LinearGradient
      colors={['#1345AE', '#2774ca']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.linearGradient}
    >
      <SafeAreaView style={styles.container}>
        <ButtonsHeader
          onBackPress={navigation.goBack}
          title="Galeria"
        />

        <View style={styles.filterContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              value={tagQuery}
              onChangeText={setTagQuery}
              placeholder="Filtruj po tagach"
              placeholderTextColor={Colors.lightGray}
              style={[styles.filterInput, { flex: 1 }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {tagQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setTagQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  padding: 6,
                  zIndex: 1,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {/* X icon (Unicode × as fallback if no icon) */}
                <Text
                  style={{
                    color: Colors.gray,
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  ×
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
          tags={tags || undefined}
          onDeletePhoto={handleLightboxDelete}
          onClose={() => {
            setLightboxVisible(false);
            setSelectedPhotoId(null);
          }}
        />

        <FloatingActionButton
          onPress={() => navigation.navigate('AddPhoto')}
          backgroundColor={Colors.blue}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

export default GalleryScreen;

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 40,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 36,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  filterHint: {
    marginTop: 8,
    color: Colors.grayText,
    fontSize: 12,
  },
  filterWarning: {
    marginTop: 6,
    color: Colors.red,
    fontSize: 12,
    fontWeight: '600',
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
