/* eslint-disable no-unused-vars */
// src/components/Orders/ConfirmRefundReasonModal.jsx
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from "@mui/material";

const ConfirmRefundReasonModal = ({ open, onClose, onSubmit, isLoading }) => {
  const [reason, setReason] = useState("");

  // Reset reason when modal opens/closes if desired, or just on open
  useEffect(() => {
    if (open) {
      setReason(""); // Clear reason each time modal opens
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit(reason.trim()); // Pass the trimmed reason to the parent
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle fontWeight="bold">Request Refund - Step 1 of 2</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1 }}>
          The seller declined this order. We understand this can be frustrating.
        </DialogContentText>
        <DialogContentText sx={{ mb: 2 }}>
          Before proceeding with a full refund, please (optionally) let us know
          why you prefer a refund at this stage, rather than looking for an
          alternative seller. This helps us improve our services.
        </DialogContentText>
        <TextField
          label="Your reason for refund (optional)"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          margin="dense" // Changed from "normal" to "dense" for slightly less padding
          variant="outlined"
          disabled={isLoading}
          autoFocus
        />
      </DialogContent>
      <DialogActions
        sx={{ px: 3, pb: 2, pt: 1, borderTop: 1, borderColor: "divider" }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isLoading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Proceed to Final Confirmation"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmRefundReasonModal;
