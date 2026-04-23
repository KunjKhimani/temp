import { createSlice } from "@reduxjs/toolkit";
import {
  fetchPromotionSettings,
  updatePromotionSettingsThunk,
  fetchPromotionHistory,
} from "../thunks/adminPromotionThunk";

const initialState = {
  settings: null,
  history: [],

  loading: false,
  saving: false,

  error: null,
  successMsg: "",
};

const adminPromotionSlice = createSlice({
  name: "adminPromotion",
  initialState,
  reducers: {
    clearPromotionMessages: (state) => {
      state.error = null;
      state.successMsg = "";
    },
  },
  extraReducers: (builder) => {
    builder

      /* ---------------- FETCH SETTINGS ---------------- */
      .addCase(fetchPromotionSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchPromotionSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------------- UPDATE SETTINGS ---------------- */
      .addCase(updatePromotionSettingsThunk.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePromotionSettingsThunk.fulfilled, (state, action) => {
        state.saving = false;
        state.settings = action.payload;
        state.successMsg = "Settings updated successfully ✅";
      })
      .addCase(updatePromotionSettingsThunk.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      /* ---------------- HISTORY ---------------- */
      .addCase(fetchPromotionHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPromotionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchPromotionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPromotionMessages } = adminPromotionSlice.actions;

export default adminPromotionSlice.reducer;