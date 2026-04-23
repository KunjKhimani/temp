import { API } from "./apis";

export const adminProductApi = {
  getAllProducts: async (queryParams = {}) => {
    try {
      const response = await API.get("/admin/products", {
        params: queryParams,
      });

      console.log(response);
      return response.data;
    } catch (error) {
      console.error("Error fetching all admin products:", error);
      throw error;
    }
  },

  getProductById: async (productId) => {
    try {
      const response = await API.get(`/admin/products/${productId}`);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error(`Error fetching admin product by ID ${productId}:`, error);
      throw error;
    }
  },

  updateProduct: async (productId, formData) => {
    try {
      const response = await API.put(`/admin/products/${productId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error(`Error updating admin product ${productId}:`, error);
      throw error;
    }
  },

  deleteProduct: async (productId) => {
    try {
      const response = await API.delete(`/admin/products/${productId}`);
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error(`Error deleting admin product ${productId}:`, error);
      throw error;
    }
  },

  deleteMultipleProducts: async (productIds) => {
    try {
      const response = await API.post(
        "/admin/products/multiple-delete",
        { productIds },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      return response.data;
    } catch (error) {
      console.error("Error deleting multiple admin products:", error);
      throw error;
    }
  },
};
