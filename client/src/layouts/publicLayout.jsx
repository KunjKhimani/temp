/* eslint-disable no-unused-vars */
// src/layouts/publicLayout.js (or your actual path)
import React, { useState, useEffect } from "react";
import { styled, Container, Box } from "@mui/material";
import { Outlet, ScrollRestoration, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import UserIntentModal from "../components/UserIntentModal"; // Import the new modal
import {
  selectUser,
  selectUpdateIntentLoading,
  selectUpdateIntentError,
  clearUpdateIntentError,
  selectIsLoggedIn, // Import selectIsLoggedIn
} from "../store/slice/userSlice";
import { updateUserIntent } from "../store/thunks/userThunks";
import FormCompletionGuard from "../components/FormCompletionGuard";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  padding: 0,
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px", // Consider if this affects scroll if Footer is fixed
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
  padding: 0,
}));

const PublicLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector(selectIsLoggedIn); // Select isLoggedIn directly
  const updateIntentLoading = useSelector(selectUpdateIntentLoading);
  const updateIntentError = useSelector(selectUpdateIntentError);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log("PublicLayout useEffect - User state:", user);
    // Check if user is logged in, email is verified, and intent is not set
    if (user && isLoggedIn && user.isEmailVerified && !user.hasSetIntent) {
      setIsModalOpen(true);
    } else {
      console.log(
        "PublicLayout: Conditions NOT met for opening UserIntentModal."
      );
      setIsModalOpen(false);
    }

    // If intent is set, and user does not have an active paid subscription, navigate to subscription page
    if (
      user &&
      user.hasSetIntent &&
      (!user.subscription ||
        !user.subscription.isActive ||
        user.subscription.paymentStatus !== "paid")
    ) {
      console.log(
        "PublicLayout: User intent set but no active paid subscription, navigating to subscription plan."
      );
      navigate("/auth/subscription-plan");
    }
  }, [user, navigate, isLoggedIn]); // Add isLoggedIn to dependencies

  const handleIntentSubmit = async ({ intent, categories }) => {
    // Determine isSeller based on intent
    const isSeller = intent === "provide";

    const resultAction = await dispatch(
      updateUserIntent({
        userId: user._id,
        intentData: {
          userIntent: intent,
          userCategories: categories,
          isSeller,
        },
      })
    );

    if (updateUserIntent.fulfilled.match(resultAction)) {
      // Intent successfully saved, modal will close due to useEffect watching user.hasSetIntent
      // and then navigate to subscription page
      dispatch(clearUpdateIntentError()); // Clear any previous errors
    } else {
      // Error handling is done by Redux, error state will be updated
      console.error("Failed to save user intent:", resultAction.payload);
    }
  };

  const handleModalClose = () => {
    // This modal is designed to be non-removable until intent is set
    // So, this function will not be directly used for closing by the user.
    // It's here for completeness if a different closing mechanism were desired.
    setIsModalOpen(false);
    dispatch(clearUpdateIntentError()); // Clear error if modal is somehow closed
  };

  return (
    <MainWrapper>
      <PageWrapper>
        <Box>
          <Navbar />
          <FormCompletionGuard>
            <Outlet /> {/* Page content renders here */}
          </FormCompletionGuard>
          <Footer />
        </Box>
      </PageWrapper>
      <ScrollRestoration />
      {user && isLoggedIn && user.isEmailVerified && !user.hasSetIntent && (
        <UserIntentModal
          open={isModalOpen}
          onClose={handleModalClose} // This won't be directly callable by user
          onSubmit={handleIntentSubmit}
          isLoading={updateIntentLoading}
          error={updateIntentError}
        />
      )}
    </MainWrapper>
  );
};

export default PublicLayout;
