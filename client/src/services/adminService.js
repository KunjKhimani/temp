// Import the configured API instance, not the individual functions or raw axios
import { API } from "./apis"; // Adjust the path if it's in a different folder

// The base path for these admin-specific routes
const ADMIN_SERVICE_URL = "/service/admin/services";

// Fetch all services for admin
const getAllServicesAdmin = async (params = {}) => {
  // REMOVED: No need to manually create config or get token. The interceptor does it.

  // Use the imported API instance.
  // The 'params' object is automatically converted to a query string by axios.
  // e.g., /api/admin/services?page=1&limit=10&filters[title]=some_search
  const response = await API.get(ADMIN_SERVICE_URL, { params });

  console.log("adminService: getAllServicesAdmin response:", response.data);
  return response.data; // Return the JSON payload from the response
};

// Fetch a single service for admin
const getSingleServiceAdmin = async (serviceId) => {
  // The URL is relative to the baseURL in apis.js (e.g., "/api")
  const response = await API.get(`${ADMIN_SERVICE_URL}/${serviceId}`);
  return response.data;
};

// Update a service for admin
const updateServiceAdmin = async (serviceId, serviceData) => {
  const response = await API.put(
    `${ADMIN_SERVICE_URL}/${serviceId}`,
    serviceData,
    {
      headers: {
        // This header is specific to this call, so it's good to keep it here.
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// Delete a single service for admin
const deleteServiceAdmin = async (serviceId) => {
  const response = await API.delete(`${ADMIN_SERVICE_URL}/${serviceId}`);
  return response.data;
};

// Delete multiple services for admin
const deleteMultipleServicesAdmin = async (serviceIds) => {
  // For DELETE requests with a body, axios requires the payload inside a 'data' key.
  const response = await API.delete(`${ADMIN_SERVICE_URL}/bulk-delete`, {
    data: { serviceIds },
  });
  return response.data;
};

const adminService = {
  getAllServicesAdmin,
  getSingleServiceAdmin,
  updateServiceAdmin,
  deleteServiceAdmin,
  deleteMultipleServicesAdmin,
};

export default adminService;
