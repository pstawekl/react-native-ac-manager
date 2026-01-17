import { PlatformPressable } from '@react-navigation/elements';
import { Link, useTheme } from '@react-navigation/native';
import * as React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from '@rneui/themed';
import Colors from '../../consts/Colors';

type Props = {
  /**
   * The label text of the item.
   */
  label:
    | string
    | ((props: { focused: boolean; color: string }) => React.ReactNode);
  /**
   * Icon to display for the `DrawerItem`.
   */
  icon?: (props: {
    focused: boolean;
    size: number;
    color: string;
  }) => React.ReactNode;
  /**
   * URL to use for the link to the tab.
   */
  to?: string;
  /**
   * Whether to highlight the drawer item as active.
   */
  focused?: boolean;
  /**
   * Function to execute on press.
   */
  onPress: () => void;
  /**
   * Color for the icon and label when the item is active.
   */
  activeTintColor?: string;
  /**
   * Color for the icon and label when the item is inactive.
   */
  inactiveTintColor?: string;
  /**
   * Background color for item when its active.
   */
  activeBackgroundColor?: string;
  /**
   * Background color for item when its inactive.
   */
  inactiveBackgroundColor?: string;
  /**
   * Color of the touchable effect on press.
   * Only supported on Android.
   *
   * @platform android
   */
  pressColor?: string;
  /**
   * Opacity of the touchable effect on press.
   * Only supported on iOS.
   *
   * @platform ios
   */
  pressOpacity?: number;
  /**
   * Style object for the label element.
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Whether label font should scale to respect Text Size accessibility settings.
   */
  allowFontScaling?: boolean;

  /**
   * Accessibility label for drawer item.
   */
  accessibilityLabel?: string;
  /**
   * ID to locate this drawer item in tests.
   */
  testID?: string;
};

function LinkPressable({
  children,
  style,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  to,
  accessibilityRole,
  disabled,
  ...rest
}: Omit<React.ComponentProps<typeof PlatformPressable>, 'style'> & {
  style: StyleProp<ViewStyle>;
} & {
  to?: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  if (Platform.OS === 'web' && to) {
    // React Native Web doesn't forward `onClick` if we use `TouchableWithoutFeedback`.
    // We need to use `onClick` to be able to prevent default browser handling of links.
    return (
      <Link
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
        disabled={disabled === true}
        to={to}
        style={[styles.button, style]}
        onPress={(e: any) => {
          if (
            !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) && // ignore clicks with modifier keys
            (e.button == null || e.button === 0) // ignore everything but left clicks
          ) {
            e.preventDefault();
            onPress?.(e);
          }
        }}
        // types for PressableProps and TextProps are incompatible with each other by `null` so we
        // can't use {...rest} for these 3 props
        onLongPress={onLongPress ?? undefined}
        onPressIn={onPressIn ?? undefined}
        onPressOut={onPressOut ?? undefined}
      >
        {children}
      </Link>
    );
  }
  return (
    <PlatformPressable
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      accessibilityRole={accessibilityRole}
      onPress={onPress}
    >
      <View style={style}>{children}</View>
    </PlatformPressable>
  );
}

/**
 * A component used to show an action item with an icon and a label in a navigation drawer.
 */
export default function DrawerItem(props: Props) {
  const { colors } = useTheme();

  const {
    icon,
    label,
    labelStyle,
    to,
    focused = false,
    allowFontScaling,
    activeTintColor = colors.primary,
    inactiveTintColor = '#000000',
    activeBackgroundColor = 'transparent',
    inactiveBackgroundColor = 'transparent',
    onPress,
    pressColor,
    pressOpacity,
    testID,
    accessibilityLabel,
    ...rest
  } = props;

  const color = focused ? activeTintColor : inactiveTintColor;
  const backgroundColor = focused
    ? activeBackgroundColor
    : inactiveBackgroundColor;

  const iconNode = icon ? icon({ size: 24, focused, color }) : null;

  return (
    <View
      collapsable={false}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      style={[styles.container, { backgroundColor }]}
    >
      <LinkPressable
        testID={testID}
        onPress={onPress}
        style={styles.wrapper}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        pressColor={pressColor}
        pressOpacity={pressOpacity}
        to={to}
      >
        <>
          {iconNode}
          <View style={styles.labelContainer}>
            {typeof label === 'string' ? (
              <Text
                numberOfLines={1}
                allowFontScaling={allowFontScaling}
                style={[styles.label, { color }]}
              >
                {label}
              </Text>
            ) : (
              label({ color, focused })
            )}
          </View>
        </>
      </LinkPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 30,
    overflow: 'hidden',
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 0,
    padding: 2,
    backgroundColor: Colors.white,
  },
  labelContainer: {
    marginHorizontal: 10,
    marginVertical: 5,
    flex: 1,
  },
  label: {
    fontSize: 16,
  },
  button: {
    display: 'flex',
  },
});
