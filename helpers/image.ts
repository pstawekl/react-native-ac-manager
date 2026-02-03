import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

const ASSETS_BASE_URL =
  Constants?.expoConfig?.extra?.apiUrl ?? 'http://api.acmanager.usermd.net';

export default async function getSize(
  uri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      error => {
        reject(error);
      },
    );
  });
}

export const getImageUrl = (uri: string | null | undefined): string | null => {
  if (!uri || typeof uri !== 'string') {
    return null;
  }

  const trimmed = uri.trim();
  if (!trimmed) {
    return null;
  }

  // Już pełny URL (http/https) – zwracamy bez zmian (jak w pdfOpener)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Ścieżka względna – dopisujemy base URL (bez podwójnego dopisywania)
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const base = ASSETS_BASE_URL.endsWith('/')
    ? ASSETS_BASE_URL.slice(0, -1)
    : ASSETS_BASE_URL;
  return `${base}${path}`;
};

/**
 * Pobiera obraz z podanego URL do katalogu lokalnego i zwraca URI pliku (file://).
 * Używane m.in. do certyfikatów-zdjęć, żeby Image ładował z dysku zamiast zdalnego URL.
 */
export async function downloadImageToLocal(remoteUrl: string): Promise<string> {
  const fileName = remoteUrl.split('/').pop() || `image_${Date.now()}.jpg`;
  const localPath = `${
    FileSystem.documentDirectory
  }cert_${Date.now()}_${fileName}`;
  const result = await FileSystem.downloadAsync(remoteUrl, localPath);
  if (!result.uri) {
    throw new Error('Nie udało się pobrać obrazu');
  }
  if (result.status !== 200) {
    throw new Error(
      `Serwer zwrócił błąd ${result.status}. Plik może nie istnieć pod podanym adresem.`,
    );
  }
  return result.uri;
}
