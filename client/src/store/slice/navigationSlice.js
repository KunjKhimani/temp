import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  formSubmissionRequired: false,
  formSubmissionPath: null,
  hasCompletedInitialSubmission:
    JSON.parse(localStorage.getItem("hasCompletedInitialSubmission")) || false,
  hasUserContent: false, // New state field
};

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    setFormSubmissionRequired: (state, action) => {
      state.formSubmissionRequired = true;
      state.formSubmissionPath = action.payload;
    },
    completeInitialSubmission: (state) => {
      state.formSubmissionRequired = false;
      state.formSubmissionPath = null;
      state.hasCompletedInitialSubmission = true;
      localStorage.setItem("hasCompletedInitialSubmission", "true");
    },
    setHasUserContent: (state, action) => {
      // New reducer
      state.hasUserContent = action.payload;
    },
  },
});

export const {
  setFormSubmissionRequired,
  completeInitialSubmission,
  setHasUserContent, // Export the new action
} = navigationSlice.actions;

export const selectFormSubmissionRequired = (state) =>
  state.navigation.formSubmissionRequired;

export default navigationSlice.reducer;
