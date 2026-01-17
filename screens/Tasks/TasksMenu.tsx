import { Route, useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import Tabs from '../../components/Tabs';
import { RootState } from '../../store';
import CalendarTab from './CalendarTab';
import TasksTab from './TasksTab';
import { filtersStateToFilterArray } from './filterUtils';

// Definicja typów dla filtrów
export type Filter = {
  name: string;
  value: string;
  type: string;
};

function TasksMenu() {
  const route = useRoute<Route<'Menu', { tab?: string }>>();
  const { tab } = route.params || {};
  const [activeTabIndex, setActiveTabIndex] = useState(
    tab === 'calendar' ? 0 : 1,
  );

  // Pobierz filtry z Redux
  const calendarFilters = useSelector(
    (state: RootState) => state.calendarFilters,
  );

  // Konwertuj filtry Redux na format Filter[] dla kompatybilności
  const appliedFilters = useMemo(
    () => filtersStateToFilterArray(calendarFilters),
    [calendarFilters],
  );

  // Funkcja do aktualizacji filtrów (dla kompatybilności wstecznej)
  const setAppliedFilters = () => {
    // Ta funkcja nie jest już używana, ale pozostawiamy dla kompatybilności typów
    // Rzeczywiste aktualizacje są wykonywane przez Redux actions w CalendarTab i TasksTab
  };

  const tabs = [
    {
      title: 'Kalendarz',
      component: (
        <CalendarTab
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
        />
      ),
      id: 'calendar',
    },
    {
      title: 'Zadania',
      component: (
        <TasksTab
          appliedFilters={appliedFilters}
          setAppliedFilters={setAppliedFilters}
        />
      ),
      id: 'tasks',
    },
  ];

  const title = activeTabIndex === 0 ? 'Kalendarz' : 'Lista zadań';

  return (
    <View style={styles.container}>
      <Tabs
        items={tabs}
        defaultTab={tab || 'tasks'}
        // linearGradient={['#FF0C01', '#FF9C04']}
        isWithLinearGradient={false}
        title={title}
        onTabChange={setActiveTabIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
});

export default TasksMenu;
