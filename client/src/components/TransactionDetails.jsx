import React from "react";
import PropTypes from "prop-types";
import {
  Paper,
  Typography,
  Divider,
  Stack,
  Box,
  useTheme,
  alpha,
} from "@mui/material";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const TransactionDetails = ({ transaction }) => {
  const theme = useTheme();

  if (!transaction) return null;

  const {
    totalAmount,
    sellerCommission,
    adminCommission,
    currency,
    paymentProvider,
    transactionId,
    createdAt,
  } = transaction;

  const formatCurrency = (value) => {
    if (typeof value !== "number") return "0.00";
    return value.toFixed(2);
  };

  const detailItems = [
    {
      label: "Total Amount",
      value: `${formatCurrency(totalAmount)} ${currency || "USD"}`,
      icon: <ReceiptIcon fontSize="small" />,
      color: theme.palette.primary.main,
    },
    {
      label: "Seller Earnings",
      value: `${formatCurrency(sellerCommission)} ${currency || "USD"}`,
      icon: <AccountBalanceWalletIcon fontSize="small" />,
      color: theme.palette.success.main,
    },
    {
      label: "Admin Commission",
      value: `${formatCurrency(adminCommission)} ${currency || "USD"}`,
      icon: <AdminPanelSettingsIcon fontSize="small" />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5,
        mt: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Transaction Details
      </Typography>
      
      <Stack spacing={2} mt={2}>
        {detailItems.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha(item.color, 0.05),
              border: `1px solid ${alpha(item.color, 0.1)}`,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  display: "flex",
                  color: item.color,
                }}
              >
                {item.icon}
              </Box>
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                {item.label}
              </Typography>
            </Stack>
            <Typography variant="subtitle1" fontWeight="bold" color={item.color}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 2, borderStyle: "dashed" }} />

      <Stack spacing={1}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Payment Provider
          </Typography>
          <Typography variant="caption" fontWeight="bold">
            {paymentProvider}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Transaction ID
          </Typography>
          <Typography variant="caption" component="span" sx={{ wordBreak: "break-all" }}>
            {transactionId}
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Date
          </Typography>
          <Typography variant="caption">
            {new Date(createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

TransactionDetails.propTypes = {
  transaction: PropTypes.shape({
    totalAmount: PropTypes.number,
    sellerCommission: PropTypes.number,
    adminCommission: PropTypes.number,
    currency: PropTypes.string,
    paymentProvider: PropTypes.string,
    transactionId: PropTypes.string,
    createdAt: PropTypes.string,
  }),
};

export default TransactionDetails;
