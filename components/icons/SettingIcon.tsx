import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function SettingIcon({
  color = '#A6A6A6',
  size = 24,
  viewBox = '0 0 24 24',
  stroke = 1.5,
}: {
  color: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M3 14.88C3 17 3 17 5 18.35l5.5 3.18c.83.48 2.18.48 3 0l5.5-3.18c2-1.35 2-1.35 2-3.46V9.11C21 7 21 7 19 5.65l-5.5-3.18c-.82-.48-2.17-.48-3 0L5 5.65C3 7 3 7 3 9.11v5.77z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        clipRule="evenodd"
        d="M12 15a3 3 0 110-6 3 3 0 010 6z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default SettingIcon;
