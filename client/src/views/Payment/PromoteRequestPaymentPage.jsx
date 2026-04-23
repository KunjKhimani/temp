/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LockIcon from "@mui/icons-material/Lock";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";

import { confirmPromotionPaymentThunk } from "../../store/thunks/serviceRequestThunks";
import {
  selectServiceRequestActionStatus,
  selectServiceRequestActionError,
  clearServiceRequestActionState,
} from "../../store/slice/serviceRequestSlice";
import { showSnackbar } from "../../store/slice/snackbarSlice";

const SQUARE_WEB_SDK_URL =
  import.meta.env.VITE_SQUARE_ENV === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

let squareSdkLoaderPromise;

const loadSquareSdk = () => {
  if (window.Square) {
    return Promise.resolve();
  }

  if (squareSdkLoaderPromise) {
    return squareSdkLoaderPromise;
  }

  squareSdkLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SQUARE_WEB_SDK_URL}"]`);

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Unable to load Square SDK.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = SQUARE_WEB_SDK_URL;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () =>
      reject(new Error("Unable to load Square SDK."))
    );
    document.body.appendChild(script);
  });

  return squareSdkLoaderPromise;
};

const CheckoutForm = ({
  paymentIntentId,
  serviceRequestId,
  serviceRequestTitle,
  amount,
  paymentBreakdown,
  formDataToRepost,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const squareCardRef = useRef(null);
  const cardContainerIdRef = useRef(
    `square-promo-card-${Math.random().toString(36).slice(2, 10)}`
  );
  // Store the repopulate data locally to ensure it's available even if props change
  const [repopulateData] = useState(formDataToRepost || {});

  const actionStatus = useSelector(selectServiceRequestActionStatus);
  const actionError = useSelector(selectServiceRequestActionError);

  const promotionFeeAmount = Number(paymentBreakdown?.promotionFee || 0);
  const specialDealFeeAmount = Number(paymentBreakdown?.specialDealFee || 0);
  const totalPayableAmount = Number(
    paymentBreakdown?.totalFee ?? amount ?? 0
  );
  const hasBreakdown = promotionFeeAmount > 0 || specialDealFeeAmount > 0;

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        setCardReady(false);
        setErrorMessage(null);

        const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

        if (!appId || !locationId) {
          throw new Error(
            "Square is not configured. Set VITE_SQUARE_APPLICATION_ID and VITE_SQUARE_LOCATION_ID."
          );
        }

        await loadSquareSdk();

        if (!mounted) {
          return;
        }

        const container = document.getElementById(cardContainerIdRef.current);
        if (!container) {
          throw new Error("Payment form container is unavailable.");
        }

        if (squareCardRef.current?.destroy) {
          await squareCardRef.current.destroy();
          squareCardRef.current = null;
        }
        container.innerHTML = "";

        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();

        if (!mounted) {
          if (card?.destroy) {
            await card.destroy();
          }
          return;
        }

        await card.attach(`#${cardContainerIdRef.current}`);

        if (mounted) {
          squareCardRef.current = card;
          setCardReady(true);
        } else if (card?.destroy) {
          await card.destroy();
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage(err.message || "Unable to load payment form.");
        }
      }
    };

    setup();
    return () => {
      mounted = false;

      if (squareCardRef.current?.destroy) {
        squareCardRef.current.destroy();
        squareCardRef.current = null;
      }

      const container = document.getElementById(cardContainerIdRef.current);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!squareCardRef.current) {
      setErrorMessage("Payment form is not ready. Please wait.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    dispatch(clearServiceRequestActionState());

    try {
      const tokenResult = await squareCardRef.current.tokenize();
      if (tokenResult.status !== "OK") {
        setErrorMessage("Card tokenization failed. Please check card details.");
        setIsProcessing(false);
        return;
      }

      await dispatch(
        confirmPromotionPaymentThunk({
          serviceRequestId,
          paymentIntentId,
          sourceId: tokenResult.token,
          idempotencyKey: `promotion-${serviceRequestId}-${Date.now()}`,
        })
      ).unwrap();

      dispatch(
        showSnackbar({
          message: "Promotion payment successful! Your request is now promoted.",
          severity: "success",
        })
      );
      navigate(`/user/my-service-requests`);
    } catch (err) {
      setErrorMessage(
        err?.message ||
        "Payment succeeded at gateway but confirmation failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="promotion-payment-form">
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{ display: "flex", alignItems: "center" }}
      >
        <PriceCheckIcon color="primary" sx={{ mr: 1 }} /> Complete Request
        Payment
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body1" gutterBottom>
        You are completing payment for your service request:
      </Typography>
      <Typography variant="h6" color="text.primary" sx={{ fontWeight: "medium", mb: 1 }}>
        "{serviceRequestTitle || "Your Service Request"}"
      </Typography>

      <Box sx={{ mb: 2.5 }}>
        {hasBreakdown ? (
          <>
            {promotionFeeAmount > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Promoted Post Fee
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${promotionFeeAmount.toFixed(2)} USD
                </Typography>
              </Box>
            )}
            {specialDealFeeAmount > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Special Deal Activation Fee
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${specialDealFeeAmount.toFixed(2)} USD
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Total Payment
              </Typography>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: "bold" }}>
                ${totalPayableAmount.toFixed(2)} USD
              </Typography>
            </Box>
          </>
        ) : (
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: "bold" }}>
            Promotion Fee: ${totalPayableAmount.toFixed(2)} USD
          </Typography>
        )}
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
        <Typography variant="subtitle1" gutterBottom sx={{ display: "flex", alignItems: "center", fontWeight: "medium" }}>
          <CreditCardIcon sx={{ mr: 1, color: "action.active" }} /> Secure Payment
        </Typography>
        <div id={cardContainerIdRef.current} />
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={isProcessing || !cardReady || actionStatus === "loading"}
        sx={{ mt: 2, mb: 1, py: 1.5, fontSize: "1rem" }}
        startIcon={
          isProcessing || actionStatus === "loading" ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <LockIcon />
          )
        }
      >
        Pay ${totalPayableAmount.toFixed(2)}
      </Button>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {actionStatus === "failed" && actionError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Server Confirmation Error: {typeof actionError === "string" ? actionError : actionError.message || "An unexpected error occurred."}
        </Alert>
      )}

      <Button
        fullWidth
        variant="text"
        onClick={() =>
          navigate("/service-requests/create", {
            state: {
              fromPaymentPage: true,
              repopulateFormData: repopulateData,
            },
          })
        }
        sx={{ mt: 1, color: "text.secondary" }}
        disabled={isProcessing || actionStatus === "loading"}
      >
        Cancel and Edit Request
      </Button>
    </form>
  );
};

const PromoteRequestPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    paymentIntentId,
    serviceRequestId,
    serviceRequestTitle = "Your Service Request",
    amount = 0,
    paymentBreakdown,
    repopulateFormData,
  } = location.state || {};

  useEffect(() => {
    if (!paymentIntentId || !serviceRequestId) {
      navigate("/service-requests/create", {
        state: {
          paymentError:
            "Missing payment details. Please try creating the request again.",
          ...(repopulateFormData && { repopulateFormData }),
        },
      });
    }
  }, [paymentIntentId, serviceRequestId, navigate, repopulateFormData]);

  if (!paymentIntentId) {
    return (
      <Container maxWidth="sm" sx={{ py: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading payment gateway...</Typography>
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
          to="/service-requests/create"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          Post Request
        </MuiLink>
        <Typography color="text.primary">Promote Request Payment</Typography>
      </Breadcrumbs>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <CheckoutForm
          paymentIntentId={paymentIntentId}
          serviceRequestId={serviceRequestId}
          serviceRequestTitle={serviceRequestTitle}
          amount={Number(amount)}
          paymentBreakdown={paymentBreakdown}
          formDataToRepost={repopulateFormData}
        />
      </Paper>
    </Container>
  );
};

export default PromoteRequestPaymentPage;
