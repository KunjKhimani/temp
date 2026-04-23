// src/store/thunks/userThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  deleteUserAccount,
  verifyEmailCode,
  resendVerificationCode,
  getServiceProviders,
  updateUserIntent as updateUserIntentService, // Renamed import
  getUserProfile, // Assuming this function exists or will be created
  getUserAnalytics,
  createUserAdmin, // Import the new service function
  checkUserContentExists, // Import the new API function
  updateUserProfile, // Import the update profile service
  // getServiceProviders, // This API call is now used in providerThunks.js
} from "../../services/userService";
import { API } from "../../services/apis"; // For setting auth header directly
import { saveUser, logout } from "../slice/userSlice"; // Import actions
import { setHasUserContent } from "../slice/navigationSlice"; // Import the new action

// --- Auth Thunks ---
// --- Thunks ---

export const createAdminUserThunk = createAsyncThunk(
  "user/createAdminUser",
  async (userData, thunkAPI) => {
    try {
      const response = await createUserAdmin(userData);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to create user."
      );
    }
  }
);

export const updateUserThunk = createAsyncThunk(
  "user/updateUser",
  async ({ id, userData }, thunkAPI) => {
    try {
      const response = await updateUserProfile(id, userData);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to update user details."
      );
    }
  }
);

export const checkUserContentThunk = createAsyncThunk(
  "user/checkUserContent",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await checkUserContentExists();
      dispatch(setHasUserContent(response.data.hasContent));
      return response.data.hasContent;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to check user content.";
      console.error("checkUserContentThunk - Error:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const login = createAsyncThunk(
  "user/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await loginUser(credentials);
      console.log(
        "LOGIN THUNK - Backend Response Data:",
        JSON.stringify(response.data, null, 2)
      );
      const { token, user, message } = response.data;

      // Check for invalid user object early
      if (!user || typeof user !== "object") {
        console.error(
          "Login Thunk: User object missing or invalid in backend response",
          response.data
        );
        return thunkAPI.rejectWithValue(
          "Login failed: Invalid user data from server."
        );
      }

      // Scenario 1: Email is NOT verified AND USER IS NOT ADMIN
      if (!user.isAdmin && !user.isEmailVerified) {
        // <<< MODIFIED CONDITION
        console.log("Login Thunk: Non-admin user, email not verified.");
        thunkAPI.dispatch(saveUser(user));
        return {
          // FULFILLED, but signals email verification needed for non-admin
          user,
          emailNotVerified: true,
          message: message || "Email requires verification.",
        };
      }
      // Scenario 2: Login fully successful (Admin, OR Verified User) and token is present
      else if (token) {
        // Admins should always get a token if credentials are correct
        // Verified users should also get a token
        console.log(
          "Login Thunk: Login successful (Admin or Verified User with token)."
        );
        localStorage.setItem("token", token);
        if (
          API &&
          API.defaults &&
          API.defaults.headers &&
          API.defaults.headers.common
        ) {
          API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
          console.warn(
            "Axios instance (API) or its headers not correctly configured for setting Authorization."
          );
        }
        // Ensure the user object saved includes the correct isEmailVerified status from backend
        // For an admin, isEmailVerified might be false but we log them in.
        // For a verified user, isEmailVerified will be true.
        thunkAPI.dispatch(saveUser(user));
        thunkAPI.dispatch(checkUserContentThunk()); // Dispatch to check user content
        return { token, user, emailNotVerified: false }; // Standard success payload
      }
      // Scenario 3: Backend indicates general issue or missing token for a case that should have one
      else if (message) {
        console.log(
          "Login Thunk: Backend message received, potentially an issue.",
          message
        );
        // This case might indicate an unverified non-admin if backend sent 200 + message
        if (
          !user.isAdmin &&
          (message.toLowerCase().includes("verify") ||
            message.toLowerCase().includes("unverified"))
        ) {
          thunkAPI.dispatch(
            saveUser({
              email: credentials.email,
              isEmailVerified: false,
              ...user,
            })
          );
          return thunkAPI.rejectWithValue({
            message,
            emailNotVerified: true,
            email: credentials.email,
            user,
          });
        }
        return thunkAPI.rejectWithValue(
          message || "Login failed: Unexpected response structure."
        );
      }
      // Fallback for other unexpected successful responses
      else {
        console.error(
          "Login Thunk: Unexpected successful response format from server.",
          response.data
        );
        return thunkAPI.rejectWithValue(
          "Login failed: Unexpected response format from server."
        );
      }
    } catch (err) {
      console.error(
        "LOGIN THUNK - Error Response Data:",
        JSON.stringify(err.response?.data, null, 2)
      );
      const errorData = err.response?.data;
      const errorMessage =
        errorData?.message ||
        err.message ||
        "Login action failed due to a network or server error.";

      // If backend specifically flags emailNotVerified in the error response (e.g., 403 error FOR NON-ADMINS)
      if (errorData && errorData.emailNotVerified === true) {
        // This primarily catches the 403 from the backend for non-admins
        console.log(
          "Login Thunk: Caught 403, emailNotVerified=true from backend."
        );
        const userToSave = errorData.user || {
          email: credentials.email,
          isEmailVerified: false,
        };
        thunkAPI.dispatch(saveUser(userToSave));
        return thunkAPI.rejectWithValue({
          ...errorData,
          message: errorMessage,
          emailNotVerified: true,
        });
      }
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const fetchUserAnalytics = createAsyncThunk(
  "user/fetchUserAnalytics",
  async (_, thunkAPI) => {
    try {
      const response = await getUserAnalytics();
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to fetch user analytics."
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const userId = getState().user.user?._id; // Get user ID from Redux state
      if (!userId) {
        return rejectWithValue("User ID not found in state.");
      }
      const response = await getUserProfile(userId); // Pass user ID to service
      dispatch(saveUser(response.data.user)); // Assuming response.data.user contains the user object
      return response.data.user;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch user profile.";
      console.error("fetchCurrentUser Thunk - Error:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  "user/register",
  async (userData, thunkAPI) => {
    // userData expected: { email, password, accountType, isSeller, fullName/companyName etc. }
    try {
      const response = await registerUser(userData);
      // Example backend response: { message: "Verification email sent", user: {id, email, ...} }

      // After successful registration, save user with isEmailVerified: false.
      // This makes the email available to the VerifyEmailPage.
      const userObjectFromResponse = response.data.user; // If backend returns the created user object

      const userToSave = {
        ...(userObjectFromResponse || {}), // Spread if backend sends user object
        email: userData.email, // Ensure email from input is primary
        isEmailVerified: false,
        // Persist other details from signup form that might be useful immediately
        // Ensure these match the keys used in your SignUp form and backend
        accountType: userData.accountType,
        username: userData.username, // (if individual)
        fullName: userData.fullName, // (if individual, ensure key consistency)
        companyName: userData.companyName, // (if agency)
        representativeName: userData.representativeName, // (if agency)
        // Do NOT set token or isLoggedIn to true here
      };
      thunkAPI.dispatch(saveUser(userToSave));

      return response.data; // e.g., { message: "Verification email sent." }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const verifyCode = createAsyncThunk(
  "user/verifyCode",
  async ({ email, code }, thunkAPI) => {
    try {
      const response = await verifyEmailCode({ email, code }); // API call
      const { user, token, message } = response.data;

      if (token && user) {
        localStorage.setItem("token", token);
        if (
          API &&
          API.defaults &&
          API.defaults.headers &&
          API.defaults.headers.common
        ) {
          API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
          console.warn(
            "Axios instance (API) or its headers not correctly configured for setting Authorization."
          );
        }
        thunkAPI.dispatch(saveUser(user)); // Save the full user object received from backend
        return { user, token, message }; // Return user and token for fulfilled state
      } else {
        // This case should ideally not be hit if backend always sends token/user on success
        console.error(
          "VerifyCode: No token or user received after verification."
        );
        return thunkAPI.rejectWithValue(
          message || "Verification successful, but failed to auto-login."
        );
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Verification failed"
      );
    }
  }
);

export const resendCode = createAsyncThunk(
  "user/resendCode",
  async ({ email }, thunkAPI) => {
    try {
      const response = await resendVerificationCode({ email });
      return response.data; // e.g., { message: "Verification code resent." }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to resend code"
      );
    }
  }
);

export const forgot = createAsyncThunk(
  "user/forgot",
  async ({ email }, thunkAPI) => {
    try {
      const response = await forgotPassword({ email }); // Ensure API call is awaited
      return { message: response.data.message || "Password reset code sent!" };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Request failed"
      );
    }
  }
);

export const reset = createAsyncThunk(
  "user/reset",
  async ({ email, code, newPassword, onSuccess, onFailure }, thunkAPI) => {
    try {
      const response = await resetPassword({ email, code, newPassword }); // Ensure API call is awaited
      if (onSuccess) onSuccess(); // Call success callback if provided
      return {
        message: response.data.message || "Password reset successfully!",
      };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to reset password";
      if (onFailure) onFailure({ message: errorMessage }); // Call failure callback
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const removeUser = createAsyncThunk(
  "user/removeUser",
  async (id, thunkAPI) => {
    try {
      await deleteUserAccount(id); // API call
      thunkAPI.dispatch(logout()); // Dispatch logout to clear all local state
      return { message: "User deleted successfully." };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to delete user"
      );
    }
  }
);

export const fetchServiceProviders = createAsyncThunk(
  "providers/fetchServiceProviders",
  async (params, thunkAPI) => {
    // params: { searchTerm, limit, page }
    try {
      const response = await getServiceProviders(params);
      // Assuming your API returns data in response.data
      // And it might be an object like { data: [...providers], meta: { pagination_details } }
      // or just an array of providers: [...providers]
      // Adjust based on your API's actual response structure.
      // If it's { data: { providers: [], pagination: {} } } then return response.data
      // If it's { data: [] } then return response.data
      // If it's { providers: [], pagination: {} } then return response.data
      console.log("fetchServiceProviders Thunk - API Response:", response.data);
      return response.data; // This will be the action.payload in the slice
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch service providers";
      console.error(
        "fetchServiceProviders Thunk - Error:",
        err.response?.data || err.message
      );
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const updateUserIntent = createAsyncThunk(
  "user/updateUserIntent",
  async ({ userId, intentData }, thunkAPI) => {
    try {
      const response = await updateUserIntentService(userId, intentData);
      thunkAPI.dispatch(saveUser(response.data.user)); // Update user state with new intent
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to update user intent."
      );
    }
  }
);
