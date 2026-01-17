import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function HamburgerIcon({
  color = '#fff',
  size = 24,
  viewBox = '0 0 24 24',
  stroke = 2,
}: {
  color?: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <Path
        d="M3 12h18M3 6h18M3 18h18"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default HamburgerIcon;
