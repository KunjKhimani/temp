/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
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
  Divider,
  ListItem,
  ListItemText,
  List,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentOrderDetail,
  selectOrderStatus as selectOrderDetailStatus,
  selectOrderError as selectOrderDetailError,
  clearOrderDetailState,
} from "../../store/slice/orderSlice";
import { fetchOrderById } from "../../store/thunks/orderThunks";
import { format } from "date-fns";
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "../Orders/OrderSummary";

const steps = ["Order Summary", "Payment Information", "Confirmation"];

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const queryParams = new URLSearchParams(location.search);
  const orderIdFromUrl = queryParams.get("orderId");

  const orderDetail = useSelector(selectCurrentOrderDetail);
  const orderDetailStatus = useSelector(selectOrderDetailStatus);
  const orderDetailError = useSelector(selectOrderDetailError);

  // console.log(orderDetail); // Keep for debugging if needed

  useEffect(() => {
    if (orderIdFromUrl) {
      dispatch(clearOrderDetailState());
      dispatch(fetchOrderById(orderIdFromUrl));
    } else {
      console.warn("No clientSecret or orderId found in URL, redirecting.");
      navigate("/user/orders");
    }

    return () => {
      dispatch(clearOrderDetailState());
    };
  }, [dispatch, orderIdFromUrl, navigate]);

  if (!orderIdFromUrl) {
    // More precise check if nothing is available
    // Redirect immediately if essential params are missing
    // This effect should run once if navigate is stable.
    // If still issues, consider a `useState` flag like `isRedirecting`.
    useEffect(() => {
      navigate("/user/orders");
    }, [navigate]);
    return (
      <Typography sx={{ p: 3, textAlign: "center" }}>
        Invalid session. Redirecting...
      </Typography>
    );
  }

  if (orderDetailStatus === "loading" && orderIdFromUrl) {
    // Only show loading if we are fetching
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          p: 3,
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>
          Loading order details for payment...
        </Typography>
      </Box>
    );
  }

  // If fetching failed for orderIdFromUrl
  if (orderDetailStatus === "failed" && orderIdFromUrl) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="error">
          Could not load order details for payment.{" "}
          {orderDetailError || "Please try again or go back."}
        </Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  // If clientSecret is missing after attempting to load order (or if no orderId was provided but clientSecret was)
  // If we have an orderId, but orderDetail is still null AFTER loading attempt.
  // This signifies an issue fetching the order linked to the payment.
  if (orderIdFromUrl && orderDetailStatus !== "loading" && !orderDetail) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="error">
          Order details for this payment session could not be found. Please
          contact support or go back to your orders.
        </Alert>
        <Button onClick={() => navigate("/user/orders")} sx={{ mt: 2 }}>
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

      <Grid
        container
        spacing={3}
        direction={{ xs: "column-reverse", md: "row" }}
      >
        {/* Left (Order Summary) - Now uses the OrderSummary component */}
        <Grid item xs={12} md={6}>
          {orderDetail ? (
            <OrderSummary order={orderDetail} />
          ) : (
            // This fallback is if orderDetail is null for some reason not caught by loading/error states above.
            // Could also show a compact loading indicator here.
            <Card elevation={2}>
              <CardHeader
                title="Order Summary"
                sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2 }}
                titleTypographyProps={{ variant: "h6" }}
              />
              <CardContent>
                <Typography>
                  {orderIdFromUrl
                    ? "Loading order summary..."
                    : "Order summary not available."}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right (Payment Information) */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardHeader
              title="Payment Information"
              sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2 }}
              titleTypographyProps={{ variant: "h6" }}
            />
            <CardContent>
              {orderIdFromUrl && orderDetail ? (
                <CheckoutForm
                  orderId={orderIdFromUrl}
                  paymentIntentId={orderDetail.paymentIntentId}
                />
              ) : (
                <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
                  {!orderIdFromUrl
                    ? "Payment cannot be initialized. Missing critical information."
                    : "Loading payment information..."}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Payment;
