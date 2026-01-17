import { Button } from '@rneui/themed';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutChangeEvent,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '../consts/Colors';
import getSize from '../helpers/image';
import ImageCropOverlay, { ImageCropOverlayLayout } from './ImageCropOverlay';

export type PhotoCropResult = {
  uri: string;
  mimeType: string;
  fileName: string;
};

type PhotoCropperModalProps = {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onConfirm: (result: PhotoCropResult) => Promise<void> | void;
};

const DEFAULT_FILE_EXTENSION = 'jpg';

function inferExtension(uri: string) {
  try {
    const cleaned = uri.split('?')[0];
    const parts = cleaned.split('.');
    const extension = parts[parts.length - 1]?.toLowerCase();
    if (!extension || extension.length > 5) {
      return DEFAULT_FILE_EXTENSION;
    }
    if (['jpg', 'jpeg', 'png'].includes(extension)) {
      return extension === 'jpeg' ? 'jpg' : extension;
    }
    return DEFAULT_FILE_EXTENSION;
  } catch (error) {
    return DEFAULT_FILE_EXTENSION;
  }
}

function inferMimeType(extension: string) {
  if (extension === 'png') {
    return 'image/png';
  }
  return 'image/jpeg';
}

const INITIAL_CROP: ImageCropOverlayLayout = {
  width: 0,
  height: 0,
  top: 0,
  left: 0,
};

function PhotoCropperModal({
  visible,
  imageUri,
  onCancel,
  onConfirm,
}: PhotoCropperModalProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [originalSize, setOriginalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [cropRect, setCropRect] =
    useState<ImageCropOverlayLayout>(INITIAL_CROP);
  const [positionTop, setPositionTop] = useState(0);
  const [loadingImage, setLoadingImage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<View>(null);
  const measuredWidthRef = useRef(0);
  const downloadedFileRef = useRef<string | null>(null);

  const resetState = useCallback(() => {
    setLocalUri(null);
    setDisplaySize({ width: 0, height: 0 });
    setOriginalSize(null);
    setCropRect(INITIAL_CROP);
    setPositionTop(0);
    measuredWidthRef.current = 0;
    if (downloadedFileRef.current) {
      FileSystem.deleteAsync(downloadedFileRef.current, {
        idempotent: true,
      }).catch(() => undefined);
      downloadedFileRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [resetState, visible]);

  const prepareImage = useCallback(async () => {
    if (!visible || !imageUri) {
      return;
    }
    setLoadingImage(true);
    try {
      let uri = imageUri;
      if (!imageUri.startsWith('file://')) {
        const extension = inferExtension(imageUri);
        const targetPath = `${
          FileSystem.cacheDirectory
        }photo-crop-${Date.now()}.${extension}`;
        const downloadResult = await FileSystem.downloadAsync(
          imageUri,
          targetPath,
        );
        uri = downloadResult.uri;
        downloadedFileRef.current = downloadResult.uri;
      }

      setLocalUri(uri);
      const size = await getSize(uri);
      setOriginalSize(size);
      setCropRect(INITIAL_CROP);
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się przygotować zdjęcia do kadrowania.');
    } finally {
      setLoadingImage(false);
    }
  }, [imageUri, visible]);

  useEffect(() => {
    prepareImage();
  }, [prepareImage]);

  const updateDisplaySize = useCallback(
    (width: number, size?: { width: number; height: number } | null) => {
      if (!size || width <= 0) {
        return;
      }
      const height = (width * size.height) / size.width;
      setDisplaySize({ width, height });
      setCropRect(prev => {
        if (prev.width === 0 || prev.height === 0) {
          return {
            width,
            height,
            top: 0,
            left: 0,
          };
        }
        return prev;
      });
    },
    [],
  );

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      measuredWidthRef.current = width;
      updateDisplaySize(width, originalSize);
      requestAnimationFrame(() => {
        containerRef.current?.measure(
          (x, y, measuredWidth, measuredHeight, pageX, pageY) => {
            setPositionTop(pageY);
          },
        );
      });
    },
    [originalSize, updateDisplaySize],
  );

  useEffect(() => {
    if (originalSize && measuredWidthRef.current > 0) {
      updateDisplaySize(measuredWidthRef.current, originalSize);
    }
  }, [originalSize, updateDisplaySize]);

  const handleLayoutChanged = useCallback((layout: ImageCropOverlayLayout) => {
    setCropRect(layout);
  }, []);

  const minCropSize = useMemo(() => {
    const { width, height } = displaySize;
    const minSize = Math.max(Math.min(width, height) * 0.2, 60);
    return {
      width: minSize,
      height: minSize,
    };
  }, [displaySize]);

  const applyCrop = useCallback(async () => {
    if (
      !localUri ||
      !originalSize ||
      displaySize.width === 0 ||
      displaySize.height === 0
    ) {
      return;
    }

    setSaving(true);
    try {
      const widthRatio = originalSize.width / displaySize.width;
      const heightRatio = originalSize.height / displaySize.height;

      const cropArea = {
        originX: Math.max(0, (cropRect.left || 0) * widthRatio),
        originY: Math.max(0, (cropRect.top || 0) * heightRatio),
        width: Math.min(
          originalSize.width,
          (cropRect.width || displaySize.width) * widthRatio,
        ),
        height: Math.min(
          originalSize.height,
          (cropRect.height || displaySize.height) * heightRatio,
        ),
      };

      const extension = inferExtension(localUri);
      const mimeType = inferMimeType(extension);
      const result = await manipulateAsync(
        localUri,
        [
          {
            crop: {
              originX: Math.round(cropArea.originX),
              originY: Math.round(cropArea.originY),
              width: Math.round(cropArea.width),
              height: Math.round(cropArea.height),
            },
          },
        ],
        {
          compress: 1,
          format: mimeType === 'image/png' ? SaveFormat.PNG : SaveFormat.JPEG,
        },
      );

      await onConfirm({
        uri: result.uri,
        mimeType,
        fileName: `photo-crop-${Date.now()}.${
          mimeType === 'image/png' ? 'png' : 'jpg'
        }`,
      });
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać przyciętego zdjęcia.');
    } finally {
      setSaving(false);
    }
  }, [cropRect, displaySize, localUri, onConfirm, originalSize]);

  const handleRotate = useCallback(
    async (degrees: number) => {
      if (!localUri) {
        return;
      }
      setProcessing(true);
      try {
        const result = await manipulateAsync(
          localUri,
          [
            {
              rotate: degrees,
            },
          ],
          {
            compress: 1,
            format: SaveFormat.JPEG,
          },
        );

        if (localUri !== imageUri) {
          FileSystem.deleteAsync(localUri, { idempotent: true }).catch(
            () => undefined,
          );
        }

        setLocalUri(result.uri);
        const size = await getSize(result.uri);
        setOriginalSize(size);
        setCropRect(INITIAL_CROP);
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się obrócić zdjęcia.');
      } finally {
        setProcessing(false);
      }
    },
    [imageUri, localUri],
  );

  const isBusy = loadingImage || processing || saving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <Button
            title="Anuluj"
            type="clear"
            titleStyle={styles.headerButtonText}
            onPress={onCancel}
            disabled={saving}
          />
          <Text style={styles.title}>Kadrowanie zdjęcia</Text>
          <Button
            title="Zapisz"
            type="clear"
            titleStyle={[styles.headerButtonText, styles.saveText]}
            disabled={isBusy || !localUri}
            onPress={applyCrop}
            loading={saving}
          />
        </View>

        <View style={styles.content}>
          {loadingImage && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          )}

          {!loadingImage && localUri && (
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              scrollEnabled={false}
              pinchGestureEnabled={false}
            >
              <View
                ref={containerRef}
                onLayout={handleContainerLayout}
                style={[
                  styles.imageWrapper,
                  { height: displaySize.height || undefined },
                ]}
              >
                {displaySize.width > 0 && displaySize.height > 0 ? (
                  <Image
                    source={{ uri: localUri }}
                    style={{
                      width: displaySize.width,
                      height: displaySize.height,
                    }}
                    resizeMode="contain"
                  />
                ) : null}

                {displaySize.width > 0 && displaySize.height > 0 && (
                  <ImageCropOverlay
                    initialHeight={cropRect.height || displaySize.height}
                    initialWidth={cropRect.width || displaySize.width}
                    initialTop={cropRect.top}
                    initialLeft={cropRect.left}
                    imageHeight={displaySize.height}
                    imageWidth={displaySize.width}
                    positionTop={positionTop}
                    minWidth={minCropSize.width}
                    minHeight={minCropSize.height}
                    onLayoutChanged={handleLayoutChanged}
                  />
                )}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.footer}>
          <Button
            icon={{ type: 'feather', name: 'rotate-ccw', color: Colors.white }}
            buttonStyle={styles.iconButton}
            disabled={processing || saving || !localUri}
            onPress={() => handleRotate(270)}
            loading={processing}
          />
          <Button
            icon={{ type: 'feather', name: 'rotate-cw', color: Colors.white }}
            buttonStyle={styles.iconButton}
            disabled={processing || saving || !localUri}
            onPress={() => handleRotate(90)}
            loading={processing}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default PhotoCropperModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray,
  },
  headerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveText: {
    color: Colors.green,
  },
  title: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  imageWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
  },
});
