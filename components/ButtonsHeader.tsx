/* eslint-disable @typescript-eslint/no-unused-vars */
import { Input, Text } from '@rneui/themed';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import Colors from '../consts/Colors';
import { IconButton } from './Button';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CloseIcon from './icons/CloseIcon';
import FilterIcon from './icons/FilterIcon';
import PlusIcon from './icons/PlusIcon';
import SearchIcon from './icons/SearchIcon';

function ButtonsHeader({
  searchValue,
  onAddPress,
  onChangeSearchValue,
  onBackPress,
  onFilterPress,
  style,
  title,
}: {
  searchValue?: string;
  onAddPress?: () => void;
  onChangeSearchValue?: Dispatch<SetStateAction<string>>;
  onBackPress?: () => void;
  onFilterPress?: () => void;
  style?: ViewStyle;
  title?: string;
}) {
  const [searchActive, setSearchActive] = useState<boolean>(false);

  const onClosePress = () => {
    if (onChangeSearchValue) {
      onChangeSearchValue('');
    }

    setSearchActive(false);
  };

  const renderSearch = () => {
    return (
      <View style={styles.searchContainer}>
        {searchActive ? (
          <>
            <Input
              containerStyle={styles.searchInputContainer}
              value={searchValue}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onChangeSearchValue}
              placeholder="Szukaj..."
            />
            <IconButton
              withoutBackground
              onPress={onClosePress}
              icon={<CloseIcon color={Colors.black} size={21} />}
            />
          </>
        ) : null}
      </View>
    );
  };

  return (
    <View style={style || styles.header}>
      {/* Lewy przycisk */}
      {onBackPress && (
        <IconButton
          withoutBackground
          onPress={onBackPress}
          icon={<ArrowLeftIcon color={Colors.black} />}
        />
      )}

      {/* Środek - Search lub pusty spacer */}
      <View style={styles.centerContainer}>
        {onChangeSearchValue && renderSearch()}
      </View>

      {/* Title wycentrowany absolutnie */}
      {title && !searchActive && (
        <View style={styles.titleContainer} pointerEvents="none">
          <Text style={styles.title}>{title}</Text>
        </View>
      )}

      {/* Prawe przyciski */}
      <View style={styles.rightContainer}>
        {onChangeSearchValue && !searchActive && (
          <IconButton
            onPress={() => setSearchActive(true)}
            icon={<SearchIcon color={Colors.black} size={18} />}
            style={styles.searchButton}
            withoutBackground
          />
        )}
        {onFilterPress && !searchActive && (
          <IconButton
            withoutBackground
            onPress={onFilterPress}
            icon={<FilterIcon color={Colors.black} />}
          />
        )}
        {onAddPress && !searchActive && (
          <IconButton
            withoutBackground
            onPress={onAddPress}
            icon={<PlusIcon color={Colors.black} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    paddingHorizontal: 10,
    paddingTop: 8,
    marginBottom: 12,
  },
  centerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    marginTop: 25,
    height: '100%',
    borderBottomWidth: 0,
    alignSelf: 'flex-end',
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    color: Colors.black,
    textAlign: 'center',
  },
  searchButton: {
    borderRadius: 35,
    height: 40,
    width: 40,
    backgroundColor: Colors.buttons.cancelBg,
  },
});

export default ButtonsHeader;
