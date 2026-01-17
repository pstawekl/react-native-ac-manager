import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MessageIconProps {
  color?: string;
  size?: number;
  viewBox?: string;
  stroke?: number;
}

function MessageIcon({
  color = '#000',
  size = 24,
  viewBox = '0 0 24 24',
  stroke = 1,
}: MessageIconProps) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      <Path
        d="M20 2H4C2.9 2 2.01 2.9 2.01 4L2 22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4.58 16.59L4 17.17V4H20V16ZM7 9H17V11H7V9ZM7 6H17V8H7V6ZM7 12H14V14H7V12Z"
        fill={color}
        stroke={color}
        strokeWidth={stroke * 0.1}
      />
    </Svg>
  );
}

export default MessageIcon;
