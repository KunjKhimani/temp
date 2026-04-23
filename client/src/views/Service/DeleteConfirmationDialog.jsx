/* eslint-disable react/prop-types */
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  serviceTitle,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Service Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the service "{serviceTitle}"? This
          action cannot be undone. Associated orders may also be affected.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} autoFocus>
          Delete Service
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
