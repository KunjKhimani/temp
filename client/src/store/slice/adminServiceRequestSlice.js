import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllAdminServiceRequests,
  fetchAdminServiceRequestById,
  updateAdminServiceRequest,
  deleteAdminServiceRequest,
  deleteAllAdminServiceRequests,
} from "../thunks/adminServiceRequestThunk";

const initialState = {
  serviceRequests: [],
  selectedServiceRequest: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  },
};

const adminServiceRequestSlice = createSlice({
  name: "adminServiceRequests",
  initialState,
  reducers: {
    clearAdminServiceRequestError: (state) => {
      state.error = null;
    },
    clearSelectedServiceRequest: (state) => {
      state.selectedServiceRequest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllAdminServiceRequests
      .addCase(fetchAllAdminServiceRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAdminServiceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceRequests = action.payload.serviceRequests;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllAdminServiceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch service requests.";
      })
      // fetchAdminServiceRequestById
      .addCase(fetchAdminServiceRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedServiceRequest = null;
      })
      .addCase(fetchAdminServiceRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedServiceRequest = action.payload;
      })
      .addCase(fetchAdminServiceRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch service request by ID.";
      })
      // updateAdminServiceRequest
      .addCase(updateAdminServiceRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminServiceRequest.fulfilled, (state, action) => {
        state.loading = false;
        // Update the specific request in the list if it exists
        const index = state.serviceRequests.findIndex(
          (req) => req._id === action.payload.serviceRequest._id
        );
        if (index !== -1) {
          state.serviceRequests[index] = action.payload.serviceRequest;
        }
        // If the updated request is the currently selected one, update it
        if (
          state.selectedServiceRequest &&
          state.selectedServiceRequest._id === action.payload.serviceRequest._id
        ) {
          state.selectedServiceRequest = action.payload.serviceRequest;
        }
      })
      .addCase(updateAdminServiceRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update service request.";
      })
      // deleteAdminServiceRequest
      .addCase(deleteAdminServiceRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdminServiceRequest.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted request from the list
        state.serviceRequests = state.serviceRequests.filter(
          (req) => req._id !== action.meta.arg // action.meta.arg contains the requestId
        );
        if (
          state.selectedServiceRequest &&
          state.selectedServiceRequest._id === action.meta.arg
        ) {
          state.selectedServiceRequest = null;
        }
      })
      .addCase(deleteAdminServiceRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete service request.";
      })
      // deleteAllAdminServiceRequests
      .addCase(deleteAllAdminServiceRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllAdminServiceRequests.fulfilled, (state) => {
        state.loading = false;
        state.serviceRequests = []; // Clear all requests
        state.selectedServiceRequest = null;
        state.pagination = {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 10,
        };
      })
      .addCase(deleteAllAdminServiceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to delete all service requests.";
      });
  },
});

export const { clearAdminServiceRequestError, clearSelectedServiceRequest } =
  adminServiceRequestSlice.actions;

export default adminServiceRequestSlice.reducer;
