import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native';

function PercentIcon({
  color,
  size = 24,
}: {
  color: ColorValue;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M17.4167 4.58325L4.58337 17.4166"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.95829 8.25008C7.22395 8.25008 8.24996 7.22407 8.24996 5.95841C8.24996 4.69276 7.22395 3.66675 5.95829 3.66675C4.69264 3.66675 3.66663 4.69276 3.66663 5.95841C3.66663 7.22407 4.69264 8.25008 5.95829 8.25008Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.0417 18.3333C17.3073 18.3333 18.3333 17.3073 18.3333 16.0417C18.3333 14.776 17.3073 13.75 16.0417 13.75C14.776 13.75 13.75 14.776 13.75 16.0417C13.75 17.3073 14.776 18.3333 16.0417 18.3333Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default PercentIcon;
