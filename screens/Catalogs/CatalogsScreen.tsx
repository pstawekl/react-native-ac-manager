import { Route, useRoute } from '@react-navigation/native';
import { Text } from '@rneui/themed';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Tabs from '../../components/Tabs';
import FilterIcon from '../../components/icons/FilterIcon';
import SearchIcon from '../../components/icons/SearchIcon';
import Colors from '../../consts/Colors';

import Catalogs from './Catalogs';
import Flyers from './Flyers';
import PriceList from './PriceList';

function CatalogsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const items = [
    {
      title: 'Katalogi',
      component: ({ isActive }: { isActive: boolean }) => (
        <Catalogs searchQuery={searchQuery} />
      ),
      id: 'catalogs',
    },
    {
      title: 'Cennik',
      component: ({ isActive }: { isActive: boolean }) => (
        <PriceList searchQuery={searchQuery} />
      ),
      id: 'prices',
    },
    {
      title: 'Ulotki',
      component: ({ isActive }: { isActive: boolean }) => (
        <Flyers searchQuery={searchQuery} />
      ),
      id: 'flyers',
    },
  ];

  const route = useRoute<Route<'Menu', { tab?: string }>>();
  const { tab } = route.params || {};

  return (
    <View style={styles.container}>
      <Tabs
        items={items}
        defaultTab={tab || 'catalogs'}
        title="Dokumentacja"
        isWithLinearGradient={false}
        headerContent={
          <View style={styles.headerContent}>
            {/* Nagłówek "Dokumenty" */}
            <Text style={styles.mainHeader}>Dokumenty</Text>

            {/* Pasek wyszukiwania i przycisk filtra */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Szukaj"
                  placeholderTextColor={Colors.lightGray}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <View style={styles.searchIconContainer}>
                  <SearchIcon color={Colors.black} size={18} />
                </View>
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  // Placeholder - na razie nic nie robi
                }}
                activeOpacity={0.7}
              >
                <FilterIcon color={Colors.black} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        }
        headerDividerColor={Colors.newPurple}
        fabBgColor={Colors.newPurple}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  headerContent: {
    backgroundColor: Colors.white,
  },
  mainHeader: {
    fontSize: 24,
    fontFamily: 'Archivo_600SemiBold',
    color: Colors.black,
    marginBottom: 20,
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.menuIconBackground,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
    padding: 0,
  },
  searchIconContainer: {
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CatalogsScreen;
