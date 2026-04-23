import { API } from "./apis"; // Assuming API instance is exported from apis.js

// Admin Requested Product Endpoints
const getAllRequestedProducts = (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return API.get(`/admin/requested-products?${queryParams.toString()}`);
};

const getRequestedProductById = (id) =>
  API.get(`/admin/requested-products/${id}`);

const updateRequestedProduct = (id, data) =>
  API.put(`/admin/requested-products/${id}`, data);

const deleteRequestedProduct = (id) =>
  API.delete(`/admin/requested-products/${id}`);

const deleteMultipleRequestedProducts = (ids) =>
  API.delete(`/admin/requested-products`, { data: { ids } });

export {
  getAllRequestedProducts,
  getRequestedProductById,
  updateRequestedProduct,
  deleteRequestedProduct,
  deleteMultipleRequestedProducts,
};
