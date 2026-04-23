import { API } from "./apis"; // Import the configured Axios instance

// Admin: Get all orders
const getAllAdminOrders = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
  if (params.filters && typeof params.filters === "object") {
    for (const key in params.filters) {
      if (
        Object.prototype.hasOwnProperty.call(params.filters, key) &&
        params.filters[key] != null &&
        params.filters[key] !== ""
      ) {
        queryParams.append(key, params.filters[key]);
      }
    }
  }
  return API.get(`/admin/orders?${queryParams.toString()}`);
};

// Admin: Get order by ID
const getAdminOrderById = (orderId) => API.get(`/admin/orders/${orderId}`);

// Admin: Update order
const updateAdminOrder = (orderId, data) =>
  API.put(`/admin/orders/${orderId}`, data);

// Admin: Delete single order
const deleteAdminOrder = (orderId) => API.delete(`/admin/orders/${orderId}`);

// Admin: Delete multiple orders
const deleteMultipleAdminOrders = (ids) =>
  API.post("/admin/orders/bulk-delete", { ids });

export {
  getAllAdminOrders,
  getAdminOrderById,
  updateAdminOrder,
  deleteAdminOrder,
  deleteMultipleAdminOrders,
};
