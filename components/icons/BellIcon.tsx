import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BellIconProps {
  color?: string;
  size?: number;
  viewBox?: string;
  stroke?: number;
}

function BellIcon({
  color = '#000',
  size = 24,
  viewBox = '0 0 24 24',
  stroke = 1,
}: BellIconProps) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M12 2C10.9 2 10 2.9 10 4V4.29C7.03 5.17 5 7.9 5 11V17L3 19V20H21V19L19 17V11C19 7.9 16.97 5.17 14 4.29V4C14 2.9 13.1 2 12 2ZM12 6C14.76 6 17 8.24 17 11V18H7V11C7 8.24 9.24 6 12 6ZM10 21C10 22.1 10.9 23 12 23C13.1 23 14 22.1 14 21H10Z"
        fill={color}
        stroke={color}
        strokeWidth={stroke * 0.1}
      />
    </Svg>
  );
}

export default BellIcon;

