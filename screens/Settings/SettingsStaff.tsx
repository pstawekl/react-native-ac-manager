import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import Tabs from '../../components/Tabs';
import { SettingsStaffScreenProps } from '../../navigation/types';
import SettingsEmployees from './SettingsEmployees';
import SettingsTeams from './SettingsTeams';

function SettingsStaff() {
  const navigation = useNavigation<SettingsStaffScreenProps['navigation']>();
  const items = [
    { title: 'Ekipy', component: <SettingsTeams /> },
    { title: 'Pracownicy', component: <SettingsEmployees /> },
  ];

  return (
    <View style={styles.container}>
      <Tabs
        items={items}
        onBackPress={() => navigation.goBack()}
        isButtonsHeader
        isWithLinearGradient={false}
        title="Ekipy i pracownicy"
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

export default SettingsStaff;
