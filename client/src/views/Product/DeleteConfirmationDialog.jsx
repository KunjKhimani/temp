/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/components/Shared/DeleteConfirmationDialog.jsx
import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  CircularProgress,
} from "@mui/material";

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  contentTypeText, // Changed from 'contentText' for clarity
  isLoading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {contentTypeText}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="primary" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          autoFocus
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Delete"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
