/* eslint-disable consistent-return */
import { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { ImageStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import Colors from '../consts/Colors';

type PhotoProps = {
  uri: string | null;
  style: StyleProp<ImageStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
};

function Photo({ uri, style, onLayout = () => undefined }: PhotoProps) {
  const [desiredWidth, setDesiredWidth] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1); // Default square aspect ratio
  const [imageLoadError, setImageLoadError] = useState(false);

  // Handle null or invalid URI
  const isValidUri = uri && typeof uri === 'string' && uri.length > 0;

  useEffect(() => {
    if (desiredWidth > 0 && !imageLoadError && isValidUri) {
      const getSizeTimeout = setTimeout(() => {
        setAspectRatio(4 / 3); // Common photo aspect ratio
      }, 3000); // 3 second timeout

      Image.getSize(
        uri,
        (width, height) => {
          clearTimeout(getSizeTimeout);
          const ratio = width / height;
          setAspectRatio(ratio);
        },
        error => {
          clearTimeout(getSizeTimeout);
          setAspectRatio(4 / 3);
        },
      );

      return () => clearTimeout(getSizeTimeout);
    }
  }, [uri, desiredWidth, imageLoadError, isValidUri]);

  const handleOnLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setDesiredWidth(width);
    onLayout(e);
  };

  const calculatedHeight = desiredWidth / aspectRatio;

  return (
    <View style={[styles.container, style]} onLayout={handleOnLayout}>
      {isValidUri ? (
        <Image
          source={{ uri }}
          style={
            (styles.imageStyle,
            {
              width: desiredWidth,
              height: calculatedHeight || 150,
            })
          }
          resizeMode="cover"
          onError={error => {
            setImageLoadError(true);
          }}
          onLoad={() => {
            setImageLoadError(false);
          }}
        />
      ) : (
        <View
          style={[
            styles.errorContainer,
            {
              width: desiredWidth,
              height: calculatedHeight || 150,
            },
          ]}
        >
          <Text style={styles.errorText}>Brak zdjęcia</Text>
        </View>
      )}
      {imageLoadError && isValidUri && (
        <View style={[styles.container, style, styles.errorContainer]}>
          <Text style={styles.errorText}>Nie udało się załadować zdjęcia</Text>
        </View>
      )}
    </View>
  );
}

export default Photo;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.divider,
    borderRadius: 4,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.divider,
    borderRadius: 4,
    minHeight: 100,
  },
  errorText: {
    color: Colors.text,
    textAlign: 'center',
    fontSize: 12,
    padding: 10,
  },
  imageStyle: {
    minHeight: 100,
  },
});
