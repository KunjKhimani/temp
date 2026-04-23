import { createSlice } from "@reduxjs/toolkit";
import {
  getAllServicesAdmin,
  getSingleServiceAdmin,
  updateServiceAdmin,
  deleteServiceAdmin,
  deleteMultipleServicesAdmin,
} from "./adminServiceThunk";

const initialState = {
  services: [],
  service: null,
  totalItems: 0, // NEW: Add totalItems for pagination
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const adminServiceSlice = createSlice({
  name: "adminServices",
  initialState,
  reducers: {
    resetAdminServices: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
      state.service = null;
      // Note: We don't reset services or totalItems here,
      // as the component might still be visible.
      // Re-fetching will overwrite them.
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Services Admin
      .addCase(getAllServicesAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllServicesAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false; // NEW: Reset error state on success
        // MODIFIED: Capture both services for the current page and the total count
        state.services = action.payload.services;
        state.totalItems = action.payload.totalItems;
        state.message = "";
      })
      .addCase(getAllServicesAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.services = [];
        state.totalItems = 0; // NEW: Reset total on error
      })

      // Get Single Service Admin (no changes needed)
      .addCase(getSingleServiceAdmin.pending, (state) => {
        state.isLoading = true;
        state.service = null;
      })
      .addCase(getSingleServiceAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.service = action.payload.service;
        state.message = "";
      })
      .addCase(getSingleServiceAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.service = null;
      })

      // Update Service Admin (no changes needed)
      .addCase(updateServiceAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateServiceAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.service = action.payload;
        state.services = state.services.map((s) =>
          s._id === action.payload._id ? action.payload : s
        );
        state.message = "Service updated successfully!";
      })
      .addCase(updateServiceAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Service Admin
      .addCase(deleteServiceAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteServiceAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const deletedId = action.meta.arg;
        state.services = state.services.filter(
          (service) => service._id !== deletedId
        );
        // NEW: Decrement total count to keep pagination in sync
        state.totalItems = state.totalItems > 0 ? state.totalItems - 1 : 0;
        state.message =
          action.payload.message || "Service deleted successfully!";
      })
      .addCase(deleteServiceAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Multiple Services Admin
      .addCase(deleteMultipleServicesAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMultipleServicesAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const deletedIds = action.meta.arg;
        state.services = state.services.filter(
          (service) => !deletedIds.includes(service._id)
        );
        // NEW: Decrement total count by the number of deleted items
        state.totalItems = Math.max(0, state.totalItems - deletedIds.length);
        state.message =
          action.payload.message || "Services deleted successfully!";
      })
      .addCase(deleteMultipleServicesAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAdminServices } = adminServiceSlice.actions;
export default adminServiceSlice.reducer;
