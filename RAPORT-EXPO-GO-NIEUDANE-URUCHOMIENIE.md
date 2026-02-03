# Raport: Dlaczego aplikacja nie uruchamia się poprawnie w Expo Go

**Data analizy:** 3 lutego 2025  
**Scenariusz:** `npx expo start` → naciśnięcie „a” (Android) → uruchomienie aplikacji przez **Expo Go** → błędy.

---

## 1. Wnioski w skrócie

Aplikacja **AC Manager** jest skonfigurowana jako **Development Build** (własny klient deweloperski z natywnym kodem), a **nie** jako projekt do uruchamiania w **Expo Go**. Uruchomienie jej w Expo Go prowadzi do błędów, ponieważ:

1. **expo-dev-client** jest w projekcie i **nie działa w Expo Go** – wymaga zbudowanej natywnej aplikacji (development build).
2. Skrypt startowy uruchamia Metro w trybie **`--dev-client`**, co jest przeznaczone dla development buildu, nie dla Expo Go.
3. W projekcie są **biblioteki natywne**, które **nie są wbudowane w Expo Go** – przy pierwszym użyciu takich modułów w Expo Go pojawią się błędy typu „native module not found” lub podobne.

**Rekomendacja:** Aplikacja powinna być uruchamiana przez **development build** (np. `npx expo run:android` i zainstalowany na urządzeniu/emulatorze zbudowany APK), a **nie** przez aplikację Expo Go.

---

## 2. Konfiguracja projektu – Development Build, nie Expo Go

### 2.1. Skrypt startowy (`package.json`)

```json
"start": "expo start --dev-client"
```

- Flaga **`--dev-client`** oznacza, że Metro jest uruchamiany w trybie dla **development buildu**.
- Oczekiwane jest, że na urządzeniu/emulatorze działa **twoja zbudowana aplikacja** (z `expo-dev-client` w środku), a nie aplikacja Expo Go.
- Naciśnięcie „a” w terminalu otwiera projekt na Androidzie; jeśli użytkownik otworzy go **w Expo Go** (np. przez skan QR), bundle ładuje się w środowisku Expo Go, które **nie zawiera** `expo-dev-client` ani wielu innych natywnych modułów z tego projektu.

### 2.2. Zależność `expo-dev-client` (`package.json`)

```json
"expo-dev-client": "~2.2.1"
```

- **expo-dev-client** dostarcza m.in.:
  - launcher UI do przełączania serwerów / wersji,
  - rozszerzone menu deweloperskie,
  - integrację z dev tools.
- Działa **tylko**, gdy jest wkompilowany w **własną natywną aplikację** (development build).
- **Expo Go** to osobna, gotowa aplikacja z **stałym zestawem** natywnych bibliotek – nie zawiera `expo-dev-client`. Próba użycia go w Expo Go skutkuje brakiem natywnego modułu i błędami.

### 2.3. EAS Build (`eas.json`)

Wszystkie profile deweloperskie mają włączony development client:

```json
"development": { "developmentClient": true, ... },
"development-simulator": { "developmentClient": true, ... },
"simulator": { "developmentClient": true, ... }
```

To potwierdza, że projekt jest od samego początku nastawiony na **development build**, a nie na Expo Go.

---

## 3. Różnica: Expo Go vs Development Build

| Aspekt            | Expo Go                                                   | Development Build (ten projekt)                                                                           |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Aplikacja natywna | Jedna, wspólna aplikacja Expo Go z Play Store / App Store | **Własna** aplikacja (np. `com.acmenago.acmanager`) zbudowana przez `expo run:android` / EAS              |
| Zawartość natywna | Stały, ograniczony zestaw bibliotek                       | Wszystkie zależności projektu (expo-dev-client, react-native-maps, itd.)                                  |
| Uruchomienie      | Skan QR / link → otwarcie w Expo Go                       | Instalacja twojego APK/IPA → uruchomienie twojej aplikacji → łączenie z Metro (`expo start --dev-client`) |
| `expo-dev-client` | **Nie jest dostępny**                                     | Dostępny (wbudowany w aplikację)                                                                          |

Dokumentacja Expo: _„Expo Go is a pre-built native app that works like a playground — it can't be changed after you install it. To add new native libraries or change things like your app name and icon, you need to build your own native app (a development build).”_

---

## 4. Biblioteki natywne prawdopodobnie niedostępne w Expo Go

Expo Go zawiera tylko **określony zestaw** natywnych modułów. W `bundledNativeModules.json` (Expo SDK 48) widać listę modułów **obsługiwanych przez SDK**, ale **nie** oznacza to, że wszystkie są w Expo Go. W projekcie są dodatkowo biblioteki **spoza** tej listy – one na pewno **nie** są w Expo Go.

### 4.1. Krytyczne dla uruchomienia w Expo Go

- **expo-dev-client** – wymaga development buildu; **nie ma go w Expo Go** → przy ładowaniu projektu w Expo Go pojawią się błędy związane z brakiem tego modułu (lub modułów z nim związanych, np. dev launcher / dev menu).

### 4.2. Biblioteki spoza „standardowego” zestawu Expo Go (w tym projektu)

Te pakiety **nie** występują w `bundledNativeModules.json` Expo 48 i z dużym prawdopodobieństwem **nie** są wbudowane w Expo Go. Użycie ich w Expo Go może skutkować błędami typu „native module not found” lub crashami:

| Pakiet                                   | Uwagi                                                          |
| ---------------------------------------- | -------------------------------------------------------------- |
| **react-native-calendars**               | Komponent kalendarza – natywny kod; zwykle nie w Expo Go.      |
| **react-native-map-clustering**          | Clustering na mapach – natywny kod.                            |
| **react-native-draggable-flatlist**      | Lista z przeciąganiem – natywne gesty / layout.                |
| **react-native-drax**                    | Drag & drop – natywne.                                         |
| **react-native-dropdown-picker**         | Picker – może zależeć od natywnych komponentów.                |
| **react-native-lightbox-v2**             | Lightbox – natywne.                                            |
| **react-native-loading-spinner-overlay** | Overlay – natywne.                                             |
| **react-native-shadow-2**                | Cienie – natywne.                                              |
| **react-native-vector-icons**            | Ikony – często wymaga linkowania fontów / natywnego kodu.      |
| **react-native-virtualized-view**        | Widok wirtualizowany – natywne.                                |
| **react-native-color-picker**            | Color picker – natywne.                                        |
| **@rneui/base**, **@rneui/themed**       | React Native Elements – mogą zależeć od natywnych komponentów. |

Nie wszystkie z nich muszą być załadowane przy starcie aplikacji, ale **każda** załadowana w Expo Go bez odpowiedniego natywnego modułu w Expo Go spowoduje błąd.

### 4.3. Moduły Expo w projekcie (część może być w Expo Go)

W projekcie są m.in.: expo-application, expo-clipboard, expo-constants, expo-crypto, expo-device, expo-document-picker, expo-file-system, expo-font, expo-image, expo-image-manipulator, expo-image-picker, expo-intent-launcher, expo-linear-gradient, expo-location, expo-sharing, expo-splash-screen, expo-sqlite, expo-status-bar, expo-updates. Część z nich jest w Expo Go, ale **obecność expo-dev-client i tryb `--dev-client`** oraz **bibliotek spoza zestawu Expo Go** i tak uniemożliwiają poprawne działanie całej aplikacji w Expo Go.

---

## 5. Konfiguracja aplikacji (`app.config.js` / `app.json`)

- **scheme:** `ac-manager` – deep linki typu `ac-manager://` – poprawne dla development buildu; w Expo Go scheme jest inny (expo-go), więc deep linki mogą nie pasować.
- **runtimeVersion** w `app.config.js` – używane przy EAS Update; spójne z modelem development buildu.
- **app.json** zawiera m.in. `expo-notifications`, `expo-image-picker`, `expo-location`, `expo-sqlite` – to są pluginy pod **własną** natywną aplikację, nie pod Expo Go.

Żadna z tych konfiguracji nie jest „naprawiona” pod Expo Go; projekt jest spójnie skonfigurowany pod **własny build**.

---

## 6. Przepływ prowadzący do błędów

1. Uruchomienie **`npx expo start`** (czyli w tym projekcie `expo start --dev-client`) – Metro startuje w trybie dla development buildu.
2. Naciśnięcie **„a”** – Expo CLI próbuje otworzyć aplikację na Androidzie (np. przez intent z URL do Metro).
3. Użytkownik otwiera projekt **w aplikacji Expo Go** (np. po zeskanowaniu QR lub wybraniu linku w Expo Go).
4. Expo Go ładuje **ten sam** bundle JS z Metro.
5. W środowisku Expo Go:
   - Brak natywnego modułu **expo-dev-client** (oraz powiązanych: dev launcher, dev menu) → błędy przy starcie lub przy pierwszym odwołaniu do tych modułów.
   - Przy wejściu w ekrany używające **react-native-calendars**, **react-native-maps**, **react-native-drax** itd. – brak odpowiednich natywnych modułów w Expo Go → kolejne błędy lub crashy.

Efekt: aplikacja „sypie błędami” w Expo Go, podczas gdy w **development buildzie** (APK z `npx expo run:android`) działa zgodnie z założeniem.

---

## 7. Podsumowanie przyczyn

| #   | Przyczyna                                | Opis                                                                                                                                                                            |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Projekt to Development Build**         | Skrypt `start` z `--dev-client`, zależność `expo-dev-client`, profile EAS z `developmentClient: true` – projekt nie jest przeznaczony do uruchamiania w Expo Go.                |
| 2   | **expo-dev-client nie działa w Expo Go** | expo-dev-client wymaga wkompilowania we własną aplikację; Expo Go go nie zawiera → błędy przy ładowaniu.                                                                        |
| 3   | **Tryb Metro `--dev-client`**            | Serwer jest nastawiony na łączenie z development buildem; używanie tego samego URL w Expo Go daje niepasujące środowisko (brak oczekiwanych modułów natywnych).                 |
| 4   | **Biblioteki spoza Expo Go**             | react-native-calendars, react-native-map-clustering, react-native-drax, react-native-vector-icons i inne – ich natywny kod nie jest w Expo Go → błędy przy użyciu tych funkcji. |
| 5   | **Expo Go = stały zestaw bibliotek**     | Nie da się „dociągnąć” brakujących natywnych modułów do Expo Go; jedyne poprawne środowisko dla tego projektu to **własny build**.                                              |

---

## 8. Rekomendowany sposób uruchamiania (bez zmian w kodzie)

- **Development build na Androidzie:**  
  `npx expo run:android`  
  Następnie uruchamiasz **zainstalowaną aplikację AC Manager** (com.acmenago.acmanager) i łączysz ją z Metro przez `npx expo start --dev-client` (albo `npm start`).
- **Nie używać** aplikacji **Expo Go** do uruchamiania tego projektu – konfiguracja i zestaw zależności są niezgodne z modelem Expo Go.

Raport ma charakter analityczny; nie wprowadzono w nim żadnych zmian w kodzie ani konfiguracji.
