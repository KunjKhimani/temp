// src/store/slice/productSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchProducts,
  fetchProductByIdThunk,
  addProductThunk,
  editProductThunk,
  deleteProductThunk,
  fetchMyProductsThunk,
  searchProductsThunk,
  fetchLatestProducts,
} from "../thunks/productThunks";

const initialPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 12,
};

const initialState = {
  // For public product listings (e.g., general /products page if different from search)
  products: [],
  pagination: { ...initialPagination },
  listStatus: "idle",
  listError: null,

  // For viewing a single product detail
  currentProduct: null,
  detailStatus: "idle",
  detailError: null,

  // For seller's own products ("My Products" page)
  myProducts: [],
  myProductsPagination: { ...initialPagination },
  myProductsStatus: "idle",
  myProductsError: null,

  // For CRUD actions (add, edit, delete)
  actionStatus: "idle",
  actionError: null,

  // --- For Product Search Results ---
  searchResults: [], // <<<--- ADDED
  searchPagination: { ...initialPagination }, // <<<--- ADDED
  searchStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed' <<<--- ADDED
  searchError: null, // <<<--- ADDED

  // --- For Latest Products (if using a dedicated state slice for it) ---
  latestProducts: [], // <<<--- ADDED
  latestProductsStatus: "idle", // <<<--- ADDED
  latestProductsError: null, // <<<--- ADDED
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProductDetailState: (state) => {
      state.currentProduct = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
    clearProductActionState: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearProductListState: (state) => {
      state.products = [];
      state.pagination = { ...initialPagination };
      state.listStatus = "idle";
      state.listError = null;
    },
    clearMyProductsState: (state) => {
      state.myProducts = [];
      state.myProductsPagination = { ...initialPagination };
      state.myProductsStatus = "idle";
      state.myProductsError = null;
    },
    clearProductSearchState: (state) => {
      // <<<--- ADDED
      state.searchResults = [];
      state.searchPagination = { ...initialPagination };
      state.searchStatus = "idle";
      state.searchError = null;
    },
    clearLatestProductsState: (state) => {
      // <<<--- ADDED
      state.latestProducts = [];
      state.latestProductsStatus = "idle";
      state.latestProductsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ... (other existing .addCase for fetchProducts, fetchProductByIdThunk, etc.) ...
      .addCase(fetchProducts.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.products = action.payload.products || [];
        state.pagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload?.message || "Failed to fetch products";
      })

      // --- Handle fetchLatestProducts Thunk ---  <<<--- ADDED (if you created the new thunk)
      .addCase(fetchLatestProducts.pending, (state) => {
        state.latestProductsStatus = "loading";
        state.latestProductsError = null;
      })
      .addCase(fetchLatestProducts.fulfilled, (state, action) => {
        state.latestProductsStatus = "succeeded";
        // Assuming fetchLatestProducts returns { products: [...] }
        // If it also returns pagination, you might want to store it,
        // but for a "latest" list, usually just the products array is enough.
        state.latestProducts = action.payload.products || [];
      })
      .addCase(fetchLatestProducts.rejected, (state, action) => {
        state.latestProductsStatus = "failed";
        state.latestProductsError =
          action.payload?.message || "Failed to fetch latest products";
      })

      .addCase(fetchProductByIdThunk.pending, (state) => {
        state.detailStatus = "loading";
        state.currentProduct = null;
        state.detailError = null;
      })
      .addCase(fetchProductByIdThunk.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductByIdThunk.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError =
          action.payload?.message || "Failed to fetch product details";
      })

      .addCase(addProductThunk.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(addProductThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        if (action.payload.product) {
          state.myProducts.unshift(action.payload.product);
          if (state.myProductsPagination)
            state.myProductsPagination.totalItems += 1;
        }
      })
      .addCase(addProductThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload?.message || "Failed to add product.";
      })

      .addCase(editProductThunk.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(editProductThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const updatedProduct = action.payload.product;
        if (updatedProduct) {
          state.products = state.products.map((p) =>
            p._id === updatedProduct._id ? updatedProduct : p
          );
          state.myProducts = state.myProducts.map((p) =>
            p._id === updatedProduct._id ? updatedProduct : p
          );
          if (state.currentProduct?._id === updatedProduct._id) {
            state.currentProduct = updatedProduct;
          }
        }
      })
      .addCase(editProductThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError =
          action.payload?.message || "Failed to update product.";
      })

      .addCase(deleteProductThunk.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
      })
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const { productId: removedId } = action.payload;
        state.products = state.products.filter((p) => p._id !== removedId);
        state.myProducts = state.myProducts.filter((p) => p._id !== removedId);
        if (state.currentProduct?._id === removedId) {
          state.currentProduct = null;
          state.detailStatus = "idle";
        }
        if (
          state.myProductsPagination &&
          state.myProducts.some((p) => p._id === removedId)
        ) {
          state.myProductsPagination.totalItems = Math.max(
            0,
            state.myProductsPagination.totalItems - 1
          );
        }
        if (
          state.pagination &&
          state.products.some((p) => p._id === removedId)
        ) {
          state.pagination.totalItems = Math.max(
            0,
            state.pagination.totalItems - 1
          );
        }
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError =
          action.payload?.message || "Failed to delete product.";
      })

      .addCase(fetchMyProductsThunk.pending, (state) => {
        state.myProductsStatus = "loading";
        state.myProductsError = null;
      })
      .addCase(fetchMyProductsThunk.fulfilled, (state, action) => {
        state.myProductsStatus = "succeeded";
        state.myProducts = action.payload.products || [];
        state.myProductsPagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(fetchMyProductsThunk.rejected, (state, action) => {
        state.myProductsStatus = "failed";
        state.myProductsError =
          action.payload?.message || "Failed to fetch your products";
      })

      // --- Handle Product Search Thunk ---  <<<--- ADDED
      .addCase(searchProductsThunk.pending, (state) => {
        state.searchStatus = "loading";
        state.searchError = null;
      })
      .addCase(searchProductsThunk.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload.products || [];
        state.searchPagination = action.payload.pagination || {
          ...initialPagination,
        };
      })
      .addCase(searchProductsThunk.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError =
          action.payload?.message || "Failed to search products";
        // If API returns 400 for "no criteria", the message from backend will be here.
        // If the payload contains products and pagination even on error (e.g. 400 from backend with a message),
        // you might want to clear them or handle them.
        // For now, just setting error and status.
        if (action.payload && action.payload.products === null) {
          // specific check if backend sends null products on error
          state.searchResults = [];
          state.searchPagination = { ...initialPagination };
        }
      });
  },
});

export const {
  clearProductDetailState,
  clearProductActionState,
  clearProductListState,
  clearMyProductsState,
  clearProductSearchState, // <<<--- EXPORTED
} = productSlice.actions;

// --- Selectors for Product Slice ---
// ... (existing selectors for list, detail, myProducts, action) ...
export const selectAllProducts = (state) => state.product.products;
export const selectProductPagination = (state) => state.product.pagination;
export const selectProductListStatus = (state) => state.product.listStatus;
export const selectProductListError = (state) => state.product.listError;

export const selectCurrentProductDetail = (state) =>
  state.product.currentProduct;
export const selectProductDetailStatus = (state) => state.product.detailStatus;
export const selectProductDetailError = (state) => state.product.detailError;

export const selectMyProducts = (state) => state.product.myProducts;
export const selectMyProductsPagination = (state) =>
  state.product.myProductsPagination;
export const selectMyProductsStatus = (state) => state.product.myProductsStatus;
export const selectMyProductsError = (state) => state.product.myProductsError;

export const selectProductActionStatus = (state) => state.product.actionStatus;
export const selectProductActionError = (state) => state.product.actionError;

// --- Selectors for Product Search ---  <<<--- UNCOMMENTED AND CORRECTED
export const selectProductSearchResults = (state) =>
  state.product.searchResults;
export const selectProductSearchStatus = (state) => state.product.searchStatus;
export const selectProductSearchError = (state) => state.product.searchError;
export const selectProductSearchPagination = (state) =>
  state.product.searchPagination;

// --- Selectors for Latest Products --- <<<--- ADDED
export const selectLatestProducts = (state) => state.product.latestProducts;
export const selectLatestProductsStatus = (state) =>
  state.product.latestProductsStatus;
export const selectLatestProductsError = (state) =>
  state.product.latestProductsError;

export default productSlice.reducer;
