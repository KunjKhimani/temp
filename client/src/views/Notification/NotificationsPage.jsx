// src/views/Notifications/NotificationsPage.jsx
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Pagination,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  selectAllNotifications,
  selectNotificationPagination,
  selectUnreadNotificationCount,
  selectNotificationStatus,
  selectNotificationError,
  clearNotificationError,
} from "../../store/slice/notificationSlice";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
  fetchUnreadCount,
} from "../../store/thunks/notificationThunks";
import { selectUser } from "../../store/slice/userSlice";

const getNotificationIcon = (type) => {
  // Customize this based on your notification types
  // Example:
  // if (type === 'NEW_ORDER_PENDING_CONFIRMATION_SELLER') return <StorefrontIcon color="action" />;
  // if (type === 'ORDER_ACCEPTED_BUYER') return <CheckCircleOutlineIcon color="success" />;
  return <NotificationsNoneIcon color="action" />;
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const notifications = useSelector(selectAllNotifications);
  const pagination = useSelector(selectNotificationPagination);
  const unreadCount = useSelector(selectUnreadNotificationCount);
  const status = useSelector(selectNotificationStatus);
  const error = useSelector(selectNotificationError);
  const user = useSelector(selectUser);

  const [currentPage, setCurrentPage] = useState(1);
  const NOTIFICATIONS_PER_PAGE = 10;

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true });
      return;
    }
    dispatch(clearNotificationError());
    dispatch(
      fetchNotifications({ page: currentPage, limit: NOTIFICATIONS_PER_PAGE })
    );
  }, [dispatch, user, navigate, currentPage]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationRead(notificationId))
      .unwrap()
      .then(() => dispatch(fetchUnreadCount()));
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsRead())
        .unwrap()
        .then(() => dispatch(fetchUnreadCount()));
    }
  };

  const handleDeleteNotification = (notificationId) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      dispatch(deleteUserNotification(notificationId))
        .unwrap()
        .then(() => {
          dispatch(fetchUnreadCount());
          if (notifications.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          } else {
            dispatch(
              fetchNotifications({
                page: currentPage,
                limit: NOTIFICATIONS_PER_PAGE,
              })
            );
          }
        });
    }
  };

  const handleRefresh = () => {
    dispatch(clearNotificationError());
    dispatch(
      fetchNotifications({ page: currentPage, limit: NOTIFICATIONS_PER_PAGE })
    );
    dispatch(fetchUnreadCount());
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          Notifications
        </Typography>
      </Breadcrumbs>

      <Paper
        elevation={2}
        sx={{ p: { xs: 1.5, sm: 2, md: 3 }, borderRadius: "12px" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            px: { xs: 0, sm: 1 },
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            Notifications
          </Typography>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleMarkAllAsRead}
              startIcon={<MarkEmailReadIcon />}
              disabled={status === "loading"}
            >
              Mark all as read ({unreadCount})
            </Button>
          )}
        </Box>

        {status === "loading" && !notifications.length && (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading notifications...
            </Typography>
          </Box>
        )}

        {status === "failed" && (
          <Alert
            severity="error"
            sx={{ my: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                startIcon={<RefreshIcon />}
              >
                Retry
              </Button>
            }
          >
            Failed to load notifications. {error?.message || error}
          </Alert>
        )}

        {status !== "loading" && notifications.length === 0 && (
          <Typography
            sx={{
              textAlign: "center",
              py: 5,
              color: "text.secondary",
              fontStyle: "italic",
            }}
          >
            You have no notifications here.
          </Typography>
        )}

        {notifications.length > 0 && (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem
                  sx={{
                    py: 2, // Increased padding
                    px: { xs: 0.5, sm: 2 },
                    bgcolor: notification.isRead
                      ? "transparent"
                      : (theme) => theme.palette.action.focus, // Subtle unread highlight
                    borderRadius: "8px",
                    my: 0.5,
                    alignItems: "flex-start",
                    cursor: notification.link ? "pointer" : "default",
                    transition: "background-color 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: (theme) => theme.palette.action.hover,
                    },
                  }}
                  // Use onClick on ListItem if the whole item should be clickable to the link
                  onClick={
                    notification.link
                      ? () => {
                          if (!notification.isRead)
                            handleMarkAsRead(notification._id);
                          navigate(notification.link);
                        }
                      : undefined
                  }
                  secondaryAction={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ mt: -0.5 }}
                    >
                      {" "}
                      {/* Align with top of text */}
                      {!notification.isRead && (
                        <Tooltip title="Mark as Read">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            color="primary"
                          >
                            <MarkEmailReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification._id);
                          }}
                          color="error"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5, mr: 1 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    disableTypography // Important when providing custom Typography for primary/secondary
                    primary={
                      <Typography // Using Typography directly
                        variant="body1" // Changed from subtitle1 for less emphasis, more body-like
                        component="div" // Use div or span, not p, for primary text wrapper
                        fontWeight={notification.isRead ? 500 : 600}
                        color={
                          notification.isRead
                            ? "text.secondary"
                            : "text.primary"
                        }
                        sx={{ mb: 0.5 }} // Add some bottom margin if secondary is present
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box component="div">
                        {" "}
                        {/* Use Box (div) or React.Fragment for secondary wrapper */}
                        <Typography
                          variant="body2"
                          component="span" // Use span to allow it to be part of the secondary block
                          color="text.secondary"
                          sx={{
                            display: "block",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          component="span" // Use span
                          color="text.disabled"
                          sx={{ display: "block", mt: 0.75 }} // Increased margin
                        >
                          {formatDistanceToNow(
                            parseISO(notification.createdAt),
                            { addSuffix: true }
                          )}
                          {notification.sender?.name && (
                            <>
                              {" "}
                              • From:{" "}
                              <strong>{notification.sender.name}</strong>
                            </>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && (
                  <Divider
                    variant="inset"
                    component="li"
                    sx={{ ml: { xs: 0, sm: "56px" } }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        )}

        {pagination && pagination.totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 1 }}>
            <Pagination
              count={pagination.totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              disabled={status === "loading"}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage;
