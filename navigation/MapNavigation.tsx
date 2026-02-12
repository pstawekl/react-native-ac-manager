import { createStackNavigator } from '@react-navigation/stack';

import ClientsListScreen from '../screens/Map/ClientsListScreen';
import MapScreen from '../screens/Map/MapScreen';

import { SubNavigationStyles } from '../consts/Styles';
import { MapParamList } from './types';

function MapNavigation() {
  const Map = createStackNavigator<MapParamList>();

  return (
    <Map.Navigator initialRouteName="Main" screenOptions={SubNavigationStyles}>
      <Map.Screen name="Main" component={MapScreen} />
      <Map.Screen name="ClientsList" component={ClientsListScreen} />
    </Map.Navigator>
  );
}

export default MapNavigation;
