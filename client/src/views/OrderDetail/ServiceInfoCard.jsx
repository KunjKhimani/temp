/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
// Import MUI Icons
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";
// Remove Tabler Icons import
// import { IconCategory, IconFileDescription } from '@tabler/icons-react';

const SERVER_ROOT_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ServiceInfoCard = ({ service }) => {
  if (!service) return null;

  const imageUrl = service.media?.[0]
    ? `${SERVER_ROOT_URL}/${service.media[0].replace(/\\/g, "/")}`
    : null;
  // Adjust link if needed
  const serviceLink = `/services/detail/${service._id}`;

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Service Details
        </Typography>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            variant="rounded"
            src={imageUrl}
            alt={service.title || "Service Image"}
            sx={{ width: 60, height: 60, mr: 2, bgcolor: "grey.200" }}
          >
            {/* Replace Tabler with MUI Icon */}
            {!imageUrl && <CategoryIcon />}
          </Avatar>
          <Box>
            <MuiLink
              component={RouterLink}
              to={serviceLink}
              variant="subtitle1"
              fontWeight="bold"
              underline="hover"
              color="primary"
            >
              {service.title || "N/A"}
            </MuiLink>
            <Typography variant="body2" color="text.secondary">
              Price: ${service.price?.toFixed(2) || "N/A"}{" "}
              {service.priceType || ""}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          {/* Replace Tabler with MUI Icon */}
          <DescriptionIcon
            sx={{ fontSize: 18, mr: 1, color: "text.secondary" }}
          />
          <Typography variant="body2" color="text.secondary">
            Type:{" "}
            {service.type
              ? service.type.charAt(0).toUpperCase() + service.type.slice(1)
              : "N/A"}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          {/* Replace Tabler with MUI Icon */}
          <CategoryIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            Category: {service.category || "N/A"}{" "}
            {service.subcategory ? `> ${service.subcategory}` : ""}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ServiceInfoCard;
