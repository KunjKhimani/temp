import { createAsyncThunk } from "@reduxjs/toolkit";
import { reviewApi } from "../../services/reviewApi";

export const fetchAllAdminReviews = createAsyncThunk(
  "adminReviews/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await reviewApi.getAdminReviews(params);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch reviews");
    }
  }
);

export const updateReviewStatusThunk = createAsyncThunk(
  "adminReviews/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await reviewApi.updateReviewStatus(id, status);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update review status");
    }
  }
);
