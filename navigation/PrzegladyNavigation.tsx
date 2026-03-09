import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, View } from 'react-native';
import ButtonsHeader from '../components/ButtonsHeader';
import { SubNavigationStyles } from '../consts/Styles';
import ReviewProtocolForm from '../screens/Clients/ReviewForm';
import PrzegladyMenu from '../screens/Przeglady/PrzegladyMenu';
import { PrzegladyParamList } from './types';

const Przeglad = createStackNavigator<PrzegladyParamList>();

function ReviewFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PrzegladyParamList, 'ReviewForm'>>();
  const { installationId, reviewId } = route.params;

  return (
    <View style={styles.formScreen}>
      <ButtonsHeader
        onBackPress={() => navigation.goBack()}
        title={reviewId ? 'Przegląd' : 'Nowy przegląd'}
      />
      <ReviewProtocolForm
        installationId={installationId}
        reviewId={reviewId ?? null}
        onSave={() => navigation.goBack()}
        onCancel={() => navigation.goBack()}
      />
    </View>
  );
}

function PrzegladyNavigation() {
  return (
    <Przeglad.Navigator
      initialRouteName="Menu"
      screenOptions={SubNavigationStyles}
    >
      <Przeglad.Screen name="Menu" component={PrzegladyMenu} />
      <Przeglad.Screen
        name="ReviewForm"
        component={ReviewFormScreen}
        options={{ headerShown: false }}
      />
    </Przeglad.Navigator>
  );
}

const styles = StyleSheet.create({
  formScreen: {
    flex: 1,
    paddingTop: 40,
  },
});

export default PrzegladyNavigation;
