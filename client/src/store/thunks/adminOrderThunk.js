import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllAdminOrders,
  getAdminOrderById,
  updateAdminOrder,
  deleteAdminOrder,
  deleteMultipleAdminOrders,
} from "../../services/adminOrderApi";

// Thunk for fetching all admin orders
export const fetchAllAdminOrders = createAsyncThunk(
  "adminOrders/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getAllAdminOrders(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk for fetching a single admin order by ID
export const fetchAdminOrderById = createAsyncThunk(
  "adminOrders/fetchById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await getAdminOrderById(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk for updating an admin order
export const updateAdminOrderThunk = createAsyncThunk(
  "adminOrders/update",
  async ({ orderId, data }, { rejectWithValue }) => {
    try {
      const response = await updateAdminOrder(orderId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk for deleting a single admin order
export const deleteAdminOrderThunk = createAsyncThunk(
  "adminOrders/delete",
  async (orderId, { rejectWithValue }) => {
    try {
      await deleteAdminOrder(orderId);
      return orderId; // Return the ID of the deleted order for state update
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Thunk for deleting multiple admin orders
export const deleteMultipleAdminOrdersThunk = createAsyncThunk(
  "adminOrders/deleteMultiple",
  async (ids, { rejectWithValue }) => {
    try {
      await deleteMultipleAdminOrders(ids);
      return ids; // Return the IDs of the deleted orders for state update
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
