import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, addMonths, addYears, startOfMonth, endOfMonth, getDaysInMonth, isSameWeek, isSameDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import Colors from '../consts/Colors';

type CalendarMode = 'day' | 'week' | 'month' | 'year';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange, mode: CalendarMode) => void;
  initialMode?: CalendarMode;
  initialDate?: Date;
}

const POLISH_MONTHS = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];

const POLISH_MONTHS_GENITIVE = [
  'Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca',
  'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia',
];

const POLISH_WEEKDAYS_SHORT = ['Pon.', 'Wt.', 'Śr.', 'Czw.', 'Pt.', 'Sob.', 'Niedz.'];

function DateRangePicker({
  onDateRangeChange,
  initialMode = 'day',
  initialDate = new Date(),
}: DateRangePickerProps): JSX.Element {
  const [selectedMode, setSelectedMode] = useState<CalendarMode>(initialMode);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [displayMonth, setDisplayMonth] = useState<Date>(initialDate);

  // Animation values for swipe
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateX: slideAnim.value }],
  }));

  const modes = [
    { key: 'day' as CalendarMode, label: 'Dzień', icon: 'today-outline' },
    { key: 'week' as CalendarMode, label: 'Tydzień', icon: 'calendar-outline' },
    { key: 'month' as CalendarMode, label: 'Miesiąc', icon: 'calendar' },
    { key: 'year' as CalendarMode, label: 'Wybierz rok', icon: 'calendar-sharp' },
  ];

  const getWeekDays = useCallback((date: Date): Date[] => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, []);

  const selectedWeekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const selectedWeekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const handleModeChange = useCallback((mode: CalendarMode) => {
    setSelectedMode(mode);
    const now = currentDate;

    let range: DateRange;
    switch (mode) {
      case 'day':
        range = { startDate: now, endDate: now };
        break;
      case 'week':
        range = {
          startDate: startOfWeek(now, { weekStartsOn: 1 }),
          endDate: endOfWeek(now, { weekStartsOn: 1 })
        };
        break;
      case 'month':
        range = {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now)
        };
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        range = { startDate: yearStart, endDate: yearEnd };
        break;
    }
    onDateRangeChange(range, mode);
  }, [currentDate, onDateRangeChange]);

  const handleDaySelect = useCallback((day: Date) => {
    setCurrentDate(day);
    setDisplayMonth(day);
    if (selectedMode === 'day') {
      onDateRangeChange({ startDate: day, endDate: day }, 'day');
    } else if (selectedMode === 'week') {
      const weekStart = startOfWeek(day, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(day, { weekStartsOn: 1 });
      onDateRangeChange({ startDate: weekStart, endDate: weekEnd }, 'week');
    } else if (selectedMode === 'month') {
      onDateRangeChange({ startDate: startOfMonth(day), endDate: endOfMonth(day) }, 'month');
    }
  }, [selectedMode, onDateRangeChange]);

  const changeMonthWithAnimation = useCallback((direction: 'next' | 'prev') => {
    fadeAnim.value = withTiming(0, { duration: 150 });
    slideAnim.value = withTiming(direction === 'next' ? -30 : 30, { duration: 150 });

    setTimeout(() => {
      const newMonth = addMonths(displayMonth, direction === 'next' ? 1 : -1);
      setDisplayMonth(newMonth);

      slideAnim.value = direction === 'next' ? 30 : -30;
      fadeAnim.value = withTiming(1, { duration: 150 });
      slideAnim.value = withTiming(0, { duration: 150 });
    }, 150);
  }, [displayMonth, fadeAnim, slideAnim]);

  const onSwipeGesture = useCallback((event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.END) {
      const threshold = 50;

      if (translationX < -threshold) {
        changeMonthWithAnimation('next');
      } else if (translationX > threshold) {
        changeMonthWithAnimation('prev');
      }
    }
  }, [changeMonthWithAnimation]);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);

  // Get week range title
  const getWeekRangeTitle = useCallback(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const month = POLISH_MONTHS_GENITIVE[weekEnd.getMonth()];
    return `${startDay} - ${endDay} ${month}`;
  }, [currentDate]);

  const renderModeSelector = () => (
    <View style={styles.modeSelectorContainer}>
      {modes.map((mode) => {
        const isSelected = selectedMode === mode.key;
        return (
          <TouchableOpacity
            key={mode.key}
            style={styles.modeButton}
            onPress={() => handleModeChange(mode.key)}
          >
            <View
              style={[
                styles.modeIconContainer,
                isSelected && styles.modeIconContainerSelected,
              ]}
            >
              <Ionicons
                name={mode.icon as any}
                size={24}
                color={isSelected ? Colors.white : Colors.grayText}
              />
            </View>
            <Text style={isSelected ? styles.modeButtonTextSelected : styles.modeButtonText}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderDayView = () => (
    <View style={styles.dayViewContainer}>
      <View style={styles.weekRowContainer}>
        {weekDays.map((day, index) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd');
          return (
            <TouchableOpacity
              key={index}
              style={styles.weekDayButton}
              onPress={() => handleDaySelect(day)}
            >
              <Text style={styles.weekDayLabel}>{POLISH_WEEKDAYS_SHORT[index]}</Text>
              <View style={[styles.weekDayCircle, isSelected && styles.weekDayCircleSelected]}>
                <Text style={[styles.weekDayNumber, isSelected && styles.weekDayNumberSelected]}>
                  {format(day, 'dd')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Week view with full month calendar and highlighted week
  const renderWeekView = () => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDayOfMonth = new Date(year, month, 1);
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const isInSelectedWeek = (day: Date | null) => {
      if (!day) return false;
      return day >= selectedWeekStart && day <= selectedWeekEnd;
    };

    const isWeekStart = (day: Date | null, dayIndex: number) => {
      if (!day) return false;
      return isSameDay(day, selectedWeekStart) || (dayIndex === 0 && isInSelectedWeek(day));
    };

    const isWeekEnd = (day: Date | null, dayIndex: number) => {
      if (!day) return false;
      return isSameDay(day, selectedWeekEnd) || (dayIndex === 6 && isInSelectedWeek(day));
    };

    return (
      <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
        <Animated.View style={[styles.weekCalendarContainer, animatedStyle]}>
          {/* Week range title */}
          <Text style={styles.weekRangeTitle}>{getWeekRangeTitle()}</Text>

          {/* Weekday headers */}
          <View style={styles.weekdayHeaderRow}>
            {POLISH_WEEKDAYS_SHORT.map((day, index) => (
              <Text key={index} style={styles.weekdayHeaderText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeekRow}>
              {week.map((day, dayIndex) => {
                const inSelectedWeek = isInSelectedWeek(day);
                const isStart = isWeekStart(day, dayIndex);
                const isEnd = isWeekEnd(day, dayIndex);

                return (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.calendarDayCell,
                      inSelectedWeek && styles.calendarDayInWeek,
                      isStart && styles.calendarDayWeekStart,
                      isEnd && styles.calendarDayWeekEnd,
                    ]}
                    onPress={() => day && handleDaySelect(day)}
                    disabled={!day}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      !day && styles.calendarDayEmpty,
                      inSelectedWeek && styles.calendarDayTextInWeek,
                    ]}>
                      {day ? day.getDate() : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {week.length < 7 && Array(7 - week.length).fill(null).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDayCell} />
              ))}
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    );
  };

  // Month view with navigation
  const renderMonthView = () => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDayOfMonth = new Date(year, month, 1);
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const isToday = (dayNum: number) => {
      const today = new Date();
      return today.getFullYear() === year &&
             today.getMonth() === month &&
             today.getDate() === dayNum;
    };

    const isSelected = (dayNum: number) => {
      return currentDate.getFullYear() === year &&
             currentDate.getMonth() === month &&
             currentDate.getDate() === dayNum;
    };

    return (
      <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
        <Animated.View style={[styles.monthViewContainer, animatedStyle]}>
          {/* Month title */}
          <Text style={styles.monthCalendarTitle}>
            {POLISH_MONTHS[month]} {year}
          </Text>

          {/* Weekday headers */}
          <View style={styles.weekdayHeaderRow}>
            {POLISH_WEEKDAYS_SHORT.map((day, index) => (
              <Text key={index} style={styles.weekdayHeaderText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeekRow}>
              {week.map((dayNum, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.calendarDayCell,
                    dayNum && isSelected(dayNum) && styles.calendarDayToday,
                  ]}
                  onPress={() => {
                    if (dayNum) {
                      const selectedDay = new Date(year, month, dayNum);
                      handleDaySelect(selectedDay);
                    }
                  }}
                  disabled={!dayNum}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !dayNum && styles.calendarDayEmpty,
                    dayNum && isSelected(dayNum) && styles.calendarDayTextToday,
                  ]}>
                    {dayNum || ''}
                  </Text>
                </TouchableOpacity>
              ))}
              {week.length < 7 && Array(7 - week.length).fill(null).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDayCell} />
              ))}
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const renderYearView = () => {
    const year = displayMonth.getFullYear();
    const months: Date[] = [];

    // Show current year and next year months
    for (let y = year; y <= year + 1; y++) {
      for (let m = 0; m < 12; m++) {
        months.push(new Date(y, m, 1));
      }
    }

    const renderMiniMonth = (monthDate: Date) => {
      const y = monthDate.getFullYear();
      const m = monthDate.getMonth();
      const daysInMonth = getDaysInMonth(monthDate);
      const firstDayOfMonth = new Date(y, m, 1);
      let startDay = firstDayOfMonth.getDay() - 1;
      if (startDay < 0) startDay = 6;

      const days: (number | null)[] = [];
      for (let i = 0; i < startDay; i++) {
        days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }

      const weeks: (number | null)[][] = [];
      for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
      }

      const isToday = (dayNum: number) => {
        const today = new Date();
        return today.getFullYear() === y &&
               today.getMonth() === m &&
               today.getDate() === dayNum;
      };

      return (
        <TouchableOpacity
          style={styles.miniMonthContainer}
          onPress={() => {
            setDisplayMonth(monthDate);
            handleDaySelect(new Date(y, m, 1));
          }}
        >
          <Text style={styles.miniMonthTitle}>{POLISH_MONTHS[m]}</Text>
          <View style={styles.miniWeekdayRow}>
            {['P', 'W', 'Ś', 'C', 'P', 'S', 'N'].map((d, i) => (
              <Text key={i} style={styles.miniWeekdayText}>{d}</Text>
            ))}
          </View>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.miniWeekRow}>
              {week.map((dayNum, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    styles.miniDayCell,
                    dayNum && isToday(dayNum) && styles.miniDayToday,
                  ]}
                >
                  <Text style={[
                    styles.miniDayText,
                    !dayNum && styles.calendarDayEmpty,
                    dayNum && isToday(dayNum) && styles.miniDayTextToday,
                  ]}>
                    {dayNum || ''}
                  </Text>
                </View>
              ))}
              {week.length < 7 && Array(7 - week.length).fill(null).map((_, i) => (
                <View key={`empty-${i}`} style={styles.miniDayCell} />
              ))}
            </View>
          ))}
        </TouchableOpacity>
      );
    };

    return (
      <ScrollView style={styles.yearViewContainer}>
        <Text style={styles.yearTitle}>{year}</Text>
        <View style={styles.yearMonthsGrid}>
          {months.slice(0, 12).map((monthDate, index) => (
            <View key={index} style={styles.yearMonthItem}>
              {renderMiniMonth(monthDate)}
            </View>
          ))}
        </View>
        <Text style={styles.yearTitle}>{year + 1}</Text>
        <View style={styles.yearMonthsGrid}>
          {months.slice(12, 24).map((monthDate, index) => (
            <View key={index} style={styles.yearMonthItem}>
              {renderMiniMonth(monthDate)}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderDateSelector = () => {
    switch (selectedMode) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      case 'year':
        return renderYearView();
    }
  };

  return (
    <View style={styles.container}>
      {renderModeSelector()}
      <View style={styles.divider} />
      {renderDateSelector()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  modeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  modeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  modeIconContainerSelected: {
    backgroundColor: Colors.calendarPrimary,
  },
  modeButtonText: {
    fontSize: 11,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  modeButtonTextSelected: {
    fontSize: 11,
    color: Colors.calendarPrimary,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  // Day View Styles
  dayViewContainer: {
    paddingVertical: 10,
  },
  weekRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  weekDayButton: {
    alignItems: 'center',
    minWidth: 40,
  },
  weekDayLabel: {
    fontSize: 10,
    color: Colors.grayText,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 4,
  },
  weekDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  weekDayCircleSelected: {
    backgroundColor: Colors.calendarPrimary,
  },
  weekDayNumber: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'Poppins_400Regular',
  },
  weekDayNumberSelected: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  // Week View Styles (full calendar with week highlight)
  weekCalendarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  weekRangeTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    marginBottom: 16,
  },
  // Month View Styles
  monthViewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  monthCalendarTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    marginBottom: 16,
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 12,
  },
  weekdayHeaderText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    textAlign: 'center',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  calendarDayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 44,
  },
  calendarDayText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
  },
  calendarDayEmpty: {
    color: 'transparent',
  },
  calendarDayToday: {
    backgroundColor: Colors.calendarPrimary,
    borderRadius: 22,
  },
  calendarDayTextToday: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  // Week selection styles
  calendarDayInWeek: {
    backgroundColor: Colors.calendarPrimary,
  },
  calendarDayWeekStart: {
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
  },
  calendarDayWeekEnd: {
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  calendarDayTextInWeek: {
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
  },
  // Year View Styles
  yearViewContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  yearTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    marginVertical: 10,
  },
  yearMonthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearMonthItem: {
    width: '48%',
    marginBottom: 10,
  },
  miniMonthContainer: {
    padding: 10,
    backgroundColor: Colors.white,
  },
  miniMonthTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.black,
    marginBottom: 8,
  },
  miniWeekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  miniWeekdayText: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grayText,
    textAlign: 'center',
  },
  miniWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  miniDayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 24,
  },
  miniDayText: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: Colors.black,
  },
  miniDayToday: {
    backgroundColor: Colors.calendarPrimary,
    borderRadius: 12,
  },
  miniDayTextToday: {
    color: Colors.white,
  },
});

export default DateRangePicker;
