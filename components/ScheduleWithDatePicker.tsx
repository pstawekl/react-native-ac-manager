import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateRangePicker from './DateRangePicker';
import ScheduleTable from './ScheduleTable';
import Colors from '../consts/Colors';
import { Task } from '../providers/TasksProvider';

type CalendarMode = 'day' | 'week' | 'month' | 'year';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface Team {
  id: number;
  nazwa: string;
}

interface ScheduleWithDatePickerProps {
  tasks: Task[];
  teams: Team[];
  onModeChange?: (mode: CalendarMode) => void;
  onDateRangeChange?: (range: DateRange, mode: CalendarMode) => void;
  initialMode?: CalendarMode;
  initialDate?: Date;
}

function ScheduleWithDatePicker({
  tasks,
  teams,
  onModeChange,
  onDateRangeChange,
  initialMode = 'day',
  initialDate = new Date(),
}: ScheduleWithDatePickerProps): JSX.Element {
  const navigation = useNavigation();
  const [currentMode, setCurrentMode] = useState<CalendarMode>(initialMode);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = initialDate;
    return { startDate: now, endDate: now };
  });

  const handleDateRangeChange = useCallback((range: DateRange, mode: CalendarMode) => {
    setCurrentMode(mode);
    setDateRange(range);
    onModeChange?.(mode);
    onDateRangeChange?.(range, mode);
  }, [onModeChange, onDateRangeChange]);

  const handleTaskPress = useCallback((task: Task) => {
    (navigation as any).navigate('TaskDetails', { task });
  }, [navigation]);

  // Filter tasks based on current date range
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const taskDate = new Date(task.start_date);
      const startOfDay = new Date(dateRange.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateRange.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });
  }, [tasks, dateRange]);

  return (
    <View style={styles.container}>
      {/* Date Range Picker - always at top */}
      <DateRangePicker
        onDateRangeChange={handleDateRangeChange}
        initialMode={initialMode}
        initialDate={initialDate}
      />

      {/* Schedule Table - always visible */}
      <View style={styles.scheduleContainer}>
        <ScheduleTable
          tasks={filteredTasks}
          teams={teams}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onTaskPress={handleTaskPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scheduleContainer: {
    flex: 1,
  },
});

export default ScheduleWithDatePicker;
