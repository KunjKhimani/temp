/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// src/components/Chat/MessageList.js
import React, { useRef, useEffect } from "react";
import { Box, Typography, Paper } from "@mui/material";

// No more dummy data needed here

const MessageList = ({ messages = [], currentUserId }) => {
  // Receive props
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // Scroll when messages change

  // Handle case where messages might be empty or undefined briefly
  if (!messages || messages.length === 0) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">
          No messages yet. Start the conversation!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        p: 2,
        backgroundColor: "grey.100", // Lighter background for message area
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        // Remove fixed height, let flexGrow handle it
      }}
    >
      {messages.map((msg) => {
        // Use the passed currentUserId to check sender
        const isSender = msg.userId === currentUserId;
        // Format timestamp (basic example, use date-fns or similar for better formatting)
        const formattedTime = msg.createdAt
          ? new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return (
          <Box
            // Use message _id from MongoDB as key
            key={msg._id || msg.tempId} // Use tempId for potential optimistic updates
            sx={{
              display: "flex",
              justifyContent: isSender ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1,
                px: 1.5,
                maxWidth: "75%",
                borderRadius: isSender
                  ? "15px 15px 0 15px"
                  : "15px 15px 15px 0",
                backgroundColor: isSender ? "primary.main" : "background.paper", // Adjusted colors
                color: isSender ? "primary.contrastText" : "text.primary",
                wordBreak: "break-word",
              }}
            >
              <Typography variant="body2">{msg.desc}</Typography>
              <Typography
                variant="caption"
                display="block"
                color={isSender ? "grey.300" : "text.secondary"}
                sx={{ mt: 0.5, textAlign: "right", fontSize: "0.65rem" }}
              >
                {formattedTime}
              </Typography>
            </Paper>
          </Box>
        );
      })}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
