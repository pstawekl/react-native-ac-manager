import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function LogoutIcon({
  color,
  size = 24,
}: {
  color: ColorValue;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5.467 12.183L3.333 10.05l2.134-2.133M11.867 10.05H3.392M10.2 16.667c3.683 0 6.667-2.5 6.667-6.667S13.883 3.333 10.2 3.333"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default LogoutIcon;
