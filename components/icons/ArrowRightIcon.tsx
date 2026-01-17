import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function ArrowRightIcon({
  color = '#fff',
  size = 24,
  viewBox = '0 0 22 18',
  stroke = 1.5,
  style,
}: {
  color?: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg style={style} width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M5.25005 2.37987L9.05339 6.18321C9.50255 6.63237 9.50255 7.36737 9.05339 7.81654L5.25005 11.6199"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default ArrowRightIcon;
