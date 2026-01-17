import { ColorValue } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

function CheckmarkIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width="35" height="35" viewBox="0 0 35 35" fill="none">
      <Circle cx="17.4" cy="17.4" r="17.4" fill={color} />
      <Path
        d="M22.4 13.7999L14.7 21.4999L11.2 17.9999"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default CheckmarkIcon;
