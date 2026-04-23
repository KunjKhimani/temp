/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
// src/context/NotificationContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

const NotificationContext = createContext({
  showNotification: (message, severity, title) => {}, // Dummy function signature
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info"); // 'error', 'warning', 'info', 'success'
  const [title, setTitle] = useState(""); // Optional title

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
    // Optional: Reset message/severity after closing animation finishes
    // setTimeout(() => {
    //     setMessage('');
    //     setSeverity('info');
    //     setTitle('');
    // }, 300); // Adjust timing based on Snackbar transition duration
  };

  // Function to trigger the notification
  const showNotification = useCallback(
    (newMessage, newSeverity = "info", newTitle = "") => {
      setMessage(newMessage);
      setSeverity(newSeverity);
      setTitle(newTitle);
      setOpen(true);
    },
    []
  );

  const contextValue = { showNotification };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000} // Adjust duration as needed (milliseconds)
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }} // Position
      >
        {/* Use Alert inside Snackbar for standard styling */}
        {/* Add key={message} to force re-render if message content changes while open */}
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{ width: "100%" }}
          variant="filled"
          key={message}
        >
          {title && <AlertTitle>{title}</AlertTitle>}
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
