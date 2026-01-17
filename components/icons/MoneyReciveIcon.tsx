import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';
import Colors from '../../consts/Colors';

function MoneyReciveIcon({
  color = Colors.black,
  size = 18,
  viewBox = '0 0 18 18',
}: {
  color?: ColorValue;
  size?: number;
  viewBox?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M7.125 10.3124C7.125 11.0399 7.68751 11.6249 8.37751 11.6249H9.78749C10.3875 11.6249 10.875 11.1149 10.875 10.4774C10.875 9.79493 10.575 9.54743 10.1325 9.38993L7.875 8.60243C7.4325 8.44493 7.13251 8.20493 7.13251 7.51493C7.13251 6.88493 7.61999 6.36743 8.21999 6.36743H9.63C10.32 6.36743 10.8825 6.95243 10.8825 7.67993"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 5.625V12.375"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 9C16.5 13.14 13.14 16.5 9 16.5C4.86 16.5 1.5 13.14 1.5 9C1.5 4.86 4.86 1.5 9 1.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.75 2.25V5.25H15.75"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 1.5L12.75 5.25"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default MoneyReciveIcon;
