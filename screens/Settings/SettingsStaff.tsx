import Tabs from '../../components/Tabs';
import SettingsEmployees from './SettingsEmployees';
import SettingsTeams from './SettingsTeams';

function SettingsStaff() {
  const items = [
    { title: 'Ekipy', component: <SettingsTeams /> },
    { title: 'Pracownicy', component: <SettingsEmployees /> },
  ];

  return <Tabs items={items} linearGradient={['#36B130', '#6EDE2F']} />;
}

export default SettingsStaff;
