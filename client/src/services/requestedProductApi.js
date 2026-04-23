// src/services/requestedProductApi.js
import { API } from "./apis"; // Your configured Axios instance

// Fetch requested products list (filtered/paginated) - for public browsing
const getRequestedProducts = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/requested-products?${params.toString()}`); // Matches backend GET /api/requested-products
};

// Create a new requested product (for authenticated users)
const createRequestedProduct = (requestedProductFormData) =>
  API.post("/requested-products", requestedProductFormData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Update an existing requested product (for requester or admin)
const updateRequestedProduct = (requestedProductId, requestedProductFormData) =>
  API.put(
    `/requested-products/${requestedProductId}`,
    requestedProductFormData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

// Delete a requested product (for requester or admin)
const deleteRequestedProduct = (requestedProductId) =>
  API.delete(`/requested-products/${requestedProductId}`);

// Get details of a single requested product by ID (public, with auth check in backend)
const getRequestedProductById = (requestedProductId) =>
  API.get(`/requested-products/${requestedProductId}`);

// Search requested products
const searchRequestedProducts = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/requested-products/search?${params.toString()}`); // Calls GET /api/requested-products/search
};

// Get requested products created by the logged-in user ("My Requested Products")
const getMyRequestedProducts = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/requested-products/my-requests?${params.toString()}`);
};

export const requestedProductApi = {
  getRequestedProducts,
  createRequestedProduct,
  updateRequestedProduct,
  deleteRequestedProduct,
  getRequestedProductById,
  searchRequestedProducts,
  getMyRequestedProducts,
};
