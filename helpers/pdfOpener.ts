import * as FileSystem from 'expo-file-system';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Pobiera plik PDF z serwera i otwiera go w skojarzonej aplikacji.
 * Przy pierwszym otwarciu system pokaże użytkownikowi wybór aplikacji.
 * System automatycznie zapamięta wybór użytkownika dla kolejnych otwarć.
 *
 * Na iOS używa UIActivityViewController, który pokazuje opcje otwarcia.
 * Na Android używa Intent, który pokazuje wybór aplikacji.
 * System automatycznie zapamięta wybór użytkownika po pierwszym użyciu.
 */
type OpenPdfFileOptions = {
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
};

// eslint-disable-next-line import/prefer-default-export
export async function openPdfFile(
  filePath: string | null | undefined,
  options?: OpenPdfFileOptions,
): Promise<void> {
  const { onLoadingStart, onLoadingEnd } = options || {};

  try {
    // Walidacja: sprawdź czy filePath jest poprawny
    if (!filePath || filePath === null || filePath === undefined) {
      Alert.alert('Błąd', 'Nie można otworzyć pliku: brak ścieżki do pliku.');
      return;
    }

    // eslint-disable-next-line no-console
    console.log('Otwieranie pliku PDF:', filePath);

    const fileUrl = `http://api.acmanager.usermd.net${filePath}`;
    const fileName = filePath.split('/').pop() || 'document.pdf';

    // Pobierz plik do lokalnego cache
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;

    // eslint-disable-next-line no-console
    console.log('Lokalna ścieżka:', localUri);

    // Sprawdź czy plik już istnieje lokalnie
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (!fileInfo.exists) {
      // Pokaż spinner podczas pobierania
      onLoadingStart?.();
      try {
        // eslint-disable-next-line no-console
        console.log('Pobieranie pliku z serwera:', fileUrl);
        // Pobierz plik z serwera
        const downloadResult = await FileSystem.downloadAsync(
          fileUrl,
          localUri,
        );

        if (!downloadResult.uri) {
          throw new Error('Nie udało się pobrać pliku');
        }
        // eslint-disable-next-line no-console
        console.log('Plik pobrany:', downloadResult.uri);
      } finally {
        // Ukryj spinner po zakończeniu pobierania
        onLoadingEnd?.();
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('Plik już istnieje lokalnie');
    }

    // Używamy Sharing.shareAsync, który pokazuje wybór aplikacji
    // Na iOS: UIActivityViewController z opcjami otwarcia
    // Na Android: Intent z wyborem aplikacji
    // System automatycznie zapamięta wybór użytkownika po pierwszym użyciu
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // eslint-disable-next-line no-console
      console.log(
        `Otwieranie pliku na ${Platform.OS} używając Sharing:`,
        localUri,
      );
      await Sharing.shareAsync(localUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Wybierz aplikację do otwarcia pliku PDF',
      });
    } else {
      // Fallback: otwórz bezpośrednio z serwera
      // eslint-disable-next-line no-console
      console.log('Sharing niedostępny, otwieranie z serwera:', fileUrl);
      await Linking.openURL(fileUrl);
    }
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error('Błąd podczas otwierania pliku PDF:', error);
    Alert.alert(
      'Błąd',
      `Nie udało się otworzyć pliku PDF: ${error.message || 'Nieznany błąd'}`,
    );
  }
}
