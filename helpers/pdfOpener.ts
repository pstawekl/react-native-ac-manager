import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

const FLAG_GRANT_READ_URI_PERMISSION = 0x00000001;

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
    console.log('[openPdfFile] Wejście, filePath:', filePath);

    // filePath może być już pełnym URL-em (http/https) lub ścieżką względną
    const fileUrl =
      filePath.startsWith('http://') || filePath.startsWith('https://')
        ? filePath
        : `http://api.acmanager.usermd.net${
            filePath.startsWith('/') ? '' : '/'
          }${filePath}`;
    const fileName = filePath.split('/').pop() || 'document.pdf';

    // Pobierz plik do documentDirectory (bardziej trwały i lepiej obsługiwany przez FileProvider)
    // Używamy unikalnej nazwy z timestampem aby zawsze pobrać nowy plik
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    const localUri = `${FileSystem.documentDirectory}${uniqueFileName}`;

    // eslint-disable-next-line no-console
    console.log('[openPdfFile] fileUrl (pobieranie):', fileUrl);
    // eslint-disable-next-line no-console
    console.log('[openPdfFile] localUri (docelowa ścieżka):', localUri);

    // Zawsze pobierz plik z serwera (nadpisz jeśli istnieje)
    // Pokaż spinner podczas pobierania
    onLoadingStart?.();
    let downloadedUri: string;
    try {
      // Usuń stary plik jeśli istnieje
      const existingFileInfo = await FileSystem.getInfoAsync(localUri);
      if (existingFileInfo.exists) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
      }

      // Pobierz plik z serwera
      const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri);

      // eslint-disable-next-line no-console
      console.log('[openPdfFile] downloadAsync result:', {
        uri: downloadResult.uri,
        status: downloadResult.status,
      });

      if (!downloadResult.uri) {
        throw new Error('Nie udało się pobrać pliku');
      }

      downloadedUri = downloadResult.uri;

      // Sprawdź czy plik został poprawnie pobrany
      const fileInfo = await FileSystem.getInfoAsync(downloadedUri, {
        size: true,
      });
      const size = 'size' in fileInfo ? fileInfo.size : 0;
      // eslint-disable-next-line no-console
      console.log(
        '[openPdfFile] Plik po pobraniu – exists:',
        fileInfo.exists,
        'size:',
        size,
        'bajtów',
      );

      if (!fileInfo.exists) {
        throw new Error('Plik nie istnieje po pobraniu');
      }
      if (size === 0) {
        throw new Error(
          'Plik został pobrany ale jest pusty (rozmiar 0 bajtów)',
        );
      }
    } finally {
      // Ukryj spinner po zakończeniu pobierania
      onLoadingEnd?.();
    }

    // Użyj downloadedUri zamiast localUri (to jest rzeczywista ścieżka do pobranego pliku)
    const fileUriToOpen = downloadedUri || localUri;

    // eslint-disable-next-line no-console
    console.log(
      '[openPdfFile] fileUriToOpen (przed otwarciem):',
      fileUriToOpen,
    );

    // Upewnij się, że fileUriToOpen ma format file://
    const fileUri = fileUriToOpen.startsWith('file://')
      ? fileUriToOpen
      : `file://${fileUriToOpen}`;

    // Sprawdź ponownie czy plik istnieje
    const finalCheck = await FileSystem.getInfoAsync(fileUri, {
      size: true,
    });
    const fileSize = 'size' in finalCheck ? finalCheck.size : 0;
    if (!finalCheck.exists || fileSize === 0) {
      throw new Error(
        `Plik nie istnieje lub jest pusty przed otwarciem. Rozmiar: ${fileSize}`,
      );
    }

    // Na Androidzie: IntentLauncher z content URI + FLAG_GRANT_READ_URI_PERMISSION
    // otwiera PDF bezpośrednio w skojarzonej aplikacji (bez ekranu udostępniania).
    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        // eslint-disable-next-line no-console
        console.log(
          '[openPdfFile] Android – otwarcie przez IntentLauncher (contentUri):',
          contentUri,
        );
        const result = await IntentLauncher.startActivityAsync(
          'android.intent.action.VIEW',
          {
            data: contentUri,
            type: 'application/pdf',
            flags: FLAG_GRANT_READ_URI_PERMISSION,
          },
        );
        // eslint-disable-next-line no-console
        // console.log(
        //   '[openPdfFile] Android – IntentLauncher result:',
        //   result.resultCode,
        // );
        // if (result.resultCode !== IntentLauncher.ResultCode.Success) {
        //   // Brak aplikacji do PDF lub użytkownik anulował – fallback na sharing
        //   if (await Sharing.isAvailableAsync()) {
        //     await Sharing.shareAsync(fileUri, {
        //       mimeType: 'application/pdf',
        //       UTI: 'com.adobe.pdf',
        //     });
        //   }
        // }
      } catch (intentError: unknown) {
        // eslint-disable-next-line no-console
        console.warn(
          '[openPdfFile] Android – IntentLauncher nie zadziałał, fallback sharing:',
          intentError,
        );
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
          });
        } else {
          throw intentError;
        }
      }
    } else {
      // Na iOS Linking.openURL z file:// działa poprawnie
      // eslint-disable-next-line no-console
      console.log('[openPdfFile] iOS – otwarcie fileUri:', fileUri);
      await Linking.openURL(fileUri);
    }
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[openPdfFile] Błąd:', error);
    Alert.alert(
      'Błąd',
      `Nie udało się otworzyć pliku PDF: ${
        error instanceof Error ? error.message : 'Nieznany błąd'
      }`,
    );
  }
}
