import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAdminProducts,
  fetchAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
  deleteMultipleAdminProducts,
} from "../thunks/adminProductThunk";

const initialState = {
  products: [],
  product: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12,
  },
};

const adminProductSlice = createSlice({
  name: "adminProduct",
  initialState,
  reducers: {
    // You can add synchronous reducers here if needed
    clearProductError: (state) => {
      state.error = null;
    },
    resetProductState: (state) => {
      state.products = [];
      state.product = null;
      state.loading = false;
      state.error = null;
      state.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 12,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchAdminProducts ---
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.products = []; // Clear products on error
        state.pagination = initialState.pagination; // Reset pagination on error
      })

      // --- fetchAdminProductById ---
      .addCase(fetchAdminProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.product = null; // Clear previous product
      })
      .addCase(fetchAdminProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchAdminProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.product = null;
      })

      // --- updateAdminProduct ---
      .addCase(updateAdminProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload.product; // Update the single product if it's the one being viewed
        // Also update in the products list if present
        const index = state.products.findIndex(
          (p) => p._id === action.payload.product._id
        );
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
      })
      .addCase(updateAdminProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- deleteAdminProduct ---
      .addCase(deleteAdminProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdminProduct.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted product from the list
        state.products = state.products.filter(
          (product) => product._id !== action.meta.arg.productId
        );
        state.pagination.totalItems -= 1; // Decrement total items
        // Recalculate totalPages if necessary (optional, can be done on next fetch)
        state.pagination.totalPages =
          Math.ceil(state.pagination.totalItems / state.pagination.limit) || 1;
      })
      .addCase(deleteAdminProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- deleteMultipleAdminProducts ---
      .addCase(deleteMultipleAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        const deletedIds = action.meta.arg.productIds;
        state.products = state.products.filter(
          (product) => !deletedIds.includes(product._id)
        );
        state.pagination.totalItems -= action.payload.deletedCount;
        state.pagination.totalPages =
          Math.ceil(state.pagination.totalItems / state.pagination.limit) || 1;
      })
      .addCase(deleteMultipleAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductError, resetProductState } =
  adminProductSlice.actions;

export default adminProductSlice.reducer;
