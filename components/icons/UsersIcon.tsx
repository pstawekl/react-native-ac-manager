import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function UsersIcon({ color, size = 24 }: { color: ColorValue; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M15.5833 19.25V17.4167C15.5833 16.4442 15.197 15.5116 14.5094 14.8239C13.8217 14.1363 12.8891 13.75 11.9166 13.75H4.58329C3.61083 13.75 2.6782 14.1363 1.99057 14.8239C1.30293 15.5116 0.916626 16.4442 0.916626 17.4167V19.25"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.25004 10.0833C10.2751 10.0833 11.9167 8.44171 11.9167 6.41667C11.9167 4.39162 10.2751 2.75 8.25004 2.75C6.225 2.75 4.58337 4.39162 4.58337 6.41667C4.58337 8.44171 6.225 10.0833 8.25004 10.0833Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21.0834 19.25V17.4166C21.0828 16.6042 20.8124 15.815 20.3146 15.1729C19.8169 14.5308 19.12 14.0722 18.3334 13.8691"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.6666 2.86914C15.4553 3.07108 16.1544 3.52978 16.6536 4.17293C17.1528 4.81607 17.4238 5.60707 17.4238 6.42122C17.4238 7.23538 17.1528 8.02638 16.6536 8.66952C16.1544 9.31266 15.4553 9.77136 14.6666 9.97331"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default UsersIcon;
