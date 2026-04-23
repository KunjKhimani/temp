/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/PromotionPaymentStatusPage.jsx (NEW FILE)
import React, { useEffect, useState } from "react";
import {
  useSearchParams,
  useNavigate,
  Link as RouterLink,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Box,
  Paper,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Verify payment intent status with backend payment APIs.
import { verifyPromotionPaymentThunk } from "../../store/thunks/serviceRequestThunks"; // Create this thunk
import { showSnackbar } from "../../store/slice/snackbarSlice";

const PromotionPaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState("processing"); // 'processing', 'succeeded', 'failed'
  const [message, setMessage] = useState("Verifying your payment...");
  const [serviceRequestId, setServiceRequestId] = useState(null);

  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent");
    const paymentIntentClientSecret = searchParams.get(
      "payment_intent_client_secret"
    );
    // Some providers may include additional redirect query params.

    if (!paymentIntentId || !paymentIntentClientSecret) {
      setMessage(
        "Invalid payment information received. Please contact support."
      );
      setStatus("failed");
      return;
    }

    // Dispatch a thunk to backend to verify payment intent status.
    dispatch(
      verifyPromotionPaymentThunk({
        paymentIntentId,
        clientSecret: paymentIntentClientSecret,
      })
    )
      .unwrap()
      .then((response) => {
        // Backend should return { success: true, status: paymentIntent.status, serviceRequestId: ... }
        if (response.status === "succeeded") {
          setMessage(
            "Promotion payment successful! Your service request is now promoted."
          );
          setStatus("succeeded");
          setServiceRequestId(response.serviceRequestId); // Get SR ID from backend response
          dispatch(
            showSnackbar({
              message: "Promotion activated!",
              severity: "success",
            })
          );
        } else {
          setMessage(
            `Payment ${response.status}. ${response.message || "Please try again or contact support."
            }`
          );
          setStatus("failed");
        }
      })
      .catch((error) => {
        setMessage(
          error.message || "Failed to verify payment. Please contact support."
        );
        setStatus("failed");
      });
  }, [dispatch, searchParams]);

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {status === "processing" && (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6">{message}</Typography>
          </>
        )}
        {status === "succeeded" && (
          <>
            <CheckCircleOutlineIcon
              sx={{ fontSize: 60, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" color="success.main" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography>{message}</Typography>
            <Box mt={3}>
              {serviceRequestId ? (
                <Button
                  variant="contained"
                  component={RouterLink}
                  to={`/service-request/${serviceRequestId}`}
                >
                  View Your Promoted Request
                </Button>
              ) : (
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/user/my-service-requests"
                >
                  View My Service Requests
                </Button>
              )}
              <Button
                variant="outlined"
                component={RouterLink}
                to="/"
                sx={{ ml: 2 }}
              >
                Go to Homepage
              </Button>
            </Box>
          </>
        )}
        {status === "failed" && (
          <>
            <ErrorOutlineIcon
              sx={{ fontSize: 60, color: "error.main", mb: 2 }}
            />
            <Typography variant="h5" color="error.main" gutterBottom>
              Payment Failed
            </Typography>
            <Typography>{message}</Typography>
            <Box mt={3}>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/service-requests/create"
              >
                Try Posting Again
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/"
                sx={{ ml: 2 }}
              >
                Go to Homepage
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PromotionPaymentStatusPage;
