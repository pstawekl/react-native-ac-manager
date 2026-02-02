import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import GalleryContent from '../../components/GalleryContent';
import Tabs from '../../components/Tabs';
import CloseIcon from '../../components/icons/CloseIcon';
import Colors from '../../consts/Colors';
import { GalleryScreenProps } from '../../navigation/types';

function GalleryScreen({ navigation }: GalleryScreenProps) {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [tagQuery, setTagQuery] = useState('');

  const handleFilterPress = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const handleTagQueryChange = (query: string) => {
    setTagQuery(query);
  };

  const tabItems = [
    {
      title: 'Galeria',
      component: (
        <GalleryContent
          navigation={navigation}
          tagQuery={tagQuery}
          onTagQueryChange={handleTagQueryChange}
          galleryType="public"
        />
      ),
      onAddPress: () => navigation.navigate('AddPhoto'),
    },
    {
      title: 'Moje zdjęcia',
      component: (
        <GalleryContent
          navigation={navigation}
          tagQuery={tagQuery}
          onTagQueryChange={handleTagQueryChange}
          galleryType="my_photos"
        />
      ),
      onAddPress: () => navigation.navigate('AddPhoto'),
    },
    {
      title: 'Galeria urządzeń',
      component: (
        <GalleryContent
          navigation={navigation}
          tagQuery={tagQuery}
          onTagQueryChange={handleTagQueryChange}
          galleryType="device_gallery"
        />
      ),
      onAddPress: () => navigation.navigate('AddPhoto'),
    },
  ];

  const filterContent = isFilterVisible ? (
    <View style={styles.filterContainer}>
      <View style={styles.filterInputContainer}>
        <TextInput
          value={tagQuery}
          onChangeText={handleTagQueryChange}
          placeholder="Filtruj po tagach"
          placeholderTextColor={Colors.lightGray}
          style={styles.filterInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {tagQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setTagQuery('')}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon color={Colors.gray} size={16} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <Tabs
        items={tabItems}
        isButtonsHeader
        title="Galeria"
        onBackPress={navigation.goBack}
        linearGradient={['#1345AE', '#2774ca']}
        fabBgColor={Colors.galleryFabButtonBackground}
        fabIconColor={Colors.black}
        isWithLinearGradient={false}
        headerDividerColor={Colors.galleryBlue}
        onFilterPress={handleFilterPress}
        headerContent={filterContent}
      />
    </SafeAreaView>
  );
}

export default GalleryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: 40,
  },
  filterContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 36,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    padding: 6,
    zIndex: 1,
  },
});
