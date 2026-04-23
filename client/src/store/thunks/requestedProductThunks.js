// src/store/thunks/requestedProductThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { requestedProductApi } from "../../services/requestedProductApi";

// Fetch a list of requested products (public, paginated, filterable)
export const fetchRequestedProducts = createAsyncThunk(
  "requestedProduct/fetchRequestedProducts",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await requestedProductApi.getRequestedProducts(
        queryParams
      );
      return response.data; // Expects { requestedProducts: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch requested products",
        }
      );
    }
  }
);

export const fetchLatestRequestedProducts = createAsyncThunk(
  "requestedProduct/fetchLatestRequestedProducts",
  async (queryParams = { sortBy: "newest", limit: 4 }, { rejectWithValue }) => {
    try {
      const response = await requestedProductApi.getRequestedProducts({
        sortBy: queryParams.sortBy || "newest",
        limit: queryParams.limit || 4,
        ...queryParams,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch latest requested products",
        }
      );
    }
  }
);

// Fetch a single requested product by its ID
export const fetchRequestedProductByIdThunk = createAsyncThunk(
  "requestedProduct/fetchById",
  async (requestedProductId, { rejectWithValue }) => {
    try {
      const response = await requestedProductApi.getRequestedProductById(
        requestedProductId
      );
      return response.data; // Expects the requested product object
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch requested product details",
        }
      );
    }
  }
);

// Add a new requested product (user action)
export const addRequestedProductThunk = createAsyncThunk(
  "requestedProduct/addRequestedProduct",
  async (requestedProductFormData, { rejectWithValue }) => {
    try {
      const response = await requestedProductApi.createRequestedProduct(
        requestedProductFormData
      );
      return response.data; // Expects { message: "...", requestedProduct: newRequestedProduct }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add requested product" }
      );
    }
  }
);

// Edit an existing requested product (requester or admin action)
export const editRequestedProductThunk = createAsyncThunk(
  "requestedProduct/editRequestedProduct",
  async (
    { requestedProductId, requestedProductFormData },
    { rejectWithValue }
  ) => {
    try {
      const response = await requestedProductApi.updateRequestedProduct(
        requestedProductId,
        requestedProductFormData
      );
      return response.data; // Expects { message: "...", requestedProduct: updatedRequestedProduct }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to update requested product",
        }
      );
    }
  }
);

// Delete a requested product (requester or admin action)
export const deleteRequestedProductThunk = createAsyncThunk(
  "requestedProduct/deleteRequestedProduct",
  async (requestedProductId, { rejectWithValue }) => {
    try {
      await requestedProductApi.deleteRequestedProduct(requestedProductId);
      return { requestedProductId }; // Return ID for reducer to remove from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to delete requested product",
        }
      );
    }
  }
);

// Fetch requested products created by the current user
export const fetchMyRequestedProductsThunk = createAsyncThunk(
  "requestedProduct/fetchMyRequestedProducts",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await requestedProductApi.getMyRequestedProducts(
        queryParams
      );
      return response.data; // Expects { requestedProducts: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to fetch your requested products",
        }
      );
    }
  }
);

// Search for requested products using the dedicated search endpoint
export const searchRequestedProductsThunk = createAsyncThunk(
  "requestedProduct/searchRequestedProducts",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await requestedProductApi.searchRequestedProducts(
        queryParams
      );
      return response.data; // Expects { requestedProducts: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: "Failed to search requested products",
        }
      );
    }
  }
);
