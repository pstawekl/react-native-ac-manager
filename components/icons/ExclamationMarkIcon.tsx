import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

function ExclamationMarkIcon({ color }: { color: ColorValue }) {
  return (
    <Svg width="19" height="16" viewBox="0 0 19 16" fill="none">
      <Path
        d="M9.5 14.6667C13.6421 14.6667 17 11.6819 17 8.00004C17 4.31814 13.6421 1.33337 9.5 1.33337C5.35786 1.33337 2 4.31814 2 8.00004C2 11.6819 5.35786 14.6667 9.5 14.6667Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 4.33337V8.7"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 10.6666V11.7"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default ExclamationMarkIcon;
