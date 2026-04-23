import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllAdminOrders,
  fetchAdminOrderById,
  updateAdminOrderThunk,
  deleteAdminOrderThunk,
  deleteMultipleAdminOrdersThunk,
} from "../thunks/adminOrderThunk";

const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState: {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    // For pagination/filtering metadata if needed
    totalOrders: 0,
    currentPage: 1,
    totalPages: 1,
  },
  reducers: {
    clearAdminOrdersError: (state) => {
      state.error = null;
    },
    clearCurrentAdminOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAllAdminOrders
      .addCase(fetchAllAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload; // Assuming payload is the array of orders
        state.totalOrders = action.payload.length; // Adjust if API returns total count
        state.error = null;
      })
      .addCase(fetchAllAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch orders.";
      })
      // fetchAdminOrderById
      .addCase(fetchAdminOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentOrder = null;
      })
      .addCase(fetchAdminOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchAdminOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch order details.";
      })
      // updateAdminOrderThunk
      .addCase(updateAdminOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminOrderThunk.fulfilled, (state, action) => {
        state.loading = false;
        // Update the order in the list if it exists
        const index = state.orders.findIndex(
          (order) => order._id === action.payload.order._id
        );
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
        // If currentOrder is being viewed, update it too
        if (state.currentOrder?._id === action.payload.order._id) {
          state.currentOrder = action.payload.order;
        }
        state.error = null;
      })
      .addCase(updateAdminOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update order.";
      })
      // deleteAdminOrderThunk
      .addCase(deleteAdminOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdminOrderThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter(
          (order) => order._id !== action.payload
        );
        state.totalOrders = state.orders.length;
        state.error = null;
      })
      .addCase(deleteAdminOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete order.";
      })
      // deleteMultipleAdminOrdersThunk
      .addCase(deleteMultipleAdminOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleAdminOrdersThunk.fulfilled, (state, action) => {
        state.loading = false;
        const deletedIds = action.payload; // Array of IDs
        state.orders = state.orders.filter(
          (order) => !deletedIds.includes(order._id)
        );
        state.totalOrders = state.orders.length;
        state.error = null;
      })
      .addCase(deleteMultipleAdminOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete multiple orders.";
      });
  },
});

export const { clearAdminOrdersError, clearCurrentAdminOrder } =
  adminOrdersSlice.actions;

export default adminOrdersSlice.reducer;
