import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function ReceiptIcon({
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
        d="M85.5 25.575c0 5.925-3.75 9.675-9.675 9.675H63V9.037C63 4.875 66.412 1.5 70.575 1.5c4.087.038 7.837 1.687 10.537 4.387 2.7 2.738 4.388 6.488 4.388 10.613v9.075z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 72.75c0 3.112 3.525 4.875 6 3l6.413-4.8c1.5-1.125 3.6-.975 4.95.375l6.224 6.263a3.78 3.78 0 005.325 0l6.3-6.3c1.313-1.313 3.413-1.463 4.875-.338L57 75.75c2.475 1.838 6 .075 6-3V9c0-4.125 3.375-7.5 7.5-7.5h-45c-11.25 0-15 6.713-15 15v56.25zM26.513 45.488l20.475-20.475"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        opacity={0.01}
        clipRule="evenodd"
        d="M93-6v90H3V-6h90z"
        stroke={color}
        strokeWidth={stroke}
      />
      <Path
        d="M47.718 44.625h.033M26.23 25.875h.034"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default ReceiptIcon;
