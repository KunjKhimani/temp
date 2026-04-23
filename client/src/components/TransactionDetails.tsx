import React from "react";
import { Paper, Typography, Box, Grid, Divider } from "@mui/material";
import { Transaction } from "../services/transaction.service";

interface TransactionDetailsProps {
  transaction: Transaction | null;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction }) => {
  if (!transaction) {
    return (
      <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: "grey.50" }}>
        <Typography variant="h6" gutterBottom>
          Transaction Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No transaction found for this order.
        </Typography>
      </Paper>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Transaction Details
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" display="block">
            Transaction ID
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {transaction.transactionId}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" display="block">
            Status
          </Typography>
          <Typography variant="body2" fontWeight="medium" sx={{ textTransform: "capitalize" }}>
            {transaction.status}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" display="block">
            Total Amount
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(transaction.totalAmount, transaction.currency)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" display="block">
            Payment Provider
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {transaction.paymentProvider}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" display="block">
            Seller Commission
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(transaction.sellerCommission, transaction.currency)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary" display="block">
            Admin Commission
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(transaction.adminCommission, transaction.currency)}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" display="block">
            Date
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {new Date(transaction.createdAt).toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TransactionDetails;
