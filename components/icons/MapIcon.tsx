import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function MapIcon({
  color = '#fff',
  size = 24,
  viewBox = '0 0 100 80',
  stroke = 4,
}: {
  color?: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M9.732 63.417c0 8.075 5.738 11.39 12.708 7.395l9.987-5.695c2.168-1.232 5.78-1.36 8.033-.212l22.312 11.177c2.253 1.105 5.865 1.02 8.033-.212l18.402-10.54c2.338-1.36 4.293-4.675 4.293-7.395V16.582c0-8.075-5.738-11.39-12.708-7.395l-9.987 5.695c-2.168 1.233-5.78 1.36-8.033.213L40.46 3.96c-2.253-1.105-5.865-1.02-8.033.212l-18.402 10.54c-2.38 1.36-4.293 4.675-4.293 7.353v41.352zM36.38 6v55.25M66.852 17.136V74"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default MapIcon;
