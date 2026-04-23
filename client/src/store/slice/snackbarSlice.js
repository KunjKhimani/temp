// src/store/slice/snackbarSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  open: false,
  message: "",
  severity: "info", // 'success' | 'info' | 'warning' | 'error'
  duration: 6000, //Default duration in ms
  vertical: "bottom",
  horizontal: "center",
};

const snackbarSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    showSnackbar(state, action) {
      state.open = true;
      // Check if the payload has a nested 'payload' property (common for rejected thunks)
      state.message =
        action.payload.payload || action.payload.message || "Notification";
      state.severity = action.payload.severity || "info";
      state.duration = action.payload.duration || initialState.duration;
      state.vertical = action.payload.vertical || initialState.vertical;
      state.horizontal = action.payload.horizontal || initialState.horizontal;
    },
    hideSnackbar(state) {
      state.open = false;
    },
    clearSnackbar() {
      return initialState; // Reset entire slice to initial state
    },
  },
});

export const { showSnackbar, hideSnackbar, clearSnackbar } =
  snackbarSlice.actions;

// Selectors
import { createSelector } from "@reduxjs/toolkit"; // Import createSelector

// Selectors
export const selectSnackbarOpen = (state) => state.snackbar.open;
export const selectSnackbarMessage = (state) => state.snackbar.message;
export const selectSnackbarSeverity = (state) => state.snackbar.severity;
export const selectSnackbarDuration = (state) => state.snackbar.duration;

// Memoized selector for snackbar position
export const selectSnackbarPosition = createSelector(
  (state) => state.snackbar.vertical,
  (state) => state.snackbar.horizontal,
  (vertical, horizontal) => ({ vertical, horizontal })
);

export default snackbarSlice.reducer;
