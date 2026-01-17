import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterField {
  id: string;
  name: string;
  label: string;
  options: { label: string; value: string | number }[];
  zIndex?: number;
  isRange?: boolean;
}

interface SplitFiltersState {
  formFields: FilterField[];
  filtersList: FilterField[];
}

interface FiltersState {
  split: SplitFiltersState;
  multi_split: SplitFiltersState;
}

const initialState: FiltersState = {
  split: {
    formFields: [],
    filtersList: [],
  },
  multi_split: {
    formFields: [],
    filtersList: [],
  },
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSplitFilters(state, action: PayloadAction<SplitFiltersState>) {
      state.split = action.payload;
    },
    setMultiSplitFilters(state, action: PayloadAction<SplitFiltersState>) {
      state.multi_split = action.payload;
    },
    clearSplitFilters(state) {
      state.split = {
        formFields: [],
        filtersList: [],
      };
    },
    clearMultiSplitFilters(state) {
      state.multi_split = {
        formFields: [],
        filtersList: [],
      };
    },
  },
});

export const {
  setSplitFilters,
  setMultiSplitFilters,
  clearSplitFilters,
  clearMultiSplitFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
