import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function Book2Icon({
  color = '#fff',
  size = 24,
  viewBox = '0 0 100 80',
  stroke = 5,
}: {
  color?: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M96.5 8.847c0-5.1-4.165-8.882-9.222-8.457h-.256c-8.925.765-22.482 5.312-30.047 10.072l-.723.468c-1.232.765-3.272.765-4.505 0l-1.062-.638C43.12 5.575 29.605 1.07 20.68.347c-5.057-.425-9.18 3.4-9.18 8.458v51.34c0 4.08 3.315 7.905 7.395 8.415l1.233.17c9.222 1.232 23.46 5.907 31.62 10.37l.17.085c1.147.637 2.974.637 4.08 0 8.16-4.505 22.44-9.223 31.705-10.455l1.402-.17c4.08-.51 7.395-4.335 7.395-8.415V8.847zM54 12.332v63.75M35.938 25.082h-9.563M39.125 37.833h-12.75"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        opacity={0.01}
        clipRule="evenodd"
        d="M3 91V-11h102V91H3z"
        stroke={color}
        strokeWidth={stroke}
      />
    </Svg>
  );
}

export default Book2Icon;
