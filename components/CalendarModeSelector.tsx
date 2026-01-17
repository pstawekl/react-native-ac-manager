import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../consts/Colors';

type CalendarMode = 'day' | 'week' | 'month';

interface CalendarModeSelectorProps {
  selectedMode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
}

function CalendarModeSelector({
  selectedMode,
  onModeChange,
}: CalendarModeSelectorProps): JSX.Element {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, selectedMode === 'day' && styles.selectedButton]}
        onPress={() => onModeChange('day')}
      >
        <Text
          style={
            selectedMode === 'day'
              ? styles.selectedButtonText
              : styles.buttonText
          }
        >
          Dzień
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          selectedMode === 'week' && styles.selectedButton,
        ]}
        onPress={() => onModeChange('week')}
      >
        <Text
          style={
            selectedMode === 'week'
              ? styles.selectedButtonText
              : styles.buttonText
          }
        >
          Tydzień
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          selectedMode === 'month' && styles.selectedButton,
        ]}
        onPress={() => onModeChange('month')}
      >
        <Text
          style={
            selectedMode === 'month'
              ? styles.selectedButtonText
              : styles.buttonText
          }
        >
          Miesiąc
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    borderRadius: 5,
  },
  selectedButton: {
    backgroundColor: Colors.calendarPrimary,
  },
  buttonText: {
    color: Colors.black,
  },
  selectedButtonText: {
    color: Colors.white,
  },
});

export default CalendarModeSelector;
