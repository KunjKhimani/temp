// src/components/Layouts/Profile.jsx (Example path)
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react"; // Added useEffect for image preloading (optional)
import { Link, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import {
  IconListCheck, // For Orders
  IconUser, // For My Profile (Individual)
  IconBuilding, // For Company Profile (Agency)
  IconMailCheck, // For Verify Email
  IconPlus, // For Add Service
  IconLayoutDashboard,
  IconFileDescription,
  IconTag, // Added for Promo Code
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import ApplyPromoCodeModal from "./components/ApplyPromoCodeModal";
import {
  logout,
  selectIsLoggedIn,
  selectUser,
} from "../../store/slice/userSlice";

// Helper to get the base domain for constructing image URLs
const getApiDomainForImages = () => {
  let domain = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  if (domain.endsWith("/api")) {
    domain = domain.substring(0, domain.lastIndexOf("/api"));
  } else if (domain.endsWith("/api/")) {
    domain = domain.substring(0, domain.lastIndexOf("/api/"));
  }
  return domain;
};
const API_DOMAIN_FOR_IMAGES = getApiDomainForImages();

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openPromoModal, setOpenPromoModal] = useState(false);
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isSeller = user.isSeller;

  // Optional: State for preloaded image to avoid flicker if src changes
  // const [avatarImageSrc, setAvatarImageSrc] = useState(undefined);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    handleClose();
  };

  if (!user) {
    return null; // Or a login button if appropriate in this context
  }

  const isUserVerified = user.isEmailVerified;
  const isUserSeller = user.isSeller;
  const isUserAdmin = user.isAdmin; // Assuming user object has an isAdmin property

  const displayName =
    user.accountType === "agency"
      ? user.companyName || user.representativeName || "Agency User"
      : user.name || user.username || "User";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  const profileRoute =
    user.accountType === "agency"
      ? `/provider/profile/${user._id}`
      : `/user/profile`;
  const profileLinkText =
    user.accountType === "agency" ? "Company Profile" : "My Profile";
  const profileLinkIcon =
    user.accountType === "agency" ? (
      <IconBuilding width={20} />
    ) : (
      <IconUser width={20} />
    );

  // Construct avatar image source
  let avatarImageSrc;
  if (user.profilePicture && typeof user.profilePicture === "string") {
    let path = user.profilePicture.trim();
    path = path.startsWith("/") ? path.substring(1) : path;
    if (path.toLowerCase().startsWith("uploads/")) {
      avatarImageSrc = `${API_DOMAIN_FOR_IMAGES}/api/${path}`;
    } else if (path.includes("/")) {
      avatarImageSrc = `${API_DOMAIN_FOR_IMAGES}/api/uploads/${path}`;
    } else if (path) {
      avatarImageSrc = `${API_DOMAIN_FOR_IMAGES}/api/uploads/profile_pictures/${path}`;
    }
  }

  // Determine text for orders link
  let ordersLinkText = "My Orders"; // Default for buyers
  if (isUserSeller) {
    ordersLinkText =
      user.accountType === "agency" ? "Company Orders" : "Recieved Orders";
  }

  // Determine display role and type based on user properties
  let displayRole = "Buyer";
  let displayType = "Individual";

  if (isUserAdmin) {
    displayRole = "Admin";
    displayType = "Admin";
  } else if (isUserSeller) {
    displayRole = "Seller";
    displayType = user.accountType === "agency" ? "Agency" : "Individual";
  } else if (user.accountType === "agency") {
    displayType = "Agency";
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="profile-menu"
        aria-haspopup="true"
        color="inherit"
        sx={{ p: "4px" }}
        onClick={handleClick}
      >
        <Avatar
          src={avatarImageSrc}
          alt={`${displayName} Avatar`}
          sx={{
            width: 34,
            height: 34,
            fontSize: "0.9rem",
            bgcolor: isUserVerified ? "primary.main" : "warning.light",
            color: "common.white",
          }}
        >
          {!avatarImageSrc && avatarLetter}
        </Avatar>
      </IconButton>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "240px",
            mt: 1.5,
            borderRadius: "8px",
            boxShadow: (theme) => theme.shadows[6],
          },
          "& .MuiMenuItem-root": {
            padding: (theme) => theme.spacing(1, 2),
            "& .MuiListItemIcon-root": {
              minWidth: "32px",
              color: "text.secondary",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" noWrap fontWeight="600">
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Role: {displayRole}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Type: {displayType}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />

        {/* Seller Dashboard Link (Example) */}
        {isUserSeller && (
          <MenuItem onClick={() => handleNavigate("/provider/dashboard")}>
            {" "}
            {/* Adjust route as needed */}
            {/* <ListItemIcon>
              <IconLayoutDashboard width={20} />
            </ListItemIcon> */}
            {/* <ListItemText>Seller Dashboard</ListItemText> */}
          </MenuItem>
        )}

        {isUserSeller && (
          <MenuItem onClick={() => handleNavigate("/provider/services/add")}>
            <ListItemIcon>
              <IconPlus width={20} />
            </ListItemIcon>
            <ListItemText>Add New Service</ListItemText>
          </MenuItem>
        )}

        {/* *** MODIFICATION STARTS HERE *** */}
        {isLoggedIn && !isSeller && (
          <MenuItem onClick={() => handleNavigate("/user/my-service-requests")}>
            <ListItemIcon>
              <IconFileDescription size={20} />
            </ListItemIcon>
            My Service Requests
          </MenuItem>
        )}

        <MenuItem onClick={() => handleNavigate(profileRoute)}>
          <ListItemIcon>{profileLinkIcon}</ListItemIcon>
          <ListItemText>{profileLinkText}</ListItemText>
        </MenuItem>

        {/* Modified Orders Link Text */}
        <MenuItem onClick={() => handleNavigate("/user/orders")}>
          <ListItemIcon>
            <IconListCheck width={20} />
          </ListItemIcon>
          <ListItemText>{ordersLinkText}</ListItemText>
        </MenuItem>

        {/* Subscription Link */}
        <MenuItem onClick={() => handleNavigate("/auth/subscription-plan")}>
          <ListItemIcon>
            <IconListCheck width={20} />
          </ListItemIcon>
          <ListItemText>Subscription</ListItemText>
        </MenuItem>

        {isUserSeller && (
          <MenuItem
            onClick={() => {
              setOpenPromoModal(true);
              handleClose();
            }}
          >
            <ListItemIcon>
              <IconTag width={20} />
            </ListItemIcon>
            <ListItemText>Apply Promo Code</ListItemText>
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5 }} />

        <Box sx={{ py: 1, px: 2 }}>
          <Button
            onClick={handleLogout}
            variant="outlined"
            color="error"
            fullWidth
            size="small"
          >
            Logout
          </Button>
        </Box>
      </Menu>

      <ApplyPromoCodeModal
        open={openPromoModal}
        onClose={() => setOpenPromoModal(false)}
      />
    </Box>
  );
};

export default Profile;
