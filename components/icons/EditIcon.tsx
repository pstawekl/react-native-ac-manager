import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function EditIcon({
  color = '#fff',
  size = 24,
  viewBox = '0 0 24 24',
  stroke = 1.5,
  style,
}: {
  color?: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg style={style} width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
        d="M11 2H9C4 2 2 4 2 9v6c0 5 2 7 7 7h6c5 0 7-2 7-7v-2"
      />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
        d="M8.16 10.901c-.3.3-.6.89-.66 1.32l-.43 3.01c-.16 1.09.61 1.85 1.7 1.7l3.01-.43c.42-.06 1.01-.36 1.32-.66l7.88-7.88c1.36-1.36 2-2.94 0-4.94-2-2-3.58-1.36-4.94 0l-7.88 7.88Z"
      />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={stroke}
        d="M14.91 4.148a7.144 7.144 0 0 0 4.94 4.94"
      />
    </Svg>
  );
}

export default EditIcon;
