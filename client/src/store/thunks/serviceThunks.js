// src/store/thunks/serviceThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
// Import your API functions for services
// Assuming they are now grouped in serviceApi.js or still in apis.js
import { serviceApi } from "../../services/serviceApi"; // OR import { getServices, createService, ... } from "../../services/apis";

export const fetchServices = createAsyncThunk(
  "service/fetchServices",
  async (query, { rejectWithValue }) => {
    try {
      const response = await serviceApi.getServices(query); // Using serviceApi
      return response.data; // Expects { services: [], pagination: {} } or just services []
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch services",
        }
      );
    }
  }
);

export const fetchSubCategoryServices = createAsyncThunk(
  "service/fetchSubCategoryServices",
  async ({ category, subcategory }, { rejectWithValue }) => {
    try {
      // Assuming getServices can handle category/subcategory
      const response = await serviceApi.getServices({ category, subcategory });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch subcategory services",
        }
      );
    }
  }
);

export const addService = createAsyncThunk(
  "service/addService",
  async (serviceFormData, { rejectWithValue }) => {
    try {
      const response = await serviceApi.createService(serviceFormData);
      return response.data;
    } catch (error) {
      console.error(
        "Error in addService thunk:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to add service",
        }
      );
    }
  }
);

export const editService = createAsyncThunk(
  "service/editService",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await serviceApi.updateService(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to update service",
        }
      );
    }
  }
);

export const removeService = createAsyncThunk(
  "service/removeService",
  async (id, { rejectWithValue }) => {
    try {
      // Backend delete might return just a success message or the ID of the deleted item
      await serviceApi.deleteService(id);
      return { id }; // Return the ID for reducer to identify which service to remove
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to delete service",
        }
      );
    }
  }
);

export const searchServices = createAsyncThunk(
  "service/searchServices",
  async (query, { rejectWithValue }) => {
    try {
      const response = await serviceApi.searchService(query); // Assuming searchService is in serviceApi
      return response.data; // Expects { services: [], pagination: {} } or just services []
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to search services",
        }
      );
    }
  }
);

export const fetchServiceById = createAsyncThunk(
  "service/fetchServiceById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await serviceApi.getServiceById(id);
      return response.data; // Expects { service, average_rating, review_count }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch service details",
        }
      );
    }
  }
);

export const fetchLatestServices = createAsyncThunk(
  "service/fetchLatestServices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceApi.getLatestServices();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch latest services",
        }
      );
    }
  }
);

export const fetchMyServices = createAsyncThunk(
  "service/fetchMyServices",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await serviceApi.getMyServices(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch your services",
        }
      );
    }
  }
);
