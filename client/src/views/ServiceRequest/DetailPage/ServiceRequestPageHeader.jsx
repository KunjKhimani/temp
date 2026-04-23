/* eslint-disable no-unused-vars */
// src/views/ServiceRequest/ServiceRequestPageHeader.jsx
/* eslint-disable react/prop-types */
import React from "react";
import {
  Box,
  Breadcrumbs,
  Typography,
  Button,
  Link as MuiLink,
  useMediaQuery,
  Chip,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleIcon from "@mui/icons-material/People"; // For community badge
import { useTheme } from "@mui/material/styles";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

const ServiceRequestPageHeader = ({ requestTitle, onGoBack, isCommunity, isSpecial }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2, color: "text.secondary", fontSize: "0.9rem" }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to="/service-requests/browse" // Link to browse service requests
          color="inherit"
          sx={{ textDecoration: "none" }}
        >
          Browse Requests
        </MuiLink>
        <Typography
          color="text.primary"
          sx={{
            fontWeight: 500,
            textTransform: "capitalize",
            maxWidth: { xs: 150, sm: 300 }, // Adjust max width for responsiveness
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {requestTitle}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          fontWeight="bold"
          sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
        >
          {requestTitle}
          {isSpecial && (
            <Chip
              label="Special Deal Request"
              size="small"
              icon={<LocalOfferIcon sx={{ fontSize: "1rem !important", color: "white !important" }} />}
              sx={{
                backgroundColor: "#ff5722", // Orange
                color: "white",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                height: "26px",
                "& .MuiChip-label": { px: 1.25 },
              }}
            />
          )}
          {isCommunity && (
            <Chip
              label="Community Offer"
              size="small"
              icon={<PeopleIcon sx={{ fontSize: "1rem !important", color: "white !important" }} />}
              sx={{
                backgroundColor: "#009688", // Teal
                color: "white",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                height: "26px",
                "& .MuiChip-label": { px: 1.25 },
              }}
            />
          )}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={onGoBack}
          sx={{ textTransform: "none" }}
        >
          Back
        </Button>
      </Box>
    </>
  );
};

export default ServiceRequestPageHeader;
