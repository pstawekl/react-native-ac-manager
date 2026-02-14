import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function StarIcon({
  color,
  size = 24,
  filled = false,
}: {
  color: ColorValue;
  size?: number;
  filled?: boolean;
}) {
  const strokeWidth = 1.5;
  const starPath =
    'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d={starPath} fill={color} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={starPath}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default StarIcon;
