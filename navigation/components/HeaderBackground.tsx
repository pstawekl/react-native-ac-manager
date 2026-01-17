import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Circles from '../../components/Circles';

type HeaderBackgroundProps = {
  gradient?: string[];
  circleColor: string;
};

function HeaderBackground({ gradient, circleColor }: HeaderBackgroundProps) {
  return (
    <Animated.View style={styles.headerBackground}>
      <View style={styles.circles}>
        <Circles color={circleColor} viewBox="2 8 441 441" size={441} />
      </View>

      {gradient && (
        <LinearGradient
          colors={gradient}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1.2, y: 0.6 }}
          style={styles.gradient}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    position: 'absolute',
    top: 0,
    flex: 1,
    width: '100%',
    elevation: -1,
    height: '100%',
    overflow: 'visible',
  },
  gradient: {
    flex: 1,
    zIndex: -2,
    elevation: -2,
    height: 300,
  },
  circles: {
    position: 'absolute',
    top: 0, // Przesuwa w górę, dostosuj w razie potrzeby
    left: -3, // Przesuwa w lewo, dostosuj w razie potrzeby
    width: '100%', // Ustal szerokość SVG
    height: 250, // Ustal wysokość SVG
    zIndex: -1,
    elevation: -1,
    overflow: 'visible', // Upewnij się, że elementy nie są przycinane
  },
});

export default HeaderBackground;
