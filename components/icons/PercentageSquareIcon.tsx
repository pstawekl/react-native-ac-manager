import { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

function PercentageSquareIcon({
  color,
  size = 24,
  viewbox = '0 0 24 24',
  stroke = 1.5,
}: {
  color: ColorValue;
  size?: number;
  viewbox?: string;
  stroke?: number;
}) {
  const baseSize = 24;
  const baseRadius = 10.25;
  const scaledRadius = (size / baseSize) * baseRadius;
  const centerPoint = size / 2;

  return (
    <Svg width={size} height={size} viewBox={viewbox} fill="none">
      <Path
        d="M8.57 15.27l6.54-6.54"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        clipRule="evenodd"
        d="M8.98 10.37a1.23 1.23 0 110-2.46 1.23 1.23 0 010 2.46zM15.52 16.09a1.23 1.23 0 110-2.46 1.23 1.23 0 010 2.46z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={centerPoint}
        cy={centerPoint}
        r={scaledRadius}
        stroke={color}
        strokeWidth={stroke}
      />
    </Svg>
  );
}

export default PercentageSquareIcon;
