import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function FolderOpenIcon({
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
        d="M84.535 67.983c-.575 5.865-1.035 10.35-11.423 10.35H24.888c-10.388 0-10.848-4.485-11.423-10.35l-1.533-19.166a11.619 11.619 0 012.491-8.395l.077-.077a11.403 11.403 0 018.855-4.178h51.29c3.565 0 6.708 1.61 8.778 4.101.039.039.077.077.077.115 1.878 2.262 2.913 5.214 2.568 8.434l-1.533 19.166z"
        stroke={color}
        strokeWidth={stroke}
      />
      <Path
        d="M16.417 37.815V18.073c0-13.033 3.258-16.291 16.291-16.291h4.869c4.868 0 5.98 1.456 7.82 3.91l4.868 6.516c1.227 1.61 1.955 2.607 5.213 2.607h9.775c13.034 0 16.292 3.258 16.292 16.292v6.861M39.148 59.167h19.703"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        opacity={0.01}
        clipRule="evenodd"
        d="M3 86V-6h92v92H3z"
        stroke={color}
        strokeWidth={stroke}
      />
    </Svg>
  );
}

export default FolderOpenIcon;
