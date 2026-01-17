/* eslint-disable react-hooks/exhaustive-deps */
import { useNavigation } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay/lib';

import { IconButton } from '../../components/Button';
import ButtonsHeader from '../../components/ButtonsHeader';
import ConfirmationOverlay from '../../components/ConfirmationOverlay';
import FloatingActionButton from '../../components/FloatingActionButton';
import PhoneIcon from '../../components/icons/PhoneIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import Colors from '../../consts/Colors';
import useApi from '../../hooks/useApi';
import { ClientMenuScreenProps } from '../../navigation/types';
import useClients, { Client } from '../../providers/ClientsProvider';

const ALPHABET = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
);

function RowLeftContent({
  phone,
  onCallPress,
}: {
  phone: string | null;
  onCallPress: () => void;
}) {
  const translateX = useRef(new Animated.Value(150)).current;

  const animate = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  useEffect(() => {
    animate(0);
  }, []);

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        styles.actionContainerLeft,
        styles.clientCall,
        { transform: [{ translateX }] },
      ]}
    >
      <IconButton
        icon={<PhoneIcon color="white" />}
        style={styles.buttonStyle}
        titleStyle={styles.buttonTitleStyle}
        onPress={onCallPress}
        withoutBackground
      />
    </Animated.View>
  );
}

function RowRightContent({ onDeletePress }: { onDeletePress: () => void }) {
  const translateX = useRef(new Animated.Value(150)).current;

  const animate = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  useEffect(() => {
    animate(0);
  }, []);

  return (
    <Animated.View
      style={[
        styles.actionContainer,
        styles.actionContainerRight,
        styles.clientDelete,
        { transform: [{ translateX }] },
      ]}
    >
      <IconButton
        icon={<TrashIcon color="white" />}
        style={styles.buttonStyle}
        titleStyle={styles.buttonTitleStyle}
        onPress={onDeletePress}
        withoutBackground
      />
    </Animated.View>
  );
}

const ClientRow = memo(
  ({
    client,
    onDeletePress,
    onCloseAllSwipes,
    registerSwipeRef,
  }: {
    client: Client;
    onDeletePress: (id: number) => void;
    onCloseAllSwipes: () => void;
    registerSwipeRef: (id: number, ref: any) => void;
  }) => {
    const { navigate } = useNavigation<ClientMenuScreenProps['navigation']>();
    const [isSwiping, setIsSwiping] = useState(false);

    const clientName = `${client.first_name
      .charAt(0)
      .toUpperCase()}${client.first_name.slice(1)} ${client.last_name
        .charAt(0)
        .toUpperCase()}${client.last_name.slice(1)}`;

    const swipeRefCallback = useCallback(
      (ref: any) => {
        if (ref) {
          registerSwipeRef(client.id, ref);
        }
      },
      [client.id, registerSwipeRef],
    );

    const renderLeftActions = () => {
      return (
        <RowLeftContent
          phone={client.numer_telefonu}
          onCallPress={handleLeftAction}
        />
      );
    };

    const renderRightActions = () => {
      return <RowRightContent onDeletePress={handleRightAction} />;
    };

    const handleLeftAction = () => {
      handleCallPress();
    };

    const handleRightAction = () => {
      onDeletePress(client.id);
    };

    const handleCallPress = () => {
      if (client.numer_telefonu) {
        Linking.openURL(`tel:${client.numer_telefonu}`);
      } else {
        Alert.alert(
          'Brak numeru telefonu',
          'Ten klient nie ma przypisanego numeru telefonu.',
        );
      }
    };

    const handlePress = () => {
      navigate('Menu', { clientId: client.id, client });
    };

    const viewWidth = Dimensions.get('window').width;
    const buttonWidth = 80;

    return (
      <Swipeable
        ref={swipeRefCallback}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        friction={2}
        leftThreshold={40}
        rightThreshold={40}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          setIsSwiping(true);
        }}
        onSwipeableWillClose={() => {
          setIsSwiping(false);
        }}
        onSwipeableOpen={direction => {
          if (direction === 'left') {
            handleLeftAction();
          } else if (direction === 'right') {
            handleRightAction();
          }

          onCloseAllSwipes();
        }}
      >
        <TouchableOpacity
          style={[styles.listItem, isSwiping && styles.listItemSwiping]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          {/* <View style={styles.listItemIcon}>
            <UserIcon viewBox="0 0 90 90" color={Colors.white} />
          </View> */}
          <View style={styles.listItemContent}>
            <Text style={styles.clientTitle}>
              {clientName ?? client.nazwa_firmy ?? client.nip}
            </Text>
            {(client.nazwa_firmy || client.nip) && (
              <Text style={styles.clientSubtitle}>
                {client.nazwa_firmy ?? client.nip}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  },
);

export default function ClientsList() {
  const { navigate, goBack } =
    useNavigation<ClientMenuScreenProps['navigation']>();

  const { execute: deleteClient } = useApi({
    path: 'remove_klient',
  });

  const [searchValue, setSearchValue] = useState<string>('');
  const [filteredClients, setFilteredClients] = useState<Client[] | null>();
  const {
    clients,
    getClients,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    resetClients,
  } = useClients();

  const [visible, setVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const swipeRefs = useRef<Map<number, any>>(new Map());

  // Funkcja do zamykania wszystkich swipe elementów
  const closeAllSwipes = useCallback(() => {
    swipeRefs.current.forEach((ref, clientId) => {
      if (ref && ref.close) {
        ref.close();
      }
    });
  }, []);

  // Funkcja do rejestrowania referencji swipe elementów
  const registerSwipeRef = useCallback((id: number, ref: any) => {
    if (ref) {
      swipeRefs.current.set(id, ref);
    }
  }, []);

  const onDeleteConfirmed = async () => {
    if (idToDelete) {
      await deleteClient({ data: { klient_id: idToDelete } });
      toggleOverlay();
      Alert.alert('Usunięto klienta');
      // Po usunięciu przeładuj pierwszą stronę
      resetClients();
      getClients(1, false);
    }
  };

  const onDelete = (id: number) => {
    setIdToDelete(id);
    toggleOverlay();
  };

  const toggleOverlay = useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  useEffect(() => {
    // Loading - pobierz pierwszą stronę jeśli nie ma klientów
    if (!clients && getClients) {
      getClients(1, false);
    }
  }, [clients, getClients]);

  // Filtruj klientów lokalnie (po wyszukiwaniu)
  useEffect(() => {
    if (clients) {
      if (searchValue.trim() === '') {
        // Brak wyszukiwania - pokaż wszystkich klientów
        setFilteredClients(clients);
      } else {
        // Filtruj po wyszukiwaniu
        const filteredData = clients.filter(client =>
          `${client.first_name} ${client.last_name}`
            .toLocaleLowerCase()
            .includes(searchValue.toLocaleLowerCase()),
        );
        setFilteredClients(filteredData);
      }
    } else {
      setFilteredClients(null);
    }
    // Zamknij wszystkie swipe elementy gdy zmienia się wyszukiwanie lub lista
    closeAllSwipes();
  }, [searchValue, clients, closeAllSwipes]);

  // Funkcja do ładowania kolejnej strony przy scrollowaniu
  const loadMoreClients = useCallback(() => {
    if (!loadingMore && hasMore && getClients && searchValue.trim() === '') {
      // Ładuj kolejną stronę tylko jeśli nie ma aktywnego wyszukiwania
      const nextPage = currentPage + 1;
      getClients(nextPage, true);
    }
  }, [loadingMore, hasMore, getClients, currentPage, searchValue]);

  const listRef = useRef<FlashList<Client>>(null);

  const handleLetterPress = useCallback(
    (letter: string) => {
      if (!filteredClients) return;
      const index = filteredClients.findIndex(
        item => item.first_name[0]?.toUpperCase() === letter,
      );
      if (index !== -1) {
        listRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0,
        });
      }
    },
    [filteredClients],
  );

  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ButtonsHeader
        onBackPress={() => navigation.goBack()}
        // onAddPress={() => navigate('Form', {})}
        searchValue={searchValue}
        onChangeSearchValue={setSearchValue}
        title="Klienci"
      />

      <View style={styles.listWrapper}>
        <View style={styles.listContainer}>
          <FlashList<Client>
            ref={listRef}
            data={filteredClients || []}
            renderItem={({ item }) => (
              <ClientRow
                onDeletePress={onDelete}
                client={item}
                onCloseAllSwipes={closeAllSwipes}
                registerSwipeRef={registerSwipeRef}
              />
            )}
            estimatedItemSize={80}
            onEndReached={loadMoreClients}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              ) : null
            }
          />
        </View>
        <View style={styles.lettersContainer}>
          <View style={styles.lettersContainerInner}>
            {ALPHABET.map(letter => (
              <TouchableOpacity
                onPress={() => handleLetterPress(letter)}
                key={letter}
                style={styles.letterContainer}
              >
                <Text style={styles.letter}>{letter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Spinner
        visible={loading}
        textContent="Trwa pobieranie danych..."
        textStyle={{ color: Colors.gray }}
      />
      <ConfirmationOverlay
        visible={visible}
        onBackdropPress={toggleOverlay}
        onSubmit={onDeleteConfirmed}
        title="Czy na pewno chcesz usunąć klienta ?"
      />

      {/* FAB - Floating Action Button */}
      <FloatingActionButton
        onPress={() => navigate('Form', {})}
        backgroundColor={Colors.green}
        right={50}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: Colors.white,
    borderTopRightRadius: 35,
    borderTopLeftRadius: 35,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingRight: 45,
  },
  listItem: {
    width: '100%',
    height: 60,
    minHeight: 48,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    backgroundColor: Colors.white,
  },
  listItemSwiping: {
    backgroundColor: Colors.gray,
  },
  // listItemIcon: {
  //   width: 45.8,
  //   height: '80%',
  //   borderRadius: 26,
  //   backgroundColor: Colors.gray,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  buttonStyle: {
    flex: 1,
    overflow: 'hidden',
    height: 60,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80, // Zmniejszona szerokość
    borderRadius: 0,
    margin: 0,
    padding: 0,
    backgroundColor: Colors.transparent,
  },
  buttonTitleStyle: {
    flex: 1,
    color: Colors.white,
    fontSize: 12,
    backgroundColor: Colors.transparent,
  },
  lettersContainer: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    height: '95%',
  },
  lettersContainerInner: {
    flex: 1,
    height: '100%',
    backgroundColor: Colors.buttons.cancelBg,
    flexDirection: 'column',
    borderRadius: 10,
    justifyContent: 'space-between',
    paddingVertical: 4,
    overflow: 'hidden',
  },
  letterContainer: {
    flex: 1,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    textAlign: 'center',
    color: Colors.grayerText,
    fontSize: 12,
  },
  listWrapper: {
    position: 'relative',
    flex: 1,
  },
  clientTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Archivo_600SemiBold',
  },
  clientSubtitle: {
    fontSize: 10,
    color: Colors.companyText,
    fontFamily: 'Archivo_400Regular',
  },
  clientCall: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    backgroundColor: Colors.primary,
    color: Colors.white,
  },
  clientDelete: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    color: Colors.white,
    backgroundColor: Colors.logout,
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  actionContainerLeft: {
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  actionContainerRight: {
    alignItems: 'flex-end',
    paddingRight: 0,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
