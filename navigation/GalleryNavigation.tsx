import { createStackNavigator } from '@react-navigation/stack';

import { SubNavigationStyles } from '../consts/Styles';
import AddPhotoForm from '../screens/Gallery/AddPhotoForm';
import EditScreen from '../screens/Gallery/EditScreen';
import GalleryScreen from '../screens/Gallery/GalleryScreen';
import { GalleryParamList } from './types';

const Gallery = createStackNavigator<GalleryParamList>();

function GalleryNavigation() {
  return (
    <Gallery.Navigator
      initialRouteName="Gallery"
      screenOptions={SubNavigationStyles}
    >
      <Gallery.Screen name="Gallery" component={GalleryScreen} />
      <Gallery.Screen name="Edit" component={EditScreen} />
      <Gallery.Screen name="AddPhoto" component={AddPhotoForm} />
    </Gallery.Navigator>
  );
}

export default GalleryNavigation;
