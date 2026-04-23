/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/components/Chat/ChatBox.js
import React from "react";
import { Paper, Box, useTheme, CircularProgress } from "@mui/material";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const ChatBox = ({
  chatState,
  onMinimize,
  onRestore,
  onClose,
  sellerName = "Seller",
  onSendMessage,
  messages = [], // <-- Receive messages
  currentUserId, // <-- Receive current user ID
  messagesLoading = false, // <-- Receive loading status
  sendMessageLoading = false, // <-- Receive sending status
}) => {
  const theme = useTheme();

  const openHeight = "450px";
  const minimizedHeight = "50px"; // Should match header height

  const isMinimized = chatState === "minimized";

  const handleDummySend = (messageText) => {
    console.log("Sending message:", messageText);
  };

  return (
    <Paper
      elevation={5}
      sx={{
        position: "fixed",
        bottom: 0,
        right: { xs: 0, sm: "20px" },
        width: { xs: "100%", sm: "340px" },
        height: isMinimized ? minimizedHeight : openHeight, // Conditional height
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0px -4px 12px rgba(0,0,0,0.1)",
        transition: "height 0.3s ease-in-out", // Animate height change
        backgroundColor: "background.paper",
        // Click the minimized bar to restore
        cursor: isMinimized ? "pointer" : "default",
      }}
      // Attach restore handler only when minimized
      onClick={isMinimized ? onRestore : undefined}
    >
      {/* Pass all relevant handlers to the header */}
      <ChatHeader
        sellerName={sellerName}
        onMinimize={onMinimize} // Pass down minimize handler
        onClose={onClose} // Pass down close handler
      />

      {/* Conditionally render message list and input */}
      {/* Render based on 'open' state, not just !isMinimized */}
      {chatState === "open" && (
        <>
          {/* Wrap MessageList in Box to handle loading state */}
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              position: "relative",
            }}
          >
            {messagesLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress size={30} />
              </Box>
            ) : (
              <MessageList messages={messages} currentUserId={currentUserId} />
            )}
          </Box>
          <Box onClick={(e) => e.stopPropagation()}>
            <MessageInput
              onSendMessage={onSendMessage}
              disabled={sendMessageLoading} // Disable input while sending
            />
            {/* Optionally show sending indicator near input */}
            {/* {sendMessageLoading && <Typography variant="caption">Sending...</Typography>} */}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ChatBox;
