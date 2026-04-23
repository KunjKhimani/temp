/* eslint-disable no-unused-vars */
// src/components/Orders/OrderDetailSummary.jsx
/* eslint-disable react/prop-types */
import React from "react";
import {
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  Chip,
} from "@mui/material";
import { format, parseISO } from "date-fns";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import EventIcon from "@mui/icons-material/Event";
import FingerprintIcon from "@mui/icons-material/Fingerprint"; // For IDs
import NotesIcon from "@mui/icons-material/Notes"; // For additional info, quantity etc.
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GroupIcon from "@mui/icons-material/Group";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

// Helper to format keys (e.g., camelCase to Title Case)
const formatKey = (key) => {
  if (key === "_id") return "ID";
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

// Helper to format values for this specific summary
const formatDisplayValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "N/A";

  const lowerKey = key.toLowerCase();

  if (
    typeof value === "number" &&
    (lowerKey.includes("price") ||
      lowerKey.includes("fee") ||
      lowerKey.includes("amount") ||
      lowerKey.includes("travel")) // Catch travelFeeApplied
  ) {
    return `$${value.toFixed(2)}`;
  }

  if (
    lowerKey.includes("date") ||
    lowerKey.includes("at") ||
    lowerKey.includes("timestamp")
  ) {
    try {
      const date = parseISO(String(value)); // Use parseISO for robust ISO string parsing
      if (!isNaN(date.valueOf())) {
        return format(date, "MMM d, yyyy, hh:mm a");
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) return value.join(", "); // Simple join for arrays

  return String(value);
};

const DetailItem = ({
  icon,
  label,
  value,
  fullWidthValue = false,
  highlight = false,
}) => (
  <ListItem disablePadding sx={{ py: 0.75 }}>
    <Grid container alignItems="flex-start">
      <Grid
        item
        xs={fullWidthValue ? 12 : 5}
        sm={fullWidthValue ? 12 : 4}
        md={fullWidthValue ? 12 : 3.5}
      >
        <Box display="flex" alignItems="center">
          {icon &&
            React.cloneElement(icon, {
              sx: { fontSize: 18, mr: 1, color: "text.secondary" },
            })}
          <Typography variant="body2" color="text.secondary">
            {label}:
          </Typography>
        </Box>
      </Grid>
      {
        fullWidthValue && icon && (
          <Grid item xs={12} sx={{ pb: 0.5 }} />
        ) /* Spacer for fullWidthValue with icon */
      }
      <Grid
        item
        xs={fullWidthValue ? 12 : 7}
        sm={fullWidthValue ? 12 : 8}
        md={fullWidthValue ? 12 : 8.5}
      >
        <Typography
          variant="body2"
          fontWeight={highlight ? "bold" : "medium"}
          color={highlight ? "primary.main" : "text.primary"}
          sx={{
            textAlign: fullWidthValue ? "left" : "right",
            pl: fullWidthValue ? (icon ? 3.2 : 0) : 0,
          }}
        >
          {value}
        </Typography>
      </Grid>
    </Grid>
  </ListItem>
);

const OrderDetailSummary = ({ order }) => {
  if (!order) return null;

  const {
    _id,
    quantity,
    numberOfHours,
    numberOfPeople,
    additionalInfo,
    location,
    travelFeeApplied,
    totalPrice,
    createdAt,
    status, // Already shown in OrderHeader, but can be here too if needed
    // service.title, type, price, priceType are in ServiceInfoCard
  } = order;

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: "12px" }}
    >
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: "bold" }}>
        Order Breakdown
      </Typography>
      <List dense disablePadding>
        <DetailItem icon={<FingerprintIcon />} label="Order ID" value={_id} />
        <DetailItem
          icon={<EventIcon />}
          label="Placed On"
          value={createdAt ? formatDisplayValue("createdAt", createdAt) : "N/A"}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Order Specifics */}
        {order.service?.priceType === "per hour" && numberOfHours != null && (
          <DetailItem
            icon={<AccessTimeIcon />}
            label="Hours Booked"
            value={`${numberOfHours} hr${numberOfHours > 1 ? "s" : ""}`}
          />
        )}
        {order.service?.priceType === "per project" && quantity != null && (
          <DetailItem
            icon={<NotesIcon />}
            label={order.service.type === "on-site" ? "Bookings" : "Quantity"}
            value={quantity}
          />
        )}
        {order.service?.type === "on-site" && numberOfPeople != null && (
          <DetailItem
            icon={<GroupIcon />}
            label="Number of People"
            value={numberOfPeople}
          />
        )}
        {order.service?.type === "on-site" && location && (
          <DetailItem
            icon={<LocationOnIcon />}
            label="Service Location"
            value={location}
          />
        )}

        {((order.service?.priceType === "per hour" && numberOfHours != null) ||
          (order.service?.priceType === "per project" && quantity != null) ||
          (order.service?.type === "on-site" &&
            (numberOfPeople != null || location))) && (
          <Divider sx={{ my: 1.5 }} />
        )}

        {/* Financials */}
        {travelFeeApplied > 0 && (
          <DetailItem
            icon={<AttachMoneyIcon />}
            label="Travel Fee"
            value={formatDisplayValue("travelFeeApplied", travelFeeApplied)}
          />
        )}
        <DetailItem
          icon={<AttachMoneyIcon />}
          label="Total Amount"
          value={formatDisplayValue("totalPrice", totalPrice)}
          highlight
        />

        {/* Additional Info */}
        {additionalInfo && additionalInfo.trim() !== "" && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <DetailItem
              icon={<NotesIcon />}
              label="Additional Notes"
              value={additionalInfo}
              fullWidthValue // Make value take full width below label
            />
          </>
        )}
      </List>
    </Paper>
  );
};

export default OrderDetailSummary;
