import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getPromotionSettings,
  updatePromotionSettings,
  getPromotionHistory,
} from "../../services/adminPromotionApi";

/* ---------------- GET SETTINGS ---------------- */
export const fetchPromotionSettings = createAsyncThunk(
  "adminPromotion/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getPromotionSettings();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch promotion settings"
      );
    }
  }
);

/* ---------------- UPDATE SETTINGS ---------------- */
export const updatePromotionSettingsThunk = createAsyncThunk(
  "adminPromotion/updateSettings",
  async ({ payload, notes }, { rejectWithValue }) => {
    try {
      const res = await updatePromotionSettings({
        ...payload,
        notes,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update settings"
      );
    }
  }
);

/* ---------------- HISTORY ---------------- */
export const fetchPromotionHistory = createAsyncThunk(
  "adminPromotion/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getPromotionHistory();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch history"
      );
    }
  }
);