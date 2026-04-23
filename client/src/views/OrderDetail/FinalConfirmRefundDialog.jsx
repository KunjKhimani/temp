/* eslint-disable no-unused-vars */
// src/components/Orders/FinalConfirmRefundDialog.jsx
/* eslint-disable react/prop-types */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Typography, // For better display of order ID
} from "@mui/material";

const FinalConfirmRefundDialog = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  orderId,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px" } }}
    >
      <DialogTitle fontWeight="bold">
        Confirm Full Refund - Step 2 of 2
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          {" "}
          {/* Use div for richer content */}
          This is your final confirmation. Clicking &apos;Yes, Confirm
          Refund&apos; will attempt to process a full refund for order{" "}
          {orderId && (
            <Typography component="span" fontWeight="bold">
              #{orderId.slice(-6)}
            </Typography>
          )}
          .
          <br />
          <br />
          This action cannot be undone once processed. Are you sure you wish to
          proceed?
        </DialogContentText>
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
          onClick={onSubmit}
          color="error"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Yes, Confirm Refund"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinalConfirmRefundDialog;
