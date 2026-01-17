import {
  LayoutChangeEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRef, useState } from 'react';
import { Button } from '@rneui/themed';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import ImageCropOverlay, {
  ImageCropOverlayLayout,
} from '../../components/ImageCropOverlay';
import Photo from '../../components/Photo';
import getSize, { getImageUrl } from '../../helpers/image';

function CropTab({ uri }: { uri: string }) {
  const [image, setImage] = useState<string>(uri);
  const [positionTop, setPositionTop] = useState(0);
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [cropSize, setCropSize] = useState<
    | {
        width: number;
        height: number;
        top: number;
        left: number;
      }
    | undefined
  >();
  const ref = useRef<View>(null);

  const handleOnImageLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;

    if (height >= 2 && width >= 2) {
      setImageSize({
        width,
        height,
      });
      ref.current?.measure(
        (measureX, measureY, measureWidth, measureHeight, pageX, pageY) => {
          setCropSize({
            width,
            height,
            top: 0,
            left: 0,
          });
          setPositionTop(pageY);
        },
      );
    }
  };

  const handleOnLayoutChanged = (layout: ImageCropOverlayLayout) => {
    setCropSize({
      width: layout.width,
      height: layout.height,
      top: layout.top,
      left: layout.left,
    });
  };

  const handleRotate = async (degree: number) => {
    const manipResult = await manipulateAsync(image, [{ rotate: degree }], {
      compress: 1,
      format: SaveFormat.PNG,
    });
    setImage(manipResult.uri);
  };

  const handleCrop = async () => {
    if (!cropSize) {
      return;
    }

    const originalSize = await getSize(image);

    const manipResult = await manipulateAsync(
      image,
      [
        {
          crop: {
            width: (cropSize.width / imageSize.width) * originalSize.width,
            height: (cropSize.height / imageSize.height) * originalSize.height,
            originX: (cropSize.left / imageSize.width) * originalSize.width,
            originY: (cropSize.top / imageSize.height) * originalSize.height,
          },
        },
      ],
      {
        compress: 1,
        format: SaveFormat.PNG,
      },
    );
    setImage(manipResult.uri);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        maximumZoomScale={5}
        minimumZoomScale={0.5}
        scrollEventThrottle={16}
        scrollEnabled={false}
        pinchGestureEnabled={false}
      >
        <View ref={ref} onLayout={handleOnImageLayout}>
          <Photo uri={getImageUrl(image)} style={styles.photo} />
          {cropSize !== undefined && (
            <ImageCropOverlay
              initialHeight={cropSize.height}
              initialWidth={cropSize.width}
              initialTop={cropSize.top}
              initialLeft={cropSize.left}
              imageHeight={imageSize.height}
              imageWidth={imageSize.width}
              positionTop={positionTop}
              onLayoutChanged={handleOnLayoutChanged}
            />
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          icon={{ type: 'entypo', name: 'crop', color: '#FFF' }}
          onPress={handleCrop}
        />
        <Button
          icon={{ type: 'feather', name: 'rotate-ccw', color: '#FFF' }}
          containerStyle={styles.marginLeft}
          onPress={() => handleRotate(270)}
        />
        <Button
          icon={{ type: 'feather', name: 'rotate-cw', color: '#FFF' }}
          onPress={() => handleRotate(90)}
        />
      </View>
    </SafeAreaView>
  );
}

export default CropTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  photo: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
  },
  marginLeft: {
    marginLeft: 'auto',
  },
});
