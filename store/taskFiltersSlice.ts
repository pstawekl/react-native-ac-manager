import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TaskFiltersState {
  dateSort: string;
  taskType: (string | number)[];
  taskStatus: (string | number)[];
  taskGroup: (string | number)[];
}

const initialState: TaskFiltersState = {
  dateSort: 'nearest',
  taskType: [],
  taskStatus: [],
  taskGroup: [],
};

const taskFiltersSlice = createSlice({
  name: 'taskFilters',
  initialState,
  reducers: {
    setDateSort(state, action: PayloadAction<string>) {
      state.dateSort = action.payload;
    },
    setTaskType(state, action: PayloadAction<(string | number)[]>) {
      state.taskType = action.payload;
    },
    setTaskStatus(state, action: PayloadAction<(string | number)[]>) {
      state.taskStatus = action.payload;
    },
    setTaskGroup(state, action: PayloadAction<(string | number)[]>) {
      state.taskGroup = action.payload;
    },
    resetFilters(state) {
      return initialState;
    },
  },
});

export const {
  setDateSort,
  setTaskType,
  setTaskStatus,
  setTaskGroup,
  resetFilters,
} = taskFiltersSlice.actions;

export default taskFiltersSlice.reducer;
