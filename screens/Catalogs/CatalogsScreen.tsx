import { Route, useRoute } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import Tabs from '../../components/Tabs';

import Catalogs from './Catalogs';
import Flyers from './Flyers';
import PriceList from './PriceList';

function CatalogsScreen() {
  const items = [
    { title: 'Katalogi', component: <Catalogs />, id: 'catalogs' },
    { title: 'Cennik', component: <PriceList />, id: 'prices' },
    { title: 'Ulotki', component: <Flyers />, id: 'flyers' },
  ];

  const route = useRoute<Route<'Menu', { tab?: string }>>();
  const { tab } = route.params || {};

  return (
    <View style={styles.container}>
      <Tabs
        items={items}
        defaultTab={tab || 'catalogs'}
        title="Katalogi"
        isWithLinearGradient={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
});

export default CatalogsScreen;
