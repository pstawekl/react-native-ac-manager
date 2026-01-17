import { Button, Image, Text } from '@rneui/themed';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Control, Controller } from 'react-hook-form';
import { FieldPathValue } from 'react-hook-form/dist/types';
import { FieldValues } from 'react-hook-form/dist/types/fields';
import { FieldPath, Path } from 'react-hook-form/dist/types/path/eager';
import { Alert, ColorValue, StyleSheet, View } from 'react-native';

import Colors from '../consts/Colors';

export type File = {
  uri: string;
  name: string;
  type: string;
};

type FilePickerProps<T extends FieldValues> = {
  label?: string;
  title?: string;
  variant?: 'gray';
  name: Path<T>;
  control: Control<T, undefined>;
  color?: ColorValue;
  type?: 'file' | 'image';
  isGoToCamera?: boolean;
  acceptedFileTypes?: string[];
};

function FilePicker<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  label,
  title,
  variant,
  name,
  control,
  color,
  type = 'file',
  isGoToCamera,
  acceptedFileTypes = ['application/pdf'],
}: FilePickerProps<T>) {
  const [documentName, setDocumentName] = useState<string | null>();
  const [documentUri, setDocumentUri] = useState<string | null>();

  const handleButtonPress = async (onChange: FieldPathValue<T, TName>) => {
    let result;

    if (type === 'image') {
      try {
        if (isGoToCamera) {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        }

        if (!result.canceled) {
          const { uri, fileName, type: fileType } = result.assets[0];

          // Generuj nazwę pliku jeśli nie jest dostępna
          let finalFileName = fileName;
          if (!finalFileName) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = fileType?.includes('png') ? 'png' : 'jpg';
            finalFileName = `image_${timestamp}.${extension}`;
          }

          // Napraw typ pliku - musi być prawidłowy MIME type
          let mimeType: string;
          if (!fileType || fileType === 'image') {
            // Określ MIME type na podstawie rozszerzenia lub domyślnie JPEG
            if (finalFileName.toLowerCase().includes('.png')) {
              mimeType = 'image/png';
            } else {
              mimeType = 'image/jpeg';
            }
          } else {
            mimeType = fileType;
          }

          setDocumentUri(uri);
          setDocumentName(finalFileName);

          const fileData = {
            uri,
            name: finalFileName,
            type: mimeType,
          };

          onChange(fileData);
        } else {
        }
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się wybrać zdjęcia');
      }
    } else if (type === 'file') {
      result = await DocumentPicker.getDocumentAsync({
        type: acceptedFileTypes,
      });

      if (result.type === 'cancel') {
        return;
      }

      try {
        onChange({
          uri: result.uri,
          name: result.name,
          type: result.mimeType,
        });
        setDocumentName(result.name);
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się wczytać pliku');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {documentName && (
        <View style={styles.documentNameContainer}>
          <View>
            <Text style={styles.documentNamePrepend}>Wybrany plik:</Text>
            <Text style={styles.documentName}>{documentName}</Text>
          </View>

          {documentUri && (
            <Image source={{ uri: documentUri }} style={styles.preview} />
          )}
        </View>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field: { onChange } }) => {
          return variant === 'gray' ? (
            <Button
              onPress={() =>
                handleButtonPress(onChange as FieldPathValue<T, TName>)
              }
              icon={{
                type: 'antdesign',
                name: 'pluscircleo',
                size: 24,
                color: Colors.black,
              }}
              buttonStyle={styles.photoButton}
              titleStyle={styles.photoButtonTitle}
              title={title || 'Dodaj zdjęcie/a'}
            />
          ) : (
            <Button
              title="Wybierz plik"
              onPress={() =>
                handleButtonPress(onChange as FieldPathValue<T, TName>)
              }
              titleStyle={styles.buttonTitle}
              /* eslint-disable-next-line react-native/no-inline-styles */
              buttonStyle={{
                borderRadius: 4,
                backgroundColor: color,
              }}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    fontFamily: 'Poppins_400Regular',
    marginTop: 0,
    marginBottom: 5,
    color: Colors.black,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  label: {
    marginBottom: 6,
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 10,
    color: Colors.black,
  },
  documentNameContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  documentNamePrepend: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  documentName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  buttonTitle: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  preview: { width: 50, height: 50 },
  photoButton: {
    width: '100%',
    height: 54,
    minHeight: 54,
    padding: 0,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: 'flex-start',
  },
  photoButtonTitle: {
    paddingLeft: 6,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Colors.black,
  },
});

export default FilePicker;
