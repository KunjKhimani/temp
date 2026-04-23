/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // Re-add navigate for the button

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
  Paper, // Added for isNotFound
} from "@mui/material";

import {
  fetchAllAdminOrders,
  deleteAdminOrderThunk,
  deleteMultipleAdminOrdersThunk,
} from "../../../store/thunks/adminOrderThunk";
import { clearAdminOrdersError } from "../../../store/slice/adminOrderSlice";
import { showSnackbar } from "../../../store/slice/snackbarSlice";

import { OrderTableToolbar } from "./orderTableToolbar";
import { OrderTableHead, headCells } from "./orderTableHead";
import { OrderTableRow } from "./orderTableRow";
import { emptyRows, getComparator, applySortFilter } from "./utils";
import { OrderDeleteConfirmationDialog } from "./OrderDeleteConfirmationDialog";
import { OrderDetailsModal } from "./orderDetailModal";
import { Iconify } from "../../components/iconify"; // Import Iconify

// ----------------------------------------------------------------------

export function OrderView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { orders, loading, error, totalOrders } = useSelector(
    (state) => state.adminOrders
  );

  const [page, setPage] = useState(0);
  const [order, setOrder] = useState("asc");
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState("createdAt");
  const [filterName, setFilterName] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState("single"); // 'single' or 'bulk'
  const [orderToDeleteId, setOrderToDeleteId] = useState(null);
  const [ordersToDeleteNames, setOrdersToDeleteNames] = useState([]); // For display in dialog

  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedOrderIdForModal, setSelectedOrderIdForModal] = useState(null);

  // --- Fetching Data ---
  const fetchOrders = useCallback(() => {
    dispatch(
      fetchAllAdminOrders({
        page: page + 1,
        limit: rowsPerPage,
        sortBy: orderBy,
        sortOrder: order,
        filters: { search: filterName },
      })
    );
  }, [dispatch, page, rowsPerPage, orderBy, order, filterName]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (error) {
      dispatch(showSnackbar({ message: error, severity: "error" }));
      dispatch(clearAdminOrdersError());
    }
  }, [error, dispatch]);

  // --- Table Handlers ---
  const handleRequestSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
      setPage(0); // Reset page on sort change
      // Re-fetch with new sort params
      dispatch(
        fetchAllAdminOrders({
          page: 1,
          limit: rowsPerPage,
          sortBy: property,
          sortOrder: isAsc ? "desc" : "asc",
          filters: { search: filterName },
        })
      );
    },
    [orderBy, order, dispatch, rowsPerPage, filterName]
  );

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = orders.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    // Re-fetch with new page
    dispatch(
      fetchAllAdminOrders({
        page: newPage + 1,
        limit: rowsPerPage,
        sortBy: orderBy,
        sortOrder: order,
        filters: { search: filterName },
      })
    );
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
    // Re-fetch with new limit
    dispatch(
      fetchAllAdminOrders({
        page: 1,
        limit: parseInt(event.target.value, 10),
        sortBy: orderBy,
        sortOrder: order,
        filters: { search: filterName },
      })
    );
  };

  const handleFilterByName = useCallback(
    (event) => {
      const query = event.target.value;
      setFilterName(query);
      setPage(0); // Reset page on filter change
      // Re-fetch with new filter
      dispatch(
        fetchAllAdminOrders({
          page: 1,
          limit: rowsPerPage,
          sortBy: orderBy,
          sortOrder: order,
          filters: { search: query },
        })
      );
    },
    [dispatch, rowsPerPage, orderBy, order]
  );

  // --- Delete Handlers ---
  const handleDeleteClick = useCallback(
    (type, id = null) => {
      setDeleteType(type);
      if (type === "single" && id) {
        setOrderToDeleteId(id);
        const orderItem = orders.find((o) => o._id === id);
        setOrdersToDeleteNames([`Order ID: ${orderItem?._id.slice(-6) || id}`]);
      } else if (type === "bulk") {
        const names = selected.map((id) => {
          const orderItem = orders.find((o) => o._id === id);
          return `Order ID: ${orderItem?._id.slice(-6) || id}`;
        });
        setOrdersToDeleteNames(names);
      }
      setOpenDeleteDialog(true);
    },
    [orders, selected]
  );

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false);
    let resultAction;
    if (deleteType === "single" && orderToDeleteId) {
      resultAction = await dispatch(deleteAdminOrderThunk(orderToDeleteId));
    } else if (deleteType === "bulk" && selected.length > 0) {
      resultAction = await dispatch(deleteMultipleAdminOrdersThunk(selected));
    }

    if (resultAction && resultAction.meta.requestStatus === "fulfilled") {
      dispatch(
        showSnackbar({ message: "Operation successful!", severity: "success" })
      );
      setSelected([]); // Clear selection after bulk delete
      setOrderToDeleteId(null);
      fetchOrders(); // Re-fetch orders to update the list
    } else {
      dispatch(
        showSnackbar({
          message: resultAction?.payload || "Operation failed.",
          severity: "error",
        })
      );
    }
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setOrderToDeleteId(null);
    setOrdersToDeleteNames([]);
  };

  // --- Edit/View Details Handlers ---
  const handleEditRow = useCallback((orderId) => {
    setSelectedOrderIdForModal(orderId);
    setOpenDetailModal(true);
  }, []);

  const handleViewDetails = useCallback((orderId) => {
    setSelectedOrderIdForModal(orderId);
    setOpenDetailModal(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setOpenDetailModal(false);
    setSelectedOrderIdForModal(null);
    fetchOrders(); // Re-fetch to ensure any edits are reflected
  }, [fetchOrders]);

  const dataFiltered = applySortFilter(
    orders,
    getComparator(order, orderBy),
    filterName
  );
  const calculatedEmptyRows = emptyRows(page, rowsPerPage, dataFiltered.length);
  const isNotFound = !dataFiltered.length && !!filterName;
  const columnCount = headCells.length + 2; // +1 for checkbox, +1 for actions column

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4">Service Orders</Typography>
        {/* Add New Order Button if applicable */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => navigate("/admin/orders/add-order")}
        >
          New Order
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error Fetching Orders</AlertTitle>
          {typeof error === "string" ? error : JSON.stringify(error)}
        </Alert>
      )}

      <Card sx={{ minWidth: 900, boxShadow: "none" }}>
        <OrderTableToolbar
          numSelected={selected.length}
          currentParams={{
            page: page + 1,
            limit: rowsPerPage,
            sortBy: orderBy,
            sortOrder: order,
            filters: { search: filterName },
          }}
          onParamsChange={(newParams) => {
            setPage(newParams.page ? newParams.page - 1 : page);
            setRowsPerPage(newParams.limit || rowsPerPage);
            setOrderBy(newParams.sortBy || orderBy);
            setOrder(newParams.sortOrder || order);
            setFilterName(newParams.filters?.search || "");
            // fetchOrders will be triggered by useEffect due to state changes
          }}
          onBulkDelete={() => handleDeleteClick("bulk")}
        />
        <TableContainer
          sx={{ position: "relative", minHeight: 300, overflowX: "auto" }}
        >
          {loading && (
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
          <Table size="medium" stickyHeader={!loading} sx={{ minWidth: 700 }}>
            <OrderTableHead
              order={order}
              orderBy={orderBy}
              rowCount={orders.length} // Use total count from API if available
              numSelected={selected.length}
              onSort={handleRequestSort}
              onSelectAllRows={handleSelectAllClick}
            />
            <TableBody>
              {dataFiltered
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <OrderTableRow
                    key={row._id}
                    order={row}
                    selected={selected.includes(row._id)}
                    onSelectRow={(event) => handleClick(event, row._id)}
                    onEditRow={() => handleEditRow(row._id)}
                    onDeleteRow={() => handleDeleteClick("single", row._id)}
                    onViewDetails={() => handleViewDetails(row._id)}
                  />
                ))}
              {calculatedEmptyRows > 0 &&
                !loading &&
                dataFiltered.length > 0 && (
                  <TableRow style={{ height: 53 * calculatedEmptyRows }}>
                    <TableCell colSpan={columnCount} />
                  </TableRow>
                )}
              {!loading && dataFiltered.length === 0 && !isNotFound && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      {error ? "Error loading orders." : "No orders found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {isNotFound && (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={columnCount} sx={{ p: 0 }}>
                      <Paper
                        sx={{
                          textAlign: "center",
                          py: 3,
                        }}
                      >
                        <Typography variant="h6" paragraph>
                          Not found
                        </Typography>

                        <Typography variant="body2">
                          No results found for &nbsp;
                          <strong>"{filterName}"</strong>.
                          <br /> Try checking for typos or using complete words.
                        </Typography>
                      </Paper>
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          page={page}
          count={totalOrders} // Use totalOrders from Redux state
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <OrderDeleteConfirmationDialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title={
          deleteType === "single" ? "Delete Order?" : "Delete Selected Orders?"
        }
        message={
          deleteType === "single"
            ? `Are you sure you want to delete ${ordersToDeleteNames[0]}? This action cannot be undone.`
            : `Are you sure you want to delete ${selected.length} selected orders? This action cannot be undone.`
        }
      />

      {/* Order Details/Edit Modal */}
      {selectedOrderIdForModal && (
        <OrderDetailsModal
          open={openDetailModal}
          onClose={handleCloseDetailModal}
          orderId={selectedOrderIdForModal}
        />
      )}
    </Box>
  );
}
