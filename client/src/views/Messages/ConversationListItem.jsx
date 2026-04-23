/* eslint-disable react/prop-types */
// src/views/Messages/ConversationListItem.jsx
import React from "react";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Badge,
  Box,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";

const getFullAvatarUrl = (relativePath) => {
  if (!relativePath) return null;
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Adjust as needed
  return `${API_BASE_URL}/${relativePath}`;
};

// // We don't need this helper here anymore if backend provides names/types
// const getUserDisplayName = (user) => { ... };

const ConversationListItem = ({
  conversation,
  currentUser,
  isSelected,
  onSelect,
}) => {
  // console.log("Current User in Item:", currentUser);
  // console.log("Conversation object in Item:", conversation);

  // --- **REVISED LOGIC STARTS HERE** ---

  // Validate essential data (check for the string IDs)
  if (
    !currentUser?._id ||
    !conversation?.sellerId || // Check if the string ID exists
    !conversation?.buyerId // Check if the string ID exists
  ) {
    console.warn("Missing critical user or conversation ID strings", {
      currentUser,
      conversation,
    });
    return null;
  }

  // Determine if the CURRENT logged-in user is the seller IN THIS CONVERSATION
  // **Compare the string IDs directly**
  const isUserTheSeller = currentUser._id === conversation.sellerId;

  // Get the details of the OTHER user directly from the conversation object fields
  const otherUserName = isUserTheSeller
    ? conversation.buyerName // Use pre-fetched buyerName
    : conversation.sellerName; // Use pre-fetched sellerName

  const otherUserAvatarRelative = isUserTheSeller
    ? conversation.buyerAvatar // Use pre-fetched buyerAvatar
    : conversation.sellerAvatar; // Use pre-fetched sellerAvatar

  // Construct the full avatar URL
  const otherUserAvatar = getFullAvatarUrl(otherUserAvatarRelative);

  // Determine if the conversation is unread FOR THE CURRENT USER
  const isUnread = isUserTheSeller
    ? !conversation.readBySeller
    : !conversation.readByBuyer;

  // Format timestamp
  const lastMessageTime = conversation.updatedAt
    ? formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })
    : "";

  // --- **REVISED LOGIC ENDS HERE** ---

  return (
    <ListItem
      alignItems="flex-start"
      selected={isSelected}
      onClick={onSelect}
      button
      sx={{
        cursor: "pointer",
        bgcolor: isSelected ? "action.selected" : "background.paper",
        "&:hover": {
          bgcolor: "action.hover",
        },
        // mb: 1,
      }}
    >
      <ListItemAvatar>
        <Badge
          color="error"
          variant="dot"
          invisible={!isUnread}
          overlap="circular"
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Avatar alt={otherUserName || ""} src={otherUserAvatar || undefined}>
            {!otherUserAvatar && otherUserName
              ? otherUserName.charAt(0).toUpperCase()
              : null}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography
            variant="subtitle1"
            fontWeight={isUnread ? "bold" : "normal"}
            noWrap
            color="text.primary"
          >
            {/* Use the derived otherUserName */}
            {otherUserName || "Unknown User"}
          </Typography>
        }
        secondary={
          <React.Fragment>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
            >
              <Typography
                variant="body2"
                color={isUnread ? "text.primary" : "text.secondary"}
                sx={{
                  fontWeight: isUnread ? "medium" : "normal",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flexGrow: 1,
                  mr: 1,
                }}
              >
                {/* Use conversation.lastMessage directly */}
                {conversation.lastMessage || "..."}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ flexShrink: 0 }}
              >
                {lastMessageTime}
              </Typography>
            </Box>
          </React.Fragment>
        }
      />
    </ListItem>
  );
};

export default ConversationListItem;
