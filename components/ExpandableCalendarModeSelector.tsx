import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../consts/Colors';

type CalendarMode = 'day' | 'week' | 'month' | 'year';

interface ExpandableCalendarModeSelectorProps {
  isExpanded: boolean;
  selectedMode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
}

function ExpandableCalendarModeSelector({
  isExpanded,
  selectedMode,
  onModeChange,
}: ExpandableCalendarModeSelectorProps): JSX.Element {
  const modes = [
    { key: 'day' as CalendarMode, label: 'Dzień', icon: 'today-outline' },
    { key: 'week' as CalendarMode, label: 'Tydzień', icon: 'calendar-outline' },
    { key: 'month' as CalendarMode, label: 'Miesiąc', icon: 'calendar' },
    { key: 'year' as CalendarMode, label: 'Wybierz rok', icon: 'calendar-sharp' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.key;
          return (
            <TouchableOpacity
              key={mode.key}
              style={styles.button}
              onPress={() => onModeChange(mode.key)}
              disabled={!isExpanded}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.gray}30`,
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconContainerSelected: {
    backgroundColor: Colors.calendarPrimary,
  },
  buttonText: {
    fontSize: 10,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  selectedButtonText: {
    fontSize: 10,
    color: Colors.black,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
});

export default ExpandableCalendarModeSelector;
