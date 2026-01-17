import { createStackNavigator } from '@react-navigation/stack';

import ClientForm from '../screens/Clients/ClientForm';
import ClientInspection from '../screens/Clients/ClientInspection';
import ClientInstallation from '../screens/Clients/ClientInstallation';
import ClientInvoiceData from '../screens/Clients/ClientInvoiceData';
import ClientService from '../screens/Clients/ClientService';
import ClientSettings from '../screens/Clients/ClientSettings';
import ClientsList from '../screens/Clients/ClientsList';
import ClientsMenu from '../screens/Clients/ClientsMenu';

import { SubNavigationStyles } from '../consts/Styles';
import ClientInstallationsList from '../screens/Clients/ClientInstallationsList';
import { ClientsParamList } from './types';

function ClientsNavigation() {
  const Clients = createStackNavigator<ClientsParamList>();

  return (
    <Clients.Navigator
      initialRouteName="List"
      screenOptions={SubNavigationStyles}
    >
      <Clients.Screen name="List" component={ClientsList} />
      <Clients.Screen name="Menu" component={ClientsMenu} />
      <Clients.Screen name="Inspection" component={ClientInspection} />
      <Clients.Screen name="Installation" component={ClientInstallation} />
      <Clients.Screen
        name="InstallationsList"
        component={ClientInstallationsList}
      />
      <Clients.Screen name="Service" component={ClientService} />
      <Clients.Screen name="InvoiceData" component={ClientInvoiceData} />
      <Clients.Screen name="Form" component={ClientForm} />
      <Clients.Screen name="Settings" component={ClientSettings} />
    </Clients.Navigator>
  );
}

export default ClientsNavigation;
