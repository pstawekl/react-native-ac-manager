import { useNavigation } from '@react-navigation/native';
import { Chip, Text } from '@rneui/themed';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CalendarProvider,
  PackedEvent,
  TimelineList,
  TimelineProps,
  WeekCalendar,
} from 'react-native-calendars';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Spinner from 'react-native-loading-spinner-overlay';

import ButtonsHeader from '../../components/ButtonsHeader';
import Colors from '../../consts/Colors';
import useTasks from '../../providers/TasksProvider';

function EventItem({ event }: { event: PackedEvent }) {
  return (
    <TouchableOpacity>
      <View>
        <Text style={styles.eventTitle}>
          {event.type} - {event.title}
        </Text>
      </View>
      <View style={styles.eventRight}>
        <Chip
          title={event.status}
          color={event.borderColor}
          buttonStyle={styles.eventStatusChip}
          titleStyle={styles.eventStatusTitle}
        />
      </View>
    </TouchableOpacity>
  );
}

function CalendarTab() {
  const navigation = useNavigation(); // TODO: add type

  const [currentDate, setCurrentDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [eventTasks, setEventTasks] = useState<any>();
  const { result: tasks, loading, execute } = useTasks();

  useEffect(() => {
    if (execute) {
      execute();
    }
  }, [execute]);

  useEffect(() => {
    if (tasks) {
      const eventTasksByDate = tasks.reduce((acc, task) => {
        const date = format(new Date(task.start_date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          start: task.start_date,
          end: task.start_date,
          title: task.nazwa,
          type: task.typ,
          color: task.status === 'wykonane' ? Colors.green : Colors.red,
        });
        return acc;
      }, {});

      setEventTasks(eventTasksByDate);
    }
  }, [tasks]);

  const timelineProps: Partial<TimelineProps> = {
    format24h: true,
    start: 8,
    end: 20,
    overlapEventsSpacing: 8,
    rightEdgeSpacing: 14,
    numberOfDays: 3,
    showNowIndicator: false,
    styles: {
      event: {
        paddingLeft: 0,
        paddingTop: 0,
      },
    },
    renderEvent: (event: PackedEvent) => <EventItem event={event} />,
  };

  const onDateChanged = (date: string) => {
    setCurrentDate(date);
  };

  return (
    <View style={styles.container}>
      <ButtonsHeader
        style={styles.buttonsHeader}
        onAddPress={() => navigation.navigate('AddForm')}
      />

      <CalendarProvider
        date={currentDate}
        onDateChanged={onDateChanged}
        showTodayButton
      >
        {eventTasks && (
          <TimelineList
            events={eventTasks}
            timelineProps={timelineProps}
            showNowIndicator={false}
            initialTime={{ hour: 9, minutes: 0 }}
          />
        )}
      </CalendarProvider>

      <Spinner
        visible={loading}
        textContent="Trwa pobieranie danych..."
        textStyle={{ color: Colors.gray }}
      />
    </View>
  );
}

export default CalendarTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventRight: {
    marginLeft: 'auto',
  },
  eventTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.white,
  },
  eventStatusTitle: {
    fontSize: 12,
  },
  eventStatusChip: {
    padding: 0,
    marginTop: 5,
  },
  buttonsHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
});
