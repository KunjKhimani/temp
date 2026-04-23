/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useCallback } from "react"; // Added useCallback
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux"; // << IMPORT useDispatch
import Lottie from "lottie-react";
import OrderAnimation from "../../assets/Order_successful.json";
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material"; // Added Stack, CircularProgress
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send"; // For the new button

import { sendMessage } from "../../store/slice/chatSlice"; // << IMPORT sendMessage THUNK
import {
  selectSendMessageStatus,
  clearSendMessageError,
} from "../../store/slice/chatSlice"; // For loading/error state
import { useSelector } from "react-redux"; // For selecting send message status

const OrderCompleted = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch(); // << Get dispatch function

  const orderIdFromState = location.state?.orderId;
  const conversationIdFromState = location.state?.conversationId;
  const initialMessageFromState = location.state?.initialMessage; // << Get initial message

  const sendMessageStatus = useSelector(selectSendMessageStatus); // For loading indicator
  const [isSendingInitial, setIsSendingInitial] = React.useState(false); // Local state for this specific send action

  const handleBackToHome = () => navigate("/");
  const handleGoToOrders = () => navigate("/user/orders");
  const handleGoToThisOrderDetails = () => {
    if (orderIdFromState) navigate(`/user/orders/${orderIdFromState}`);
    else handleGoToOrders();
  };
  const handleGoToMessagesDirectly = useCallback(() => {
    // Renamed for clarity
    if (conversationIdFromState)
      navigate(`/messages?conversationId=${conversationIdFromState}`);
    else handleGoToThisOrderDetails();
  });

  // New handler to send the initial message and then navigate
  const handleSendInitialMessageAndGoToChat = useCallback(async () => {
    if (
      conversationIdFromState &&
      initialMessageFromState &&
      initialMessageFromState.trim() !== ""
    ) {
      setIsSendingInitial(true);
      dispatch(clearSendMessageError()); // Clear any previous errors
      try {
        await dispatch(
          sendMessage({
            conversationId: conversationIdFromState,
            desc: initialMessageFromState,
          })
        ).unwrap(); // unwrap to catch rejections here

        // Message sent (or at least attempted), now navigate
        navigate(`/messages?conversationId=${conversationIdFromState}`);
      } catch (error) {
        console.error("Failed to send initial message:", error);
        // Error will be in Redux state (sendMessageError), MessageInput on chat page will show it.
        // Or, you can show an alert here too.
        alert(
          `Could not send your initial message: ${
            error.message || "Please try sending it from the chat screen."
          }`
        );
        // Still navigate to chat so they can try manually
        navigate(`/messages?conversationId=${conversationIdFromState}`);
      } finally {
        setIsSendingInitial(false);
      }
    } else {
      // If no message or conversationId, just go to chat normally
      handleGoToMessagesDirectly();
    }
  }, [
    conversationIdFromState,
    initialMessageFromState,
    dispatch,
    navigate,
    handleGoToMessagesDirectly,
  ]);

  // Clear send message error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearSendMessageError());
    };
  }, [dispatch]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "80vh", // Use minHeight instead of fixed height
        bgcolor: "background.default", // Use theme background color
        p: 3, // Add some padding
      }}
    >
      <>
        {/* Lottie Animation */}
        <Box sx={{ width: "80%", maxWidth: "300px", mb: 2 }}>
          {" "}
          {/* Control Lottie size */}
          <Lottie animationData={OrderAnimation} loop={true} />
        </Box>

        {/* Success Message */}
        <Typography
          variant="h4"
          component="h1"
          color="success.main"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Payment Successful!
        </Typography>
        <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
          Your Order is Confirmed.
        </Typography>

        {initialMessageFromState && initialMessageFromState.trim() !== "" && (
          <Box
            sx={{
              my: 2,
              p: 2,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              width: "90%",
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your initial message/notes to the seller:
            </Typography>
            <Typography variant="body1" sx={{ fontStyle: "italic" }}>
              &quot;{initialMessageFromState}&quot;
            </Typography>
          </Box>
        )}

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Thank you for your purchase! The seller has been notified.
          {initialMessageFromState && initialMessageFromState.trim() !== ""
            ? " You can send your initial message now or chat further."
            : " You can now view your order details or chat with the seller."}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="center"
          sx={{ width: "100%", mt: 2 }}
          flexWrap="wrap"
        >
          {/* Option 1: Button to Send Initial Message then Go to Chat */}
          {conversationIdFromState &&
            initialMessageFromState &&
            initialMessageFromState.trim() !== "" && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSendInitialMessageAndGoToChat}
                startIcon={
                  isSendingInitial ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SendIcon />
                  )
                }
                disabled={isSendingInitial}
                sx={{ order: { xs: 1, sm: 0 } }}
              >
                Send Note & Go to Chat
              </Button>
            )}

          {/* Option 2: Button to just Go to Chat (if no initial message or user prefers) */}
          {conversationIdFromState &&
            (!initialMessageFromState ||
              initialMessageFromState.trim() === "") && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleGoToMessagesDirectly}
                startIcon={<ChatBubbleOutlineIcon />}
                sx={{ order: { xs: 1, sm: 0 } }}
              >
                Chat About Order
              </Button>
            )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleGoToThisOrderDetails}
            startIcon={<ListAltIcon />}
            sx={{ order: { xs: initialMessageFromState ? 2 : 1, sm: 1 } }}
          >
            View Your Order
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBackToHome}
            startIcon={<HomeIcon />}
            sx={{ order: { xs: initialMessageFromState ? 3 : 2, sm: 2 } }}
          >
            Back to Home
          </Button>
        </Stack>
      </>
    </Box>
  );
};

export default OrderCompleted;
