/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-unescaped-entities */
// src/views/ServiceRequest/DetailPage/RejectOfferModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  CircularProgress,
  Alert, // For displaying potential top-level errors from thunk
} from "@mui/material";
import { useSelector } from "react-redux";
import { selectServiceRequestActionError } from "../../../store/slice/serviceRequestSlice"; // To show thunk errors

const RejectOfferModal = ({
  open,
  onClose,
  offer,
  serviceRequest,
  onSubmitReject,
  isLoading, // This will be actionStatus from the parent
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [internalError, setInternalError] = useState(""); // For form-specific validation
  const actionErrorFromThunk = useSelector(selectServiceRequestActionError); // Global action error

  useEffect(() => {
    if (open) {
      setRejectionReason(""); // Reset reason when modal opens
      setInternalError("");
      // Note: clearServiceRequestActionState() should be dispatched in the parent (DetailPage) when modal opens
    }
  }, [open]);

  const handleSubmit = () => {
    // Basic validation, though backend might be primary
    // if (!rejectionReason.trim()) { // Making reason optional based on previous design
    //   setInternalError('Providing a reason is recommended.');
    //   return;
    // }
    onSubmitReject(offer._id, rejectionReason); // Pass offerId and reason to parent handler
  };

  if (!offer || !serviceRequest) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="reject-offer-dialog-title"
    >
      <DialogTitle id="reject-offer-dialog-title">
        Reject Offer for "{serviceRequest.title}"
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          You are about to reject the offer from{" "}
          <strong>
            {offer.seller?.name || offer.seller?.companyName || "this provider"}
          </strong>{" "}
          for <strong>${offer.proposedPrice?.toFixed(2)}</strong> (
          {offer.priceType?.replace("_", " ") || "N/A"}).
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="rejectionReason"
          name="rejectionReason"
          label="Reason for Rejection (Optional)"
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={rejectionReason}
          onChange={(e) => {
            setRejectionReason(e.target.value);
            if (internalError) setInternalError("");
          }}
          error={!!internalError}
          helperText={internalError}
          inputProps={{ maxLength: 500 }} // From schema
        />
        {/* Display general submission error if any from thunk */}
        {isLoading === false && actionErrorFromThunk && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {typeof actionErrorFromThunk === "string"
              ? actionErrorFromThunk
              : actionErrorFromThunk.message || "Failed to reject offer."}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="error"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Confirm Rejection"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectOfferModal;
