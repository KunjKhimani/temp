/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
// src/views/ProductOrder/ProductOrderPaymentPage.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  selectCurrentProductOrder,
  selectProductOrderDetailStatus,
  selectProductOrderDetailError,
  clearProductOrderDetailState,
} from "../../store/slice/productOrderSlice"; // Use productOrderSlice
import { fetchProductOrderByIdThunk } from "../../store/thunks/productOrderThunks";
import ProductCheckoutForm from "./ProductCheckoutForm";
import ProductOrderSummary from "./ProductOrderSummary";

const steps = ["Order Details", "Payment", "Confirmation"];

const ProductOrderPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryParams = new URLSearchParams(location.search);
  const productOrderIdFromUrl = queryParams.get("productOrderId");
  const productOrder = useSelector(selectCurrentProductOrder);
  const orderDetailStatus = useSelector(selectProductOrderDetailStatus);
  const orderDetailError = useSelector(selectProductOrderDetailError);

  useEffect(() => {
    if (productOrderIdFromUrl) {
      dispatch(clearProductOrderDetailState());
      dispatch(fetchProductOrderByIdThunk(productOrderIdFromUrl));
    } else {
      navigate("/user/product-orders");
    }
    return () => {
      dispatch(clearProductOrderDetailState());
    };
  }, [dispatch, productOrderIdFromUrl, navigate]);

  if (!productOrderIdFromUrl) {
    return <Typography sx={{ p: 3, textAlign: "center" }}>Invalid session. Redirecting...</Typography>;
  }
  if (orderDetailStatus === "loading") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", p: 3 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading order details for payment...</Typography>
      </Box>
    );
  }
  if (orderDetailStatus === "failed") {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="error">Could not load order details. {orderDetailError || "Please try again."}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }
  if (!productOrder) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="error">Order details for this payment could not be found.</Alert>
        <Button onClick={() => navigate("/user/product-orders")} sx={{ mt: 2 }}>Back to Orders</Button>
      </Box>
    );
  }

  const squareConfig = {
    applicationId: import.meta.env.VITE_SQUARE_APPLICATION_ID,
    locationId: import.meta.env.VITE_SQUARE_LOCATION_ID,
  };

  if (!squareConfig.applicationId || !squareConfig.locationId) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="error">
          Square is not configured. Set `VITE_SQUARE_APPLICATION_ID` and
          `VITE_SQUARE_LOCATION_ID` in client environment.
        </Alert>
        <Button onClick={() => navigate("/user/product-orders")} sx={{ mt: 2 }}>
          Back to Orders
        </Button>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 1, sm: 2, md: 3 }}>
      <Stepper activeStep={1} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Grid container spacing={3} direction={{ xs: "column-reverse", md: "row" }}>
        <Grid item xs={12} md={6}>
          <ProductOrderSummary order={productOrder} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader title="Payment Information" />
            <CardContent>
              <ProductCheckoutForm productOrderId={productOrderIdFromUrl} squareConfig={squareConfig} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductOrderPaymentPage;
