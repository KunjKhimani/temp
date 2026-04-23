import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// Import necessary API functions
import {
  getUserById,
  updateUserProfile,
  removeDocument,
} from "../../services/apis"; // <-- Added removeDocument

// --- Async Thunks ---

export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (id, { rejectWithValue }) => {
    // Added rejectWithValue
    try {
      const response = await getUserById(id);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch profile"
      ); // Use rejectWithValue
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async ({ id, data }, { rejectWithValue }) => {
    // Added rejectWithValue
    try {
      const response = await updateUserProfile(id, data);
      // The backend should return { message: '...', user: {...} }
      if (response.data.user) {
        return response.data.user; // Return only the updated user object
      }
      throw new Error("Update response did not contain user data."); // Handle unexpected response
    } catch (err) {
      console.error("Update Profile Error Raw:", err.response?.data || err);
      return rejectWithValue(
        err.response?.data || { message: "Failed to update profile" }
      ); // Pass richer error object
    }
  }
);

// --- NEW: Delete Document Thunk ---
export const deleteDocument = createAsyncThunk(
  "profile/deleteDocument",
  async ({ userId, docId }, { rejectWithValue }) => {
    try {
      const response = await removeDocument(userId, docId);
      // Expecting backend to return { message: '...', documents: [...] }
      if (response.data && Array.isArray(response.data.documents)) {
        // Return the necessary info to update the state
        return {
          docIdToRemove: docId,
          updatedDocuments: response.data.documents,
        };
      }
      throw new Error(
        "Delete document response did not contain updated documents."
      );
    } catch (err) {
      console.error("Delete Document Error Raw:", err.response?.data || err);
      return rejectWithValue(
        err.response?.data || { message: "Failed to delete document" }
      );
    }
  }
);
// --- END NEW ---

// Slice
const profileSlice = createSlice({
  name: "profile",
  initialState: {
    profile: null, // Holds { user: {...}, services: [...] }
    fetchLoading: false,
    updateLoading: false,
    deleteDocLoading: false, // <-- New loading state for delete doc
    fetchError: null,
    updateError: null,
    deleteDocError: null, // <-- New error state for delete doc
  },
  reducers: {
    // Optional: Reducer to clear errors manually if needed
    clearProfileErrors(state) {
      state.fetchError = null;
      state.updateError = null;
      state.deleteDocError = null;
    },
    // You might add a reducer to clear the profile on logout if needed
    clearProfileData(state) {
      state.profile = null;
      // Reset other states if desired
      state.fetchLoading = false;
      state.updateLoading = false;
      state.deleteDocLoading = false;
      state.fetchError = null;
      state.updateError = null;
      state.deleteDocError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.fetchLoading = true;
        state.fetchError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.fetchLoading = false;
        // Payload should be { user: {...}, services: [...] } from API
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.fetchLoading = false;
        state.fetchError = action.payload; // Error message from rejectWithValue
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Action.payload is the updated user object
        // Update the user part of the profile state
        if (state.profile && action.payload) {
          state.profile.user = { ...state.profile.user, ...action.payload };
        } else if (action.payload) {
          // If profile was null, maybe initialize it (less likely case)
          state.profile = { user: action.payload, services: [] };
        }
        state.updateError = null; // Clear error on success
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload; // Error object from rejectWithValue
      })

      // --- NEW: Delete Document Reducers ---
      .addCase(deleteDocument.pending, (state) => {
        state.deleteDocLoading = true;
        state.deleteDocError = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.deleteDocLoading = false;
        // action.payload is { docIdToRemove, updatedDocuments }
        // Update the documents array within the profile's user object
        if (state.profile?.user?.documents) {
          // Option 1: Replace with the list from backend (safer if order matters or backend modifies more)
          state.profile.user.documents = action.payload.updatedDocuments;

          // Option 2: Filter locally (simpler if backend only returns the ID)
          // const docIdToRemove = action.payload.docIdToRemove;
          // state.profile.user.documents = state.profile.user.documents.filter(
          //    doc => doc._id !== docIdToRemove
          // );
        }
        state.deleteDocError = null; // Clear error on success
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.deleteDocLoading = false;
        state.deleteDocError = action.payload; // Error object from rejectWithValue
      });
    // --- END NEW ---
  },
});

// Export actions and reducer
export const { clearProfileErrors, clearProfileData } = profileSlice.actions; // Export new actions
export default profileSlice.reducer;

// Selectors
export const selectProfile = (state) => state.profile.profile;
export const selectFetchLoading = (state) => state.profile.fetchLoading;
export const selectUpdateLoading = (state) => state.profile.updateLoading;
export const selectFetchError = (state) => state.profile.fetchError;
export const selectUpdateError = (state) => state.profile.updateError;
// --- NEW Selectors ---
export const selectDeleteDocLoading = (state) => state.profile.deleteDocLoading;
export const selectDeleteDocError = (state) => state.profile.deleteDocError;
// --- END NEW ---
