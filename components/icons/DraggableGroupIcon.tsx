import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function DraggableGroupIcon({
  color = '#C7C7C7',
  width = 11,
  height = 20,
  viewBox = '0 0 11 20',
}: {
  color?: ColorValue;
  width?: number;
  height?: number;
  viewBox?: string;
}) {
  return (
    <Svg width={width} height={height} viewBox={viewBox} fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.963 12.194a1.538 1.538 0 110-3.075 1.538 1.538 0 010 3.075zM2.038 12.194a1.538 1.538 0 110-3.075 1.538 1.538 0 010 3.075zM8.963 19.881a1.538 1.538 0 110-3.075 1.538 1.538 0 010 3.075zM2.038 19.881a1.538 1.538 0 110-3.075 1.538 1.538 0 010 3.075zM8.963 3.825a1.537 1.537 0 110-3.075 1.537 1.537 0 010 3.075zM2.038 3.825a1.538 1.538 0 110-3.075 1.538 1.538 0 010 3.075z"
        fill={color}
      />
    </Svg>
  );
}

export default DraggableGroupIcon;
