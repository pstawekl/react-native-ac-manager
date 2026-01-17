import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';
import Colors from '../../consts/Colors';

function SearchStatusIcon({
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
        d="M15 8.25C15 11.9775 11.9775 15 8.25 15C4.5225 15 1.5 11.9775 1.5 8.25C1.5 4.5225 4.5225 1.5 8.25 1.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.1998 15.7874C16.8373 14.8274 16.4173 14.0399 15.2623 14.0399C14.4073 14.0324 13.9273 14.6999 14.1973 15.5174C14.5948 16.7174 15.5023 16.8374 16.1998 15.7874Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 3.75H15"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 6H12.75"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default SearchStatusIcon;
