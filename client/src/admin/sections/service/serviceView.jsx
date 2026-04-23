/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  showSnackbar,
  clearSnackbar,
} from "../../../store/slice/snackbarSlice";
import { selectUser, selectIsLoggedIn } from "../../../store/slice/userSlice";

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

// Redux Actions and Selectors for Admin Services
import {
  getAllServicesAdmin,
  deleteMultipleServicesAdmin,
  deleteServiceAdmin,
} from "../../../store/adminServiceThunk";
import { resetAdminServices } from "../../../store/adminServiceSlice";

// Sections/Components
import { ServiceTableToolbar } from "./serviceTableToolbar";
import { headCells, ServiceTableHead } from "./serviceTableHead";
import { ServiceTableRow } from "./serviceTableRow";
import { emptyRows } from "./utils";
import { useTableSelection } from "../../../hooks/useTableSelection";
import { Iconify } from "../../components/iconify";
import { DashboardContent } from "../../layouts/dashboard/main";
import { ServiceDeleteConfirmationDialog } from "./ServiceDeleteConfirmationDialog";
import { ServiceDetailsModal } from "./serviceDetailModal";

// ----------------------------------------------------------------------

export function ServiceView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Selectors ---
  // MODIFIED: Destructure 'totalItems' from the Redux state
  const { services, totalItems, isLoading, isError, message, isSuccess } =
    useSelector((state) => state.adminServices);

  const isLoggedIn = useSelector(selectIsLoggedIn);

  // --- Local State ---
  const tableSelection = useTableSelection();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState(false);
  const [servicesToDeleteTitles, setServicesToDeleteTitles] = useState([]);

  const [openSingleDeleteDialog, setOpenSingleDeleteDialog] = useState(false);
  const [serviceToDeleteId, setServiceToDeleteId] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [filterName, setFilterName] = useState("");

  // --- Find selected service data for modal ---
  const serviceForModal = React.useMemo(() => {
    if (!selectedServiceId || !services) return null;
    return services.find((s) => s._id === selectedServiceId);
  }, [selectedServiceId, services]);

  // --- Effects ---
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(
        getAllServicesAdmin({
          page: page + 1, // API is 1-indexed
          limit: rowsPerPage,
          sortBy: orderBy,
          sortOrder: order,
          // MODIFIED: Only include filters if there is a value
          filters: filterName ? { title: filterName } : undefined,
        })
      );
    } else {
      console.warn("ServiceView: User not logged in, not fetching services.");
    }
  }, [dispatch, page, rowsPerPage, orderBy, order, filterName, isLoggedIn]);

  useEffect(() => {
    return () => {
      dispatch(resetAdminServices());
    };
  }, [dispatch]);

  // Effect for delete operation feedback
  useEffect(() => {
    if (isSuccess && message) {
      dispatch(
        showSnackbar({
          message: message,
          severity: "success",
        })
      );
      tableSelection.resetSelected();
      // After a delete, if the current page becomes empty and it's not the first page, go back one page.
      if (
        message.toLowerCase().includes("deleted") &&
        services.length === 0 &&
        page > 0
      ) {
        setPage(page - 1);
      }
      dispatch(clearSnackbar());
    } else if (isError && message) {
      dispatch(
        showSnackbar({
          message: message,
          severity: "error",
        })
      );
      dispatch(clearSnackbar());
    }
  }, [isSuccess, isError, message, dispatch, tableSelection, services, page]);

  // --- Handlers ---
  const handleSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
      setPage(0);
      tableSelection.resetSelected();
    },
    [orderBy, order, tableSelection]
  );

  const handleFilterByName = useCallback((event) => {
    setPage(0);
    setFilterName(event.target.value);
  }, []);

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSelectAllRows = useCallback(
    (checked) => {
      tableSelection.onSelectAllRows(checked, services || []);
    },
    [tableSelection, services]
  );

  const handleEditRow = useCallback(
    (serviceId) => {
      navigate(`/admin/services/edit/${serviceId}`);
    },
    [navigate]
  );

  const handleDeleteRow = useCallback(
    (serviceId) => {
      const serviceToDelete = services.find((s) => s._id === serviceId);
      setServicesToDeleteTitles([
        serviceToDelete
          ? serviceToDelete.title
          : `service with ID ${serviceId}`,
      ]);
      setServiceToDeleteId(serviceId);
      setOpenSingleDeleteDialog(true);
    },
    [services]
  );

  const handleViewDetails = useCallback((serviceId) => {
    setSelectedServiceId(serviceId);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedServiceId(null);
    dispatch(resetAdminServices());
  }, [dispatch]);

  const handleDeleteSelectedServices = useCallback(() => {
    if (tableSelection.selected.length > 0) {
      const titles = tableSelection.selected
        .map((id) => {
          const service = services.find((s) => s._id === id);
          return service ? service.title : `Service ID: ${id}`;
        })
        .filter(Boolean);
      setServicesToDeleteTitles(titles);
      setOpenConfirmDeleteDialog(true);
    }
  }, [tableSelection.selected, services]);

  const handleConfirmDeleteSelectedServices = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
    if (tableSelection.selected.length > 0) {
      dispatch(deleteMultipleServicesAdmin(tableSelection.selected));
    }
  }, [dispatch, tableSelection.selected]);

  const handleCloseConfirmDeleteDialog = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
  }, []);

  const handleConfirmSingleServiceDelete = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    if (serviceToDeleteId) {
      dispatch(deleteServiceAdmin(serviceToDeleteId));
      setServiceToDeleteId(null);
    }
  }, [dispatch, serviceToDeleteId]);

  const handleCloseSingleDeleteDialog = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    setServiceToDeleteId(null);
  }, []);

  // --- Render Logic ---
  // MODIFIED: The API returns the paginated list, so 'services' is what we display.
  const servicesToDisplay = services || [];
  // MODIFIED: Use the total count from the API (via Redux state) for pagination.
  const totalItemsForPagination = totalItems || 0;

  const calculatedEmptyRows = emptyRows(
    page,
    rowsPerPage,
    servicesToDisplay.length
  );
  const columnCount = headCells.length + 1 + 1; // account for checkbox and actions column

  const handleAddServiceClick = () => {
    navigate("/admin/services/add");
  };

  return (
    <DashboardContent>
      {/* ... Header and Error Display ... */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4">Services Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddServiceClick}
        >
          New Service
        </Button>
      </Box>

      {isError && message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {typeof message === "string" ? message : JSON.stringify(message)}
        </Alert>
      )}

      <Card sx={{ minWidth: 900, boxShadow: "none" }}>
        <ServiceTableToolbar
          numSelected={tableSelection.selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
          onBulkDelete={handleDeleteSelectedServices}
        />
        <TableContainer
          sx={{ position: "relative", minHeight: 300, overflowX: "auto" }}
        >
          {/* ... Loading Spinner ... */}
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
          <Table
            size="medium"
            stickyHeader={!isLoading}
            sx={{ minWidth: 700, tableLayout: "fixed" }}
          >
            <ServiceTableHead
              order={order}
              orderBy={orderBy}
              rowCount={servicesToDisplay.length}
              numSelected={tableSelection.selected.length}
              onSort={handleSort}
              onSelectAllRows={handleSelectAllRows}
              headCells={headCells}
            />
            <TableBody>
              {/* MODIFIED: Removed the .slice() method. The API handles pagination. */}
              {servicesToDisplay.map((service) => (
                <ServiceTableRow
                  key={service._id}
                  service={service}
                  selected={tableSelection.selected.includes(service._id)}
                  onSelectRow={() => tableSelection.onSelectRow(service._id)}
                  onEditRow={() => handleEditRow(service._id)}
                  onDeleteRow={() => handleDeleteRow(service._id)}
                  onViewDetails={() => handleViewDetails(service._id)}
                />
              ))}
              {calculatedEmptyRows > 0 &&
                !isLoading &&
                servicesToDisplay.length > 0 && (
                  <TableRow style={{ height: 53 * calculatedEmptyRows }}>
                    <TableCell colSpan={columnCount} />
                  </TableRow>
                )}
              {!isLoading && servicesToDisplay.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      {isError
                        ? "Error loading services."
                        : "No services found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          page={page}
          // MODIFIED: Use totalItems from the Redux state for the count
          count={totalItemsForPagination}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Card>

      {/* ... Modals and Dialogs ... */}
      {serviceForModal && (
        <ServiceDetailsModal
          open={modalOpen}
          onClose={handleCloseModal}
          service={serviceForModal}
        />
      )}
      <ServiceDeleteConfirmationDialog
        open={openConfirmDeleteDialog}
        onClose={handleCloseConfirmDeleteDialog}
        onConfirm={handleConfirmDeleteSelectedServices}
        title="Confirm Bulk Service Deletion"
        message={`Are you sure you want to delete ${tableSelection.selected.length} selected service(s)? This action is irreversible.`}
      />
      <ServiceDeleteConfirmationDialog
        open={openSingleDeleteDialog}
        onClose={handleCloseSingleDeleteDialog}
        onConfirm={handleConfirmSingleServiceDelete}
        title="Confirm Service Deletion"
        message={`Are you sure you want to delete ${
          servicesToDeleteTitles.length > 0
            ? servicesToDeleteTitles[0]
            : "this service"
        }? This action is irreversible.`}
      />
    </DashboardContent>
  );
}
