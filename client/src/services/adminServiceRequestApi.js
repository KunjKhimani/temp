import { createApi } from "@reduxjs/toolkit/query/react";
import { API } from "./apis"; // Import the API instance from apis.js

// Custom baseQuery using Axios instance
const axiosBaseQuery =
  () =>
  async ({ url, method, data, params }) => {
    try {
      const result = await API({ url, method, data, params });
      return { data: result.data };
    } catch (axiosError) {
      let err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const adminServiceRequestApi = createApi({
  reducerPath: "adminServiceRequestApi",
  baseQuery: axiosBaseQuery(), // Use the custom axiosBaseQuery
  tagTypes: ["ServiceRequest"],
  endpoints: (builder) => ({
    getAllAdminServiceRequests: builder.query({
      query: (params) => ({
        url: "/service-request/admin/all",
        params: params, // status, category, subcategory, budgetMin, budgetMax, location, page, limit, q, sortBy, sortOrder
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.serviceRequests.map(({ _id }) => ({
                type: "ServiceRequest",
                id: _id,
              })),
              "ServiceRequest",
            ]
          : ["ServiceRequest"],
    }),
    getAdminServiceRequestById: builder.query({
      query: (requestId) => `/service-request/admin/${requestId}`,
      providesTags: (result, error, { requestId }) => [
        { type: "ServiceRequest", id: requestId },
      ],
    }),
    updateAdminServiceRequest: builder.mutation({
      query: ({ requestId, formData }) => ({
        // formData for multipart/form-data (attachments)
        url: `/service-request/admin/${requestId}`,
        method: "PUT",
        data: formData, // Use data instead of body for Axios
      }),
      invalidatesTags: (result, error, { requestId }) => [
        { type: "ServiceRequest", id: requestId },
      ],
    }),
    deleteAdminServiceRequest: builder.mutation({
      query: (requestId) => ({
        url: `/service-request/admin/${requestId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { requestId }) => [
        { type: "ServiceRequest", id: requestId },
      ],
    }),
    deleteAllAdminServiceRequests: builder.mutation({
      query: () => ({
        url: "/service-request/admin/all",
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceRequest"], // Invalidate all service requests
    }),
  }),
});

export const {
  useGetAllAdminServiceRequestsQuery,
  useGetAdminServiceRequestByIdQuery,
  useUpdateAdminServiceRequestMutation,
  useDeleteAdminServiceRequestMutation,
  useDeleteAllAdminServiceRequestsMutation,
} = adminServiceRequestApi;
