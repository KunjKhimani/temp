/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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

// Redux Actions and Selectors
import {
  useGetAllAdminServiceRequestsQuery,
  useDeleteAdminServiceRequestMutation,
  useDeleteAllAdminServiceRequestsMutation,
} from "../../../services/adminServiceRequestApi";
import {
  clearAdminServiceRequestError,
  clearSelectedServiceRequest,
} from "../../../store/slice/adminServiceRequestSlice";
import {
  showSnackbar,
  clearSnackbar,
} from "../../../store/slice/snackbarSlice";

// Sections/Components
import { ServiceRequestTableToolbar } from "./serviceRequestTableToolbar";
import { headCells, ServiceRequestTableHead } from "./serviceRequestTableHead";
import { ServiceRequestTableRow } from "./serviceRequestTableRow";
import { emptyRows } from "../user/utils"; // Reusing emptyRows from user section
import { useTableSelection } from "../../../hooks/useTableSelection";
import { Iconify } from "../../components/iconify";
import { DashboardContent } from "../../layouts/dashboard/main";
import { ServiceRequestDetailModal } from "./serviceRequestDetailModal";
import { ServiceRequestDeleteConfirmationDialog } from "./serviceRequestDeleteConfirmationDialog";

// ----------------------------------------------------------------------

export function ServiceRequestView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Local State for Table Parameters ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({}); // For status, category, etc.

  // --- RTK Query Hooks ---
  const {
    data: serviceRequestData,
    isLoading: isFetching,
    isError: isFetchError,
    error: fetchError,
    refetch,
  } = useGetAllAdminServiceRequestsQuery({
    page: page + 1,
    limit: rowsPerPage,
    sortBy: orderBy,
    sortOrder: order,
    q: searchQuery,
    ...filters,
  });

  const [
    deleteServiceRequest,
    {
      isLoading: isDeletingSingle,
      isSuccess: isDeleteSingleSuccess,
      isError: isDeleteSingleError,
      error: deleteSingleError,
    },
  ] = useDeleteAdminServiceRequestMutation();

  const [
    deleteAllServiceRequests,
    {
      isLoading: isDeletingAll,
      isSuccess: isDeleteAllSuccess,
      isError: isDeleteAllError,
      error: deleteAllError,
    },
  ] = useDeleteAllAdminServiceRequestsMutation();

  // --- Data from RTK Query ---
  const allServiceRequests = serviceRequestData?.serviceRequests || [];
  const totalItems = serviceRequestData?.pagination?.totalItems || 0;

  // --- Local State for Modals/Dialogs ---
  const tableSelection = useTableSelection();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceRequestId, setSelectedServiceRequestId] =
    useState(null);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState(false);
  const [requestsToDeleteTitles, setRequestsToDeleteTitles] = useState([]);

  // State for single request deletion
  const [openSingleDeleteDialog, setOpenSingleDeleteDialog] = useState(false);
  const [requestToDeleteId, setRequestToDeleteId] = useState(null);

  // --- Find selected service request data ---
  const selectedServiceRequest = React.useMemo(() => {
    if (!selectedServiceRequestId || !allServiceRequests) return null;
    return allServiceRequests.find(
      (req) => req._id === selectedServiceRequestId
    );
  }, [selectedServiceRequestId, allServiceRequests]);

  // --- Effects for API Callbacks ---
  useEffect(() => {
    if (isDeleteSingleSuccess || isDeleteAllSuccess) {
      dispatch(
        showSnackbar({
          message: isDeleteSingleSuccess
            ? "Service request deleted successfully!"
            : "All service requests deleted successfully!",
          severity: "success",
        })
      );
      tableSelection.resetSelected();
      refetch(); // Re-fetch data after deletion
    }
    if (isDeleteSingleError) {
      dispatch(
        showSnackbar({
          message:
            deleteSingleError?.data?.message ||
            "Failed to delete service request.",
          severity: "error",
        })
      );
    }
    if (isDeleteAllError) {
      dispatch(
        showSnackbar({
          message:
            deleteAllError?.data?.message ||
            "Failed to delete all service requests.",
          severity: "error",
        })
      );
    }
  }, [
    isDeleteSingleSuccess,
    isDeleteAllSuccess,
    isDeleteSingleError,
    isDeleteAllError,
    deleteSingleError,
    deleteAllError,
    dispatch,
    tableSelection,
    refetch,
  ]);

  // --- Handlers ---
  const handleSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
      setPage(0); // Reset to first page on sort
      tableSelection.resetSelected();
    },
    [order, orderBy, tableSelection]
  );

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      setPage(0); // Reset to first page on search
      tableSelection.resetSelected();
    },
    [tableSelection]
  );

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPage(0); // Reset to first page on filter change
      tableSelection.resetSelected();
    },
    [tableSelection]
  );

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to page 0
  }, []);

  const handleSelectAllRows = useCallback(
    (checked) => {
      tableSelection.onSelectAllRows(checked, allServiceRequests || []);
    },
    [tableSelection, allServiceRequests]
  );

  const handleEditRow = useCallback(
    (requestId) => {
      // Navigate to edit page or open edit modal
      navigate(`/admin/service-requests/edit/${requestId}`);
      console.log("Edit service request:", requestId);
    },
    [navigate]
  );

  const handleDeleteRow = useCallback(
    (requestId) => {
      const requestToDelete = allServiceRequests.find(
        (req) => req._id === requestId
      );
      const requestTitle = requestToDelete
        ? requestToDelete.title
        : `request with ID ${requestId}`;

      setRequestsToDeleteTitles([requestTitle]);
      setRequestToDeleteId(requestId);
      setOpenSingleDeleteDialog(true);
    },
    [allServiceRequests]
  );

  const handleViewDetails = useCallback((requestId) => {
    setSelectedServiceRequestId(requestId);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedServiceRequestId(null);
  }, []);

  // --- Handlers for Bulk Delete ---
  const handleDeleteSelectedRequests = useCallback(() => {
    if (tableSelection.selected.length > 0) {
      const titles = tableSelection.selected
        .map((id) => {
          const req = allServiceRequests.find((r) => r._id === id);
          return req ? req.title : `Request ID: ${id}`;
        })
        .filter(Boolean);

      setRequestsToDeleteTitles(titles);
      setOpenConfirmDeleteDialog(true);
    }
  }, [tableSelection.selected, allServiceRequests]);

  const handleConfirmDeleteSelectedRequests = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
    if (tableSelection.selected.length > 0) {
      // If deleting all, call deleteAllServiceRequests
      if (tableSelection.selected.length === totalItems) {
        // Heuristic for "all"
        deleteAllServiceRequests();
      } else {
        // Otherwise, call deleteServiceRequest for each selected ID
        // Note: RTK Query mutation hooks are designed for single calls.
        // For bulk, you might need to loop or use a separate thunk that dispatches multiple mutations.
        // For simplicity, we'll loop here, but a dedicated bulk delete endpoint is better.
        tableSelection.selected.forEach((id) => {
          deleteServiceRequest(id);
        });
      }
    }
  }, [
    tableSelection.selected,
    deleteAllServiceRequests,
    deleteServiceRequest,
    totalItems,
  ]);

  const handleCloseConfirmDeleteDialog = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
  }, []);

  // Handlers for single request delete confirmation
  const handleConfirmSingleRequestDelete = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    if (requestToDeleteId) {
      deleteServiceRequest(requestToDeleteId);
      setRequestToDeleteId(null);
    }
  }, [deleteServiceRequest, requestToDeleteId]);

  const handleCloseSingleDeleteDialog = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    setRequestToDeleteId(null);
  }, []);

  // --- Render Logic ---
  const isLoading = isFetching || isDeletingSingle || isDeletingAll;
  const requestsToDisplay = allServiceRequests;
  const currentPageMUI = page; // MUI TablePagination uses 0-indexed page

  const calculatedEmptyRows = emptyRows(
    currentPageMUI,
    rowsPerPage,
    requestsToDisplay.length
  );
  const columnCount = headCells.length + (tableSelection.selected ? 1 : 0) + 1; // account for checkbox and actions column

  const handleAddServiceRequestClick = () => {
    // navigate("/admin/service-requests/add"); // If there's an add form
    dispatch(
      showSnackbar({
        message: "Add Service Request functionality not yet implemented.",
        severity: "info",
      })
    );
  };

  return (
    <DashboardContent>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4">Service Requests Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddServiceRequestClick}
        >
          New Request
        </Button>
      </Box>

      {/* Error Display */}
      {isFetchError && fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error Fetching Service Requests</AlertTitle>
          {typeof fetchError?.data?.message === "string"
            ? fetchError.data.message
            : JSON.stringify(fetchError)}
        </Alert>
      )}

      <Card sx={{ minWidth: 900, boxShadow: "none" }}>
        <ServiceRequestTableToolbar
          numSelected={tableSelection.selected.length}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
          onBulkDelete={handleDeleteSelectedRequests}
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
                zIndex: 10,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Table size="medium" stickyHeader={!isLoading} sx={{ minWidth: 700 }}>
            <ServiceRequestTableHead
              order={order}
              orderBy={orderBy}
              rowCount={requestsToDisplay.length}
              numSelected={tableSelection.selected.length}
              onSort={handleSort}
              onSelectAllRows={handleSelectAllRows}
              headCells={headCells}
            />
            <TableBody>
              {requestsToDisplay.map((request) => (
                <ServiceRequestTableRow
                  key={request._id}
                  request={request}
                  selected={tableSelection.selected.includes(request._id)}
                  onSelectRow={() => tableSelection.onSelectRow(request._id)}
                  onEditRow={() => handleEditRow(request._id)}
                  onDeleteRow={() => handleDeleteRow(request._id)}
                  onViewDetails={() => handleViewDetails(request._id)}
                />
              ))}
              {calculatedEmptyRows > 0 &&
                !isLoading &&
                requestsToDisplay.length > 0 && (
                  <TableRow style={{ height: 53 * calculatedEmptyRows }}>
                    <TableCell colSpan={columnCount} />
                  </TableRow>
                )}
              {!isLoading && requestsToDisplay.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      {isFetchError
                        ? "Error loading service requests."
                        : "No service requests found."}
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
      {selectedServiceRequest && (
        <ServiceRequestDetailModal
          open={modalOpen}
          onClose={handleCloseModal}
          serviceRequest={selectedServiceRequest}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <ServiceRequestDeleteConfirmationDialog
        open={openConfirmDeleteDialog}
        onClose={handleCloseConfirmDeleteDialog}
        onConfirm={handleConfirmDeleteSelectedRequests}
        title="Confirm Bulk Service Request Deletion"
        message={
          requestsToDeleteTitles.length > 0
            ? `Are you sure you want to delete the following service request(s): ${requestsToDeleteTitles.join(
                ", "
              )}? This action is irreversible and will also delete all associated data.`
            : `Are you sure you want to delete ${tableSelection.selected.length} selected service request(s)? This action is irreversible and will also delete all associated data.`
        }
      />

      {/* Single Service Request Delete Confirmation Dialog */}
      <ServiceRequestDeleteConfirmationDialog
        open={openSingleDeleteDialog}
        onClose={handleCloseSingleDeleteDialog}
        onConfirm={handleConfirmSingleRequestDelete}
        title="Confirm Service Request Deletion"
        message={
          requestsToDeleteTitles.length > 0
            ? `Are you sure you want to delete ${requestsToDeleteTitles[0]}? This action is irreversible and will also delete all associated data.`
            : "Are you sure you want to delete this service request? This action is irreversible and will also delete all associated data."
        }
      />
    </DashboardContent>
  );
}
