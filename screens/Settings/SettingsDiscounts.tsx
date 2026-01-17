import Tabs from '../../components/Tabs';
import SettingsDiscountList from './SettingsDiscountList';
import SettingsSurcharge from './SettingsSurcharge';

function SettingsDiscounts() {
  const items = [
    { title: 'Narzut', component: <SettingsSurcharge /> },
    { title: 'Rabat', component: <SettingsDiscountList /> },
  ];

  return (
    <Tabs
      items={items}
      isButtonsHeader={false}
      linearGradient={['#36B130', '#6EDE2F']}
    />
  );
}

export default SettingsDiscounts;
