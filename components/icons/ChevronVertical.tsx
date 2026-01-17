import React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface ChevronProps {
  color: ColorValue;
  size?: number;
  isUp?: boolean;
}

function ChevronVertical({ color, size = 24, isUp = false }: ChevronProps) {
  // Kąt obrotu chevrona w stopniach
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={isUp ? 'M19 14L12 7L5 14' : 'M19 10L12 17L5 10'}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default ChevronVertical;
