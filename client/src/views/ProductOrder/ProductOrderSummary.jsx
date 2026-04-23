/* eslint-disable no-unused-vars */
// src/components/ProductOrder/ProductOrderSummary.jsx
/* eslint-disable react/prop-types */
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Avatar,
  Link as MuiLink,
} from "@mui/material";
// import { Link as RouterLink } from "react-router-dom"; // If linking to product/seller

const API_DOMAIN_FOR_IMAGES =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Simplified

const ProductOrderSummary = ({ order }) => {
  if (!order) {
    return (
      <Card elevation={2}>
        <CardHeader title="Order Summary" />
        <CardContent>
          <Typography>No order details to display.</Typography>
        </CardContent>
      </Card>
    );
  }

  const {
    items,
    shippingAddress,
    subTotal,
    shippingFee,
    totalPrice,
    additionalInfo,
  } = order;

  return (
    <Card elevation={2}>
      <CardHeader
        title="Order Summary"
        subheader={`Order #${order._id.slice(-6).toUpperCase()}`}
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      />
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Items
        </Typography>
        <List disablePadding sx={{ mb: 2 }}>
          {items.map((item, index) => (
            <React.Fragment key={item.product?._id || index}>
              <ListItem disableGutters sx={{ py: 0.5 }}>
                <ListItemText
                  primary={`${item.nameAtOrder} (Qty: ${item.quantity})`}
                  secondary={`@ $${item.priceAtOrder.toFixed(2)} each`}
                />
                <Typography variant="body1">
                  ${(item.quantity * item.priceAtOrder).toFixed(2)}
                </Typography>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
        <Divider sx={{ my: 1.5 }} />

        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="body1">Subtotal:</Typography>
          <Typography variant="body1">${subTotal.toFixed(2)}</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" mb={1.5}>
          <Typography variant="body1">Shipping Fee:</Typography>
          <Typography variant="body1">${shippingFee.toFixed(2)}</Typography>
        </Box>
        <Divider sx={{ my: 1.5 }} />
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="div">
            Total:
          </Typography>
          <Typography
            variant="h6"
            component="div"
            color="primary.main"
            fontWeight="bold"
          >
            ${totalPrice.toFixed(2)}
          </Typography>
        </Box>

        {shippingAddress && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Shipping To:
            </Typography>
            <Typography variant="body2">{shippingAddress.name}</Typography>
            <Typography variant="body2">{shippingAddress.street}</Typography>
            <Typography variant="body2">
              {shippingAddress.city}, {shippingAddress.state}{" "}
              {shippingAddress.postalCode}
            </Typography>
            <Typography variant="body2">{shippingAddress.country}</Typography>
            {shippingAddress.phone && (
              <Typography variant="body2">
                Phone: {shippingAddress.phone}
              </Typography>
            )}
          </>
        )}
        {additionalInfo && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Additional Notes:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {additionalInfo}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductOrderSummary;
