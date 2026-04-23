/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { Box, Typography, IconButton, Avatar, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIcon from "@mui/icons-material/ArrowBack"; // For mobile back
import PersonIcon from "@mui/icons-material/Person"; // Fallback avatar
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined"; // For order icon

const ChatHeader = ({
  targetUserName = "Chat",
  targetUserAvatar, // Optional: pass avatar URL
  conversationDetails,
  onMinimizeOrBack, // Single handler for minimize (desktop) or back (mobile)
  onClose, // Handler for closing the floating chat box (if applicable)
  isMobile = false, // To decide icon for onMinimizeOrBack
}) => {
  const orderId = conversationDetails?.orderId;
  const displayOrderId = orderId
    ? `Order #${orderId.substring(0, 8)}...`
    : null; // Show partial order ID

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1,
        pl: isMobile && onMinimizeOrBack ? 0.5 : 1.5, // Adjust left padding if back button is present
        backgroundColor: "background.paper", // Use paper background for better theme integration
        color: "text.primary",
        borderBottom: 1, // Add a bottom border
        borderColor: "divider",
        height: "56px", // Standard Material Design toolbar height
        flexShrink: 0,
      }}
    >
      {isMobile && onMinimizeOrBack && (
        <IconButton
          onClick={onMinimizeOrBack}
          size="small"
          sx={{ color: "text.secondary", mr: 0.5 }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          overflow: "hidden",
          flexGrow: 1,
        }}
      >
        <Avatar
          src={targetUserAvatar}
          sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
        >
          {!targetUserAvatar && (
            <PersonIcon
              fontSize="small"
              sx={{ color: "primary.contrastText" }}
            />
          )}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="medium" noWrap>
            {targetUserName}
          </Typography>
          {displayOrderId && (
            <Tooltip title={`Conversation related to ${displayOrderId}`}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  cursor: "default",
                }}
                noWrap
              >
                <ShoppingBagOutlinedIcon sx={{ fontSize: "0.875rem" }} />
                {displayOrderId}
              </Typography>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box>
        {!isMobile &&
          onMinimizeOrBack && ( // Minimize button for non-mobile if handler exists
            <IconButton
              onClick={onMinimizeOrBack}
              size="small"
              sx={{ color: "text.secondary" }}
              aria-label="minimize chat"
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          )}
        {onClose && ( // Close button if handler exists (for floating chat)
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary", ml: 0.5 }}
            aria-label="close chat"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default ChatHeader;
