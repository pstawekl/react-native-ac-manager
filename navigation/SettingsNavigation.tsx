import { createStackNavigator } from '@react-navigation/stack';

import { SubNavigationStyles } from '../consts/Styles';
import AddEmployeeForm from '../screens/Settings/AddEmployeeForm';
import AddTeamForm from '../screens/Settings/AddTeamForm';
import SettingsData from '../screens/Settings/SettingsData';
import SettingsDiscounts from '../screens/Settings/SettingsDiscounts';
import SettingsInvoices from '../screens/Settings/SettingsInvoices';
import SettingsMenu from '../screens/Settings/SettingsMenu';
import SettingsOffers from '../screens/Settings/SettingsOffers';
import SettingsStaff from '../screens/Settings/SettingsStaff';
import SettingsTexts from '../screens/Settings/SettingsTexts';
import { SettingsParamList } from './types';

const Settings = createStackNavigator<SettingsParamList>();

function SettingsNavigation() {
  return (
    <Settings.Navigator
      initialRouteName="Menu"
      screenOptions={SubNavigationStyles}
    >
      <Settings.Screen name="Menu" component={SettingsMenu} />
      <Settings.Screen name="Data" component={SettingsData} />
      <Settings.Screen name="Staff" component={SettingsStaff} />
      <Settings.Screen name="AddTeam" component={AddTeamForm} />
      <Settings.Screen name="AddEmployee" component={AddEmployeeForm} />
      <Settings.Screen name="Offers" component={SettingsOffers} />
      <Settings.Screen name="Invoices" component={SettingsInvoices} />
      <Settings.Screen name="Discounts" component={SettingsDiscounts} />
      <Settings.Screen name="Texts" component={SettingsTexts} />
    </Settings.Navigator>
  );
}

export default SettingsNavigation;
