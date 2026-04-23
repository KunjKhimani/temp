/* eslint-disable no-unused-vars */
// src/components/Navbar/NotificationsPopover.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Popover,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Box,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
// Adjust path
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  selectAllNotifications,
  selectNotificationStatus,
  selectUnreadNotificationCount,
} from "../store/slice/notificationSlice";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../store/thunks/notificationThunks";

function NotificationsPopover() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadNotificationCount);
  const status = useSelector(selectNotificationStatus);
  // const pagination = useSelector(selectNotificationPagination); // Not used currently

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    // Fetch first page of notifications when opening, if not already loading/succeeded recently
    if (status !== "loading" && status !== "succeeded") {
      // Or add a time-based check
      dispatch(fetchNotifications({ page: 1, limit: 7 })); // Fetch limited number for popover
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsRead());
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      dispatch(markNotificationRead(notification._id));
    }
    // Navigate to link if exists
    if (notification.link) {
      navigate(notification.link);
    }
    handleClose(); // Close popover after click
  };

  const handleViewAll = () => {
    navigate("/notifications"); // Navigate to a dedicated notifications page
    handleClose();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        sx={{ padding: { xs: "6px", md: "8px" }, color: "text.primary" }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { width: 360, mt: 1.5, p: 0, borderRadius: "8px", boxShadow: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            px: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              disabled={status === "loading" || unreadCount === 0}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider sx={{ borderStyle: "dashed" }} />

        {status === "loading" && !notifications.length && (
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 100,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
        {status !== "loading" && notifications.length === 0 && (
          <Typography
            sx={{ color: "text.secondary", p: 3, textAlign: "center" }}
          >
            You have no notifications.
          </Typography>
        )}

        {notifications.length > 0 && (
          <List sx={{ maxHeight: 320, overflow: "auto", p: 0 }}>
            {notifications.map((notification) => (
              <ListItemButton // Changed to ListItemButton for better click handling
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                alignItems="flex-start" // For better layout with multi-line text
                sx={{
                  py: 1.5,
                  px: 2,
                  // bgcolor: notification.isRead ? 'action.selected' : 'background.paper',
                  "&:hover": { bgcolor: "action.hover" },
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: "none" }, // Remove border for last item
                }}
              >
                {/* Optional Icon based on type */}
                {/* <ListItemIcon sx={{minWidth: 36, mt: 0.5}}> <SomeIcon/> </ListItemIcon> */}
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: notification.isRead ? "normal" : 600 }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", display: "block" }}
                        noWrap
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.disabled",
                          display: "block",
                          mt: 0.25,
                        }}
                      >
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </>
                  }
                />
                {!notification.isRead && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      ml: 1.5,
                      mt: 0.5,
                      flexShrink: 0,
                    }}
                  />
                )}
              </ListItemButton>
            ))}
          </List>
        )}

        {notifications.length > 0 && <Divider sx={{ borderStyle: "dashed" }} />}

        <Box sx={{ p: 1, textAlign: "center" }}>
          <Button
            fullWidth
            onClick={handleViewAll}
            disabled={status === "loading" && notifications.length === 0}
          >
            View All Notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}

export default NotificationsPopover;
