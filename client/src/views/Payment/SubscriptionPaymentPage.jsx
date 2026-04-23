/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Link as MuiLink,
  Breadcrumbs,
} from "@mui/material";
import {
  useNavigate,
  useParams,
  Link as RouterLink,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../store/slice/userSlice";
import { fetchProfile } from "../../store/slice/profileSlice";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LockIcon from "@mui/icons-material/Lock";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import { showSnackbar } from "../../store/slice/snackbarSlice";
import { createSubscriptionCheckoutSession } from "../../services/subscriptionApi";
import { confirmSubscriptionPaymentThunk } from "../../store/thunks/subscriptionThunks";

const SQUARE_WEB_SDK_URL =
  import.meta.env.VITE_SQUARE_ENV === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

const plans = [
  {
    id: "basic_account",
    name: "Basic Account",
    price: "Free Forever",
    originalPrice: null,
    discountedPrice: "Free Forever",
  },
  {
    id: "growth_account",
    name: "Growth Account",
    price: "$19.90/month",
    originalPrice: "$40",
    discountedPrice: "$19.90/month",
  },
  {
    id: "business_account",
    name: "Business Account",
    price: "$39.90/month",
    originalPrice: "$80",
    discountedPrice: "$39.90/month",
  },
];

const SubscriptionCheckoutForm = ({ selectedPlanDetails, squareConfig }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loggedInUser = useSelector(selectUser);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [squareCard, setSquareCard] = useState(null);

  useEffect(() => {
    let mounted = true;
    let cardInstance = null;

    const setupSquareCard = async () => {
      try {
        if (!window.Square) {
          await new Promise((resolve, reject) => {
            const existing = document.querySelector(
              `script[src="${SQUARE_WEB_SDK_URL}"]`
            );
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

        const payments = window.Square.payments(
          squareConfig.applicationId,
          squareConfig.locationId
        );

        cardInstance = await payments.card();

        // Clear previous content before attaching
        const container = document.getElementById(
          "square-subscription-card-container"
        );
        if (container) container.innerHTML = "";

        await cardInstance.attach("#square-subscription-card-container");

        if (mounted) {
          setSquareCard(cardInstance);
          setCardReady(true);
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage("Unable to load Square card form. Please refresh.");
        }
      }
    };

    setupSquareCard();

    return () => {
      mounted = false;
      setCardReady(false);
      setSquareCard(null);
      // Destroy previous card on unmount
      if (cardInstance) {
        // `destroy()` can throw if the SDK already cleaned up.
        try {
          cardInstance.destroy();
        } catch (error) {
          // no-op
          console.error("Error destroying card instance:", error);
        }
      }
    };
  }, [squareConfig.applicationId, squareConfig.locationId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!squareCard) {
      setErrorMessage("Payment form is not ready yet.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const tokenResult = await squareCard.tokenize();
      if (tokenResult.status !== "OK") {
        setErrorMessage("Card tokenization failed. Please check your card details.");
        setIsProcessing(false);
        return;
      }

      await dispatch(
        confirmSubscriptionPaymentThunk({
          planId: selectedPlanDetails.id,
          sourceId: tokenResult.token,
          idempotencyKey: `subscription-${selectedPlanDetails.id}-${Date.now()}`,
        })
      ).unwrap();

      if (loggedInUser?._id) {
        dispatch(fetchProfile(loggedInUser._id));
      }

      dispatch(
        showSnackbar({
          message: "Subscription payment successful!",
          severity: "success",
        })
      );

      navigate("/auth/subscription/complete");
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Payment succeeded at gateway but failed to finalize. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="subscription-payment-form">
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{ display: "flex", alignItems: "center" }}
      >
        <PriceCheckIcon color="primary" sx={{ mr: 1 }} /> Complete Your {" "}
        {selectedPlanDetails?.name} Subscription
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1" gutterBottom>
        You are subscribing to the:
      </Typography>
      <Typography
        variant="h6"
        color="text.primary"
        sx={{ fontWeight: "medium", mb: 1 }}
      >
        "{selectedPlanDetails?.name || "Selected Plan"}"
      </Typography>
      <Box sx={{ mb: 2.5 }}>
        {selectedPlanDetails?.originalPrice && (
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ textDecoration: "line-through", mb: 0.5 }}
          >
            Amount: {selectedPlanDetails.originalPrice}
          </Typography>
        )}
        <Typography variant="h4" color="primary.main" sx={{ fontWeight: "bold" }}>
          Amount: {selectedPlanDetails?.discountedPrice || selectedPlanDetails?.price}
        </Typography>
      </Box>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          p: 2,
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", fontWeight: "medium" }}
        >
          <CreditCardIcon sx={{ mr: 1, color: "action.active" }} /> Secure Payment
        </Typography>
        <div id="square-subscription-card-container" />
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={isProcessing || !cardReady}
        sx={{ mt: 2, mb: 1, py: 1.5, fontSize: "1rem" }}
        startIcon={
          isProcessing ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <LockIcon />
          )
        }
      >
        Pay {selectedPlanDetails?.discountedPrice || selectedPlanDetails?.price} and Subscribe
      </Button>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
    </form>
  );
};

SubscriptionCheckoutForm.propTypes = {
  selectedPlanDetails: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    originalPrice: PropTypes.string,
    discountedPrice: PropTypes.string,
  }).isRequired,
  squareConfig: PropTypes.shape({
    applicationId: PropTypes.string.isRequired,
    locationId: PropTypes.string.isRequired,
  }).isRequired,
};

const SubscriptionPaymentPage = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [squareConfig, setSquareConfig] = useState(null);

  useEffect(() => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      setFetchError("Invalid subscription plan selected.");
      setLoading(false);
      return;
    }

    setSelectedPlanDetails(plan);

    if (plan.id === "basic_account") {
      dispatch(
        confirmSubscriptionPaymentThunk({
          planId: "basic_account",
          paymentIntentId: "basic_account_no_payment",
        })
      )
        .unwrap()
        .then(() => {
          dispatch(
            showSnackbar({
              message: "Basic subscription activated!",
              severity: "success",
            })
          );
          navigate("/auth/subscription/complete");
        })
        .catch((err) => {
          setFetchError(err.message || "Failed to activate basic subscription.");
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    const prepareSquareCheckout = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const response = await createSubscriptionCheckoutSession(planId);

        if (response?.paymentProvider !== "square" || !response?.square) {
          setFetchError("Failed to initialize Square checkout for this plan.");
          return;
        }

        setSquareConfig({
          applicationId: response.square.applicationId,
          locationId: response.square.locationId,
        });
      } catch (error) {
        setFetchError(
          error.response?.data?.message ||
            error.message ||
            "An unexpected error occurred while preparing payment."
        );
      } finally {
        setLoading(false);
      }
    };

    prepareSquareCheckout();
  }, [dispatch, navigate, planId]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading payment details...</Typography>
      </Container>
    );
  }

  if (fetchError) {
    return (
      <Container maxWidth="sm" sx={{ py: 5, textAlign: "center" }}>
        <Alert severity="error">{fetchError}</Alert>
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => navigate("/auth/subscription-plan")}
        >
          Back to Plans
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to="/auth/subscription-plan"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          Subscription Plans
        </MuiLink>
        <Typography color="text.primary">Payment</Typography>
      </Breadcrumbs>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {squareConfig && selectedPlanDetails ? (
          <SubscriptionCheckoutForm
            selectedPlanDetails={selectedPlanDetails}
            squareConfig={squareConfig}
          />
        ) : (
          <Alert severity="info">Preparing your payment. Please wait...</Alert>
        )}
      </Paper>
    </Container>
  );
};

export default SubscriptionPaymentPage;
