/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
} from "@mui/material";
import { format } from "date-fns"; // For date formatting

// Helper to format keys (e.g., camelCase to Title Case)
const formatKey = (key) => {
  if (key === "_id") return "Order ID"; // Special case for _id
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

// Helper to format values
const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "N/A";

  // Price/Fee formatting
  if (
    typeof value === "number" &&
    (key.toLowerCase().includes("price") ||
      key.toLowerCase().includes("fee") ||
      key.toLowerCase().includes("amount"))
  ) {
    return `$${value.toFixed(2)}`;
  }

  // Date formatting
  if (key.toLowerCase().includes("date") || key.toLowerCase().includes("at")) {
    try {
      const date = new Date(value);
      if (!isNaN(date.valueOf())) {
        return format(date, "MMMM d, yyyy, hh:mm a");
      }
    } catch (e) {
      /* ignore, will be stringified */
    }
  }

  // Boolean formatting
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Array formatting (simple comma-separated list)
  if (Array.isArray(value)) {
    if (value.length === 0) return "N/A";
    // If array of simple strings/numbers
    if (
      value.every(
        (item) => typeof item === "string" || typeof item === "number"
      )
    ) {
      return value.join(", ");
    }
    return "[Complex Array Data]"; // Placeholder for more complex array rendering
  }

  // Default to string
  return String(value);
};

const OrderSummary = ({ order }) => {
  if (!order) return null;

  // Define keys to exclude from the main iteration
  const excludedRootKeys = [
    "__v",
    "updatedAt", // createdAt will be shown separately if desired
    "paymentIntentId",
    "paymentIntentClientSecret",
    "service", // Service object will be handled specially
    "buyer", // Buyer object might be handled specially or excluded
    "seller", // Seller object might be handled specially or excluded
    "status", // Status will be shown prominently
    "totalPrice", // Will be shown prominently
    // "createdAt" // If you want to show it in the main list, remove from here
  ];

  // Keys from the service object to display
  const serviceDisplayKeys = [
    "type",
    "category",
    "subcategory",
    "price",
    "priceType",
  ];

  const renderObjectEntries = (obj, excluded = [], parentKey = "") => {
    return Object.entries(obj)
      .filter(([key]) => !excluded.includes(key))
      .map(([key, value]) => {
        // Skip complex objects for now in this generic renderer, unless explicitly handled
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          // Optionally, you could decide to render specific nested objects here
          // For now, we'll skip them to keep it cleaner, as `service` is handled separately
          // console.log(`Skipping nested object: ${parentKey}${key}`);
          return null;
        }
        return (
          <ListItem key={parentKey + key} disablePadding sx={{ py: 0.5 }}>
            <ListItemText
              primary={formatKey(key)}
              secondary={formatValue(key, value)}
              primaryTypographyProps={{
                fontWeight: "medium",
                variant: "body2",
              }}
              secondaryTypographyProps={{
                variant: "body2",
                color: "text.secondary",
                whiteSpace: "pre-wrap",
              }}
            />
          </ListItem>
        );
      })
      .filter(Boolean); // Remove null entries
  };

  return (
    <Card variant="outlined" sx={{ boxShadow: 2, borderRadius: "8px" }}>
      <CardHeader
        title="Order Summary"
        titleTypographyProps={{ variant: "h6", fontWeight: "bold" }}
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          py: 1.5,
          px: 2,
        }}
      />
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Column 1: Main Order Details */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              color="primary"
            >
              Order Details
            </Typography>
            <List dense disablePadding>
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary="Order ID"
                  secondary={order._id || "N/A"}
                  primaryTypographyProps={{
                    fontWeight: "medium",
                    variant: "body2",
                  }}
                  secondaryTypographyProps={{
                    variant: "body2",
                    color: "text.secondary",
                  }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary="Order Status"
                  secondary={
                    <Chip
                      label={formatKey(order.status || "N/A")}
                      size="small"
                      color={
                        order.status === "pending-payment"
                          ? "warning"
                          : "default"
                      }
                    />
                  }
                  primaryTypographyProps={{
                    fontWeight: "medium",
                    variant: "body2",
                  }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.5 }}>
                <ListItemText
                  primary="Order Date"
                  secondary={
                    order.createdAt
                      ? formatValue("createdAt", order.createdAt)
                      : "N/A"
                  }
                  primaryTypographyProps={{
                    fontWeight: "medium",
                    variant: "body2",
                  }}
                  secondaryTypographyProps={{
                    variant: "body2",
                    color: "text.secondary",
                  }}
                />
              </ListItem>
              {/* Render other root-level order details dynamically */}
              {renderObjectEntries(
                order,
                excludedRootKeys.concat(["_id", "createdAt"])
              )}
            </List>
          </Grid>

          {/* Column 2: Service & Price Details */}
          <Grid item xs={12} md={6}>
            {order.service && (
              <>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  gutterBottom
                  color="primary"
                >
                  Service Information
                </Typography>
                <List dense disablePadding>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary="Service"
                      secondary={order.service.title || "N/A"}
                      primaryTypographyProps={{
                        fontWeight: "medium",
                        variant: "body2",
                      }}
                      secondaryTypographyProps={{
                        variant: "body2",
                        color: "text.secondary",
                        fontWeight: "bold",
                      }}
                    />
                  </ListItem>
                  {/* Dynamically render specific service keys */}
                  {renderObjectEntries(
                    order.service,
                    Object.keys(order.service).filter(
                      (k) => !serviceDisplayKeys.includes(k)
                    )
                  )}
                </List>
                <Divider sx={{ my: 1.5 }} />
              </>
            )}

            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
              color="primary"
            >
              Payment Summary
            </Typography>
            <List dense disablePadding>
              {order.travelFeeApplied > 0 && (
                <ListItem disablePadding sx={{ py: 0.5 }}>
                  <ListItemText
                    primary="Travel Fee"
                    secondary={formatValue(
                      "travelFeeApplied",
                      order.travelFeeApplied
                    )}
                    primaryTypographyProps={{
                      fontWeight: "medium",
                      variant: "body2",
                    }}
                    secondaryTypographyProps={{
                      variant: "body2",
                      color: "text.secondary",
                    }}
                  />
                </ListItem>
              )}
              <ListItem
                disablePadding
                sx={{
                  py: 1,
                  backgroundColor: "grey.100",
                  borderRadius: 1,
                  px: 1,
                }}
              >
                <ListItemText
                  primary="Total Amount"
                  secondary={formatValue("totalPrice", order.totalPrice)}
                  primaryTypographyProps={{
                    fontWeight: "bold",
                    variant: "body1",
                  }}
                  secondaryTypographyProps={{
                    fontWeight: "bold",
                    variant: "h6",
                    color: "primary.main",
                  }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>

        {/* Additional Info Section (if exists) */}
        {order.additionalInfo && order.additionalInfo.trim() !== "" && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                gutterBottom
                color="primary"
              >
                Additional Information
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-wrap", fontStyle: "italic" }}
              >
                {order.additionalInfo}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
