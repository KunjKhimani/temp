const BASE_URL = import.meta.env.VITE_APP_BASE_URL; // Assuming you have a .env variable for base URL

export const productEndpoints = {
  // Admin Product Endpoints
  ADMIN_GET_ALL_PRODUCTS_API: BASE_URL + "/api/admin/products",
  ADMIN_GET_PRODUCT_BY_ID_API: BASE_URL + "/api/admin/products", // ID will be appended
  ADMIN_UPDATE_PRODUCT_API: BASE_URL + "/api/admin/products", // ID will be appended
  ADMIN_DELETE_PRODUCT_API: BASE_URL + "/api/admin/products", // ID will be appended
  ADMIN_DELETE_MULTIPLE_PRODUCTS_API:
    BASE_URL + "/api/admin/products/multiple-delete",
};
