import { StyleSheet, View } from 'react-native';
import Tabs from '../../components/Tabs';
import Certificates from './Certificates';
import Trainings from './Trainings';

function CertificatesScreen() {
  const items = [
    { title: 'Certyfikaty', component: <Certificates /> },
    { title: 'Szkolenia', component: <Trainings /> },
  ];

  return (
    <View style={styles.container}>
      <Tabs
        items={items}
        //  linearGradient={['#cf0078', '#db489a']}
        isWithLinearGradient={false}
        // isButtonsHeader={false}
        title="Certyfikaty"
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

export default CertificatesScreen;
