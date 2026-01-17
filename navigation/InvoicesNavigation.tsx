import { createStackNavigator } from '@react-navigation/stack';

import { SubNavigationStyles } from '../consts/Styles';
import InvoiceDetails from '../screens/Invoices/InvoiceDetails';
import InvoiceForm from '../screens/Invoices/InvoiceForm';
import InvoicesList from '../screens/Invoices/InvoicesList';
import { InvoicesParamList } from './types';

const Invoice = createStackNavigator<InvoicesParamList>();

function InvoicesNavigation() {
  return (
    <Invoice.Navigator
      initialRouteName="List"
      screenOptions={SubNavigationStyles}
    >
      <Invoice.Screen name="List" component={InvoicesList} />
      <Invoice.Screen name="Details" component={InvoiceDetails} />
      <Invoice.Screen name="Form" component={InvoiceForm} />
    </Invoice.Navigator>
  );
}

export default InvoicesNavigation;
