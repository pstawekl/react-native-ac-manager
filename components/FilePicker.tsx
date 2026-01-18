import { Button, Image, Text } from '@rneui/themed';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Control, Controller, useWatch } from 'react-hook-form';
import { FieldPathValue } from 'react-hook-form/dist/types';
import { FieldValues } from 'react-hook-form/dist/types/fields';
import { FieldPath, Path } from 'react-hook-form/dist/types/path/eager';
import {
  Alert,
  ColorValue,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../consts/Colors';
import { openPdfFile } from '../helpers/pdfOpener';
import PlusIcon from './icons/PlusIcon';

export type File = {
  uri: string;
  name: string;
  type: string;
};

type FilePickerProps<T extends FieldValues> = {
  label?: string;
  title?: string;
  subtitle?: string;
  variant?: 'gray';
  name: Path<T>;
  control: Control<T, undefined>;
  color?: ColorValue;
  type?: 'file' | 'image';
  isGoToCamera?: boolean;
  acceptedFileTypes?: string[];
  initialValue?: File | string; // URL do pliku lub obiekt File
};

function FilePicker<
  T extends FieldValues,
  TName extends FieldPath<T> = FieldPath<T>,
>({
  label,
  title,
  subtitle,
  variant,
  name,
  control,
  color,
  type = 'file',
  isGoToCamera,
  acceptedFileTypes = ['application/pdf'],
  initialValue,
}: FilePickerProps<T>) {
  const [documentName, setDocumentName] = useState<string | null>();
  const [documentUri, setDocumentUri] = useState<string | null>();

  // Obserwuj wartość pola w formularzu
  const fieldValue = useWatch({
    control,
    name,
  });

  // Obsługa wartości początkowej i wartości z formularza
  useEffect(() => {
    const value = fieldValue || initialValue;
    if (value) {
      if (typeof value === 'string') {
        // Jeśli to URL, wyciągnij nazwę pliku z URL
        const urlParts = value.split('/');
        const fileName = urlParts[urlParts.length - 1] || 'umowa.pdf';
        setDocumentName(fileName);
        setDocumentUri(value);
      } else if (value.name && value.uri) {
        // Jeśli to obiekt File
        setDocumentName(value.name);
        setDocumentUri(value.uri);
      }
    } else {
      // Resetuj jeśli nie ma wartości
      setDocumentName(null);
      setDocumentUri(null);
    }
  }, [fieldValue, initialValue]);

  // Funkcja do otwierania pliku PDF
  const handleOpenFile = async () => {
    if (!documentUri) return;

    try {
      let fileUri: string;

      // Określ URI pliku
      if (typeof documentUri === 'string') {
        fileUri = documentUri;
      } else {
        return; // Nie obsługujemy obiektów w tym miejscu
      }

      // Jeśli to URL z serwera (http/https), użyj openPdfFile
      if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
        // Jeśli URL zawiera pełną ścieżkę serwera, wyciągnij względną ścieżkę
        if (fileUri.includes('http://api.acmanager.usermd.net')) {
          const filePath = fileUri.replace(
            'http://api.acmanager.usermd.net',
            '',
          );
          await openPdfFile(filePath);
        } else {
          // Jeśli to pełny URL z innego serwera, użyj bezpośrednio
          await openPdfFile(fileUri);
        }
      } else {
        // Jeśli to lokalny plik (file:// lub lokalny URI)
        // Użyj getContentUriAsync + Linking.openURL do otwarcia pliku bezpośrednio w aplikacji PDF
        try {
          // Sprawdź czy plik istnieje
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (!fileInfo.exists) {
            Alert.alert('Błąd', 'Plik nie istnieje');
            return;
          }

          // Na Androidzie użyj getContentUriAsync aby uzyskać content:// URI
          // To pozwoli otworzyć plik bezpośrednio w aplikacji PDF bez dialogu udostępniania
          if (Platform.OS === 'android') {
            // Upewnij się, że URI zaczyna się od file://
            const androidFileUri = fileUri.startsWith('file://')
              ? fileUri
              : `file://${fileUri}`;

            // Konwertuj file:// URI na content:// URI używając getContentUriAsync
            const contentUri = await FileSystem.getContentUriAsync(
              androidFileUri,
            );

            // Otwórz plik używając content:// URI
            // To otworzy plik bezpośrednio w domyślnej aplikacji PDF
            await Linking.openURL(contentUri);
          } else {
            // Na iOS użyj Linking.openURL z file:// URI
            const iosUri = fileUri.startsWith('file://')
              ? fileUri
              : `file://${fileUri}`;
            await Linking.openURL(iosUri);
          }
        } catch (error: any) {
          Alert.alert('Błąd', `Nie udało się otworzyć pliku: ${error.message}`);
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Błąd',
        `Nie udało się otworzyć pliku: ${error.message || 'Nieznany błąd'}`,
      );
    }
  };

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
        <TouchableOpacity
          onPress={handleOpenFile}
          activeOpacity={0.7}
          style={styles.documentNameContainer}
        >
          <View>
            <Text style={styles.documentNamePrepend}>Wybrany plik:</Text>
            <Text style={styles.documentName}>{documentName}</Text>
          </View>

          {documentUri && type === 'image' && (
            <Image source={{ uri: documentUri }} style={styles.preview} />
          )}
        </TouchableOpacity>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field: { onChange } }) => {
          return variant === 'gray' ? (
            <TouchableOpacity
              onPress={() =>
                handleButtonPress(onChange as FieldPathValue<T, TName>)
              }
              style={styles.photoButton}
              activeOpacity={0.7}
            >
              <View style={styles.photoButtonContent}>
                <View style={styles.photoButtonIconContainer}>
                  <PlusIcon color={Colors.black} size={24} />
                </View>
                <View style={styles.photoButtonTextContainer}>
                  <Text style={styles.photoButtonTitle}>
                    {title || 'Dodaj zdjęcie/a'}
                  </Text>
                  {subtitle && (
                    <Text style={styles.photoButtonSubtitle}>{subtitle}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
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
    minHeight: 54,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  photoButtonContent: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  photoButtonIconContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  photoButtonTextContainer: {
    flex: 1,
  },
  photoButtonTitle: {
    fontFamily: 'Archivo_600SemiBold',
    fontSize: 14,
    color: Colors.black,
    marginBottom: 4,
  },
  photoButtonSubtitle: {
    fontFamily: 'Archivo_400Regular',
    fontSize: 12,
    color: Colors.grayText,
  },
});

export default FilePicker;
