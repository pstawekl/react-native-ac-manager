import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { StyleSheet, View } from 'react-native';
import Tabs from '../../components/Tabs';
import { GalleryParamList, MainParamList } from '../../navigation/types';
import GeneralTab from './GeneralTab';
import TagTab from './TagTab';

type EditScreenProps = CompositeScreenProps<
  StackScreenProps<GalleryParamList, 'Edit'>,
  DrawerScreenProps<MainParamList, 'GalleryStack'>
>;

function EditScreen({ route }: EditScreenProps) {
  const { uri } = route.params;

  const items = [
    { title: 'Ogólne', component: <GeneralTab uri={uri} /> },
    // { title: 'Przycinanie', component: <CropTab uri={uri} /> },
    { title: 'Tagi', component: <TagTab uri={uri} /> },
  ];

  return (
    <View style={styles.container}>
      <Tabs
        items={items}
        linearGradient={['#1345AE', '#2774ca']}
        title="Edycja"
      />
    </View>
  );
}

export default EditScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
});
