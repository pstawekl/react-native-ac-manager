import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function UserIcon({
  color = '#fff',
  size = 24,
  viewBox = '0 0 90 80',
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
        d="M46.5 40.5c-10.7 0-19.375-8.674-19.375-19.375 0-10.7 8.675-19.375 19.375-19.375s19.375 8.675 19.375 19.375S57.2 40.5 46.5 40.5z"
        stroke={color} // Ustawienie koloru z propsa
        strokeWidth={stroke} // Ujednolicenie grubości obramowania
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M79.786 79.25c0-14.996-14.919-27.125-33.286-27.125-18.368 0-33.287 12.129-33.287 27.125"
        stroke={color} // Ustawienie koloru z propsa
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default UserIcon;
