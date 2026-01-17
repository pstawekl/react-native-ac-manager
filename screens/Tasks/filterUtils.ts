import { Filter } from './TasksMenu';
import { CalendarFiltersState } from '../../store/calendarFiltersSlice';

/**
 * Konwertuje CalendarFiltersState na tablicę Filter[] (stary format dla kompatybilności)
 */
export const filtersStateToFilterArray = (
  state: CalendarFiltersState,
): Filter[] => {
  const filters: Filter[] = [];

  if (state.dateFilter) {
    filters.push({
      name: 'dateFilter',
      value: state.dateFilter,
      type: 'dateFilter',
    });
  }

  if (state.dateSort) {
    filters.push({
      name: 'dateSort',
      value: state.dateSort,
      type: 'dateSort',
    });
  }

  if (state.taskType && state.taskType.length > 0) {
    filters.push({
      name: 'taskType',
      value: JSON.stringify(state.taskType),
      type: 'taskType',
    });
  }

  if (state.taskStatus && state.taskStatus !== 'wszystkie') {
    filters.push({
      name: 'taskStatus',
      value: state.taskStatus,
      type: 'taskStatus',
    });
  }

  if (state.taskGroup && state.taskGroup.length > 0) {
    filters.push({
      name: 'taskGroup',
      value: JSON.stringify(state.taskGroup),
      type: 'taskGroup',
    });
  }

  return filters;
};

/**
 * Konwertuje tablicę Filter[] na CalendarFiltersState
 */
export const filterArrayToFiltersState = (
  filters: Filter[],
  currentState?: CalendarFiltersState,
): Partial<CalendarFiltersState> => {
  const newState: Partial<CalendarFiltersState> = {};

  filters.forEach(filter => {
    switch (filter.type) {
      case 'dateFilter':
        newState.dateFilter = filter.value;
        break;
      case 'dateSort':
        newState.dateSort = filter.value;
        break;
      case 'taskType':
        try {
          const parsed = JSON.parse(filter.value);
          if (Array.isArray(parsed)) {
            newState.taskType = parsed;
          }
        } catch {
          // Jeśli nie jest JSON, traktuj jako pustą tablicę lub pojedynczą wartość
          if (filter.value && filter.value !== '[]' && filter.value !== '') {
            newState.taskType = [filter.value];
          } else {
            newState.taskType = [];
          }
        }
        break;
      case 'taskStatus':
        newState.taskStatus = filter.value || 'wszystkie';
        break;
      case 'taskGroup':
        try {
          const parsed = JSON.parse(filter.value);
          if (Array.isArray(parsed)) {
            newState.taskGroup = parsed;
          }
        } catch {
          // Jeśli nie jest JSON, traktuj jako pustą tablicę lub pojedynczą wartość
          if (filter.value && filter.value !== '[]' && filter.value !== '') {
            newState.taskGroup = [filter.value];
          } else {
            newState.taskGroup = [];
          }
        }
        break;
    }
  });

  return newState;
};
