import { useEffect, useState } from "react";
import { Box, Typography, Button, Container, Paper } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import OrderSuccessfulAnimation from "../../assets/Order_successful.json"; // Assuming this animation exists
import { useDispatch, useSelector } from "react-redux"; // Import useDispatch and useSelector
import { selectUser } from "../../store/slice/userSlice"; // Import selectUser
import { setFormSubmissionRequired } from "../../store/slice/navigationSlice"; // Import the action
import FirstRequestOfferModal from "../../components/FirstRequestOfferModal";

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch(); // Initialize useDispatch
  const loggedInUser = useSelector(selectUser); // Get loggedInUser from Redux state
  const [showFirstRequestOfferModal, setShowFirstRequestOfferModal] =
    useState(false);
  const hasCompletedInitialSubmission = useSelector(
    (state) => state.navigation.hasCompletedInitialSubmission
  );

  useEffect(() => {
    if (loggedInUser?.subscription?.paymentStatus === "paid") {
      if (!hasCompletedInitialSubmission) {
        setShowFirstRequestOfferModal(true); // Show the modal only if not completed
      } else {
        // If already completed, just navigate to a default page or home
        const timer = setTimeout(() => navigate("/"), 3000);
        return () => clearTimeout(timer);
      }
    } else if (loggedInUser?.subscription?.plan === "free_account") {
      // For free accounts, redirect to home (this case should be handled by SubscriptionPlan.jsx now)
      const timer = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(timer);
    }
    // If not paid and not free, do nothing or handle other cases
  }, [loggedInUser, navigate, hasCompletedInitialSubmission]);

  const handleCloseModal = () => {
    setShowFirstRequestOfferModal(false);
    // Optionally navigate to a default page if the user closes the modal without selecting an option
    // navigate("/");
  };

  const handleModalSelect = (route) => {
    dispatch(setFormSubmissionRequired(route));
    navigate(route);
    setShowFirstRequestOfferModal(false); // Close the modal after selection
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Lottie
            animationData={OrderSuccessfulAnimation}
            loop={false}
            autoplay
            style={{ width: 150, height: 150, margin: "0 auto" }}
          />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Subscription Activated Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Congratulations! Your subscription plan is now active. You will be
          redirected shortly.
        </Typography>
        {/* Optional: Add a manual redirect button in case automatic redirect fails */}
        <Button
          component={RouterLink}
          to="/user/profile" // Fallback to general dashboard/profile
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
        >
          Go to Dashboard (if not redirected)
        </Button>
      </Paper>
      {loggedInUser &&
        showFirstRequestOfferModal &&
        !hasCompletedInitialSubmission && (
          <FirstRequestOfferModal
            open={showFirstRequestOfferModal}
            userCategories={loggedInUser.userCategories || []}
            onClose={handleCloseModal}
            onSelect={handleModalSelect} // Pass the new onSelect callback
            currentUser={loggedInUser}
          />
        )}
    </Container>
  );
};

export default SubscriptionSuccessPage;
