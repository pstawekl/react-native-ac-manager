import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginOptionsScreen from '../screens/Auth/LoginOptions';
import LoginScreen from '../screens/Auth/Login';
import RegistrationScreen from '../screens/Auth/Registration';
import useAuth from '../providers/AuthProvider';
import LoadingScreen from '../screens/Loading/LoadingScreen';
import { AuthParamList, LoginScreenNavigationProp } from './types';
import Colors from '../consts/Colors';
import Styles from '../consts/Styles';
import { IconButton } from '../components/Button';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';

const Auth = createStackNavigator<AuthParamList>();

function AuthNavigation() {
  const { loadingInitial } = useAuth();
  const insets = useSafeAreaInsets();

  const getOptions = (
    navigation: LoginScreenNavigationProp['navigation'],
    additionalProps: object,
  ) => ({
    headerShown: true,
    headerStyle: {
      height: Styles.headerHeight + insets.top,
    },
    headerTitleStyle: Styles.headerWhiteTitleStyle,
    headerTintColor: Colors.black,
    cardStyle: {
      backgroundColor: '#FFF',
    },
    headerShadowVisible: false,
    headerLeftLabelVisible: false,
    // eslint-disable-next-line react/no-unstable-nested-components
    headerLeft: () => (
      <IconButton
        withoutBackground
        onPress={navigation.goBack}
        icon={<ArrowLeftIcon color={Colors.black} />}
      />
    ),
    ...additionalProps,
  });

  return (
    <Auth.Navigator
      screenOptions={{
        headerLeftLabelVisible: false,
        headerTintColor: Colors.black,
      }}
    >
      {loadingInitial ? (
        <Auth.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Auth.Screen
            name="Home"
            component={LoginOptionsScreen}
            options={{ headerShown: false }}
          />
          <Auth.Screen
            name="Login"
            options={({ navigation }) =>
              getOptions(navigation, { headerTitle: 'Logowanie' })
            }
            component={LoginScreen}
          />
          <Auth.Screen
            name="Registration"
            options={({ navigation }) =>
              getOptions(navigation, { headerTitle: 'Rejestracja' })
            }
            component={RegistrationScreen}
          />
        </>
      )}
    </Auth.Navigator>
  );
}

export default AuthNavigation;
