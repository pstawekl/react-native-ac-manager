import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function ArchiveTickIcon({
  color = '#fff',
  size = 24,
  viewBox = '0 0 91 91',
  stroke = 5,
}: {
  color?: ColorValue;
  size?: number;
  viewBox?: string;
  stroke?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <Path
        d="M27.224 7.583c-8.076 0-14.636 6.598-14.636 14.636v53.425c0 6.825 4.891 9.706 10.882 6.408l18.504-10.276c1.971-1.1 5.156-1.1 7.09 0l18.503 10.276c5.991 3.336 10.882.455 10.882-6.408V22.219c-.037-8.038-6.597-14.636-14.673-14.636H27.224z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M36.362 41.708l5.687 5.688 15.167-15.167"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default ArchiveTickIcon;
