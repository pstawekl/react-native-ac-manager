import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function TaskListIcon({
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
        d="M47.418 27.41h20.125M24.457 27.41l2.875 2.906 8.625-8.719M47.418 54.534h20.125M24.457 54.534l2.875 2.907 8.625-8.72"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M57.5 78.25c19.167 0 26.833-7.75 26.833-27.125v-23.25C84.333 8.5 76.667.75 57.5.75h-23C15.333.75 7.667 8.5 7.667 27.875v23.25C7.667 70.5 15.333 78.25 34.5 78.25h23z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default TaskListIcon;
