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
import AccountCircleIcon from "@mui/icons-material/AccountCircle"; // Replacement for UserCircle
import EmailIcon from "@mui/icons-material/Email"; // Replacement for Mail
// Remove Tabler Icons import
// import { IconUserCircle, IconMail } from '@tabler/icons-react';

const SERVER_ROOT_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const UserInfoCard = ({ user, title = "User Information" }) => {
  if (!user) return null;

  const displayName =
    user.accountType === "agency"
      ? user.companyName || user.representativeName
      : user.name;
  const profileLink = `/provider/profile/${user._id}`;
  const avatarSrc = user.profilePicture
    ? `${SERVER_ROOT_URL}/${user.profilePicture.replace(/\\/g, "/")}`
    : null;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || "?";

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" mb={1.5}>
          <Avatar
            src={avatarSrc}
            alt={displayName || "Avatar"}
            sx={{ width: 48, height: 48, mr: 2, bgcolor: "primary.light" }}
          >
            {/* Fallback if no avatar */}
            {!avatarSrc && <AccountCircleIcon />}
          </Avatar>
          <Box>
            <MuiLink
              component={RouterLink}
              to={profileLink}
              variant="subtitle1"
              fontWeight="bold"
              underline="hover"
            >
              {displayName || "N/A"}
            </MuiLink>
            <Typography variant="body2" color="text.secondary">
              {user.accountType
                ? user.accountType.charAt(0).toUpperCase() +
                  user.accountType.slice(1)
                : ""}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" mt={1}>
          {/* Replace Tabler with MUI Icon */}
          <EmailIcon sx={{ fontSize: 18, mr: 1, color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            {user.email || "No email provided"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
