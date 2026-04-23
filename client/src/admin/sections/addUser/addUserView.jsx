import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Added useParams
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  // IconButton, // Not used directly here
  // CircularProgress, // Handled in UserCreationForm
  // Alert, // Handled in UserCreationForm
} from "@mui/material";

import { DashboardContent } from "../../layouts/dashboard/main"; // Adjust path if needed
import { Iconify } from "../../components/iconify"; // Adjust path if needed
import UserCreationForm from "./UserCreationForm"; // Assuming this path is correct

// Import Redux actions and selectors
import {
  createAdminUserThunk,
  updateUserThunk, // Added update thunk
} from "../../../store/thunks/userThunks";

import {
  selectCreateAdminUserError,
  selectCreateAdminUserLoading,
  selectCreateAdminUserSuccess,
  selectUpdateAdminUserError, // Added update specific selectors
  selectUpdateAdminUserLoading,
  selectUpdateAdminUserSuccess,
} from "../../../store/slice/userSlice";

import {
  clearAuthError,
} from "../../../store/slice/userSlice";
import { getUserById } from "../../../services/userService"; // Added for fetching user data

// ----------------------------------------------------------------------

const AddUserView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Hook for navigation

  // --- Selectors ---
  const createAdminUserLoading = useSelector(selectCreateAdminUserLoading);
  const createAdminUserError = useSelector(selectCreateAdminUserError);
  const createAdminUserSuccess = useSelector(selectCreateAdminUserSuccess);

  const updateAdminUserLoading = useSelector(selectUpdateAdminUserLoading);
  const updateAdminUserError = useSelector(selectUpdateAdminUserError);
  const updateAdminUserSuccess = useSelector(selectUpdateAdminUserSuccess);

  const isLoading = createAdminUserLoading || updateAdminUserLoading;
  const currentError = createAdminUserError || updateAdminUserError;
  const isSuccess = createAdminUserSuccess || updateAdminUserSuccess;

  // --- State ---
  const initialFormData = React.useMemo(
    () => ({
      email: "",
      password: "",
      accountType: "individual",
      name: "",
      companyName: "",
      representativeName: "",
      website: "",
      isSeller: false,
      isVerified: false,
      isAdmin: false,
    }),
    []
  );

  const [formData, setFormData] = useState(initialFormData);
  const [successMessage, setSuccessMessage] = useState(null);

  const { id } = useParams(); // Get user ID from URL
  const isEdit = Boolean(id);

  // --- Effects ---
  useEffect(() => {
    const fetchUser = async () => {
      if (isEdit) {
        try {
          const res = await getUserById(id);
          if (res && res.data && res.data.user) {
            const u = res.data.user;
            setFormData({
              email: u.email || "",
              password: "", // Always empty in edit mode (not shown in form anyway)
              accountType: u.accountType || "individual",
              name: u.name || "",
              companyName: u.companyName || "",
              representativeName: u.representativeName || "",
              website: u.website || "",
              isSeller: !!u.isSeller,
              isVerified: !!u.isVerified,
              isAdmin: !!u.isAdmin,
            });
          }
        } catch (error) {
          console.error("Failed to fetch user for editing:", error);
        }
      }
    };

    fetchUser();

    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch, isEdit, id]);

  // --- Handlers ---
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked } = event.target;

      // Clear previous errors/success messages when user starts typing again
      if (currentError || isSuccess) {
        dispatch(clearAuthError());
        setSuccessMessage(null);
      }

      setFormData((prevData) => {
        const updatedData = {
          ...prevData,
          [name]: type === "checkbox" || type === "switch" ? checked : value,
        };

        if (name === "accountType") {
          if (value === "individual") {
            updatedData.companyName = "";
            updatedData.representativeName = "";
            updatedData.website = "";
          } else if (value === "agency") {
            updatedData.name = "";
          }
        }
        return updatedData;
      });
    },
    [dispatch, createAdminUserError, createAdminUserSuccess] // Updated dependencies
  );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      dispatch(clearAuthError()); // Clear any previous errors
      setSuccessMessage(null);

      if (!isEdit && (!formData.email || !formData.password)) {
        console.warn("Email and password required for new user");
        return;
      }
      // Add more validation if needed...

      const payload = { ...formData };
      if (isEdit) {
        delete payload.email;
        delete payload.password;
      }

      const actionThunk = isEdit
        ? updateUserThunk({ id, userData: payload })
        : createAdminUserThunk(payload);

      dispatch(actionThunk)
        .unwrap()
        .then((result) => {
          setSuccessMessage(
            result.message ||
              (isEdit
                ? "User updated successfully!"
                : "User created successfully!")
          );
          if (!isEdit) setFormData(initialFormData);

          setTimeout(() => {
            navigate("/admin/users");
          }, 800);
        })
        .catch((err) => {
          console.error("Submit failed:", err);
        });
    },
    [dispatch, formData, initialFormData, navigate, isEdit, id]
  );

  // --- Render ---
  return (
    <DashboardContent>
      {/* Header Section */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify
            icon={isEdit ? "eva:edit-2-fill" : "eva:person-add-fill"}
            width={32}
          />
          <Typography variant="h4">
            {isEdit ? "Edit User detail" : "Create New User"}
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          onClick={handleGoBack}
        >
          Back
        </Button>
      </Stack>

      {/* Form Section */}
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
          <UserCreationForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={isLoading}
            error={currentError}
            success={isSuccess ? successMessage : null}
            isEdit={isEdit}
          />
        </Paper>
      </Container>
    </DashboardContent>
  );
};

export default AddUserView;
