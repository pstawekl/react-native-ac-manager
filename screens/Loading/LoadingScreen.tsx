import { ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';

function LoadingScreen() {
  return (
    <ImageBackground
      source={require('../../assets/loading.png')}
      style={styles.container}
    >
      <ActivityIndicator size="large" color="#000" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default LoadingScreen;
