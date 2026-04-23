/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
// src/views/ProductOrder/ProductOrderSuccessPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import Lottie from "lottie-react";
import OrderAnimation from "../../assets/Order_successful.json"; // Reuse animation
import { Box, Button, Typography, Stack, Alert } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt";

const ProductOrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get("status"); // e.g. 'succeeded', 'failed', 'pending'
  const productOrderIdFromQuery = queryParams.get("productOrderId");

  // Data passed via navigate state from ProductCheckoutForm
  const productOrderIdFromState = location.state?.productOrderId;
  const paymentSuccessFromState = location.state?.paymentSuccess;
  const additionalInfoFromState = location.state?.additionalInfo; // Example

  const productOrderId = productOrderIdFromState || productOrderIdFromQuery;

  // Handle cases where user might land here without proper state/query params
  useEffect(() => {
    if (status !== "succeeded" && !paymentSuccessFromState) {
      // If not explicitly succeeded and no state confirms success, redirect
      // Or show a more generic message
      // For now, assume if they land here, it's mostly success from Stripe redirect
    }
  }, [status, paymentSuccessFromState, navigate]);

  if (status === "failed" || (paymentSuccessFromState === false && !status)) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "80vh",
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ mb: 3, width: "100%", maxWidth: 500 }}>
          <Typography variant="h5">Payment Failed</Typography>
          <Typography>
            There was an issue with your payment. Please try again or contact
            support.
          </Typography>
        </Alert>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
        >
          {productOrderId && (
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/user/product-orders/${productOrderId}`}
            >
              Try Payment Again
            </Button>
          )}
          <Button variant="contained" component={RouterLink} to="/products">
            Browse Products
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "80vh",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Box sx={{ width: "80%", maxWidth: "300px", mb: 2 }}>
        <Lottie animationData={OrderAnimation} loop={true} />
      </Box>
      <Typography
        variant="h4"
        component="h1"
        color="success.main"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Payment Successful!
      </Typography>
      <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
        Your Product Order is Confirmed.
      </Typography>
      {additionalInfoFromState && (
        <Box
          sx={{
            my: 2,
            p: 2,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
            width: "90%",
            maxWidth: 500,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your notes for this order:
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: "italic" }}>
            "{additionalInfoFromState}"
          </Typography>
        </Box>
      )}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 500 }}
      >
        Thank you for your purchase! The seller has been notified and will
        confirm your order shortly. You can view your order details below.
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="center"
        sx={{ width: "100%", mt: 2 }}
      >
        {productOrderId && (
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to={`/user/product-orders/${productOrderId}`}
            startIcon={<ListAltIcon />}
          >
            View Your Order
          </Button>
        )}
        <Button
          variant="outlined"
          color="primary"
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
        >
          Back to Home
        </Button>
      </Stack>
    </Box>
  );
};

export default ProductOrderSuccessPage;
