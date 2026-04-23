/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
// src/views/ServiceRequest/DetailPage/CounterOfferModal.jsx
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
} from "@mui/material";
import { useSelector } from "react-redux"; // To get actionError
import { selectServiceRequestActionError } from "../../../store/slice/serviceRequestSlice";

// Assuming offerPriceTypes might be shared or defined here if not imported
const defaultOfferPriceTypes = [
  { value: "fixed", label: "Fixed Price (Total for Project)" },
  { value: "per_hour", label: "Per Hour" },
  { value: "per_day", label: "Per Day" },
  // { value: 'negotiable', label: 'Negotiable'}, // Add if your backend OfferSubSchema supports it
];

const CounterOfferModal = ({
  open,
  onClose,
  originalOffer, // The seller's offer being countered
  serviceRequest, // The parent service request
  onSubmitCounter, // Function from DetailPage: (offerId, counterData) => void
  isLoading, //isLoading: actionStatus === 'loading' from DetailPage
}) => {
  const [counterData, setCounterData] = useState({
    price: "",
    priceType: "fixed", // Default to fixed
    deliveryTime: "", // e.g., "5 days", "1 week"
    message: "", // Buyer's message explaining the counter
  });
  const [formErrors, setFormErrors] = useState({});
  const actionErrorFromThunk = useSelector(selectServiceRequestActionError);

  // Use imported offerPriceTypes or fallback
  const offerPriceTypes = defaultOfferPriceTypes;

  useEffect(() => {
    if (open && originalOffer) {
      // Pre-fill with original offer's details for easier modification,
      // or keep blank for a fresh counter. Here, pre-filling.
      setCounterData({
        price: originalOffer.proposedPrice?.toString() || "",
        priceType: originalOffer.priceType || "fixed",
        deliveryTime: originalOffer.proposedDeliveryTime || "",
        message: "", // Buyer should write a new message
      });
      setFormErrors({});
    }
  }, [open, originalOffer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCounterData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateCounterForm = () => {
    const newErrors = {};
    if (!counterData.message.trim()) {
      newErrors.message =
        "A message explaining your counter-offer is required.";
    } else if (counterData.message.trim().length < 10) {
      newErrors.message =
        "Counter-offer message should be at least 10 characters.";
    }

    const priceNum = parseFloat(counterData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.price =
        "A valid proposed price is required for the counter-offer.";
    }

    if (!counterData.priceType) {
      newErrors.priceType =
        "Please select a price type for your counter-offer.";
    }
    // deliveryTime is optional for counter, but you could add validation if needed

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateCounterForm()) {
      return;
    }
    onSubmitCounter(originalOffer._id, {
      price: parseFloat(counterData.price),
      priceType: counterData.priceType,
      deliveryTime: counterData.deliveryTime.trim() || undefined, // Send undefined if empty
      message: counterData.message.trim(),
    });
  };

  if (!originalOffer || !serviceRequest) {
    return null; // Or a loading/error state if appropriate
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="counter-offer-dialog-title"
    >
      <DialogTitle id="counter-offer-dialog-title">
        Submit Counter-Offer to{" "}
        {originalOffer.seller?.name ||
          originalOffer.seller?.companyName ||
          "Provider"}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          You are making a counter-offer for the service request:{" "}
          <strong>"{serviceRequest.title}"</strong>.
        </Typography>
        <Typography
          variant="caption"
          display="block"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Original offer from seller: ${originalOffer.proposedPrice?.toFixed(2)}{" "}
          ({originalOffer.priceType?.replace("_", " ")}), Delivery:{" "}
          {originalOffer.proposedDeliveryTime || "N/A"}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="message"
              label="Your Message for Counter-Offer"
              multiline
              rows={3}
              fullWidth
              value={counterData.message}
              onChange={handleChange}
              required
              error={!!formErrors.message}
              helperText={
                formErrors.message ||
                "Clearly explain your revised terms or questions."
              }
              inputProps={{ maxLength: 1000 }} // From schema
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="price"
              label={`New Proposed Price (${
                serviceRequest.budget?.currency || "USD"
              })`}
              type="number"
              fullWidth
              value={counterData.price}
              onChange={handleChange}
              required
              InputProps={{ inputProps: { min: 0.01, step: "0.01" } }}
              error={!!formErrors.price}
              helperText={formErrors.price}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!formErrors.priceType}>
              <InputLabel id="counter-price-type-label">
                New Price Type
              </InputLabel>
              <Select
                labelId="counter-price-type-label"
                name="priceType"
                value={counterData.priceType}
                label="New Price Type"
                onChange={handleChange}
              >
                {offerPriceTypes.map((pt) => (
                  <MenuItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.priceType && (
                <Typography
                  component="p"
                  variant="caption"
                  color="error"
                  sx={{ ml: 1.5, mt: 0.5 }}
                >
                  {formErrors.priceType}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="deliveryTime"
              label="New Estimated Delivery Time (Optional)"
              fullWidth
              value={counterData.deliveryTime}
              onChange={handleChange}
              helperText={
                formErrors.deliveryTime ||
                "e.g., 3 days, 1 week. Leave blank if same as original."
              }
              error={!!formErrors.deliveryTime}
              inputProps={{ maxLength: 100 }} // From schema
            />
          </Grid>
        </Grid>
        {isLoading === false && actionErrorFromThunk && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {typeof actionErrorFromThunk === "string"
              ? actionErrorFromThunk
              : actionErrorFromThunk.message ||
                "Failed to submit counter-offer."}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Send Counter-Offer"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CounterOfferModal;
