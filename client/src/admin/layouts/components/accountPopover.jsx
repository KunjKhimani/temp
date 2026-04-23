/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux"; // Import Redux hooks

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import Divider from "@mui/material/Divider";
import MenuList from "@mui/material/MenuList";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuItem, { menuItemClasses } from "@mui/material/MenuItem";

// --- Import Redux user data and actions ---
import { selectUser, logout } from "../../../store/slice/userSlice"; // *** ADJUST PATH ***
import { useLocation, useNavigate } from "react-router-dom";

// --- Remove mock import ---
// import { _myAccount } from "../../_mock";

// --- Helper function for initials (optional but good practice) ---
const getInitials = (name = "") => {
  if (!name) return "?"; // Fallback if name is not available
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// --- Base URL for profile pictures (adjust if needed) ---
const BASE_IMAGE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"; // Match API base

// ----------------------------------------------------------------------

export function AccountPopover({ data, sx, ...other }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Use location.pathname to get current path
  const pathname = location.pathname;

  // --- Get user data from Redux store ---
  const user = useSelector(selectUser); // Get the logged-in user object

  const [openPopover, setOpenPopover] = useState(null);

  const handleOpenPopover = useCallback((event) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleClickItem = useCallback(
    (path) => {
      handleClosePopover();
      navigate(path); // Use navigate directly
    },
    [handleClosePopover, navigate] // Add navigate to dependency array
  );

  // --- Logout Handler ---
  const handleLogout = useCallback(() => {
    // Remove async
    try {
      handleClosePopover();
      console.log("Dispatching logout action"); // Debug log
      dispatch(logout()); // Dispatch the synchronous action
      console.log("Logout action dispatched, navigating..."); // Debug log
      // Redirect immediately after dispatching (state update will follow)
      navigate("/auth/signin", { replace: true }); // Use replace: true
    } catch (error) {
      // Catching errors from synchronous dispatch is less common
      // but good practice if the reducer itself could potentially throw
      console.error("Error during logout dispatch:", error);
    }
  }, [dispatch, handleClosePopover, navigate]);

  // --- Construct avatar URL ---
  const avatarUrl = user?.profilePicture
    ? `${BASE_IMAGE_URL}/${user.profilePicture}`
    : null;
  const displayName = user?.name || "User"; // Use user's name or fallback

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          p: "2px",
          width: 40,
          height: 40,
          // Optional: keep the gradient or simplify
          // background: (theme) => `conic-gradient(${theme.vars.palette.primary.light}, ${theme.vars.palette.warning.light}, ${theme.vars.palette.primary.light})`,
          border: (theme) => `solid 2px ${theme.palette.background.default}`, // Add border for contrast
          ...sx,
        }}
        {...other}
      >
        <Avatar
          // Use dynamic data
          src={avatarUrl}
          alt={displayName}
          sx={{ width: "100%", height: "100%" }}
        >
          {/* Fallback initials if no avatar or name */}
          {!avatarUrl && getInitials(displayName)}
        </Avatar>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: 200, mt: 1 }, // Added margin top
          },
        }}
      >
        {/* --- Display dynamic user info --- */}
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName}
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
            {user?.email || ""}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* --- Render menu items passed via props --- */}
        <MenuList
          disablePadding
          sx={{
            p: 1,
            // ... other styles ...
          }}
        >
          {data?.map(
            (
              option // Check if data exists
            ) => (
              <MenuItem
                key={option.label}
                selected={option.href === pathname}
                onClick={() => handleClickItem(option.href)}
              >
                {/* Render icon passed in data */}
                {option.icon && (
                  <Box
                    component="span"
                    sx={{
                      width: 24,
                      height: 24,
                      mr: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {option.icon}
                  </Box>
                )}
                {option.label}
              </MenuItem>
            )
          )}
        </MenuList>

        <Divider sx={{ borderStyle: "dashed" }} />

        {/* --- Logout Button --- */}
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            color="inherit" // Or error if you prefer red
            size="medium"
            variant="outlined" // Changed variant for distinction
            onClick={handleLogout} // Attach logout handler
          >
            Logout
          </Button>
        </Box>
      </Popover>
    </>
  );
}
