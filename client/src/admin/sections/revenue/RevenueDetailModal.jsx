import React from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Divider,
  Stack,
  Box,
  Chip,
} from "@mui/material";

import { Iconify } from "../../components/iconify";

const getUserDisplayName = (user) => {
  if (!user) return "N/A";
  return user.companyName || user.name || user.representativeName || "N/A";
};

export function RevenueDetailModal({ open, onClose, transaction }) {
  if (!transaction) return null;

  const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === "active" || s === "paid" || s === "delivered") return "success";
    if (s === "pending") return "warning";
    if (s === "cancelled" || s === "failed") return "error";
    return "default";
  };

  const currentStatus = transaction.purchasedItem?.status || transaction.status || "N/A";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Transaction Details</Typography>
        <Chip 
          label={currentStatus.replace(/-/g, " ")} 
          color={getStatusColor(currentStatus)}
          size="small"
          sx={{ textTransform: "capitalize" }}
        />
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Transaction Metadata */}
          <Grid item xs={12}>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Order ID:</Typography>
                <Typography variant="subtitle2">{transaction._id}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Transaction ID:</Typography>
                <Typography variant="subtitle2">{transaction.transactionId || "N/A"}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Date:</Typography>
                <Typography variant="subtitle2">
                  {transaction.createdAt ? format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm") : "N/A"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Parties involved */}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              BUYER
            </Typography>
            <Typography variant="subtitle1">{getUserDisplayName(transaction.buyer)}</Typography>
            <Typography variant="body2" color="text.secondary">{transaction.buyer?.email || ""}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              SELLER
            </Typography>
            <Typography variant="subtitle1">{getUserDisplayName(transaction.seller)}</Typography>
            <Typography variant="body2" color="text.secondary">{transaction.seller?.email || ""}</Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Item Details */}
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              PURCHASED ITEM ({transaction.itemModel?.replace("Order", "").replace(/([A-Z])/g, ' $1').trim()})
            </Typography>
            <Typography variant="subtitle1">
               {transaction.purchasedItem?.title || transaction.purchasedItem?.service?.title || transaction.purchasedItem?.name || "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Financials */}
          <Grid item xs={12}>
            <Stack spacing={1.5}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body1">Total Amount:</Typography>
                <Typography variant="h6">${transaction.totalAmount?.toFixed(2) || "0.00"}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="success.main">Admin Revenue:</Typography>
                <Typography variant="subtitle1" color="success.main">+${transaction.adminCommission?.toFixed(2) || "0.00"}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Seller Earning:</Typography>
                <Typography variant="subtitle1">${transaction.sellerCommission?.toFixed(2) || "0.00"}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

RevenueDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  transaction: PropTypes.object,
};
