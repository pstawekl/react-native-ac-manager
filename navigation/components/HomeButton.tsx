import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import HomeIcon from '../../components/icons/HomeIcon';

function HomeButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.reset({
          index: 0,
          routes: [{ name: 'BottomTabs' }],
        })
      }
    >
      <HomeIcon color={Colors.white} />
    </TouchableOpacity>
  );
}

export default HomeButton;
