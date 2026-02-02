import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CalendarFiltersState {
  dateFilter: string;
  dateSort: string;
  taskType: (string | number)[];
  taskStatus: string;
  taskGroup: (string | number)[];
  calendarMode: 'day' | 'week' | 'month' | 'year';
}

const initialState: CalendarFiltersState = {
  dateFilter: '',
  dateSort: 'nearest',
  taskType: [],
  taskStatus: 'wszystkie',
  taskGroup: [],
  calendarMode: 'day',
};

const calendarFiltersSlice = createSlice({
  name: 'calendarFilters',
  initialState,
  reducers: {
    setDateFilter(state, action: PayloadAction<string>) {
      state.dateFilter = action.payload;
    },
    setDateSort(state, action: PayloadAction<string>) {
      state.dateSort = action.payload;
    },
    setTaskType(state, action: PayloadAction<(string | number)[]>) {
      state.taskType = action.payload;
    },
    setTaskStatus(state, action: PayloadAction<string>) {
      state.taskStatus = action.payload;
    },
    setTaskGroup(state, action: PayloadAction<(string | number)[]>) {
      state.taskGroup = action.payload;
    },
    setCalendarMode(
      state,
      action: PayloadAction<'day' | 'week' | 'month' | 'year'>,
    ) {
      state.calendarMode = action.payload;
    },
    setAllFilters(state, action: PayloadAction<Partial<CalendarFiltersState>>) {
      return { ...state, ...action.payload };
    },
    resetFilters(state) {
      return initialState;
    },
  },
});

export const {
  setDateFilter,
  setDateSort,
  setTaskType,
  setTaskStatus,
  setTaskGroup,
  setCalendarMode,
  setAllFilters,
  resetFilters,
} = calendarFiltersSlice.actions;

export default calendarFiltersSlice.reducer;
