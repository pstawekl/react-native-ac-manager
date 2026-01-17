import { StyleSheet, View } from 'react-native';
import Colors from '../consts/Colors';

export default function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  separator: {
    height: 2,
    backgroundColor: Colors.separator,
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
