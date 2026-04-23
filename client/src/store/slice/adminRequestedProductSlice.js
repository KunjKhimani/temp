import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllRequestedProducts,
  fetchRequestedProductById,
  updateRequestedProductThunk,
  deleteRequestedProductThunk,
  deleteMultipleRequestedProductsThunk,
} from "../thunks/adminRequestedProductThunk";

const adminRequestedProductSlice = createSlice({
  name: "adminRequestedProducts",
  initialState: {
    requestedProducts: [],
    selectedRequestedProduct: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetRequestedProductState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllRequestedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchAllRequestedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.requestedProducts = action.payload;
        state.success = true;
      })
      .addCase(fetchAllRequestedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Fetch By ID
      .addCase(fetchRequestedProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(fetchRequestedProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRequestedProduct = action.payload;
        state.success = true;
      })
      .addCase(fetchRequestedProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Update
      .addCase(updateRequestedProductThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateRequestedProductThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.requestedProducts = state.requestedProducts.map((product) =>
          product._id === action.payload._id ? action.payload : product
        );
        state.selectedRequestedProduct = action.payload;
        state.success = true;
      })
      .addCase(updateRequestedProductThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete
      .addCase(deleteRequestedProductThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteRequestedProductThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.requestedProducts = state.requestedProducts.filter(
          (product) => product._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteRequestedProductThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete Multiple
      .addCase(deleteMultipleRequestedProductsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        deleteMultipleRequestedProductsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.requestedProducts = state.requestedProducts.filter(
            (product) => !action.payload.includes(product._id)
          );
          state.success = true;
        }
      )
      .addCase(
        deleteMultipleRequestedProductsThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
          state.success = false;
        }
      );
  },
});

export const { resetRequestedProductState } =
  adminRequestedProductSlice.actions;

export default adminRequestedProductSlice.reducer;

// Selectors
export const selectRequestedProducts = (state) =>
  state.adminRequestedProducts.requestedProducts;
export const selectRequestedProductLoading = (state) =>
  state.adminRequestedProducts.loading;
export const selectRequestedProductError = (state) =>
  state.adminRequestedProducts.error;
export const selectRequestedProductSuccess = (state) =>
  state.adminRequestedProducts.success;
export const selectSelectedRequestedProduct = (state) =>
  state.adminRequestedProducts.selectedRequestedProduct;
