import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminProductApi } from "../../services/adminProductApi";
import { showSnackbar } from "../slice/snackbarSlice"; // Import showSnackbar

// Async Thunk for fetching all admin products
export const fetchAdminProducts = createAsyncThunk(
  "adminProduct/fetchAdminProducts",
  async ({ queryParams }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminProductApi.getAllProducts(queryParams);
      return response; // Assuming response contains products and pagination info
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch products.";
      dispatch(showSnackbar({ message, severity: "error" })); // Use showSnackbar
      return rejectWithValue(message);
    }
  }
);

// Async Thunk for fetching a single admin product by ID
export const fetchAdminProductById = createAsyncThunk(
  "adminProduct/fetchAdminProductById",
  async ({ productId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminProductApi.getProductById(productId);
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch product details.";
      dispatch(showSnackbar({ message, severity: "error" })); // Use showSnackbar
      return rejectWithValue(message);
    }
  }
);

// Async Thunk for updating an admin product
export const updateAdminProduct = createAsyncThunk(
  "adminProduct/updateAdminProduct",
  async ({ productId, formData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminProductApi.updateProduct(productId, formData);
      dispatch(
        showSnackbar({
          message: response.message || "Product updated successfully!",
          severity: "success",
        })
      ); // Use showSnackbar
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to update product.";
      dispatch(showSnackbar({ message, severity: "error" })); // Use showSnackbar
      return rejectWithValue(message);
    }
  }
);

// Async Thunk for deleting an admin product
export const deleteAdminProduct = createAsyncThunk(
  "adminProduct/deleteAdminProduct",
  async ({ productId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminProductApi.deleteProduct(productId);
      dispatch(
        showSnackbar({
          message: response.message || "Product deleted successfully!",
          severity: "success",
        })
      ); // Use showSnackbar
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete product.";
      dispatch(showSnackbar({ message, severity: "error" })); // Use showSnackbar
      return rejectWithValue(message);
    }
  }
);

// Async Thunk for deleting multiple admin products
export const deleteMultipleAdminProducts = createAsyncThunk(
  "adminProduct/deleteMultipleAdminProducts",
  async ({ productIds }, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminProductApi.deleteMultipleProducts(productIds);
      dispatch(
        showSnackbar({
          message:
            response.message ||
            `${response.deletedCount} products deleted successfully!`,
          severity: "success",
        })
      ); // Use showSnackbar
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete multiple products.";
      dispatch(showSnackbar({ message, severity: "error" })); // Use showSnackbar
      return rejectWithValue(message);
    }
  }
);
