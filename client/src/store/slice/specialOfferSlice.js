// src/store/slice/specialOfferSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchSpecialOffersThunk } from "../thunks/specialOfferThunks";

const initialState = {
  specialOffers: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 4,
  },
};

const specialOfferSlice = createSlice({
  name: "specialOffer",
  initialState,
  reducers: {
    clearSpecialOfferError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpecialOffersThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSpecialOffersThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.specialOffers = action.payload.offers || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchSpecialOffersThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearSpecialOfferError } = specialOfferSlice.actions;

export const selectSpecialOffers = (state) => state.specialOffer.specialOffers;
export const selectSpecialOffersStatus = (state) => state.specialOffer.status;
export const selectSpecialOffersError = (state) => state.specialOffer.error;
export const selectSpecialOffersPagination = (state) => state.specialOffer.pagination;

export default specialOfferSlice.reducer;
