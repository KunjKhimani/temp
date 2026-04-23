/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/components/ServiceRequest/SubmitOfferModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Autocomplete,
} from "@mui/material";
// No longer need useDispatch, useSelector, or thunks here
// import { useDispatch, useSelector } from "react-redux";
// import { submitOfferThunk } from "../../../store/thunks/serviceRequestThunks";
// import { showSnackbar } from "../../../store/slice/snackbarSlice";
// import {
//   selectServiceRequestActionStatus,
//   selectServiceRequestActionError,
//   clearServiceRequestActionState,
// } from "../../../store/slice/serviceRequestSlice";

const availabilityTimeSlots = [
  { value: "morning", label: "Morning (e.g., 9 AM - 12 PM)" },
  { value: "afternoon", label: "Afternoon (e.g., 1 PM - 5 PM)" },
  { value: "evening", label: "Evening (e.g., 6 PM - 9 PM)" },
  { value: "flexible", label: "Flexible / Upon Discussion" },
  { value: "specific_time", label: "Specific Time (Enter Below)" },
];

const offerPriceTypes = [
  { value: "fixed", label: "Fixed Price (Total for Project)" },
  { value: "per_hour", label: "Per Hour" },
  { value: "per_day", label: "Per Day" },
];

const parseDeliveryTimeToDays = (timeString) => {
  if (!timeString || typeof timeString !== "string") return Infinity;
  const lowerCaseTime = timeString.toLowerCase().trim();
  const parts = lowerCaseTime.split(" ");

  if (parts.length === 2) {
    const quantity = parseInt(parts[0], 10);
    const unit = parts[1];
    if (!isNaN(quantity)) {
      if (unit.startsWith("day")) return quantity;
      if (unit.startsWith("week")) return quantity * 7;
      if (unit.startsWith("month")) return quantity * 30;
    }
  }
  if (lowerCaseTime.includes("day"))
    return parseInt(lowerCaseTime, 10) || Infinity;
  if (lowerCaseTime.includes("week"))
    return (parseInt(lowerCaseTime, 10) || 1) * 7;
  if (lowerCaseTime.includes("month"))
    return (parseInt(lowerCaseTime, 10) || 1) * 30;

  return Infinity;
};

const SubmitOfferModal = ({
  open,
  onClose,
  serviceRequest,
  sellerServices = [],
  onSubmitOffer, // New prop: callback to submit offer
  isLoading, // New prop: loading status from parent
  actionError, // New prop: error from parent
}) => {
  console.log(serviceRequest);
  // const dispatch = useDispatch(); // Removed
  const [offerData, setOfferData] = useState({
    message: "", // CORRECTED: This is the field for the offer's text/description
    proposedPrice: "",
    priceType: "fixed",
    proposedDeliveryTime: "",
    availabilityDate: "",
    availabilityTimeSlot: "flexible",
    specificTime: "",
    linkedServiceId: null,
  });
  const [formErrors, setFormErrors] = useState({});

  // const actionStatus = useSelector(selectServiceRequestActionStatus); // Removed
  // const actionError = useSelector(selectServiceRequestActionError); // Removed

  useEffect(() => {
    if (open && serviceRequest) {
      let defaultPriceType = "fixed";
      if (
        serviceRequest.budget?.type === "hourly_range" ||
        serviceRequest.budget?.type === "hourly_fixed"
      ) {
        defaultPriceType = "per_hour";
      }

      setOfferData({
        message: "", // Reset offer message
        proposedPrice: "",
        priceType: defaultPriceType,
        availabilityDate: "",
        availabilityTimeSlot: "flexible",
        specificTime: "",
        linkedServiceId: null,
        proposedDeliveryTime: "", // Ensure this is reset
      });
      // dispatch(clearServiceRequestActionState()); // Removed
      setFormErrors({});
    }
  }, [open, serviceRequest]); // Removed dispatch from dependency array

  const requestConstraints = useMemo(() => {
    if (!serviceRequest) return {};
    return {
      requestBudgetType: serviceRequest.budget?.type,
      requestBudgetMin: serviceRequest.budget?.min,
      requestBudgetMax: serviceRequest.budget?.max,
      requestBudgetFixedValue: serviceRequest.budget?.value,
      requestedDeliveryTimeInDays: serviceRequest.desiredDeliveryTime
        ? parseDeliveryTimeToDays(serviceRequest.desiredDeliveryTime)
        : Infinity,
    };
  }, [serviceRequest]);

  const validateForm = () => {
    const errors = {};
    const price = parseFloat(offerData.proposedPrice);

    if (!offerData.message.trim()) {
      errors.message = "Message / Cover Letter for your offer is required.";
    } else if (offerData.message.trim().length < 10) {
      errors.message = "Offer message should be at least 10 characters long.";
    }

    if (isNaN(price) || price <= 0) {
      errors.proposedPrice = "Valid proposed price is required.";
    } else {
      if (offerData.priceType === "fixed") {
        if (
          requestConstraints.requestBudgetType === "fixed_price" &&
          typeof requestConstraints.requestBudgetFixedValue === "number"
        ) {
          if (price > requestConstraints.requestBudgetFixedValue) {
            errors.proposedPrice = `Offer ($${price}) exceeds request's fixed price ($${requestConstraints.requestBudgetFixedValue}). Consider revising.`;
          }
        } else if (
          requestConstraints.requestBudgetType?.includes("range") &&
          typeof requestConstraints.requestBudgetMax === "number"
        ) {
          if (price > requestConstraints.requestBudgetMax) {
            errors.proposedPrice = `Offer ($${price}) exceeds the request's max budget limit ($${requestConstraints.requestBudgetMax}). While you can submit, this may be a factor.`;
          }
        }
      } else if (offerData.priceType === "per_hour") {
        if (requestConstraints.requestBudgetType === "hourly_range") {
          if (
            typeof requestConstraints.requestBudgetMin === "number" &&
            price < requestConstraints.requestBudgetMin
          ) {
            errors.proposedPrice = `Hourly rate ($${price}/hr) is below the request's minimum ($${requestConstraints.requestBudgetMin}/hr). You may adjust.`;
          }
          if (
            typeof requestConstraints.requestBudgetMax === "number" &&
            price > requestConstraints.requestBudgetMax
          ) {
            errors.proposedPrice = `Hourly rate ($${price}/hr) exceeds the request's maximum ($${requestConstraints.requestBudgetMax}/hr). Consider revising.`;
          }
        }
      }
    }

    if (!offerData.priceType) {
      errors.priceType = "Price type is required.";
    }

    if (offerData.proposedDeliveryTime) {
      const proposedDays = parseDeliveryTimeToDays(
        offerData.proposedDeliveryTime
      );
      if (
        requestConstraints.requestedDeliveryTimeInDays !== Infinity &&
        proposedDays > requestConstraints.requestedDeliveryTimeInDays
      ) {
        errors.proposedDeliveryTime = `Estimate (${
          offerData.proposedDeliveryTime
        }) may exceed desired timeframe (${
          serviceRequest.desiredDeliveryTime || "N/A"
        }). Please confirm or adjust.`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOfferData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (name === "availabilityTimeSlot" && value !== "specific_time") {
      setOfferData((prev) => ({ ...prev, specificTime: "" }));
    }
  };

  const handleLinkedServiceChange = (event, newValue) => {
    setOfferData((prev) => ({ ...prev, linkedServiceId: newValue }));
  };

  // handleSubmitOffer logic moved to parent (ServiceRequestDetailPage)
  // This component will now call the onSubmitOffer prop
  const handleInternalSubmit = () => {
    if (!validateForm()) {
      const hardErrors = Object.values(formErrors).some(
        (err) =>
          err &&
          !(
            err.toLowerCase().includes("consider revising") ||
            err.toLowerCase().includes("may exceed") ||
            err.toLowerCase().includes("may adjust")
          )
      );
      if (hardErrors) {
        // Snackbar for hard errors is now handled by parent via actionError prop
        // or can be re-added here if modal needs to show its own snackbar for form errors
        return;
      }
    }

    const dataToSend = {
      message: offerData.message,
      proposedPrice: Number(offerData.proposedPrice),
      priceType: offerData.priceType,
      proposedDeliveryTime: offerData.proposedDeliveryTime || undefined,
      availabilityDate: offerData.availabilityDate || undefined,
      availabilityTimeSlot: offerData.availabilityTimeSlot || undefined,
      specificTime: offerData.specificTime || undefined,
      linkedServiceId: offerData.linkedServiceId
        ? offerData.linkedServiceId._id
        : null,
    };
    onSubmitOffer(dataToSend); // Call parent's submit handler
  };

  if (!serviceRequest) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Submit Your Proposal for "{serviceRequest.title}"
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Request Highlights:
          </Typography>
          {serviceRequest.title && (
            <Typography variant="body1" fontWeight="medium" sx={{ mb: 0.5 }}>
              Title: {serviceRequest.title}
            </Typography>
          )}
          {serviceRequest.category && (
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              Category: {serviceRequest.category}
              {serviceRequest.subcategory && ` / ${serviceRequest.subcategory}`}
            </Typography>
          )}
          {serviceRequest.budget && (
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              Budget:{" "}
              {serviceRequest.budget.type === "fixed" &&
              typeof serviceRequest.budget.min !== "undefined"
                ? `$${serviceRequest.budget.min} (Fixed)`
                : serviceRequest.budget.type === "fixed_price" &&
                  typeof serviceRequest.budget.value !== "undefined"
                ? `$${serviceRequest.budget.value} (Fixed)`
                : serviceRequest.budget.type?.includes("range") &&
                  typeof serviceRequest.budget.min !== "undefined" &&
                  typeof serviceRequest.budget.max !== "undefined"
                ? `$${serviceRequest.budget.min} - $${
                    serviceRequest.budget.max
                  }${
                    serviceRequest.budget.type === "hourly_range" ? "/hr" : ""
                  }`
                : ` ${
                    serviceRequest.budget.type?.replace(/_/g, " ") ||
                    "Not specified"
                  }`}
              {serviceRequest.budget.currency &&
                ` ${serviceRequest.budget.currency}`}
            </Typography>
          )}
          {serviceRequest.desiredDeliveryTime && (
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              Desired Delivery: {serviceRequest.desiredDeliveryTime}
            </Typography>
          )}
          {serviceRequest.locationPreference && (
            <Typography variant="caption" display="block">
              Location:{" "}
              {serviceRequest.locationPreference
                .replace("_", " ")
                .replace(/^\w/, (c) => c.toUpperCase())}
            </Typography>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="message" // Changed from description to message
              label="Your Message / Cover Letter"
              multiline
              rows={4}
              fullWidth
              value={offerData.message} // Changed from offerData.description
              onChange={handleChange}
              required
              error={!!formErrors.message} // Changed from formErrors.description
              helperText={
                formErrors.message ||
                "Explain why you're a good fit and how you'll approach the request."
              } // Changed from formErrors.description
              inputProps={{ maxLength: 2000 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="proposedPrice"
              label={`Proposed Price (${
                serviceRequest.budget?.currency || "USD"
              })`}
              type="number"
              fullWidth
              value={offerData.proposedPrice}
              onChange={handleChange}
              required
              InputProps={{ inputProps: { min: 0.01, step: "0.01" } }}
              error={!!formErrors.proposedPrice}
              helperText={formErrors.proposedPrice}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!formErrors.priceType}>
              <InputLabel id="offer-price-type-label">Price Type</InputLabel>
              <Select
                labelId="offer-price-type-label"
                name="priceType"
                value={offerData.priceType}
                label="Price Type"
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
          <Grid item xs={12} sm={6}>
            <TextField
              name="proposedDeliveryTime"
              label="Estimated Delivery Time"
              fullWidth
              value={offerData.proposedDeliveryTime}
              onChange={handleChange}
              helperText={
                formErrors.proposedDeliveryTime ||
                "e.g., 5 days, 2 weeks, 1 month"
              }
              error={!!formErrors.proposedDeliveryTime}
              inputProps={{ maxLength: 100 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
              Your Availability (Optional)
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              name="availabilityDate"
              label="Available From Date"
              type="date"
              fullWidth
              value={offerData.availabilityDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel id="availability-slot-label">
                Preferred Time Slot
              </InputLabel>
              <Select
                labelId="availability-slot-label"
                name="availabilityTimeSlot"
                value={offerData.availabilityTimeSlot}
                label="Preferred Time Slot"
                onChange={handleChange}
              >
                {availabilityTimeSlots.map((slot) => (
                  <MenuItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {offerData.availabilityTimeSlot === "specific_time" && (
            <Grid item xs={12} sm={3}>
              <TextField
                name="specificTime"
                label="Specific Time"
                type="time"
                fullWidth
                value={offerData.specificTime}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <Autocomplete
              id="linked-seller-service"
              options={sellerServices}
              getOptionLabel={(option) => option.title || ""}
              value={offerData.linkedServiceId}
              onChange={handleLinkedServiceChange}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Link Your Existing Service (Optional)"
                  variant="outlined"
                  helperText="If relevant, you can link one of your existing services to this proposal."
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id}>
                  <Typography variant="body2">{option.title}</Typography>
                  {option.price && option.priceType && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      (${option.price} {option.priceType.replace("_", " ")})
                    </Typography>
                  )}
                </Box>
              )}
            />
          </Grid>
        </Grid>
        {isLoading === "failed" &&
          actionError && ( // Use isLoading prop for status
            <Alert severity="error" sx={{ mt: 2 }}>
              {typeof actionError === "string"
                ? actionError
                : actionError?.message ||
                  actionError?.error ||
                  (actionError.errors &&
                    Object.values(actionError.errors)[0]?.message) ||
                  "An error occurred while submitting the offer."}
            </Alert>
          )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isLoading === "loading"} // Use isLoading prop
        >
          Cancel
        </Button>
        <Button
          onClick={handleInternalSubmit} // Call internal handler
          variant="contained"
          color="primary"
          disabled={isLoading === "loading"} // Use isLoading prop
        >
          {isLoading === "loading" ? ( // Use isLoading prop
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Submit Offer"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitOfferModal;
