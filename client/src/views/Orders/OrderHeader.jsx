/* eslint-disable no-unused-vars */
// src/components/Orders/OrderHeader.jsx
/* eslint-disable react/prop-types */
import React from "react";
import { Box, Typography, Chip, Button, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { formatDistanceToNow } from "date-fns";
import { green, amber, red, blue } from "@mui/material/colors"; // Keep for original colors if needed

// --- UPDATED getStatusChipProps (ensure this is consistent with OrderDetailPage) ---
const getStatusChipProps = (status) => {
  const s = status?.toLowerCase();
  switch (s) {
    case "completed":
      return {
        label: "Completed",
        style: { backgroundColor: green[600], color: "#fff" },
      };
    case "in-progress":
      return {
        label: "In Progress",
        style: { backgroundColor: blue[700], color: "#fff" },
      };
    case "accepted":
      return {
        label: "Accepted",
        style: { backgroundColor: green[400], color: "#fff" },
      };
    case "awaiting-seller-confirmation":
      return {
        label: "Pending Seller Action",
        style: { backgroundColor: amber[700], color: "#000" },
      };
    case "pending-payment":
      return {
        label: "Pending Payment",
        style: { backgroundColor: amber[500], color: "#000" },
      };
    case "declined":
      return {
        label: "Declined",
        style: { backgroundColor: red[400], color: "#fff" },
      };
    case "cancelled":
      return {
        label: "Cancelled",
        style: { backgroundColor: red[600], color: "#fff" },
      };
    case "failed":
      return {
        label: "Payment Failed",
        style: { backgroundColor: red[800], color: "#fff" },
      };
    default:
      return {
        label: status || "Unknown",
        style: { backgroundColor: "#e0e0e0", color: "#000" },
      };
  }
};

const OrderHeader = ({ orderId, status, date, onGoBack }) => {
  const chipProps = getStatusChipProps(status);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      mb={4}
      spacing={2}
    >
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Order Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Order ID: {orderId}
        </Typography>
        {date && (
          <Typography variant="body2" color="text.secondary">
            Placed: {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Chip
          label={chipProps.label}
          style={chipProps.style} // Use style directly
          size="medium"
          sx={{ fontWeight: "bold", textTransform: "capitalize" }}
        />
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={onGoBack}
        >
          Back to Orders
        </Button>
      </Stack>
    </Stack>
  );
};

export default OrderHeader;
