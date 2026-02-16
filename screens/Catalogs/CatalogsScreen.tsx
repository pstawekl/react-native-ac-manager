import { Route, useNavigation, useRoute } from '@react-navigation/native';
import { Text } from '@rneui/base';
import { StyleSheet, View } from 'react-native';
import Tabs from '../../components/Tabs';
import Colors from '../../consts/Colors';

import Catalogs from './Catalogs';
import Flyers from './Flyers';
import PriceList from './PriceList';

function CatalogsScreen() {
  const items = [
    {
      title: 'Katalogi',
      component: ({ isActive }: { isActive: boolean }) => <Catalogs />,
      id: 'catalogs',
    },
    {
      title: 'Cennik',
      component: ({ isActive }: { isActive: boolean }) => <PriceList />,
      id: 'prices',
    },
    {
      title: 'Ulotki',
      component: ({ isActive }: { isActive: boolean }) => <Flyers />,
      id: 'flyers',
    },
  ];

  const route = useRoute<Route<'Menu', { tab?: string }>>();
  const { tab } = route.params || {};
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Tabs
        items={items}
        defaultTab={tab || 'catalogs'}
        isWithLinearGradient={false}
        headerContent={
          <View style={styles.headerContent}>
            <Text style={styles.mainHeader}>Dokumenty</Text>
          </View>
        }
        onBackPress={() => {
          navigation.goBack();
        }}
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
  },
});

export default CatalogsScreen;
