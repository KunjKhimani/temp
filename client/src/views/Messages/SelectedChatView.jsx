/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect } from "react"; // Added useEffect
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
} from "@mui/material"; // Added Alert
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import ChatHeader from "../Chat/ChatHeader";
import MessageList from "../Chat/MessageList";
import MessageInput from "../Chat/MessageInput";

import {
  selectCurrentMessages,
  selectMessagesStatus,
  // selectSendMessageStatus, // No longer needed here, MessageInput handles its own disabled state
  selectCurrentChatTargetName,
  selectChatError, // General chat error (e.g., for loading messages)
  sendMessage,
  selectCurrentConversationDetails,
  clearSendMessageError, // For clearing on unmount
} from "../../store/slice/chatSlice";
import { selectUser } from "../../store/slice/userSlice";

const SelectedChatView = ({ conversationId, onBack }) => {
  const dispatch = useDispatch();

  const currentMessages = useSelector(selectCurrentMessages);
  const messagesStatus = useSelector(selectMessagesStatus);
  const chatTargetName = useSelector(selectCurrentChatTargetName);
  const generalChatError = useSelector(selectChatError); // Error for fetching messages
  const currentUser = useSelector(selectUser);
  const currentConversationDetails = useSelector(
    selectCurrentConversationDetails
  ); // Get full details

  // Clear any lingering send message error when the chat view changes or unmounts
  useEffect(() => {
    return () => {
      dispatch(clearSendMessageError());
    };
  }, [dispatch, conversationId]);

  const handleSendMessage = (messageText) => {
    if (conversationId && messageText.trim()) {
      dispatch(
        sendMessage({
          conversationId: conversationId,
          desc: messageText.trim(),
        })
      );
    } else {
      console.error(
        "Cannot send message: No active conversation ID or empty message."
      );
    }
  };

  let content;
  if (messagesStatus === "loading") {
    /* ... */
    content = (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexGrow: 1,
        }}
      >
        <CircularProgress />
      </Box>
    );
  } else if (messagesStatus === "failed") {
    content = (
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Alert severity="error" sx={{ width: "100%", textAlign: "center" }}>
          Failed to load messages. {generalChatError || "Please try again."}
        </Alert>
      </Box>
    );
  } else {
    content = (
      <>
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflowY: "hidden",
          }}
        >
          {" "}
          {/* Ensure MessageList can scroll */}
          <MessageList
            messages={currentMessages}
            currentUserId={currentUser?._id}
          />
        </Box>
        <MessageInput onSendMessage={handleSendMessage} />{" "}
        {/* disabled prop removed, handled internally */}
      </>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {" "}
      {/* Changed to background.default */}
      <ChatHeader
        targetUserName={chatTargetName} // Renamed prop for clarity
        conversationDetails={currentConversationDetails} // Pass full details for orderId display
        onMinimizeOrBack={onBack ? () => onBack() : undefined} // Use a more generic prop name
        isMobile={!!onBack} // Pass if it's mobile context (for back button vs. minimize)
      />
      {content}
    </Box>
  );
};

export default SelectedChatView;
