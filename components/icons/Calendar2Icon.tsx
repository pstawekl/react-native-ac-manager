import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function Calendar2Icon({
  color = '#fff',
  size = 24,
}: {
  color?: ColorValue;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 90 80" fill="none">
      <Path
        d="M31 .75v11.625M62 .75v11.625M13.563 28.224h65.874M81.375 58.875C81.375 70.5 75.562 78.25 62 78.25H31c-13.563 0-19.375-7.75-19.375-19.375V25.937c0-11.625 5.813-19.375 19.375-19.375h31c13.563 0 19.375 7.75 19.375 19.375v32.938zM60.817 46.087h.035M60.817 57.712h.035M46.483 46.087h.034M46.483 57.712h.034M32.14 46.087h.035M32.14 57.712h.035"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default Calendar2Icon;
