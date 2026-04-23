import { createSlice } from "@reduxjs/toolkit";
import { fetchAllAdminReviews, updateReviewStatusThunk } from "../thunks/adminReviewThunk";

const adminReviewSlice = createSlice({
  name: "adminReviews",
  initialState: {
    reviews: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 1,
    },
    loading: false,
    error: null,
    statusUpdateLoading: false,
  },
  reducers: {
    clearAdminReviewError: (state) => {
      state.error = null;
    },
    resetReviewStatus: (state) => {
      state.statusUpdateLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAllAdminReviews
      .addCase(fetchAllAdminReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAdminReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllAdminReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateReviewStatusThunk
      .addCase(updateReviewStatusThunk.pending, (state) => {
        state.statusUpdateLoading = true;
      })
      .addCase(updateReviewStatusThunk.fulfilled, (state, action) => {
        state.statusUpdateLoading = false;
        const updatedReview = action.payload;
        const index = state.reviews.findIndex(r => r._id === updatedReview._id);
        if (index !== -1) {
          state.reviews[index] = { ...state.reviews[index], ...updatedReview };
        }
      })
      .addCase(updateReviewStatusThunk.rejected, (state, action) => {
        state.statusUpdateLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminReviewError, resetReviewStatus } = adminReviewSlice.actions;

export default adminReviewSlice.reducer;

// Selectors
export const selectAdminReviews = (state) => state.adminReviews.reviews;
export const selectAdminReviewsPagination = (state) => state.adminReviews.pagination;
export const selectAdminReviewsLoading = (state) => state.adminReviews.loading;
export const selectAdminReviewsError = (state) => state.adminReviews.error;
export const selectReviewStatusUpdateLoading = (state) => state.adminReviews.statusUpdateLoading;
