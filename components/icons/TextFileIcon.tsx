import Svg, { Path } from 'react-native-svg';
import { ColorValue } from 'react-native/Libraries/StyleSheet/StyleSheet';

function TextFileIcon({
  color,
  size = 24,
}: {
  color: ColorValue;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M12.8333 1.83331H5.49996C5.01373 1.83331 4.54741 2.02647 4.2036 2.37028C3.85978 2.7141 3.66663 3.18042 3.66663 3.66665V18.3333C3.66663 18.8195 3.85978 19.2859 4.2036 19.6297C4.54741 19.9735 5.01373 20.1666 5.49996 20.1666H16.5C16.9862 20.1666 17.4525 19.9735 17.7963 19.6297C18.1401 19.2859 18.3333 18.8195 18.3333 18.3333V7.33331L12.8333 1.83331Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.8334 1.83331V7.33331H18.3334"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.6667 11.9167H7.33337"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.6667 15.5833H7.33337"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.16671 8.25H8.25004H7.33337"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default TextFileIcon;
