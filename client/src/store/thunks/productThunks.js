// src/store/thunks/productThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { productApi } from "../../services/productApi";

// Fetch a list of products (public, paginated, filterable)
export const fetchProducts = createAsyncThunk(
  "product/fetchProducts",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await productApi.getProducts(queryParams);
      return response.data; // Expects { products: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch products" }
      );
    }
  }
);

export const fetchLatestProducts = createAsyncThunk(
  "product/fetchLatestProducts", // <<<< New action type prefix
  async (queryParams = { sortBy: "newest", limit: 4 }, { rejectWithValue }) => {
    // Default params for "latest"
    try {
      // Internally, this could call productApi.getProducts or a specific "latest" endpoint if you had one
      const response = await productApi.getProducts({
        sortBy: queryParams.sortBy || "newest", // Default to newest
        limit: queryParams.limit || 4, // Default limit
        ...queryParams, // Allow overriding defaults
      });
      return response.data; // Expects { products: [], pagination: {} (or just products array) }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch latest products" }
      );
    }
  }
);

// Fetch a single product by its ID
export const fetchProductByIdThunk = createAsyncThunk(
  "product/fetchById",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await productApi.getProductById(productId);
      return response.data; // Expects the product object
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch product details" }
      );
    }
  }
);

// Add a new product (seller action)
export const addProductThunk = createAsyncThunk(
  "product/addProduct",
  async (productFormData, { rejectWithValue }) => {
    try {
      const response = await productApi.createProduct(productFormData);
      return response.data; // Expects { message: "...", product: newProduct }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add product" }
      );
    }
  }
);

// Edit an existing product (seller action)
export const editProductThunk = createAsyncThunk(
  "product/editProduct",
  async ({ productId, productFormData }, { rejectWithValue }) => {
    try {
      const response = await productApi.updateProduct(
        productId,
        productFormData
      );
      return response.data; // Expects { message: "...", product: updatedProduct }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update product" }
      );
    }
  }
);

// Delete a product (seller action)
export const deleteProductThunk = createAsyncThunk(
  "product/deleteProduct",
  async (productId, { rejectWithValue }) => {
    try {
      await productApi.deleteProduct(productId);
      return { productId }; // Return ID for reducer to remove from state
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete product" }
      );
    }
  }
);

// Fetch products listed by the current seller
export const fetchMyProductsThunk = createAsyncThunk(
  "product/fetchMyProducts",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await productApi.getMyProducts(queryParams);
      return response.data; // Expects { products: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch your products" }
      );
    }
  }
);

// Search for products using the dedicated search endpoint
export const searchProductsThunk = createAsyncThunk(
  // <<<--- UNCOMMENTED AND DEFINED
  "product/searchProducts",
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const response = await productApi.searchProducts(queryParams); // Calls the new API function
      return response.data; // Expects { products: [], pagination: {} }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to search products" }
      );
    }
  }
);
