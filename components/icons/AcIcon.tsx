import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function AcIcon({
  color = '#fff',
  width = 24,
  height = 23,
  viewBox = '0 0 24 23',
  stroke = 1.5,
}: {
  color?: ColorValue;
  width?: number;
  height?: number;
  viewBox?: string;
  stroke?: number;
}) {
  return (
    <Svg width={width} height={height} viewBox={viewBox} fill="none">
      <Path
        d="M19.313 12.594v0a3.75 3.75 0 00-3.75-3.75H8.436a3.75 3.75 0 00-3.75 3.75v0m-.937-7.5h1.875m1.875 0h1.875m.75 10.312v6.188m3.75-6.188v6.188M3.562 18.78H4.5c1.036 0 1.875-.84 1.875-1.875v-1.5m11.25 0v1.5c0 1.036.84 1.875 1.875 1.875h.938m2.625-8.062V6.344a5 5 0 00-5-5H5.938a5 5 0 00-5 5v4.375c0 1.035.839 1.875 1.875 1.875h18.375c1.035 0 1.875-.84 1.875-1.875z"
        stroke={color}
        strokeWidth={stroke}
        strokeMiterlimit={10}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default AcIcon;
