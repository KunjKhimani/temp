import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllRequestedProducts,
  getRequestedProductById,
  updateRequestedProduct,
  deleteRequestedProduct,
  deleteMultipleRequestedProducts,
} from "../../services/adminRequestedProductApi";

export const fetchAllRequestedProducts = createAsyncThunk(
  "adminRequestedProducts/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAllRequestedProducts(params);
      return Array.isArray(response.data.data) ? response.data.data : []; // Ensure payload is an array
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchRequestedProductById = createAsyncThunk(
  "adminRequestedProducts/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getRequestedProductById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateRequestedProductThunk = createAsyncThunk(
  "adminRequestedProducts/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateRequestedProduct(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteRequestedProductThunk = createAsyncThunk(
  "adminRequestedProducts/delete",
  async (id, { rejectWithValue }) => {
    try {
      await deleteRequestedProduct(id);
      return id; // Return the ID of the deleted product
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteMultipleRequestedProductsThunk = createAsyncThunk(
  "adminRequestedProducts/deleteMultiple",
  async (ids, { rejectWithValue }) => {
    try {
      await deleteMultipleRequestedProducts(ids);
      return ids; // Return the IDs of the deleted products
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
