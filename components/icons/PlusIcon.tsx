import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';
import Colors from '../../consts/Colors';

function PlusIcon({
  color = Colors.black,
  size = 24,
}: {
  color: ColorValue;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10ZM12 8v8M8 12h8"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default PlusIcon;
