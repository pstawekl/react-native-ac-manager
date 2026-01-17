import { StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Button, Text } from '@rneui/themed';
import { LinkButton, SubmitButton } from '../../components/Button';
import { FormInput } from '../../components/Input';
import useAuth from '../../providers/AuthProvider';
import { LoginScreenNavigationProp } from '../../navigation/types';
import Colors from '../../consts/Colors';
import Container from '../../components/Container';

type LoginData = {
  email: string;
  password: string;
};

function LoginScreen({ navigation }: LoginScreenNavigationProp) {
  const { login, error, loading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  function onSubmit(data: LoginData) {
    login(data.email, data.password);
  }

  return (
    <Container style={styles.container}>
      <View style={styles.inputContainer}>
        <FormInput
          name="email"
          required
          error={errors.email}
          control={control}
          label="E-mail"
          keyboardType="email-address"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />

        <FormInput
          name="password"
          control={control}
          label="Hasło"
          keyboardType="default"
          secureTextEntry
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.forgotContainer}>
        <Button
          title="Zapomniałeś hasła?"
          type="clear"
          titleStyle={styles.forgotButton}
        />
      </View>

      <View style={styles.buttonContainer}>
        <SubmitButton
          title="Zaloguj się"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
        />
      </View>

      <LinkButton
        text="Nie masz konta?"
        title="Zarejestruj się"
        onPress={() => navigation.navigate('Registration')}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  errorText: {
    color: Colors.red,
    paddingHorizontal: 12,
    marginBottom: 0,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  forgotContainer: {
    marginBottom: 20,
  },
  forgotButton: {
    color: Colors.buttons.forgotBg,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

export default LoginScreen;
