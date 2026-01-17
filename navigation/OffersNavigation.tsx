import { createStackNavigator } from '@react-navigation/stack';
import { SubNavigationStyles } from '../consts/Styles';
import AddSurchargeForm from '../screens/Offers/AddSurchargeForm';
import AddToolForm from '../screens/Offers/AddToolForm';
import MontazProposals from '../screens/Offers/MontazProposals';
import OfferOverview from '../screens/Offers/OfferOverview';
import OffersList from '../screens/Offers/OffersList';
import OffersMenu from '../screens/Offers/OffersMenu';
import OfferTemplateForm from '../screens/Offers/OfferTemplateForm';
import OfferTemplatesList from '../screens/Offers/OfferTemplatesList';
import SelectMontazDate from '../screens/Offers/SelectMontazDate';
import { OffersParamList } from './types';

const Offer = createStackNavigator<OffersParamList>();

function OffersNavigation() {
  return (
    <Offer.Navigator
      initialRouteName="Menu"
      screenOptions={SubNavigationStyles}
    >
      <Offer.Screen name="Menu" component={OffersMenu} />
      <Offer.Screen name="List" component={OffersList} />
      <Offer.Screen name="AddToolForm" component={AddToolForm} />
      <Offer.Screen name="AddSurchargeForm" component={AddSurchargeForm} />
      <Offer.Screen name="Overview" component={OfferOverview} />
      <Offer.Screen name="OfferTemplatesList" component={OfferTemplatesList} />
      <Offer.Screen name="OfferTemplateForm" component={OfferTemplateForm} />
      <Offer.Screen name="SelectMontazDate" component={SelectMontazDate} />
      <Offer.Screen name="MontazProposals" component={MontazProposals} />
    </Offer.Navigator>
  );
}

export default OffersNavigation;
