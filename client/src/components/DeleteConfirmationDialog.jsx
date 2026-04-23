/* eslint-disable react/prop-types */
// src/components/DeleteConfirmationDialog.jsx (Example path)
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
  title,
  children,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-confirm-dialog-title"
      aria-describedby="delete-confirm-dialog-description"
    >
      <DialogTitle id="delete-confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-confirm-dialog-description">
          {children} {/* Pass the confirmation text as children */}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} autoFocus>
          Confirm Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
