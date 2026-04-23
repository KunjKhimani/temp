/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Button, Typography, CircularProgress } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../services/orderApi";

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
      existing.addEventListener("error", () => reject(new Error("Unable to load Square SDK.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = SQUARE_WEB_SDK_URL;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error("Unable to load Square SDK.")));
    document.body.appendChild(script);
  });

  return squareSdkLoaderPromise;
};

const CheckoutForm = ({ orderId, paymentIntentId }) => {
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setLocalErrorMessage] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [squareCard, setSquareCard] = useState(null);

  const cardInstanceRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const setupAttemptRef = useRef(0);
  const cardContainerIdRef = useRef(
    `square-order-card-container-${Math.random().toString(36).slice(2, 10)}`
  );

  useEffect(() => {
    let mounted = true;
    const currentAttempt = setupAttemptRef.current + 1;
    setupAttemptRef.current = currentAttempt;

    const isStaleAttempt = () => !mounted || setupAttemptRef.current !== currentAttempt;

    const setupSquareCard = async () => {
      try {
        if (hasInitializedRef.current) {
          return;
        }

        hasInitializedRef.current = true;
        const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

        if (!appId || !locationId) {
          throw new Error(
            "Square is not configured. Set VITE_SQUARE_APPLICATION_ID and VITE_SQUARE_LOCATION_ID."
          );
        }

        await loadSquareSdk();

        if (isStaleAttempt()) {
          return;
        }

        const container = document.getElementById(cardContainerIdRef.current);
        if (!container) {
          throw new Error("Payment form container is unavailable.");
        }

        const payments = window.Square.payments(appId, locationId);
        const card = await payments.card();

        if (isStaleAttempt()) {
          if (card?.destroy) {
            card.destroy();
          }
          return;
        }

        await card.attach(`#${cardContainerIdRef.current}`);

        if (isStaleAttempt()) {
          if (card?.destroy) {
            card.destroy();
          }
          return;
        }

        if (mounted) {
          cardInstanceRef.current = card;
          setSquareCard(card);
          setCardReady(true);
        }
      } catch (err) {
        hasInitializedRef.current = false;
        if (mounted) {
          setLocalErrorMessage(err.message || "Unable to load payment form.");
        }
      }
    };

    setupSquareCard();

    return () => {
      mounted = false;
      setupAttemptRef.current += 1;
      setCardReady(false);
      setSquareCard(null);

      if (cardInstanceRef.current?.destroy) {
        cardInstanceRef.current.destroy();
        cardInstanceRef.current = null;
      }

      const container = document.getElementById(cardContainerIdRef.current);
      if (container) {
        container.innerHTML = "";
      }

      hasInitializedRef.current = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalErrorMessage(null);

    if (!squareCard) {
      setLocalErrorMessage("Payment form is not ready yet.");
      return;
    }

    setIsProcessing(true);
    try {
      const tokenResult = await squareCard.tokenize();
      if (tokenResult.status !== "OK") {
        setLocalErrorMessage("Card tokenization failed. Please check card details.");
        setIsProcessing(false);
        return;
      }

      const paymentData = {
        paymentIntentId,
        sourceId: tokenResult.token,
        idempotencyKey: `order-${orderId}-${Date.now()}`,
      };

      const response = await orderApi.confirmOrderPayment(orderId, paymentData);

      if (response.data && response.data.order) {
        const confirmedOrder = response.data.order;
        navigate("/auth/order/complete", {
          state: {
            orderId: confirmedOrder._id,
            paymentSuccess: true,
          },
        });
      } else {
        setLocalErrorMessage("Order confirmation failed. Please contact support.");
      }
    } catch (err) {
      setLocalErrorMessage(
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred during payment."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div id={cardContainerIdRef.current} />
      {errorMessage && (
        <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
          {errorMessage}
        </Typography>
      )}
      <Button
        type="submit"
        disabled={!cardReady || isProcessing}
        variant="contained"
        fullWidth
        sx={{ mt: 3, py: 1.5, fontSize: "1rem" }}
      >
        {isProcessing ? <CircularProgress size={24} color="inherit" /> : "Pay Now"}
      </Button>
    </form>
  );
};

export default CheckoutForm;
