import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminServiceRequestApi } from "../../services/adminServiceRequestApi"; // Import the RTK Query API

// Thunk for fetching all admin service requests
export const fetchAllAdminServiceRequests = createAsyncThunk(
  "adminServiceRequests/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      // RTK Query's query functions return a promise that resolves with { data } or rejects with { error }
      const response =
        await adminServiceRequestApi.endpoints.getAllAdminServiceRequests
          .initiate(params)
          .unwrap();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Thunk for fetching a single admin service request by ID
export const fetchAdminServiceRequestById = createAsyncThunk(
  "adminServiceRequests/fetchById",
  async (requestId, { rejectWithValue }) => {
    try {
      const response =
        await adminServiceRequestApi.endpoints.getAdminServiceRequestById
          .initiate(requestId)
          .unwrap();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Thunk for updating an admin service request
export const updateAdminServiceRequest = createAsyncThunk(
  "adminServiceRequests/update",
  async ({ requestId, formData }, { rejectWithValue }) => {
    try {
      const response =
        await adminServiceRequestApi.endpoints.updateAdminServiceRequest
          .initiate({ requestId, formData })
          .unwrap();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Thunk for deleting a single admin service request
export const deleteAdminServiceRequest = createAsyncThunk(
  "adminServiceRequests/delete",
  async (requestId, { rejectWithValue }) => {
    try {
      const response =
        await adminServiceRequestApi.endpoints.deleteAdminServiceRequest
          .initiate(requestId)
          .unwrap();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Thunk for deleting all admin service requests
export const deleteAllAdminServiceRequests = createAsyncThunk(
  "adminServiceRequests/deleteAll",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await adminServiceRequestApi.endpoints.deleteAllAdminServiceRequests
          .initiate()
          .unwrap();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
