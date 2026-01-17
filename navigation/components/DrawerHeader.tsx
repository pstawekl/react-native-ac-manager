import { Avatar, Text } from '@rneui/themed';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Circles from '../../components/Circles';
import Colors from '../../consts/Colors';
import useAuth from '../../providers/AuthProvider';

function DrawerHeader() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  if (!user) {
    return null;
  }

  return (
    <View
      style={
        (styles.linearGradient,
        {
          paddingTop: insets.top,
        })
      }
    >
      <Animated.View style={styles.header}>
        <View style={styles.circles}>
          <Circles color={Colors.white} viewBox="0 0 686 686" size={900} />
        </View>
        <View style={styles.container}>
          <View style={styles.avatar}>
            <Avatar
              size={56}
              rounded
              source={user.avatar ? { uri: user.avatar } : {}}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: -1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    heihgt: '100%',
    paddingHorizontal: 24,
  },
  header: {
    width: '100%',
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    flex: 0,
    height: 50,
    width: 50,
    backgroundColor: Colors.white,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: Colors.white,
  },
  email: {
    color: Colors.white,
  },
  circles: {
    position: 'absolute',
    top: 0, // Przesuwa w górę, dostosuj w razie potrzeby
    left: 0, // Przesuwa w lewo, dostosuj w razie potrzeby
    width: '100%', // Ustal szerokość SVG
    height: '100%', // Ustal wysokość SVG
    zIndex: -1,
    elevation: -1,
    overflow: 'visible', // Upewnij się, że elementy nie są przycinane
    opacity: 0.45,
  },
});

export default DrawerHeader;
