import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../consts/Colors';

type CalendarMode = 'day' | 'week' | 'month' | 'year';

interface CalendarModeSelectorProps {
  selectedMode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
}

function CalendarModeSelector({
  selectedMode,
  onModeChange,
}: CalendarModeSelectorProps): JSX.Element {
  const modes = [
    { key: 'day' as CalendarMode, label: 'Dzień', icon: 'today-outline' },
    { key: 'week' as CalendarMode, label: 'Tydzień', icon: 'calendar-outline' },
    { key: 'month' as CalendarMode, label: 'Miesiąc', icon: 'calendar' },
    { key: 'year' as CalendarMode, label: 'Wybierz rok', icon: 'calendar-sharp' },
  ];

  return (
    <View style={styles.container}>
      {modes.map((mode) => {
        const isSelected = selectedMode === mode.key;
        return (
          <TouchableOpacity
            key={mode.key}
            style={styles.button}
            onPress={() => onModeChange(mode.key)}
          >
            <View
              style={[
                styles.iconContainer,
                isSelected && styles.iconContainerSelected,
              ]}
            >
              <Ionicons
                name={mode.icon as any}
                size={24}
                color={isSelected ? Colors.white : Colors.grayText}
              />
            </View>
            <Text
              style={isSelected ? styles.selectedButtonText : styles.buttonText}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: Colors.white,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectedButton: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  iconContainerSelected: {
    backgroundColor: Colors.calendarPrimary,
  },
  buttonText: {
    fontSize: 11,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  selectedButtonText: {
    fontSize: 11,
    color: Colors.calendarPrimary,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
});

export default CalendarModeSelector;
