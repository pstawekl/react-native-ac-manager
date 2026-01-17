import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../consts/Colors';

type SegmentedControlOption = {
  label: string;
  value: string;
};

type SegmentedControlProps = {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  style?: any;
};

export default function SegmentedControl({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps) {
  if (options.length !== 2) {
    console.warn('SegmentedControl expects exactly 2 options');
    return null;
  }

  const [option1, option2] = options;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.segment,
          styles.leftSegment,
          value === option1.value && styles.activeSegment,
        ]}
        onPress={() => onChange(option1.value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.segmentText,
            value === option1.value && styles.activeSegmentText,
          ]}
        >
          {option1.label}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.segment,
          styles.rightSegment,
          value === option2.value && styles.activeSegment,
        ]}
        onPress={() => onChange(option2.value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.segmentText,
            value === option2.value && styles.activeSegmentText,
          ]}
        >
          {option2.label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderColor: Colors.grayBorder,
    overflow: 'hidden',
    height: 40,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  leftSegment: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  rightSegment: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  activeSegment: {
    backgroundColor: Colors.separator,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Archivo_400Regular',
    color: Colors.grayText,
  },
  activeSegmentText: {
    color: Colors.black,
    fontFamily: 'Archivo_600SemiBold',
  },
});
