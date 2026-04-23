/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/views/Chat/MessageInput.jsx or src/components/Chat/MessageInput.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSendMessageError,
  clearSendMessageError,
  selectSendMessageStatus,
} from "../../store/slice/chatSlice"; // Adjust path

const MessageInput = ({ onSendMessage }) => {
  // Removed disabled prop, will use selector
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();
  const sendMessageError = useSelector(selectSendMessageError);
  const sendMessageStatus = useSelector(selectSendMessageStatus); // Get status for loading indicator

  const isDisabled = sendMessageStatus === "loading";

  useEffect(() => {
    // Clear the input field if the message was successfully sent (status changes from loading to succeeded)
    // This effect depends on how you handle successful send indication.
    // If `handleIncomingMessage` via socket makes `sendMessageStatus` go to 'succeeded' quickly, this might work.
    // Or, if `sendMessage.fulfilled` in slice clears text, this effect might not be needed for clearing.
    if (sendMessageStatus === "succeeded" && message !== "") {
      // Check if status just became succeeded
      // setMessage(''); // Optimistic clear was removed, let socket handling update things.
      // Message text is usually cleared by the component after calling onSendMessage.
    }
  }, [sendMessageStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      dispatch(clearSendMessageError()); // Clear previous error on new attempt
      onSendMessage(message.trim()); // Send trimmed message
      setMessage(""); // Clear input immediately after sending attempt
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    // If there's an error and user starts typing something valid, clear the error
    if (sendMessageError && e.target.value.trim() !== "") {
      dispatch(clearSendMessageError());
    }
  };

  // Clear error when component unmounts (optional, good practice)
  useEffect(() => {
    return () => {
      if (sendMessageError) {
        dispatch(clearSendMessageError());
      }
    };
  }, [dispatch, sendMessageError]);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 1.5, // Reduced padding slightly
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper", // Ensure consistent background
      }}
    >
      <Box display="flex" alignItems="center">
        <TextField
          fullWidth
          variant="outlined"
          size="small" // Keep size small for chat input
          placeholder="Type your message..."
          value={message}
          onChange={handleChange}
          disabled={isDisabled}
          autoComplete="off"
          multiline
          maxRows={4} // Allow some expansion
          error={!!sendMessageError} // Highlight field if there's a send error
          sx={{ mr: 1 }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!message.trim() || isDisabled}
          sx={{ ml: 0.5 }} // Adjust margin
        >
          {isDisabled ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
      {/* Display the error message from backend if it exists */}
      {sendMessageError && (
        <Typography
          color="error"
          variant="caption"
          sx={{ display: "block", mt: 0.5, ml: 0.5 }} // Adjust margin/padding
        >
          {sendMessageError.message}
        </Typography>
      )}
    </Box>
  );
};

export default MessageInput;
