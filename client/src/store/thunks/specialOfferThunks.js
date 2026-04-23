// src/store/thunks/specialOfferThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { specialOfferApi } from "../../services/specialOfferApi";

export const fetchSpecialOffersThunk = createAsyncThunk(
  "specialOffer/fetchSpecialOffers",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await specialOfferApi.getSpecialOffers(queryParams);
      return response.data; // Expects { offers: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch special offers" }
      );
    }
  }
);
