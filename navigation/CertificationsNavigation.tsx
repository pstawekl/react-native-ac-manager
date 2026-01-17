import { createStackNavigator } from '@react-navigation/stack';
import { CertificatesParamList } from './types';
import Styles, { SubNavigationStyles } from '../consts/Styles';
import AddCertificate from '../screens/Certs/AddCertificate';
import CertificatesScreen from '../screens/Certs/CertificatesScreen';
import AddTraining from '../screens/Certs/AddTraining';

const Certifications = createStackNavigator<CertificatesParamList>();

function CertificationsNavigation() {
  return (
    <Certifications.Navigator
      initialRouteName="CertificatesList"
      screenOptions={SubNavigationStyles}
    >
      <Certifications.Screen
        name="CertificatesList"
        component={CertificatesScreen}
      />
      <Certifications.Screen name="AddCertificate" component={AddCertificate} />
      <Certifications.Screen name="AddTraining" component={AddTraining} />
    </Certifications.Navigator>
  );
}

export default CertificationsNavigation;
