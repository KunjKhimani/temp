/* eslint-disable no-unused-vars */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { saveUser } from "../store/slice/userSlice";
// import { saveUser } from "../../store/slice/userSlice"; // Import saveUser action

// Assuming your base API URL is available globally or from an environment variable
const BASE_API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_API_URL,
    prepareHeaders: (headers) => {
      // Removed getState as it's no longer used
      // Retrieve token from localStorage as it's not directly in Redux state based on userSlice.js
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["User"], // Define tag types for caching and invalidation
  endpoints: (builder) => ({
    getUserProfile: builder.query({
      query: (id) => `/user/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    updateUserProfile: builder.mutation({
      query: ({ id, data }) => ({
        // Expect 'data' to be the FormData object
        url: `/user/${id}`,
        method: "PUT",
        body: data, // Pass FormData directly as body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "User", id }],
      async onQueryStarted(
        { id, data },
        { dispatch, queryFulfilled, getState }
      ) {
        try {
          const { data: responseData } = await queryFulfilled;
          // Assuming the backend returns { message: "...", user: updatedUserObject }
          if (responseData?.user) {
            dispatch(saveUser(responseData.user)); // Update the user in the userSlice
          }
        } catch (error) {
          // Handle any errors during the mutation or subsequent dispatches
          console.error("Failed to update user profile in Redux:", error);
        }
      },
    }),
    removeUserDocument: builder.mutation({
      query: ({ userId, docId }) => ({
        url: `/user/${userId}/documents/${docId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ], // Invalidate the user's profile after document removal
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useRemoveUserDocumentMutation,
} = userApi;
