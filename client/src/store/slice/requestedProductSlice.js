// src/store/slice/requestedProductSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchRequestedProducts,
  fetchRequestedProductByIdThunk,
  addRequestedProductThunk,
  editRequestedProductThunk,
  deleteRequestedProductThunk,
  fetchMyRequestedProductsThunk,
  searchRequestedProductsThunk,
  fetchLatestRequestedProducts,
} from "../thunks/requestedProductThunks";

const initialPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 12,
};

const initialState = {
  // For public requested product listings
  requestedProducts: [],
  pagination: { ...initialPagination },
  listStatus: "idle",
  listError: null,

  // For viewing a single requested product detail
  currentRequestedProduct: null,
  detailStatus: "idle",
  detailError: null,

  // For user's own requested products ("My Requested Products" page)
  myRequestedProducts: [],
  myRequestedProductsPagination: { ...initialPagination },
  myRequestedProductsStatus: "idle",
  myRequestedProductsError: null,

  // For CRUD actions (add, edit, delete)
  actionStatus: "idle",
  actionError: null,

  // For Requested Product Search Results
  requestedSearchResults: [],
  requestedSearchPagination: { ...initialPagination },
  requestedSearchStatus: "idle",
  requestedSearchError: null,

  // For Latest Requested Products
  latestRequestedProducts: [],
  latestRequestedProductsStatus: "idle",
  latestRequestedProductsError: null,
};

const requestedProductSlice = createSlice({
  name: "requestedProduct",
  initialState,
  reducers: {
    clearRequestedProductDetailState: (state) => {
      state.currentRequestedProduct = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
    clearRequestedProductActionState: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearRequestedProductListState: (state) => {
      state.requestedProducts = [];
      state.pagination = { ...initialPagination };
      state.listStatus = "idle";
      state.listError = null;
    },
    clearMyRequestedProductsState: (state) => {
      state.myRequestedProducts = [];
      state.myRequestedProductsPagination = { ...initialPagination };
      state.myRequestedProductsStatus = "idle";
      state.myRequestedProductsError = null;
    },
    clearRequestedProductSearchState: (state) => {
      state.requestedSearchResults = [];
      state.requestedSearchPagination = { ...initialPagination };
      state.requestedSearchStatus = "idle";
      state.requestedSearchError = null;
    },
    clearLatestRequestedProductsState: (state) => {
      state.latestRequestedProducts = [];
      state.latestRequestedProductsStatus = "idle";
      state.latestRequestedProductsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequestedProducts.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchRequestedProducts.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.requestedProducts = action.payload.requestedProducts || [];
        state.pagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchRequestedProducts.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError =
          action.payload?.message || "Failed to fetch requested products";
      })

      .addCase(fetchLatestRequestedProducts.pending, (state) => {
        state.latestRequestedProductsStatus = "loading";
        state.latestRequestedProductsError = null;
      })
      .addCase(fetchLatestRequestedProducts.fulfilled, (state, action) => {
        state.latestRequestedProductsStatus = "succeeded";
        state.latestRequestedProducts = action.payload.requestedProducts || [];
      })
      .addCase(fetchLatestRequestedProducts.rejected, (state, action) => {
        state.latestRequestedProductsStatus = "failed";
        state.latestRequestedProductsError =
          action.payload?.message ||
          "Failed to fetch latest requested products";
      })

      .addCase(fetchRequestedProductByIdThunk.pending, (state) => {
        state.detailStatus = "loading";
        state.currentRequestedProduct = null;
        state.detailError = null;
      })
      .addCase(fetchRequestedProductByIdThunk.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.currentRequestedProduct = action.payload;
      })
      .addCase(fetchRequestedProductByIdThunk.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError =
          action.payload?.message ||
          "Failed to fetch requested product details";
      })

      .addCase(addRequestedProductThunk.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(addRequestedProductThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        if (action.payload.requestedProduct) {
          state.myRequestedProducts.unshift(action.payload.requestedProduct);
          if (state.myRequestedProductsPagination)
            state.myRequestedProductsPagination.totalItems += 1;
        }
      })
      .addCase(addRequestedProductThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError =
          action.payload?.message || "Failed to add requested product.";
      })

      .addCase(editRequestedProductThunk.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(editRequestedProductThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const updatedRequestedProduct = action.payload.requestedProduct;
        if (updatedRequestedProduct) {
          state.requestedProducts = state.requestedProducts.map((p) =>
            p._id === updatedRequestedProduct._id ? updatedRequestedProduct : p
          );
          state.myRequestedProducts = state.myRequestedProducts.map((p) =>
            p._id === updatedRequestedProduct._id ? updatedRequestedProduct : p
          );
          if (
            state.currentRequestedProduct?._id === updatedRequestedProduct._id
          ) {
            state.currentRequestedProduct = updatedRequestedProduct;
          }
        }
      })
      .addCase(editRequestedProductThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError =
          action.payload?.message || "Failed to update requested product.";
      })

      .addCase(deleteRequestedProductThunk.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(deleteRequestedProductThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const { requestedProductId: removedId } = action.payload;
        state.requestedProducts = state.requestedProducts.filter(
          (p) => p._id !== removedId
        );
        state.myRequestedProducts = state.myRequestedProducts.filter(
          (p) => p._id !== removedId
        );
        if (state.currentRequestedProduct?._id === removedId) {
          state.currentRequestedProduct = null;
          state.detailStatus = "idle";
        }
        if (
          state.myRequestedProductsPagination &&
          state.myRequestedProducts.some((p) => p._id === removedId)
        ) {
          state.myRequestedProductsPagination.totalItems = Math.max(
            0,
            state.myRequestedProductsPagination.totalItems - 1
          );
        }
        if (
          state.pagination &&
          state.requestedProducts.some((p) => p._id === removedId)
        ) {
          state.pagination.totalItems = Math.max(
            0,
            state.pagination.totalItems - 1
          );
        }
      })
      .addCase(deleteRequestedProductThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError =
          action.payload?.message || "Failed to delete requested product.";
      })

      .addCase(fetchMyRequestedProductsThunk.pending, (state) => {
        state.myRequestedProductsStatus = "loading";
        state.myRequestedProductsError = null;
      })
      .addCase(fetchMyRequestedProductsThunk.fulfilled, (state, action) => {
        state.myRequestedProductsStatus = "succeeded";
        state.myRequestedProducts = action.payload.requestedProducts || [];
        state.myRequestedProductsPagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchMyRequestedProductsThunk.rejected, (state, action) => {
        state.myRequestedProductsStatus = "failed";
        state.myRequestedProductsError =
          action.payload?.message || "Failed to fetch your requested products";
      })

      .addCase(searchRequestedProductsThunk.pending, (state) => {
        state.requestedSearchStatus = "loading";
        state.requestedSearchError = null;
      })
      .addCase(searchRequestedProductsThunk.fulfilled, (state, action) => {
        state.requestedSearchStatus = "succeeded";
        state.requestedSearchResults = action.payload.requestedProducts || [];
        state.requestedSearchPagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(searchRequestedProductsThunk.rejected, (state, action) => {
        state.requestedSearchStatus = "failed";
        state.requestedSearchError =
          action.payload?.message || "Failed to search requested products";
        if (action.payload && action.payload.requestedProducts === null) {
          state.requestedSearchResults = [];
          state.requestedSearchPagination = { ...initialPagination };
        }
      });
  },
});

export const {
  clearRequestedProductDetailState,
  clearRequestedProductActionState,
  clearRequestedProductListState,
  clearMyRequestedProductsState,
  clearRequestedProductSearchState,
  clearLatestRequestedProductsState,
} = requestedProductSlice.actions;

// Selectors for Requested Product Slice
export const selectAllRequestedProducts = (state) =>
  state.requestedProduct.requestedProducts;
export const selectRequestedProductPagination = (state) =>
  state.requestedProduct.pagination;
export const selectRequestedProductListStatus = (state) =>
  state.requestedProduct.listStatus;
export const selectRequestedProductListError = (state) =>
  state.requestedProduct.listError;

export const selectCurrentRequestedProductDetail = (state) =>
  state.requestedProduct.currentRequestedProduct;
export const selectRequestedProductDetailStatus = (state) =>
  state.requestedProduct.detailStatus;
export const selectRequestedProductDetailError = (state) =>
  state.requestedProduct.detailError;

export const selectMyRequestedProducts = (state) =>
  state.requestedProduct.myRequestedProducts;
export const selectMyRequestedProductsPagination = (state) =>
  state.requestedProduct.myRequestedProductsPagination;
export const selectMyRequestedProductsStatus = (state) =>
  state.requestedProduct.myRequestedProductsStatus;
export const selectMyRequestedProductsError = (state) =>
  state.requestedProduct.myRequestedProductsError;

export const selectRequestedProductActionStatus = (state) =>
  state.requestedProduct.actionStatus;
export const selectRequestedProductActionError = (state) =>
  state.requestedProduct.actionError;

// Selectors for Requested Product Search
export const selectRequestedSearchResults = (state) =>
  state.requestedProduct.requestedSearchResults;
export const selectRequestedSearchStatus = (state) =>
  state.requestedProduct.requestedSearchStatus;
export const selectRequestedSearchError = (state) =>
  state.requestedProduct.requestedSearchError;
export const selectRequestedSearchPagination = (state) =>
  state.requestedProduct.requestedSearchPagination;

// Selectors for Latest Requested Products
export const selectLatestRequestedProducts = (state) =>
  state.requestedProduct.latestRequestedProducts;
export const selectLatestRequestedProductsStatus = (state) =>
  state.requestedProduct.latestRequestedProductsStatus;
export const selectLatestRequestedProductsError = (state) =>
  state.requestedProduct.latestRequestedProductsError;

export default requestedProductSlice.reducer;
