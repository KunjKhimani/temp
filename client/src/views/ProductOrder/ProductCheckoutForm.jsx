/* eslint-disable no-unused-vars */
// src/components/ProductOrder/ProductCheckoutForm.jsx
/* eslint-disable react/prop-types */ // If you use prop-types
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button, Typography, CircularProgress } from "@mui/material";
import { confirmProductOrderPaymentThunk } from "../../store/thunks/productOrderThunks";

const SQUARE_WEB_SDK_URL = "https://sandbox.web.squarecdn.com/v1/square.js";

const ProductCheckoutForm = ({ productOrderId, squareConfig }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setLocalErrorMessage] = useState(null);
  const [cardReady, setCardReady] = useState(false);
  const [squareCard, setSquareCard] = useState(null);

  const squareCardRef = useRef(null);
  const setupInProgressRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      // prevent duplicate initialization
      if (setupInProgressRef.current || squareCardRef.current) return;
      setupInProgressRef.current = true;

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
        const container = document.getElementById("square-product-card-container");
        if (container) container.innerHTML = "";
        await card.attach("#square-product-card-container");
        if (mounted) {
          squareCardRef.current = card;
          setSquareCard(card);
          setCardReady(true);
        }
      } catch (err) {
        if (mounted) setLocalErrorMessage("Unable to load payment form. Please refresh.");
      } finally {
        setupInProgressRef.current = false;
      }
    };
    setup();
    return () => {
      setCardReady(false);
      setSquareCard(null);
      if (squareCardRef.current && typeof squareCardRef.current.destroy === "function") {
        squareCardRef.current.destroy().catch(() => {});
      }
      squareCardRef.current = null;
    };
  }, [squareConfig.applicationId, squareConfig.locationId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalErrorMessage(null);
    if (!squareCard) return;
    setIsProcessing(true);
    try {
      const tokenResult = await squareCard.tokenize();
      if (tokenResult.status !== "OK") {
        setLocalErrorMessage("Card tokenization failed. Please check card details.");
        return;
      }

      const actionResult = await dispatch(
        confirmProductOrderPaymentThunk({
          orderId: productOrderId,
          paymentData: {
            sourceId: tokenResult.token,
            idempotencyKey: `product-order-${productOrderId}`,
          },
        })
      ).unwrap();

      navigate(`/auth/productOrder/complete?status=succeeded&productOrderId=${productOrderId}`, {
        state: {
          productOrderId: actionResult.order?._id || productOrderId,
          paymentSuccess: true,
          additionalInfo: actionResult.order?.additionalInfo,
        },
      });
    } catch (err) {
      setLocalErrorMessage(err.message || "Order confirmation failed after payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div id="square-product-card-container" />
      {errorMessage && (
        <Typography color="error" sx={{ mt: 2, textAlign: "center" }}>
          {errorMessage}
        </Typography>
      )}
      <Button type="submit" disabled={!cardReady || isProcessing} variant="contained" fullWidth sx={{ mt: 3, py: 1.5, fontSize: "1rem" }}>
        {isProcessing ? <CircularProgress size={24} color="inherit" /> : "Pay Now"}
      </Button>
    </form>
  );
};

export default ProductCheckoutForm;
