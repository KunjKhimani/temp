/* eslint-disable no-unused-vars */
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { fShortenNumber } from "../../utils/formatNumber";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserAnalytics } from "../../../store/thunks/userThunks";
import {
  selectUserAnalytics,
  selectUserAnalyticsLoading,
  selectUserAnalyticsError,
} from "../../../store/slice/userSlice";

import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";

// ----------------------------------------------------------------------

// Smaller & cleaner icon
const StyledIcon = styled("div")(({ theme }) => ({
  margin: "auto",
  display: "flex",
  borderRadius: "50%",
  alignItems: "center",
  justifyContent: "center",
  width: theme.spacing(6),          // reduced from 8
  height: theme.spacing(6),         // reduced from 8
  marginBottom: theme.spacing(1),   // reduced spacing
  color: theme.palette.info.dark,
  backgroundImage: `linear-gradient(135deg, ${alpha(
    theme.palette.info.dark,
    0
  )} 0%, ${alpha(theme.palette.info.dark, 0.24)} 100%)`,
}));

// ----------------------------------------------------------------------

export function UserAnalyticsCard({
  title,
  total,
  icon,
  color = "primary",
  sx,
  ...other
}) {
  return (
    <Card
      sx={{
        py: 2,                     // smaller height
        px: 2,
        textAlign: "center",
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[2], // subtle shadow
        transition: "0.2s",
        "&:hover": {
          boxShadow: (theme) => theme.shadows[6],
        },
        color: (theme) => theme.palette[color].darker,
        bgcolor: (theme) => theme.palette[color].lighter,
        ...sx,
      }}
      {...other}
    >
      <StyledIcon
        sx={{
          color: (theme) => theme.palette[color].dark,
          backgroundImage: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette[color].dark,
              0
            )} 0%, ${alpha(theme.palette[color].dark, 0.24)} 100%)`,
        }}
      >
        {icon}
      </StyledIcon>

      {/* Reduced text size */}
      <Typography variant="h4">
        {fShortenNumber(total)}
      </Typography>

      <Typography variant="body2" sx={{ opacity: 0.72 }}>
        {title}
      </Typography>
    </Card>
  );
}

UserAnalyticsCard.propTypes = {
  color: PropTypes.string,
  icon: PropTypes.element,
  title: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

export function UserAnalyticsDashboard() {
  const dispatch = useDispatch();
  const userAnalytics = useSelector(selectUserAnalytics);
  const userAnalyticsLoading = useSelector(selectUserAnalyticsLoading);
  const userAnalyticsError = useSelector(selectUserAnalyticsError);

  useEffect(() => {
    dispatch(fetchUserAnalytics());
  }, [dispatch]);

  // Loading State
  if (userAnalyticsLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="150px"
      >
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // Error State
  if (userAnalyticsError) {
    return (
      <Alert severity="error">
        Error loading user analytics: {userAnalyticsError}
      </Alert>
    );
  }

  // Empty State
  if (!userAnalytics) {
    return <Alert severity="info">No data available.</Alert>;
  }

  // Final Dashboard
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,   // tighter spacing
        gridTemplateColumns: {
          xs: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        alignItems: "stretch", // equal height cards
      }}
    >
      <UserAnalyticsCard
        title="Total Users"
        total={userAnalytics.data.totalUsers}
        icon={<GroupOutlinedIcon />}
        color="info"
      />

      <UserAnalyticsCard
        title="New Users (7 Days)"
        total={userAnalytics.data.newUsersLast7Days}
        icon={<PersonAddOutlinedIcon />}
        color="warning"
      />

      <UserAnalyticsCard
        title="Verified Sellers"
        total={userAnalytics.data.verifiedSellers}
        icon={<VerifiedUserOutlinedIcon />}
        color="success"
      />

      <UserAnalyticsCard
        title="Unverified Sellers"
        total={userAnalytics.data.unverifiedSellers}
        icon={<PersonOffOutlinedIcon />}
        color="error"
      />
    </Box>
  );
}