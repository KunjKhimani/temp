// src/services/productApi.js
import { API } from "./apis"; // Your configured Axios instance

// Fetch products list (filtered/paginated) - for public browsing
const getProducts = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/product?${params.toString()}`); // Matches backend GET /api/product
};

// Create a new product (for sellers)
const createProduct = (productFormData) =>
  API.post("/product", productFormData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Update an existing product (for sellers)
const updateProduct = (productId, productFormData) =>
  API.put(`/product/${productId}`, productFormData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Delete a product (for sellers)
const deleteProduct = (productId) => API.delete(`/product/${productId}`);

// Get details of a single product by ID (public)
const getProductById = (productId) => API.get(`/product/${productId}`);

// Search products
const searchProducts = (queryParams = {}) => {
  // <<<--- UNCOMMENTED AND IMPLEMENTED
  const params = new URLSearchParams(queryParams);
  return API.get(`/product/search?${params.toString()}`); // Calls GET /api/product/search
};

// Get products created by the logged-in seller ("My Products")
const getMyProducts = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  // Ensure you have a backend route like /api/product/my-products
  // or your getProducts controller handles a specific sellerId for auth user
  return API.get(`/product/my-products?${params.toString()}`);
};

export const productApi = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  searchProducts, // <<<--- ADDED TO EXPORTS
  getMyProducts,
};
