// src/store/thunks/communityOfferThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { communityOfferApi } from "../../services/communityOfferApi";

export const fetchCommunityOffersThunk = createAsyncThunk(
  "communityOffer/fetchCommunityOffers",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await communityOfferApi.getCommunityOffers(queryParams);
      return response.data; // Expects { offers: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch community offers" }
      );
    }
  }
);
