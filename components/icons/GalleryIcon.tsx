import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function GalleryIcon({
  color = '#fff',
  size = 24,
}: {
  color?: ColorValue;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 90 80"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <Path
        d="M56.875 77.417c18.958 0 26.542-7.584 26.542-26.542v-22.75c0-18.958-7.584-26.542-26.542-26.542h-22.75c-18.958 0-26.542 7.584-26.542 26.542v22.75c0 18.958 7.584 26.542 26.542 26.542h22.75z"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        clipRule="evenodd"
        d="M34.125 31.917a7.583 7.583 0 110-15.167 7.583 7.583 0 010 15.167z"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.124 65.852l18.693-12.55c2.995-2.01 7.318-1.782 10.01.53l1.251 1.1c2.958 2.54 7.735 2.54 10.693 0l15.773-13.536c2.957-2.54 7.735-2.54 10.692 0l6.18 5.308"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default GalleryIcon;
