import { useNavigation } from '@react-navigation/native';
import { Button, Text } from '@rneui/themed';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { ButtonGroup } from '../../components/Button';
import Colors from '../../consts/Colors';
import { getImageUrl } from '../../helpers/image';
import { GalleryEditScreenProps } from '../../navigation/types';

function GeneralTab({ uri }: { uri: string }) {
  const { navigate } = useNavigation<GalleryEditScreenProps['navigation']>();

  const handleCancel = () => {
    navigate('Gallery');
  };

  const handleSave = () => {
    // @ToDo

    Alert.alert('Zapisano');
  };

  const handleRemove = () => {
    // @ToDo

    Alert.alert('Usunięto');
  };

  const handleRemoveFromGallery = () => {
    // @ToDo

    Alert.alert('Usunięto do galerii');
  };

  const handleAddToGallery = () => {
    // @ToDo

    Alert.alert('Dodano do galerii');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>Nazwa zdjęcia</Text>
        <Text style={styles.author}>Autor</Text>
      </View>

      <View style={styles.photoContainer}>
        <Image
          source={{ uri: getImageUrl(uri) || undefined }}
          style={styles.photo}
        />
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title="Usuń zdjęcie" // Usuń zdjęcie z bazy
          onPress={handleRemove}
          type="clear"
          icon={{ type: 'antdesign', name: 'delete' }}
          titleStyle={styles.actionTitle}
          iconContainerStyle={styles.actionIconContainer}
        />
        {/* <Button
          title="Usuń zdjęcie z galerii"
          onPress={handleRemoveFromGallery}
          type="clear"
          icon={{ type: 'antdesign', name: 'camerao' }}
          titleStyle={styles.actionTitle}
          iconContainerStyle={styles.actionIconContainer}
        /> */}
        {/* <Button
          title="Dodaj zdjęcie do galerii"
          onPress={handleAddToGallery}
          type="clear"
          icon={{ type: 'antdesign', name: 'pluscircleo' }}
          titleStyle={styles.actionTitle}
          iconContainerStyle={styles.actionIconContainer}
        /> */}
      </View>

      <View style={styles.footer}>
        <ButtonGroup
          cancelTitle="Anuluj"
          submitTitle="Akceptuj"
          submitStyle={styles.submitButton}
          onCancel={handleCancel}
          onSubmitPress={handleSave}
        />
      </View>
    </View>
  );
}

export default GeneralTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    flex: 0,
  },
  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  author: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  photoContainer: {
    flex: 1,
    marginVertical: 16,
    alignItems: 'center',
  },
  photo: {
    flex: 3,
    width: '100%',
    minHeight: 100,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  actionsContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  actionTitle: {
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    marginVertical: 5,
  },
  actionIconContainer: {
    marginLeft: 0,
    marginRight: 10,
  },
  footer: {
    flexDirection: 'row',
  },
  submitButton: {
    height: 34,
    padding: 0,
    backgroundColor: Colors.buttons.blue,
  },
});
