import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function HomeIcon({
  color,
  size = 24,
  viewBox = '0 0 20 20',
  stroke = 2,
}: {
  color: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M3.025 5.867c-.75.583-1.358 1.825-1.358 2.766v6.175a3.521 3.521 0 003.508 3.517h9.65a3.52 3.52 0 003.508-3.508V8.75c0-1.008-.675-2.3-1.5-2.875l-5.15-3.608c-1.166-.817-3.041-.775-4.166.1l-4.492 3.5zM10 14.992v-2.5"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default HomeIcon;
