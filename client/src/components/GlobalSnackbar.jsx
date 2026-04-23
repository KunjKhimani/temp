/* eslint-disable no-unused-vars */
// src/components/Shared/GlobalSnackbar.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert"; // MuiAlert is now just Alert
import {
  hideSnackbar,
  selectSnackbarOpen,
  selectSnackbarMessage,
  selectSnackbarSeverity,
  selectSnackbarDuration,
  selectSnackbarPosition,
} from "../store/slice/snackbarSlice";

const GlobalSnackbar = () => {
  const dispatch = useDispatch();
  const open = useSelector(selectSnackbarOpen);
  const message = useSelector(selectSnackbarMessage);
  const severity = useSelector(selectSnackbarSeverity);
  const duration = useSelector(selectSnackbarDuration);
  const position = useSelector(selectSnackbarPosition);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    dispatch(hideSnackbar());
  };

  // Ensure message is not empty or null before rendering Snackbar to avoid MUI errors
  if (!message) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={position}
      // key={message} // Optional: if you want to re-animate if only message changes
    >
      {/* Using Alert component inside Snackbar for better styling and severity icons */}
      <Alert
        onClose={handleClose} // Allow closing via the Alert's X button
        severity={severity}
        variant="filled" // 'filled' looks good for snackbars
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
