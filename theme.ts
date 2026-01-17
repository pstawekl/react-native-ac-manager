import { createTheme } from '@rneui/themed';
import Colors from './consts/Colors';

const theme = createTheme({
  components: {
    Text: {
      style: {
        fontFamily: 'Archivo_400Regular',
        fontSize: 14,
      },
    },
    Tab: {
      style: {
        flex: 0,
        margin: 0,
        padding: 0,
      },
      indicatorStyle: {
        backgroundColor: Colors.black,
        height: 2,
        position: 'absolute',
        bottom: -2,
      },
      titleStyle: (active: boolean) => {
        return {
          fontFamily: active ? 'Archivo_600SemiBold' : 'Archivo_400Regular',
          color: active ? Colors.black : Colors.grayText,
          fontSize: 15,
          paddingHorizontal: 16,
          paddingVertical: 8,
        };
      },
    },
    TabItem: {
      buttonStyle: {
        marginHorizontal: 5,
        paddingVertical: 3,
      },
      containerStyle: {
        flex: 0,
        margin: 0,
        padding: 0,
      },
    },
    ListItemTitle: {
      style: {
        fontFamily: 'Archivo_400Regular',
        fontSize: 14,
        color: Colors.text,
      },
    },
    ListItemSubtitle: {
      style: {
        fontFamily: 'Archivo_400Regular',
        fontSize: 11,
        color: Colors.grayerText,
      },
    },
    Chip: {
      titleStyle: {
        fontFamily: 'Archivo_400Regular',
        fontSize: 12,
      },
      buttonStyle: {
        borderRadius: 4,
      },
      containerStyle: {
        borderRadius: 5,
      },
    },
  },
});

export default theme;
