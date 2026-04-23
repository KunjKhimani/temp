/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Stack,
} from "@mui/material";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { showSnackbar } from "../../store/slice/snackbarSlice";
import {
  selectServiceRequestActionStatus,
  selectServiceRequestActionError,
} from "../../store/slice/serviceRequestSlice";
import {
  fetchServiceRequestByIdThunk,
  confirmServicePaymentThunk, // Import the thunk
} from "../../store/thunks/serviceRequestThunks";
import CreditCardIcon from "@mui/icons-material/CreditCard"; // Import the icon
import LockIcon from "@mui/icons-material/Lock"; // Import the icon

// Square Web SDK URL
const SQUARE_WEB_SDK_URL = "https://sandbox.web.squarecdn.com/v1/square.js";

const CheckoutForm = ({ serviceRequest, squareConfig, amount }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const actionStatus = useSelector(selectServiceRequestActionStatus);
  const actionError = useSelector(selectServiceRequestActionError);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [squareCard, setSquareCard] = useState(null);

  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        if (!window.Square) {
          await new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${SQUARE_WEB_SDK_URL}"]`);
            if (existing) {
              existing.addEventListener("load", resolve, { once: true });
              existing.addEventListener("error", reject, { once: true });
              return;
            }
            const script = document.createElement("script");
            script.src = SQUARE_WEB_SDK_URL;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        const payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
        const card = await payments.card();
        await card.attach("#square-card-container");
        if (mounted) {
          setSquareCard(card);
          setCardReady(true);
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage("Unable to load Square card form. Please refresh.");
        }
      }
    };
    setup();
    return () => {
      mounted = false;
    };
  }, [squareConfig.applicationId, squareConfig.locationId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!squareCard) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const tokenResult = await squareCard.tokenize();
      if (tokenResult.status !== "OK") {
        setErrorMessage("Card tokenization failed. Please check card details.");
        setIsProcessing(false);
        return;
      }

      await dispatch(
        confirmServicePaymentThunk({
          requestId: serviceRequest._id,
          paymentData: {
            sourceId: tokenResult.token,
            idempotencyKey: `service-request-${serviceRequest._id}`,
          },
        })
      ).unwrap();

      dispatch(showSnackbar({ message: "Payment successful!", severity: "success" }));
      navigate(`/service-request/${serviceRequest._id}`);
    } catch (err) {
      setErrorMessage(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Typography variant="h6">Payment Details</Typography>
        <Typography variant="body1">Service Request: <strong>{serviceRequest?.title}</strong></Typography>
        <Typography variant="body1">Amount Due: <strong>${amount?.toFixed(2)}</strong></Typography>
        <Box sx={{ border: "1px solid", borderColor: "divider", p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ display: "flex", alignItems: "center", fontWeight: "medium" }}>
            <CreditCardIcon sx={{ mr: 1, color: "action.active" }} /> Secure Payment
          </Typography>
          <div id="square-card-container" />
        </Box>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {actionError && (
          <Alert severity="error">
            {actionError.message || "An error occurred."}
          </Alert>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={
            isProcessing || !cardReady || actionStatus === "loading"
          }
          sx={{ mt: 2 }}
          startIcon={isProcessing || actionStatus === "loading" ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
        >
          {isProcessing || actionStatus === "loading" ? (
            <CircularProgress size={24} />
          ) : (
            `Pay $${amount?.toFixed(2)}`
          )}
        </Button>
        {/* Removed succeeded alert as it's handled by snackbar and navigation */}
      </Stack>
    </form>
  );
};

CheckoutForm.propTypes = {
  serviceRequest: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  squareConfig: PropTypes.shape({
    applicationId: PropTypes.string.isRequired,
    locationId: PropTypes.string.isRequired,
  }).isRequired,
  amount: PropTypes.number.isRequired,
};

const ServiceRequestPaymentPage = () => {
  const { requestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    amount,
    serviceRequest: initialServiceRequest,
    square,
  } = location.state || {};

  // Use the serviceRequest passed via state if available, otherwise use Redux
  const serviceRequestFromRedux = useSelector(
    (state) => state.serviceRequest.currentServiceRequest
  );
  const detailStatus = useSelector(
    (state) => state.serviceRequest.detailStatus
  );
  const detailError = useSelector((state) => state.serviceRequest.detailError);

  const currentServiceRequest =
    initialServiceRequest || serviceRequestFromRedux;

  useEffect(() => {
    if (initialServiceRequest && initialServiceRequest._id === requestId) {
      return;
    }
    if (
      detailStatus === "loading" ||
      (serviceRequestFromRedux && serviceRequestFromRedux._id === requestId)
    ) {
      return;
    }

    // Otherwise, fetch the service request.
    dispatch(fetchServiceRequestByIdThunk(requestId));
  }, [
    dispatch,
    requestId,
    initialServiceRequest, // If this object is re-created often, it can cause issues.
    serviceRequestFromRedux, // Object reference changes
    detailStatus, // Added to prevent re-fetch during loading
  ]);

  if (
    !currentServiceRequest ||
    currentServiceRequest._id !== requestId ||
    detailStatus === "loading"
  ) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          Loading service request details...
        </Typography>
      </Box>
    );
  }
  if (detailStatus === "failed") {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          {detailError?.message || "Error loading service request details."}
        </Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }
  if (!square?.applicationId || !square?.locationId || !amount) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          Payment details are missing. Please initiate payment from the service request page.
        </Alert>
        <Button
          onClick={() => navigate(`/service-request/${requestId}`)}
          sx={{ mt: 2 }}
        >
          Go to Service Request
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Complete Your Payment
        </Typography>
        <CheckoutForm serviceRequest={currentServiceRequest} squareConfig={square} amount={amount} />
      </Paper>
    </Container>
  );
};

export default ServiceRequestPaymentPage;
