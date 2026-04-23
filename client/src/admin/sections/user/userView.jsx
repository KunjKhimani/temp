/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  showSnackbar,
  clearSnackbar,
} from "../../../store/slice/snackbarSlice";

import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableContainer,
  TablePagination,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  TableRow,
  TableCell,
} from "@mui/material";

// Helper function to get user display name
const getUserDisplayName = (user) => {
  if (user.accountType === "agency") {
    return user.companyName || user.representativeName || user.email;
  }
  return user.name || user.email;
};

// Redux Actions and Selectors
import {
  fetchAllUsers,
  setAllUsersParams,
  selectAllAdminUsers,
  selectAllAdminUsersPagination,
  selectAllAdminUsersParams,
  selectFetchAllStatus,
  selectFetchAllError,
  selectVerifyUserStatus,
  selectDeleteMultipleUsersStatus,
  selectDeleteMultipleUsersError,
  clearAdminErrors,
  resetDeleteMultipleUsersStatus,
  updateUserStatusThunk,
  resetStatusUpdateStatus,
} from "../../../store/slice/adminSlice";

// Sections/Components
import { UserTableToolbar } from "./userTableToolbar";
import { headCells, UserTableHead } from "./userTableHead";
import { UserTableRow } from "./userTableRow";
import { emptyRows } from "./utils";
import { useTableSelection } from "../../../hooks/useTableSelection";
import { Iconify } from "../../components/iconify";
import { DashboardContent } from "../../layouts/dashboard/main";
import { UserDetailsModal } from "./userDetailModal";
// import DeleteConfirmationDialog from "../../../components/DeleteConfirmationDialog"; // Removed old import
// Assuming deleteMultipleUsers is correctly imported and is a thunk or similar action
import { deleteMultipleUsers } from "../../../store/slice/adminSlice"; // Or from services/apis if it's a direct API call service
import { UserDeleteConfirmationDialog } from "./UserDeleteConfirmationDialog"; // New import

// ----------------------------------------------------------------------

export function UserView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Selectors ---
  const allUsers = useSelector(selectAllAdminUsers);
  const pagination = useSelector(selectAllAdminUsersPagination);
  const currentParams = useSelector(selectAllAdminUsersParams);
  const fetchStatus = useSelector(selectFetchAllStatus);
  const fetchError = useSelector(selectFetchAllError);
  const verifyStatus = useSelector(selectVerifyUserStatus);
  const deleteStatus = useSelector(selectDeleteMultipleUsersStatus);
  const deleteError = useSelector(selectDeleteMultipleUsersError);
  const statusUpdateStatus = useSelector((state) => state.admin.statusUpdateStatus);
  const statusUpdateError = useSelector((state) => state.admin.statusUpdateError);

  // --- Local State ---
  const tableSelection = useTableSelection();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState(false);
  const [usersToDeleteNames, setUsersToDeleteNames] = useState([]); // State for user names

  // State for single user deletion
  const [openSingleDeleteDialog, setOpenSingleDeleteDialog] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);

  // --- Find selected user data ---
  const selectedUser = React.useMemo(() => {
    if (!selectedUserId || !allUsers) return null;
    return allUsers.find((user) => user._id === selectedUserId);
  }, [selectedUserId, allUsers]);

  // --- Effects ---
  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [
    dispatch,
    currentParams?.page,
    currentParams?.limit,
    currentParams?.sortBy,
    currentParams?.sortOrder,
    JSON.stringify(currentParams?.filters),
  ]);

  useEffect(() => {
    return () => {
      dispatch(clearAdminErrors()); // Clear general admin errors on unmount
    };
  }, [dispatch]);

  useEffect(() => {
    if (fetchStatus === "succeeded" || verifyStatus === "succeeded") {
      // Potentially clear specific errors related to fetch/verify if needed
      // dispatch(clearAdminErrors()); // Or more specific error clearing
    }
  }, [fetchStatus, verifyStatus, dispatch]);

  // Effect for bulk delete operation feedback
  useEffect(() => {
    if (deleteStatus === "succeeded") {
      dispatch(
        showSnackbar({
          message: "Selected users deleted successfully!",
          severity: "success",
        })
      );
      tableSelection.resetSelected();
      dispatch(clearSnackbar());
      dispatch(fetchAllUsers()); // Re-fetch users after successful deletion
      dispatch(resetDeleteMultipleUsersStatus()); // Reset delete status
    } else if (deleteStatus === "failed") {
      dispatch(
        showSnackbar({
          message: deleteError || "Failed to delete selected users.",
          severity: "error",
        })
      );
      dispatch(resetDeleteMultipleUsersStatus()); // Reset delete status even on failure
    }
  }, [deleteStatus, deleteError, dispatch, tableSelection]);

  // Effect for status update feedback
  useEffect(() => {
    if (statusUpdateStatus === "succeeded") {
      dispatch(
        showSnackbar({
          message: "User status updated successfully!",
          severity: "success",
        })
      );
      dispatch(resetStatusUpdateStatus());
    } else if (statusUpdateStatus === "failed") {
      dispatch(
        showSnackbar({
          message: statusUpdateError || "Failed to update user status.",
          severity: "error",
        })
      );
      dispatch(resetStatusUpdateStatus());
    }
  }, [statusUpdateStatus, statusUpdateError, dispatch]);

  // --- Handlers ---
  const handleSort = useCallback(
    (property) => {
      const isAsc =
        currentParams.sortBy === property && currentParams.sortOrder === "asc";
      const newOrder = isAsc ? "desc" : "asc";
      dispatch(
        setAllUsersParams({ sortBy: property, sortOrder: newOrder, page: 1 })
      );
      tableSelection.resetSelected();
    },
    [dispatch, currentParams.sortBy, currentParams.sortOrder, tableSelection]
  );

  const handleParamsChange = useCallback(
    (newParams) => {
      dispatch(setAllUsersParams(newParams));
      tableSelection.resetSelected();
    },
    [dispatch, tableSelection]
  );

  const handlePageChange = useCallback(
    (event, newPage) => {
      dispatch(setAllUsersParams({ page: newPage + 1 }));
    },
    [dispatch]
  );

  const handleRowsPerPageChange = useCallback(
    (event) => {
      dispatch(
        setAllUsersParams({ limit: parseInt(event.target.value, 10), page: 1 }) // Reset to page 1
      );
    },
    [dispatch]
  );

  const handleSelectAllRows = useCallback(
    (checked) => {
      tableSelection.onSelectAllRows(checked, allUsers || []);
    },
    [tableSelection, allUsers]
  );

  const handleEditRow = useCallback(
    (userId) => {
      // Navigate to edit page or open edit modal
      navigate(`/admin/users/edit-user/${userId}`);
      console.log("Edit user:", userId);
    },
    [navigate]
  );

  const handleDeleteRow = useCallback(
    (userId) => {
      const userToDelete = allUsers.find((user) => user._id === userId);
      const userName = userToDelete
        ? getUserDisplayName(userToDelete)
        : `user with ID ${userId}`;

      setUsersToDeleteNames([userName]); // Set for single user
      setUserToDeleteId(userId);
      setOpenSingleDeleteDialog(true);
    },
    [allUsers]
  );

  const handleVerifyRow = useCallback(
    (userId) => {
      console.log(
        "Verify action triggered for row (now handled in modal):",
        userId
      );
      // This seems to imply verification is handled elsewhere (e.g., in UserDetailsModal)
      // If direct action is needed: dispatch(verifyUserAction(userId));
    },
    [dispatch]
  );

  const handleViewDetails = useCallback((userId) => {
    setSelectedUserId(userId);
    setModalOpen(true);
  }, []);

  const handleUpdateStatus = useCallback(
    (userId, status) => {
      dispatch(updateUserStatusThunk({ userId, status }));
    },
    [dispatch]
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedUserId(null);
  }, []);

  // --- Handlers for Bulk Delete ---
  const handleDeleteSelectedUsers = useCallback(() => {
    if (tableSelection.selected.length > 0) {
      const names = tableSelection.selected
        .map((id) => {
          const user = allUsers.find((user) => user._id === id);
          if (user) {
            // Prioritize 'name' for individual users
            if (user.name) return user.name;
            // For agency users, use companyName or representativeName
            if (user.accountType === "agency") {
              if (user.companyName) return user.companyName;
              if (user.representativeName) return user.representativeName;
            }
            // Fallback if no suitable name field is found
            return `User ID: ${user._id}`;
          }
          return null; // User not found in allUsers
        })
        .filter(Boolean); // Filter out nulls

      setUsersToDeleteNames(names);
      setOpenConfirmDeleteDialog(true);
    }
  }, [tableSelection.selected, allUsers]); // Corrected dependency

  const handleConfirmDeleteSelectedUsers = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
    if (tableSelection.selected.length > 0) {
      dispatch(deleteMultipleUsers(tableSelection.selected)); // This should be your redux thunk
    }
  }, [dispatch, tableSelection.selected]);

  const handleCloseConfirmDeleteDialog = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
  }, []);

  // Handlers for single user delete confirmation
  const handleConfirmSingleUserDelete = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    if (userToDeleteId) {
      dispatch(deleteMultipleUsers([userToDeleteId])); // Dispatch with array for single ID
      setUserToDeleteId(null); // Clear the ID after dispatch
    }
  }, [dispatch, userToDeleteId]);

  const handleCloseSingleDeleteDialog = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    setUserToDeleteId(null);
  }, []);

  // --- Render Logic ---
  const isLoading = fetchStatus === "pending" || deleteStatus === "pending";
  const usersToDisplay = allUsers || [];
  const totalItems = pagination?.totalItems || 0;
  const currentPageAPI = pagination?.currentPage || 1;
  const currentPageMUI = Math.max(0, currentPageAPI - 1); // Ensure page is not negative
  const rowsPerPage = currentParams.limit || 10;

  const calculatedEmptyRows = emptyRows(
    currentPageMUI,
    rowsPerPage,
    usersToDisplay.length
  );
  const columnCount = headCells.length + (tableSelection.selected ? 1 : 0) + 1; // account for checkbox and actions column

  const handleAddUserClick = () => {
    navigate("/admin/users/add-user");
  };

  return (
    <DashboardContent>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mt={3}
        mb={4}
      >
        <Typography variant="h4">Users Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddUserClick}
        >
          New user
        </Button>
      </Box>

      {/* Error Display */}
      {fetchStatus === "failed" && fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error Fetching Users</AlertTitle>
          {typeof fetchError === "string"
            ? fetchError
            : JSON.stringify(fetchError)}
        </Alert>
      )}
      {/* Note: deleteError is handled by snackbar in useEffect, but can also be shown here if preferred */}

      <Card sx={{ minWidth: 900, boxShadow: "none" }}>
        <UserTableToolbar
          numSelected={tableSelection.selected.length}
          currentParams={currentParams}
          onParamsChange={handleParamsChange}
          onBulkDelete={handleDeleteSelectedUsers}
        />
        <TableContainer
          sx={{ position: "relative", minHeight: 300, overflowX: "auto" }}
        >
          {isLoading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "rgba(255, 255, 255, 0.7)",
                zIndex: 10, // Ensure it's above table
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Table size="medium" stickyHeader={!isLoading} sx={{ minWidth: 700 }}>
            <UserTableHead
              order={currentParams?.sortOrder || "asc"}
              orderBy={currentParams?.sortBy || ""}
              rowCount={usersToDisplay.length}
              numSelected={tableSelection.selected.length}
              onSort={handleSort}
              onSelectAllRows={handleSelectAllRows}
              headCells={headCells}
            />
            <TableBody>
              {usersToDisplay.map((user) => (
                <UserTableRow
                  key={user._id}
                  user={user}
                  selected={tableSelection.selected.includes(user._id)}
                  onSelectRow={() => tableSelection.onSelectRow(user._id)}
                  onEditRow={() => handleEditRow(user._id)}
                  onDeleteRow={() => handleDeleteRow(user._id)}
                  onVerifyRow={() => handleVerifyRow(user._id)} // Assuming verify is still relevant
                  onViewDetails={() => handleViewDetails(user._id)}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
              {calculatedEmptyRows > 0 &&
                !isLoading &&
                usersToDisplay.length > 0 && (
                  <TableRow style={{ height: 53 * calculatedEmptyRows }}>
                    <TableCell colSpan={columnCount} />
                  </TableRow>
                )}
              {!isLoading && usersToDisplay.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      {fetchStatus === "failed"
                        ? "Error loading users."
                        : "No users found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          page={currentPageMUI}
          count={totalItems}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Card>

      {/* Modals */}
      {selectedUser && (
        <UserDetailsModal
          open={modalOpen}
          onClose={handleCloseModal}
          user={selectedUser}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <UserDeleteConfirmationDialog
        open={openConfirmDeleteDialog}
        onClose={handleCloseConfirmDeleteDialog}
        onConfirm={handleConfirmDeleteSelectedUsers}
        title="Confirm Bulk User Deletion"
        message={
          usersToDeleteNames.length > 0
            ? `Are you sure you want to delete the following user(s): ${usersToDeleteNames.join(
                ", "
              )}? This action is irreversible and will also delete all associated data (services, products, orders, messages, etc.) created by these users.`
            : `Are you sure you want to delete ${tableSelection.selected.length} selected user(s)? This action is irreversible and will also delete all associated data (services, products, orders, messages, etc.) created by these users.`
        }
      />

      {/* Single User Delete Confirmation Dialog */}
      <UserDeleteConfirmationDialog
        open={openSingleDeleteDialog}
        onClose={handleCloseSingleDeleteDialog}
        onConfirm={handleConfirmSingleUserDelete}
        title="Confirm User Deletion"
        message={
          usersToDeleteNames.length > 0
            ? `Are you sure you want to delete ${usersToDeleteNames[0]}? This action is irreversible and will also delete all associated data (services, products, orders, messages, etc.) created by this user.`
            : "Are you sure you want to delete this user? This action is irreversible and will also delete all associated data (services, products, orders, messages, etc.) created by this user."
        }
      />
    </DashboardContent>
  );
}
