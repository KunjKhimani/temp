// src/store/slice/communityOfferSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchCommunityOffersThunk } from "../thunks/communityOfferThunks";

const initialState = {
  communityOffers: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 4,
  },
};

const communityOfferSlice = createSlice({
  name: "communityOffer",
  initialState,
  reducers: {
    clearCommunityOfferError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunityOffersThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCommunityOffersThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.communityOffers = action.payload.offers || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchCommunityOffersThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearCommunityOfferError } = communityOfferSlice.actions;

export const selectCommunityOffers = (state) => state.communityOffer.communityOffers;
export const selectCommunityOffersStatus = (state) => state.communityOffer.status;
export const selectCommunityOffersError = (state) => state.communityOffer.error;
export const selectCommunityOffersPagination = (state) => state.communityOffer.pagination;

export default communityOfferSlice.reducer;
