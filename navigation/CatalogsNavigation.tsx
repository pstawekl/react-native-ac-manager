import { createStackNavigator } from '@react-navigation/stack';

import { Route, useRoute } from '@react-navigation/native';
import { SubNavigationStyles } from '../consts/Styles';
import AddCatalogForm from '../screens/Catalogs/AddCatalogForm';
import AddFlyerForm from '../screens/Catalogs/AddFlyerForm';
import AddPriceListForm from '../screens/Catalogs/AddPriceListForm';
import CatalogsScreen from '../screens/Catalogs/CatalogsScreen';
import EditCatalogForm from '../screens/Catalogs/EditCatalogForm';
import EditFlyerForm from '../screens/Catalogs/EditFlyerForm';
import EditPriceListForm from '../screens/Catalogs/EditPriceListForm';
import { CatalogsParamList } from './types';

function CatalogsNavigation() {
  const Catalog = createStackNavigator<CatalogsParamList>();
  const route = useRoute<Route<string, { Menu?: { tab?: string } }>>();

  const initialTab = route.params?.Menu?.tab;

  return (
    <Catalog.Navigator
      initialRouteName="Menu"
      screenOptions={SubNavigationStyles}
    >
      <Catalog.Screen
        name="Menu"
        component={CatalogsScreen}
        initialParams={{ tab: initialTab }}
      />
      <Catalog.Screen name="AddCatalog" component={AddCatalogForm} />
      <Catalog.Screen name="AddPriceList" component={AddPriceListForm} />
      <Catalog.Screen name="AddFlyer" component={AddFlyerForm} />
      <Catalog.Screen name="EditCatalog" component={EditCatalogForm} />
      <Catalog.Screen name="EditPriceList" component={EditPriceListForm} />
      <Catalog.Screen name="EditFlyer" component={EditFlyerForm} />
    </Catalog.Navigator>
  );
}

export default CatalogsNavigation;
