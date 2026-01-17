import { StackNavigationOptions } from '@react-navigation/stack';
import { Platform } from 'react-native';
import Colors from './Colors';

const BOTTOM_MARGIN = 20;
const HEADER_BASE_HEIGHT = 60;
const RADIUS = Platform.OS === 'ios' ? 16 : 0;

export default {
  headerBaseHeight: HEADER_BASE_HEIGHT,
  headerHeight: HEADER_BASE_HEIGHT + BOTTOM_MARGIN,
  headerBottomMargin: BOTTOM_MARGIN,

  headerTitleStyle: {
    color: Colors.white,
    fontFamily: 'Archivo_400Regular',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    marginBottom: BOTTOM_MARGIN,
  },
  headerTintColor: Colors.white,
  headerLeftContainerStyle: {
    marginBottom: BOTTOM_MARGIN,
  },
  headerRightContainerStyle: {
    marginBottom: BOTTOM_MARGIN,
    paddingRight: BOTTOM_MARGIN,
  },
  headerWhiteTitleStyle: {
    color: Colors.black,
    fontFamily: 'Archivo_700Bold',
    fontSize: 18,
  },

  contentRadius: RADIUS,
  headerWithSubNavigationHeight: HEADER_BASE_HEIGHT + BOTTOM_MARGIN,
};

export const SubNavigationStyles: StackNavigationOptions = {
  headerShown: false,
  cardStyle: {
    marginTop: Platform.OS === 'ios' ? -BOTTOM_MARGIN : 0,

    backgroundColor: '#FFF',
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    overflow: 'visible',
  },
  headerMode: 'screen',
  headerShadowVisible: false,
  animationEnabled: false,
  headerLeftLabelVisible: false,
};
