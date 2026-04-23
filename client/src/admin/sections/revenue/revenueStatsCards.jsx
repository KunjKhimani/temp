import PropTypes from "prop-types";
import { Grid, Card, Typography, Box, Stack } from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export function RevenueStatsCards({ stats, totalOrders }) {
  const configs = [
    {
      title: "Total Revenue",
      value: stats?.totalRevenue || 0,
      icon: <AttachMoneyIcon />,
      color: "#22c55e",
      bg: "rgba(34, 197, 94, 0.1)",
    },
    {
      title: "Admin Earnings",
      value: stats?.adminRevenue || 0,
      icon: <TrendingUpIcon />,
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
    },
    {
      title: "Seller Earnings",
      value: stats?.sellerRevenue || 0,
      icon: <AccountBalanceWalletIcon />,
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.1)",
    },
    {
      title: "Total Orders",
      value: totalOrders || 0,
      icon: <ShoppingCartIcon />,
      color: "#6366f1",
      bg: "rgba(99, 102, 241, 0.1)",
    },
  ];

  return (
    <Grid container spacing={3} mb={4}>
      {configs.map((item, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "none",
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">
                {item.title}
              </Typography>
              <Typography variant="h4">
                {typeof item.value === "number" && item.title !== "Total Orders"
                  ? `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : item.value}
              </Typography>
            </Stack>

            <Box
              sx={{
                width: 48,
                height: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                color: item.color,
                bgcolor: item.bg,
              }}
            >
              {item.icon}
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

RevenueStatsCards.propTypes = {
  stats: PropTypes.shape({
    totalRevenue: PropTypes.number,
    adminRevenue: PropTypes.number,
    sellerRevenue: PropTypes.number,
  }),
  totalOrders: PropTypes.number,
};