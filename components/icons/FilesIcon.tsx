import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Colors from '../../consts/Colors';

function FilesIcon({
  color = Colors.white,
  size = 18,
}: {
  color: ColorValue;
  size: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        fill={color}
        d="M.449 3.436 3.436.45A1.52 1.52 0 0 1 4.52 0h4.887a3.285 3.285 0 0 1 3.281 3.281V3.5h1.094a3.285 3.285 0 0 1 3.281 3.281v7a3.285 3.285 0 0 1-3.28 3.281H7.655a3.285 3.285 0 0 1-3.281-3.28v-.22H3.281A3.285 3.285 0 0 1 0 10.283V4.517c0-.408.16-.793.449-1.082ZM3.5 2.24 2.24 3.5h.33c.513 0 .93-.418.93-.93v-.33Zm2.188 11.541a1.97 1.97 0 0 0 1.968 1.969h6.125a1.97 1.97 0 0 0 1.969-1.969v-7a1.97 1.97 0 0 0-1.969-1.968h-1.094v5.468a3.285 3.285 0 0 1-3.28 3.281h-3.72v.22ZM3.28 12.25h6.125a1.97 1.97 0 0 0 1.969-1.969v-7a1.97 1.97 0 0 0-1.969-1.969H4.812v1.259a2.244 2.244 0 0 1-2.241 2.241H1.312v5.47c0 1.084.883 1.968 1.97 1.968Z"
      />
    </Svg>
  );
}

export default FilesIcon;
