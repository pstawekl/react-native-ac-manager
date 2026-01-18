import * as FileSystem from 'expo-file-system';
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

    // Pobierz plik do documentDirectory (bardziej trwały i lepiej obsługiwany przez FileProvider)
    // Używamy unikalnej nazwy z timestampem aby zawsze pobrać nowy plik
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    const localUri = `${FileSystem.documentDirectory}${uniqueFileName}`;

    // eslint-disable-next-line no-console
    console.log('Lokalna ścieżka:', localUri);
    // eslint-disable-next-line no-console
    console.log('Pobieranie pliku z serwera:', fileUrl);

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
      const downloadResult = await FileSystem.downloadAsync(
        fileUrl,
        localUri,
      );

      if (!downloadResult.uri) {
        throw new Error('Nie udało się pobrać pliku');
      }
      
      downloadedUri = downloadResult.uri;
      // eslint-disable-next-line no-console
      console.log('Plik pobrany:', downloadedUri);
      
      // Sprawdź czy plik został poprawnie pobrany
      const fileInfo = await FileSystem.getInfoAsync(downloadedUri);
      if (!fileInfo.exists) {
        throw new Error('Plik nie istnieje po pobraniu');
      }
      if (fileInfo.size === 0) {
        throw new Error('Plik został pobrany ale jest pusty (rozmiar 0 bajtów)');
      }
      // eslint-disable-next-line no-console
      console.log('Rozmiar pobranego pliku:', fileInfo.size, 'bajtów');
    } finally {
      // Ukryj spinner po zakończeniu pobierania
      onLoadingEnd?.();
    }

    // Użyj downloadedUri zamiast localUri (to jest rzeczywista ścieżka do pobranego pliku)
    const fileUriToOpen = downloadedUri || localUri;
    
    // Na Androidzie użyj getContentUriAsync + IntentLauncher aby otworzyć plik bezpośrednio
    // Na iOS użyj Linking.openURL z file:// URI
    if (Platform.OS === 'android') {
      try {
        // Upewnij się, że fileUriToOpen ma format file://
        const fileUri = fileUriToOpen.startsWith('file://')
          ? fileUriToOpen
          : `file://${fileUriToOpen}`;
        
        // eslint-disable-next-line no-console
        console.log('Próba otwarcia pliku z URI:', fileUri);
        
        // Sprawdź ponownie czy plik istnieje przed konwersją
        const finalCheck = await FileSystem.getInfoAsync(fileUri);
        if (!finalCheck.exists || finalCheck.size === 0) {
          throw new Error(`Plik nie istnieje lub jest pusty przed otwarciem. Rozmiar: ${finalCheck.size}`);
        }
        
        // eslint-disable-next-line no-console
        console.log('Plik istnieje, rozmiar:', finalCheck.size, 'bajtów');
        
        // Konwertuj file:// URI na content:// URI używając getContentUriAsync
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        
        // eslint-disable-next-line no-console
        console.log(
          `Otwieranie pliku na Android używając content:// URI:`,
          contentUri,
        );
        
        // Dodajemy małe opóźnienie aby upewnić się, że plik jest gotowy
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Spróbuj otworzyć przez Linking z content:// URI
        // Uwaga: To może nie działać bez flag FLAG_GRANT_READ_URI_PERMISSION,
        // ale spróbujemy jako pierwsze podejście
        try {
          // eslint-disable-next-line no-console
          console.log('Próba otwarcia przez Linking z content:// URI:', contentUri);
          const canOpen = await Linking.canOpenURL(contentUri);
          if (canOpen) {
            await Linking.openURL(contentUri);
            return; // Sukces, zakończ funkcję
          }
        } catch (linkingError: any) {
          // eslint-disable-next-line no-console
          console.warn('Linking.openURL nie zadziałał, próbujemy expo-sharing:', linkingError);
        }
        
        // Fallback: użyj expo-sharing jako ostatnia deska ratunku
        // expo-sharing używa natywnych flag Intent z FLAG_GRANT_READ_URI_PERMISSION
        // Niestety zawsze pokazuje okno wyboru aplikacji, ale to jedyne działające rozwiązanie
        // bez potrzeby przebudowy aplikacji natywnej
        if (await Sharing.isAvailableAsync()) {
          // eslint-disable-next-line no-console
          console.log('Używanie expo-sharing jako fallback');
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
          });
        } else {
          throw new Error('Nie można otworzyć pliku: brak dostępnych metod otwierania plików');
        }
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Błąd podczas otwierania pliku:', error);
        throw error;
      }
    } else {
      // Na iOS użyj Linking.openURL z file:// URI
      const fileUri = fileUriToOpen.startsWith('file://')
        ? fileUriToOpen
        : `file://${fileUriToOpen}`;
      // eslint-disable-next-line no-console
      console.log(`Otwieranie pliku na iOS używając file:// URI:`, fileUri);
      await Linking.openURL(fileUri);
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
