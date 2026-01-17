import { StyleSheet, View } from 'react-native';
import { Button, Text, Divider } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';

import Circles from '../../components/Circles';
import { AuthParamList } from '../../navigation/types';
import Colors from '../../consts/Colors';

function DividerBlock() {
  return (
    <View style={styles.dividerContainer}>
      <Divider color={Colors.white} width={1} style={styles.divider} />
      <Text style={styles.dividerText}>lub</Text>
      <Divider color={Colors.white} width={1} style={styles.divider} />
    </View>
  );
}

function LoginOptionsScreen({ navigation }: StackScreenProps<AuthParamList>) {
  return (
    <LinearGradient
      colors={['#FFFD2E', '#35B84B']}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0.6 }}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <LinearGradient
          colors={['#FFFD2E', '#35B84B']}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0.4, y: 0.6 }}
        >
          <Circles size={390} color={Colors.brighterGreen} />
        </LinearGradient>
      </View>

      <View style={styles.container}>
        <Button
          title="Zaloguj się"
          buttonStyle={styles.loginBtn}
          titleStyle={styles.loginBtnTitle}
          onPress={() => navigation.navigate('Login')}
        />
        <DividerBlock />
        <Button
          title="Zarejestruj się"
          type="outline"
          buttonStyle={styles.registerBtn}
          titleStyle={styles.registerBtnTitle}
          onPress={() => navigation.navigate('Registration')}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerContainer: {
    position: 'absolute',
    transform: [{ rotate: '235deg' }],
    top: -80,
    left: -80,
  },
  loginBtn: {
    width: 316,
    height: 57,
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 16,
  },
  loginBtnTitle: {
    color: Colors.darkerGreen,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  registerBtn: {
    width: 316,
    height: 57,
    borderColor: Colors.white,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 16,
  },
  registerBtnTitle: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },

  dividerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 316,
  },
  dividerText: {
    color: Colors.white,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  divider: {
    width: 124,
  },
});

export default LoginOptionsScreen;
