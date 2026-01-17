import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../consts/Colors';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium';
  style?: any;
}

function NotificationBadge({
  count,
  size = 'medium',
  style,
}: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > 99 ? '99+' : count.toString();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        isSmall ? styles.badgeSmall : styles.badgeMedium,
        style,
      ]}
    >
      {count > 0 && (
        <Text
          style={[
            styles.badgeText,
            isSmall ? styles.badgeTextSmall : styles.badgeTextMedium,
          ]}
        >
          {displayCount}
        </Text>
      )}
    </View>
  );
}

export default NotificationBadge;

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    backgroundColor: Colors.red,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeSmall: {
    minWidth: 16,
    height: 16,
    bottom: 15,
    right: 5,
  },
  badgeMedium: {
    minWidth: 20,
    height: 20,
    top: -6,
    right: -6,
  },
  badgeText: {
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  badgeTextSmall: {
    fontSize: 9,
    paddingHorizontal: 3,
  },
  badgeTextMedium: {
    fontSize: 11,
    paddingHorizontal: 4,
  },
});
