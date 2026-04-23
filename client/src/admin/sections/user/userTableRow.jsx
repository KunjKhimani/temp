/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";

import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import TableRow from "@mui/material/TableRow";
import Checkbox from "@mui/material/Checkbox";
import MenuList from "@mui/material/MenuList";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem"; // Removed menuItemClasses as it wasn't used
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

//components
import { Iconify } from "../../components/iconify"; // Adjust path
import Label from "../../components/label/Label"; // Adjust path
// Removed date-fns import as 'createdAt' is no longer displayed

const getInitials = (name = "") => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const getUserDisplayName = (user) => {
  if (user.accountType === "agency") {
    return user.companyName || user.representativeName || user.email;
  }
  return user.name || user.email;
};

const BASE_IMAGE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ----------------------------------------------------------------------

export function UserTableRow({
  user,
  selected,
  onSelectRow,
  onEditRow,
  onDeleteRow,
  onVerifyRow,
  onViewDetails,
  onUpdateStatus, // Add prop for status update
}) {
  const [openPopover, setOpenPopover] = useState(null);
  
  // Status Dropdown State
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);

  const handleOpenPopover = useCallback((event) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleOpenStatusMenu = useCallback((event) => {
    setStatusAnchorEl(event.currentTarget);
  }, []);

  const handleCloseStatusMenu = useCallback(() => {
    setStatusAnchorEl(null);
  }, []);

  const handleStatusClick = (status) => {
    onUpdateStatus(user._id, status);
    handleCloseStatusMenu();
  };

  const displayName = getUserDisplayName(user);
  const initials = getInitials(displayName);
  const avatarUrl = user.profilePicture
    ? `${BASE_IMAGE_URL}/${user.profilePicture}`
    : null;

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        {/* Checkbox */}
        <TableCell padding="checkbox">
          <Checkbox
            disableRipple
            checked={selected}
            onChange={() => onSelectRow(user._id)}
          />
        </TableCell>

        {/* Name & Avatar */}
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              alt={displayName}
              src={avatarUrl}
              sx={{ width: 36, height: 36 }}
            >
              {!avatarUrl && initials}
            </Avatar>
            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
              {displayName}
            </Typography>
          </Box>
        </TableCell>

        {/* Email */}
        <TableCell>
          <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
            {user.email}
          </Typography>
        </TableCell>

        {/* Account Type */}
        <TableCell>
          <Label
            color={user.accountType === "agency" ? "info" : "default"}
            sx={{ textTransform: "capitalize" }}
          >
            {user.accountType}
          </Label>
        </TableCell>

        {/* Seller Status */}
        <TableCell align="center">
          <Iconify
            icon={
              user.isSeller
                ? "eva:checkmark-circle-2-fill"
                : "eva:close-circle-fill"
            }
            sx={{ color: user.isSeller ? "success.main" : "text.disabled" }}
          />
        </TableCell>

        {/* Verified Status (Seller Verification) */}
        <TableCell align="center">
          {user.isSeller ? (
            <Tooltip
              title={
                user.isVerified ? "Seller Verified" : "Seller Not Verified"
              }
            >
              <Iconify
                icon={
                  user.isVerified ? "eva:shield-fill" : "eva:shield-off-fill"
                }
                sx={{
                  color: user.isVerified ? "primary.main" : "warning.main",
                }}
              />
            </Tooltip>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              N/A
            </Typography>
          )}
        </TableCell>

        {/* Status Dropdown */}
        <TableCell align="center">
          <Label
            color={
              (user.status === "active" && "success") ||
              (user.status === "pending" && "warning") ||
              (user.status === "suspended" && "error") ||
              "default"
            }
            onClick={handleOpenStatusMenu}
            sx={{ 
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
              textTransform: "capitalize",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5
            }}
          >
            {user.status || "pending"}
            <Iconify icon="eva:chevron-down-fill" width={14} height={14} />
          </Label>

          {/* Status Menu */}
          <Popover
            open={!!statusAnchorEl}
            anchorEl={statusAnchorEl}
            onClose={handleCloseStatusMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
            slotProps={{ paper: { sx: { width: 140, mt: 0.5 } } }}
          >
            <MenuList sx={{ p: 0.5 }}>
              <MenuItem onClick={() => handleStatusClick("active")}>
                <Iconify
                  icon="eva:checkmark-circle-outline"
                  sx={{ mr: 1, color: "success.main", width: 20, height: 20 }}
                />
                Active
              </MenuItem>
              {(user.status !== "active" && user.status !== "suspended") && (
                <MenuItem onClick={() => handleStatusClick("pending")}>
                  <Iconify
                    icon="eva:clock-outline"
                    sx={{ mr: 1, color: "warning.main", width: 20, height: 20 }}
                  />
                  Pending
                </MenuItem>
              )}
              <MenuItem onClick={() => handleStatusClick("suspended")}>
                <Iconify
                  icon="eva:slash-outline"
                  sx={{ mr: 1, color: "error.main", width: 20, height: 20 }}
                />
                Suspended
              </MenuItem>
            </MenuList>
          </Popover>
        </TableCell>

        {/* Actions Menu */}
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Popover Actions Menu */}
      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 180, mt: -0.5 } } }}
      >
        <MenuList sx={{ p: 0.5 }}>
          {/* Main Actions */}
          <MenuItem
            onClick={() => {
              onViewDetails(user._id);
              handleClosePopover();
            }}
          >
            <Iconify icon="solar:eye-bold" sx={{ mr: 1, width: 20, height: 20 }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={() => {
              onEditRow(user._id);
              handleClosePopover();
            }}
          >
            <Iconify icon="solar:pen-bold" sx={{ mr: 1, width: 20, height: 20 }} />
            Edit User
          </MenuItem>
          <MenuItem
            onClick={() => {
              onDeleteRow(user._id);
              handleClosePopover();
            }}
            sx={{ color: "error.main" }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1, width: 20, height: 20 }} />
            Delete User
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
