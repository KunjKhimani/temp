/* eslint-disable no-unused-vars */
import { createAsyncThunk } from "@reduxjs/toolkit";
import adminService from "../services/adminService";

// Get all services for admin
export const getAllServicesAdmin = createAsyncThunk(
  "adminServices/getAll",
  async (params, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token"); // Get token directly from localStorage
      if (!token) {
        console.error(
          "getAllServicesAdmin Thunk: No authentication token found."
        );
        return rejectWithValue("No authentication token found. Please log in.");
      }
      console.log(
        "getAllServicesAdmin Thunk: Token present, fetching services..."
      );
      const responseData = await adminService.getAllServicesAdmin(
        params,
        token
      );
      console.log("getAllServicesAdmin Thunk: API Response:", responseData);
      return responseData;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      console.error(
        "getAllServicesAdmin Thunk: Error fetching services:",
        error.response?.data || error.message
      );
      return rejectWithValue(message);
    }
  }
);

// Get a single service for admin
export const getSingleServiceAdmin = createAsyncThunk(
  "adminServices/getSingle",
  async (serviceId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token"); // Get token directly from localStorage
      return await adminService.getSingleServiceAdmin(serviceId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

// Update a service for admin
export const updateServiceAdmin = createAsyncThunk(
  "adminServices/update",
  async ({ serviceId, serviceData }, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token"); // Get token directly from localStorage
      return await adminService.updateServiceAdmin(
        serviceId,
        serviceData,
        token
      );
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

// Delete a single service for admin
export const deleteServiceAdmin = createAsyncThunk(
  "adminServices/delete",
  async (serviceId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token"); // Get token directly from localStorage
      return await adminService.deleteServiceAdmin(serviceId, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);

// Delete multiple services for admin
export const deleteMultipleServicesAdmin = createAsyncThunk(
  "adminServices/deleteMultiple",
  async (serviceIds, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token"); // Get token directly from localStorage
      return await adminService.deleteMultipleServicesAdmin(serviceIds, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return rejectWithValue(message);
    }
  }
);
