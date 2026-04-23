import { createAsyncThunk } from "@reduxjs/toolkit";
import { confirmSubscriptionPayment } from "../../services/subscriptionApi";
import { saveUser } from "../slice/userSlice"; // Import saveUser

export const confirmSubscriptionPaymentThunk = createAsyncThunk(
  "subscription/confirmPayment",
  async (
    { planId, paymentIntentId, sourceId, idempotencyKey },
    { dispatch, rejectWithValue }
  ) => {
    // Add dispatch to thunkAPI
    try {
      const response = await confirmSubscriptionPayment({
        planId,
        paymentIntentId,
        sourceId,
        idempotencyKey,
      });
      if (response.user) {
        // Check if user object is returned
        dispatch(saveUser(response.user)); // Update the user slice
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
