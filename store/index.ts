import { configureStore } from '@reduxjs/toolkit';
import calendarFiltersReducer from './calendarFiltersSlice';
import filtersReducer from './filtersSlice';
import taskFiltersReducer from './taskFiltersSlice';

const store = configureStore({
  reducer: {
    filters: filtersReducer,
    calendarFilters: calendarFiltersReducer,
    taskFilters: taskFiltersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
