import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import Tabs from '../../components/Tabs';
import { SettingsDiscountsScreenProps } from '../../navigation/types';
import SettingsDiscountList from './SettingsDiscountList';
import SettingsSurcharge from './SettingsSurcharge';

function SettingsDiscounts() {
  const navigation =
    useNavigation<SettingsDiscountsScreenProps['navigation']>();
  const items = [
    { title: 'Narzut', component: <SettingsSurcharge /> },
    { title: 'Rabat', component: <SettingsDiscountList /> },
  ];

  return (
    <View style={styles.container}>
      <Tabs
        items={items}
        isButtonsHeader
        isWithLinearGradient={false}
        onBackPress={() => navigation.goBack()}
        title="Narzuty i rabaty"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
});

export default SettingsDiscounts;
