// src/services/serviceApi.js
import { API } from "./apis"; // Assuming API is your configured Axios instance from apis.js

// Fetch services list (filtered/paginated)
const getServices = (query) => API.get("/service", { params: query });

// Create a new service
const createService = (data) =>
  API.post("/service", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Update a service
const updateService = (id, data) =>
  API.put(`/service/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" }, // If update also involves files
  });

// Delete a service
const deleteService = (id) => API.delete(`/service/${id}`);

// Get details of a single service
const getServiceById = (id) => API.get(`/service/${id}`);

// Search services
const searchService = (queryObjectFromThunk) => {
  // queryObjectFromThunk already contains 'page' and other relevant filters
  const params = new URLSearchParams();
  for (const key in queryObjectFromThunk) {
    if (
      queryObjectFromThunk[key] != null &&
      String(queryObjectFromThunk[key]).trim() !== ""
    ) {
      // Check for non-empty strings too
      params.append(key, queryObjectFromThunk[key]);
    }
  }
  const queryString = params.toString();
  console.log(`[serviceApi.js] Calling /service/search?${queryString}`);
  return API.get(`/service/search?${queryString}`);
};

// Get latest services
const getLatestServices = () => API.get("/service/latest");

// Get services created by the logged-in user
const getMyServices = (params = {}) => {
  const queryParams = new URLSearchParams(params);
  return API.get(`/service/my-services?${queryParams.toString()}`);
};

// Add review to a service (if part of service API calls)
const addReview = (serviceId, data) =>
  API.post(`/service/${serviceId}/reviews`, data);

export const serviceApi = {
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceById,
  searchService,
  getLatestServices,
  getMyServices,
  addReview, // Include if it's managed here
};
