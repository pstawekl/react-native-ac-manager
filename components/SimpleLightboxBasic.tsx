import { CheckBox, Text } from '@rneui/themed';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Colors from '../consts/Colors';
import useApi from '../hooks/useApi';
import useGallery from '../providers/GalleryProvider';
import { Employee } from '../providers/StaffProvider';
import DefaultSaveResponse from '../types/DefaultSaveResponse';
import { IconButton } from './Button';
import PhotoCropperModal, { PhotoCropResult } from './PhotoCropperModal';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CloseIcon from './icons/CloseIcon';
import EditIcon from './icons/EditIcon';
import ImageIcon from './icons/ImageIcon';
import TrashIcon from './icons/TrashIcon';

type Photo = {
  id: number;
  image: string;
  tags: number[];
};

type Tag = {
  id: number;
  name: string;
  created_date: string;
};

type SimpleLightboxBasicProps = {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  photo?: Photo;
  photoOwner?: Employee;
  tags?: Tag[];
  onDeletePhoto?: (photoId: number) => Promise<void> | void;
  hideTagsSection?: boolean;
  hideEditButton?: boolean;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 4;

const clampValue = (value: number, lowerBound: number, upperBound: number) => {
  'worklet';

  if (lowerBound > upperBound) {
    return value;
  }
  return Math.min(Math.max(value, lowerBound), upperBound);
};

export default function SimpleLightboxBasic({
  visible,
  imageUri,
  onClose,
  photo,
  photoOwner,
  tags,
  onDeletePhoto,
  hideTagsSection = false,
  hideEditButton = false,
}: SimpleLightboxBasicProps) {
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const {
    tags: contextTags,
    getTags,
    getPhotos,
    deletePhoto: deletePhotoFromContext,
  } = useGallery();
  const [availableTags, setAvailableTags] = useState<Tag[]>(
    () => tags ?? contextTags ?? [],
  );
  const [currentPhotoTagIds, setCurrentPhotoTagIds] = useState<number[]>(
    photo?.tags ?? [],
  );
  const [newTagName, setNewTagName] = useState('');
  const [isEditEnabled, setIsTagInputVisible] = useState(false);
  const [isPublic, setIsPublic] = useState(photo?.is_public ?? false);

  const [currentImageUri, setCurrentImageUri] = useState(imageUri);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [isUploadingCropped, setIsUploadingCropped] = useState(false);

  const displaySize = useMemo(() => {
    if (!imageDimensions || !imageDimensions.width || !imageDimensions.height) {
      return null;
    }

    const maxHeight = screenHeight * 0.5; // Half of screen height
    const aspectRatio = imageDimensions.width / imageDimensions.height;

    if (aspectRatio <= 0 || !Number.isFinite(aspectRatio)) {
      return null;
    }

    const calculatedWidth = maxHeight * aspectRatio;

    // If calculated width exceeds screen width, scale down proportionally
    if (calculatedWidth > screenWidth * 0.9) {
      const maxWidth = screenWidth * 3;
      return {
        width: maxWidth,
        height: maxWidth / aspectRatio,
      };
    }

    return {
      width: calculatedWidth,
      height: maxHeight,
    };
  }, [imageDimensions]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const baseTranslateX = useSharedValue(0);
  const baseTranslateY = useSharedValue(0);
  const imageWidthShared = useSharedValue(0);
  const imageHeightShared = useSharedValue(0);

  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);

  useEffect(() => {
    if (displaySize) {
      imageWidthShared.value = displaySize.width;
      imageHeightShared.value = displaySize.height;
    } else {
      imageWidthShared.value = 0;
      imageHeightShared.value = 0;
    }
  }, [displaySize, imageHeightShared, imageWidthShared]);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onBegin(() => {
          baseScale.value = scale.value;
          baseTranslateX.value = translateX.value;
          baseTranslateY.value = translateY.value;
        })
        .onUpdate(event => {
          const nextScale = Math.max(
            MIN_SCALE,
            Math.min(MAX_SCALE, baseScale.value * event.scale),
          );
          scale.value = nextScale;

          const boundX = (nextScale - 1) * imageWidthShared.value * 0.5;
          const boundY = (nextScale - 1) * imageHeightShared.value * 0.5;

          if (boundX <= 0) {
            translateX.value = 0;
          } else {
            translateX.value = clampValue(translateX.value, -boundX, boundX);
          }

          if (boundY <= 0) {
            translateY.value = 0;
          } else {
            translateY.value = clampValue(translateY.value, -boundY, boundY);
          }
        })
        .onFinalize(() => {
          if (scale.value < MIN_SCALE) {
            scale.value = withTiming(MIN_SCALE);
            baseScale.value = MIN_SCALE;
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            baseTranslateX.value = 0;
            baseTranslateY.value = 0;
          } else if (scale.value > MAX_SCALE) {
            scale.value = withTiming(MAX_SCALE);
            baseScale.value = MAX_SCALE;
            const boundX = (MAX_SCALE - 1) * imageWidthShared.value * 0.5;
            const boundY = (MAX_SCALE - 1) * imageHeightShared.value * 0.5;
            translateX.value = clampValue(translateX.value, -boundX, boundX);
            translateY.value = clampValue(translateY.value, -boundY, boundY);
            baseTranslateX.value = translateX.value;
            baseTranslateY.value = translateY.value;
          } else {
            baseScale.value = scale.value;
            const boundX = (scale.value - 1) * imageWidthShared.value * 0.5;
            const boundY = (scale.value - 1) * imageHeightShared.value * 0.5;
            if (boundX <= 0) {
              translateX.value = 0;
            } else {
              translateX.value = clampValue(translateX.value, -boundX, boundX);
            }
            if (boundY <= 0) {
              translateY.value = 0;
            } else {
              translateY.value = clampValue(translateY.value, -boundY, boundY);
            }
            baseTranslateX.value = translateX.value;
            baseTranslateY.value = translateY.value;
          }
        }),
    [
      baseScale,
      baseTranslateX,
      baseTranslateY,
      imageHeightShared,
      imageWidthShared,
      scale,
      translateX,
      translateY,
    ],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          baseTranslateX.value = translateX.value;
          baseTranslateY.value = translateY.value;
        })
        .onUpdate(event => {
          if (scale.value <= 1) {
            translateX.value = 0;
            translateY.value = 0;
            return;
          }

          const boundX = (scale.value - 1) * imageWidthShared.value * 0.5;
          const boundY = (scale.value - 1) * imageHeightShared.value * 0.5;

          const limitedX =
            boundX > 0
              ? clampValue(
                baseTranslateX.value + event.translationX,
                -boundX,
                boundX,
              )
              : 0;
          const limitedY =
            boundY > 0
              ? clampValue(
                baseTranslateY.value + event.translationY,
                -boundY,
                boundY,
              )
              : 0;

          translateX.value = limitedX;
          translateY.value = limitedY;
        })
        .onFinalize(() => {
          baseTranslateX.value = translateX.value;
          baseTranslateY.value = translateY.value;
        }),
    [
      baseTranslateX,
      baseTranslateY,
      imageHeightShared,
      imageWidthShared,
      scale,
      translateX,
      translateY,
    ],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onStart(() => {
          onClose();
        }),
    [onClose],
  );

  const combinedGesture = useMemo(
    () => Gesture.Race(pinchGesture, panGesture, tapGesture),
    [pinchGesture, panGesture, tapGesture],
  );

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Konflikt typów transformacji z typami react-native-reanimated
  const animatedImageStyle = useAnimatedStyle(() => {
    'worklet';

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    } as any;
  });

  useEffect(() => {
    if (!visible) {
      baseScale.value = 1;
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      baseTranslateX.value = 0;
      baseTranslateY.value = 0;
    }
  }, [
    visible,
    baseScale,
    baseTranslateX,
    baseTranslateY,
    scale,
    translateX,
    translateY,
  ]);

  useEffect(() => {
    baseScale.value = 1;
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    baseTranslateX.value = 0;
    baseTranslateY.value = 0;
  }, [
    imageUri,
    baseScale,
    baseTranslateX,
    baseTranslateY,
    scale,
    translateX,
    translateY,
  ]);

  useEffect(() => {
    setCurrentImageUri(imageUri);
  }, [imageUri]);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    baseTranslateX.value = 0;
    baseTranslateY.value = 0;
  }, [currentImageUri, baseTranslateX, baseTranslateY, translateX, translateY]);

  const { execute: createTag, loading: creatingTag } = useApi<
    DefaultSaveResponse,
    { name: string }
  >({
    path: 'add_tag',
  });

  const { execute: updatePhoto, loading: updatingPhoto } = useApi<
    DefaultSaveResponse,
    { photo_id: number; tags: number[] }
  >({
    path: 'edit_photo',
  });

  const { execute: updatePhotoImage } = useApi<DefaultSaveResponse, FormData>({
    path: 'edit_photo',
  });

  useEffect(() => {
    setAvailableTags(tags ?? contextTags ?? []);
  }, [tags, contextTags]);

  useEffect(() => {
    setCurrentPhotoTagIds(photo?.tags ?? []);
  }, [photo?.id, photo?.tags]);

  useEffect(() => {
    setIsPublic(photo?.is_public ?? false);
  }, [photo?.id, photo?.is_public]);

  useEffect(() => {
    if (!visible) {
      setNewTagName('');
      setIsTagInputVisible(false);
    }
  }, [visible]);

  const currentPhotoTags = useMemo(() => {
    return availableTags.filter(tag => currentPhotoTagIds.includes(tag.id));
  }, [availableTags, currentPhotoTagIds]);

  const isSavingTags = creatingTag || updatingPhoto;

  const handleAddTag = async () => {
    const trimmedName = newTagName.trim();
    if (!photo?.id || !trimmedName || isSavingTags) {
      return;
    }

    try {
      const normalizedName = trimmedName.toLowerCase();
      let tagCandidate = availableTags.find(
        tag => tag.name.toLowerCase() === normalizedName,
      );
      let updatedTagPool = availableTags;

      if (!tagCandidate) {
        const created = await createTag({
          data: { name: trimmedName },
        });

        if (!created) {
          return;
        }

        const response = await getTags?.();
        if (Array.isArray(response?.tag_list)) {
          updatedTagPool = response.tag_list;
          setAvailableTags(response.tag_list);
        } else if (contextTags) {
          updatedTagPool = contextTags;
        }

        tagCandidate = updatedTagPool.find(
          tag => tag.name.toLowerCase() === normalizedName,
        );
      }

      if (!tagCandidate) {
        Alert.alert('Błąd', 'Nie udało się dodać tagu.');
        return;
      }

      if (currentPhotoTagIds.includes(tagCandidate.id)) {
        setNewTagName('');
        return;
      }

      const updatedTagIds = [...currentPhotoTagIds, tagCandidate.id];
      const result = await updatePhoto({
        data: {
          photo_id: photo.id,
          tags: updatedTagIds,
        },
      });

      if (!result) {
        return;
      }

      setCurrentPhotoTagIds(updatedTagIds);
      setNewTagName('');

      setAvailableTags(prev => {
        const exists = prev.some(tag => tag.id === tagCandidate?.id);
        if (exists) {
          return prev;
        }
        return [...prev, tagCandidate as Tag];
      });

      if (getPhotos) {
        await getPhotos();
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się dodać tagu.');
    }
  };

  const deletePhotoAvailable =
    Boolean(onDeletePhoto || deletePhotoFromContext) && Boolean(photo?.id);

  const handleDeletePhoto = () => {
    if (!photo?.id || !deletePhotoAvailable) {
      return;
    }

    Alert.alert('Usuń zdjęcie', 'Czy na pewno chcesz usunąć to zdjęcie?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            if (onDeletePhoto) {
              await onDeletePhoto(photo.id);
            } else if (deletePhotoFromContext) {
              await deletePhotoFromContext(photo.id);
              await getPhotos?.();
            }
            onClose();
          } catch (error) {
            Alert.alert('Błąd', 'Nie udało się usunąć zdjęcia.');
          }
        },
      },
    ]);
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!photo?.id || isSavingTags) {
      return;
    }

    const updatedTagIds = currentPhotoTagIds.filter(id => id !== tagId);

    try {
      const result = await updatePhoto({
        data: {
          photo_id: photo.id,
          tags: updatedTagIds,
        },
      });

      if (!result) {
        return;
      }

      setCurrentPhotoTagIds(updatedTagIds);

      if (getPhotos) {
        await getPhotos();
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się usunąć tagu.');
    }
  };

  const handlePublicChange = async (newIsPublic: boolean) => {
    if (!photo?.id || isSavingTags) {
      return;
    }

    try {
      const result = await updatePhoto({
        data: {
          photo_id: photo.id,
          is_public: newIsPublic,
        },
      });

      if (!result) {
        // Wróć do poprzedniej wartości w przypadku błędu
        setIsPublic(!newIsPublic);
        return;
      }

      // Aktualizuj stan tylko jeśli API się powiodło
      setIsPublic(newIsPublic);

      if (getPhotos) {
        await getPhotos();
      }
    } catch (error) {
      // Wróć do poprzedniej wartości w przypadku błędu
      setIsPublic(!newIsPublic);
      Alert.alert('Błąd', 'Nie udało się zmienić ustawień publiczności.');
    }
  };

  const handleImageLoad = (event: any) => {
    try {
      const { width, height } = event.nativeEvent.source;
      if (width && height && width > 0 && height > 0) {
        setImageDimensions({ width, height });
        baseScale.value = 1;
        scale.value = 1;
        translateX.value = 0;
        translateY.value = 0;
        baseTranslateX.value = 0;
        baseTranslateY.value = 0;
      }
    } catch (error: unknown) {
      Alert.alert(
        `Error loading image dimensions: ${(error as Error).message}`,
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.container}>
          <View style={styles.headerButtons}>
            <IconButton
              withoutBackground
              onPress={onClose}
              icon={<ArrowLeftIcon color={Colors.white} size={24} />}
            />
          </View>

          <View style={styles.body}>
            <View style={styles.imageContainer}>
              {imageUri ? (
                <GestureDetector gesture={combinedGesture}>
                  <Animated.View
                    style={[
                      styles.pinchContainer,
                      displaySize
                        ? {
                          width: displaySize.width,
                          height: displaySize.height,
                        }
                        : null,
                      animatedImageStyle,
                    ]}
                  >
                    <Image
                      source={{ uri: currentImageUri || imageUri }}
                      style={[
                        styles.image,
                        displaySize
                          ? {
                            width: displaySize.width,
                            height: displaySize.height,
                          }
                          : null,
                      ]}
                      resizeMode="contain"
                      onLoad={handleImageLoad}
                      onError={error =>
                        Alert.alert(
                          'Image load error:',
                          (error as unknown as Error).message,
                        )
                      }
                    />
                  </Animated.View>
                </GestureDetector>
              ) : null}
            </View>

            {!hideTagsSection && (
              <View style={styles.tagsWrapper}>
                <View style={styles.tagsContainer}>
                  <View style={styles.tagsHeader}>
                    <View style={styles.tagsHeaderLeft}>
                      {photo?.id && !hideEditButton ? (
                        <View style={styles.tagsHeaderLeftItem}>
                          <IconButton
                            withoutBackground
                            onPress={() => setIsTagInputVisible(!isEditEnabled)}
                            icon={
                              isEditEnabled ? (
                                <CloseIcon color={Colors.black} size={24} />
                              ) : (
                                <EditIcon color={Colors.black} size={24} />
                              )
                            }
                          />
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.tagsHeaderRight}>
                      {photo?.id && isEditEnabled ? (
                        <IconButton
                          withoutBackground
                          onPress={() => setCropperVisible(true)}
                          icon={<ImageIcon color={Colors.black} size={24} />}
                          disabled={isUploadingCropped}
                        />
                      ) : null}
                      {photo?.id && isEditEnabled && deletePhotoAvailable && (
                        <View style={styles.tagsHeaderRightItem}>
                          <IconButton
                            withoutBackground
                            onPress={handleDeletePhoto}
                            icon={<TrashIcon color={Colors.red} size={24} />}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.ownerInfo}>
                    <Text style={styles.ownerText}>
                      Zdjęcie użytkownika {photoOwner?.first_name}{' '}
                      {photoOwner?.last_name}
                    </Text>
                  </View>

                  {currentPhotoTags.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tagsList}
                      style={styles.tagsScroll}
                    >
                      {currentPhotoTags.map(tag => (
                        <View key={tag.id} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag.name}</Text>
                          {isEditEnabled && (
                            <TouchableOpacity
                              style={[
                                styles.removeTagButton,
                                isSavingTags && styles.removeTagButtonDisabled,
                              ]}
                              onPress={() => handleRemoveTag(tag.id)}
                              disabled={isSavingTags}
                            >
                              <Text style={styles.removeTagButtonText}>x</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noTagsText}>Brak tagów</Text>
                  )}

                  {isEditEnabled && (
                    <View style={styles.publicCheckboxContainer}>
                      <CheckBox
                        title="Publiczne"
                        checked={isPublic}
                        onPress={() => handlePublicChange(!isPublic)}
                        containerStyle={styles.checkboxContainer}
                        textStyle={styles.checkboxText}
                        checkedColor={Colors.primary}
                        uncheckedColor={Colors.gray}
                      />
                    </View>
                  )}

                  {isEditEnabled && (
                    <View>
                      <Text style={styles.tagsTitle}>Tagi:</Text>
                      <View style={styles.addTagContainer}>
                        <TextInput
                          value={newTagName}
                          onChangeText={setNewTagName}
                          placeholder="Wpisz nazwę tagu"
                          placeholderTextColor={Colors.lightGray}
                          style={styles.tagInput}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isSavingTags}
                          returnKeyType="done"
                          onSubmitEditing={handleAddTag}
                        />
                        <TouchableOpacity
                          style={[
                            styles.addTagButton,
                            (!newTagName.trim() ||
                              isSavingTags ||
                              !photo?.id) &&
                            styles.addTagButtonDisabled,
                          ]}
                          onPress={handleAddTag}
                          disabled={
                            !newTagName.trim() || isSavingTags || !photo?.id
                          }
                          activeOpacity={0.8}
                        >
                          {isSavingTags ? (
                            <ActivityIndicator
                              size="small"
                              color={Colors.white}
                            />
                          ) : (
                            <Text style={styles.addTagButtonText}>Dodaj</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
        <PhotoCropperModal
          visible={cropperVisible}
          imageUri={currentImageUri || imageUri}
          onCancel={() => setCropperVisible(false)}
          onConfirm={async (result: PhotoCropResult) => {
            if (!photo?.id) {
              return;
            }

            setIsUploadingCropped(true);
            const previousUri = currentImageUri;
            setCurrentImageUri(result.uri);

            try {
              const formData = new FormData();
              formData.append('photo_id', String(photo.id));
              formData.append('image', {
                uri: result.uri,
                type: result.mimeType,
                name: result.fileName,
              } as any);

              const response = await updatePhotoImage({
                method: 'POST',
                data: formData,
              });

              if (!response) {
                throw new Error('Brak odpowiedzi z serwera');
              }

              setCropperVisible(false);
              if (getPhotos) {
                await getPhotos();
              }
            } catch (error) {
              setCurrentImageUri(previousUri ?? imageUri);
              Alert.alert('Błąd', 'Nie udało się zapisać przyciętego zdjęcia.');
            } finally {
              setIsUploadingCropped(false);
            }
          }}
        />
        {isUploadingCropped && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator size="large" color={Colors.white} />
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    width: '100%',
  },
  container: {
    backgroundColor: Colors.transparent,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  headerButtons: {
    backgroundColor: Colors.transparent,
    position: 'absolute',
    top: 10,
    right: 0,
    left: 10,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  body: {
    flex: 1,
    width: '100%',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  pinchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    color: Colors.black,
    width: screenWidth,
  },
  image: {
    top: 0,
    borderRadius: 25,
  },
  tagsWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  tagsContainer: {
    backgroundColor: Colors.white,
    width: '100%',
    maxWidth: screenWidth,
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  tagsHeader: {
    marginBottom: 10,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tagsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    left: 0,
  },
  tagsHeaderLeftItem: {
    backgroundColor: Colors.deviceBackground,
    borderRadius: 70,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    right: 0,
  },
  tagsHeaderRightItem: {
    backgroundColor: Colors.trashIconBackground,
    borderRadius: 70,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInfo: {
    marginBottom: 15,
  },
  ownerText: {
    color: Colors.black,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    paddingLeft: 10,
  },
  tagsTitle: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagsScroll: {
    marginTop: 8,
  },
  tagsList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  tagChip: {
    backgroundColor: Colors.deviceBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
  },
  tagText: {
    color: Colors.black,
    fontSize: 12,
  },
  noTagsText: {
    color: Colors.gray,
    fontSize: 14,
    fontStyle: 'italic',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.white,
    color: Colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  addTagButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  removeTagButton: {
    marginLeft: 4,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 70,
    borderWidth: 1,
    borderColor: Colors.black,
  },
  removeTagButtonDisabled: {
    opacity: 0.6,
  },
  removeTagButtonText: {
    color: Colors.black,
    fontSize: 16,
    lineHeight: 16,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.blackHalfOpacity,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicCheckboxContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  checkboxText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: '500',
  },
});
