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

// Redux Actions and Selectors
import {
  fetchAllRequestedProducts,
  updateRequestedProductThunk,
  deleteRequestedProductThunk,
  deleteMultipleRequestedProductsThunk,
} from "../../../store/thunks/adminRequestedProductThunk";
import {
  selectRequestedProducts,
  selectRequestedProductLoading,
  selectRequestedProductError,
  selectRequestedProductSuccess,
  resetRequestedProductState as resetSliceState, // Alias to avoid conflict
} from "../../../store/slice/adminRequestedProductSlice";

// Sections/Components
import { RequestedProductTableToolbar } from "./RequestedProductTableToolbar";
import {
  headCells,
  RequestedProductTableHead,
} from "./RequestedProductTableHead";
import { RequestedProductTableRow } from "./RequestedProductTableRow";
import { emptyRows } from "./utils";
import { useTableSelection } from "../../../hooks/useTableSelection";
import { Iconify } from "../../components/iconify";
import { DashboardContent } from "../../layouts/dashboard/main";
import { RequestedProductDeleteConfirmationDialog } from "./RequestedProductDeleteConfirmationDialog";
import { RequestedProductDetailsModal } from "./RequestedProductDetailsModal"; // NEW: Import details modal

// ----------------------------------------------------------------------

export function RequestedProductView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Selectors ---
  const allRequestedProducts = useSelector(selectRequestedProducts);
  const isLoading = useSelector(selectRequestedProductLoading);
  const fetchError = useSelector(selectRequestedProductError);
  const isSuccess = useSelector(selectRequestedProductSuccess);

  // --- Local State ---
  const tableSelection = useTableSelection();
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = useState(false);
  const [productsToDeleteNames, setProductsToDeleteNames] = useState([]);

  // State for single product deletion
  const [openSingleDeleteDialog, setOpenSingleDeleteDialog] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState(null);

  // State for details modal
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedProductIdForDetails, setSelectedProductIdForDetails] =
    useState(null);

  // Pagination and sorting state (simplified for now, can be expanded with Redux params later)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("createdAt"); // Default sort by creation date
  const [order, setOrder] = useState("desc"); // Default sort order

  // --- Effects ---
  useEffect(() => {
    dispatch(
      fetchAllRequestedProducts({
        page: page + 1,
        limit: rowsPerPage,
        sortBy: orderBy,
        sortOrder: order,
      })
    );
  }, [dispatch, page, rowsPerPage, orderBy, order]);

  useEffect(() => {
    return () => {
      dispatch(resetSliceState()); // Clear state on unmount
    };
  }, [dispatch]);

  useEffect(() => {
    if (isSuccess && !isLoading && fetchError === null) {
      dispatch(
        showSnackbar({
          message: "Operation successful!",
          severity: "success",
        })
      );
      dispatch(clearSnackbar());
      dispatch(resetSliceState()); // Reset success state after showing snackbar
    } else if (fetchError && !isLoading) {
      dispatch(
        showSnackbar({
          message: fetchError || "An error occurred.",
          severity: "error",
        })
      );
      dispatch(clearSnackbar());
      dispatch(resetSliceState()); // Reset error state after showing snackbar
    }
  }, [isSuccess, isLoading, fetchError, dispatch]);

  // --- Handlers ---
  const handleSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === "asc";
      setOrder(isAsc ? "desc" : "asc");
      setOrderBy(property);
      setPage(0); // Reset to page 0 on sort change
      tableSelection.resetSelected();
    },
    [order, orderBy, tableSelection]
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
      tableSelection.onSelectAllRows(checked, allRequestedProducts || []);
    },
    [tableSelection, allRequestedProducts]
  );

  const handleEditRow = useCallback((productId) => {
    // Navigate to edit page or open edit modal
    console.log("Edit requested product:", productId);
    // navigate(`/admin/requested-products/edit/${productId}`); // Example navigation
  }, []);

  const handleDeleteRow = useCallback(
    (productId) => {
      const productToDelete = allRequestedProducts.find(
        (p) => p._id === productId
      );
      const productName = productToDelete
        ? productToDelete.name || `Product ID: ${productId}`
        : `Product ID: ${productId}`;

      setProductsToDeleteNames([productName]);
      setProductToDeleteId(productId);
      setOpenSingleDeleteDialog(true);
    },
    [allRequestedProducts]
  );

  const handleViewDetails = useCallback((productId) => {
    setSelectedProductIdForDetails(productId);
    setOpenDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setOpenDetailsModal(false);
    setSelectedProductIdForDetails(null);
  }, []);

  // --- Handlers for Bulk Delete ---
  const handleDeleteSelectedProducts = useCallback(() => {
    if (tableSelection.selected.length > 0) {
      const names = tableSelection.selected
        .map((id) => {
          const product = allRequestedProducts.find((p) => p._id === id);
          return product ? product.name || `Product ID: ${product._id}` : null;
        })
        .filter(Boolean);

      setProductsToDeleteNames(names);
      setOpenConfirmDeleteDialog(true);
    }
  }, [tableSelection.selected, allRequestedProducts]);

  const handleConfirmDeleteSelectedProducts = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
    if (tableSelection.selected.length > 0) {
      dispatch(deleteMultipleRequestedProductsThunk(tableSelection.selected));
      tableSelection.resetSelected();
    }
  }, [dispatch, tableSelection]);

  const handleCloseConfirmDeleteDialog = useCallback(() => {
    setOpenConfirmDeleteDialog(false);
  }, []);

  // Handlers for single product delete confirmation
  const handleConfirmSingleProductDelete = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    if (productToDeleteId) {
      dispatch(deleteRequestedProductThunk(productToDeleteId));
      setProductToDeleteId(null);
    }
  }, [dispatch, productToDeleteId]);

  const handleCloseSingleDeleteDialog = useCallback(() => {
    setOpenSingleDeleteDialog(false);
    setProductToDeleteId(null);
  }, []);

  // --- Render Logic ---
  const productsToDisplay = allRequestedProducts || [];
  const totalItems = allRequestedProducts.length; // This should come from API pagination metadata if available
  const currentPageMUI = page; // MUI TablePagination uses 0-indexed page

  const calculatedEmptyRows = emptyRows(
    currentPageMUI,
    rowsPerPage,
    productsToDisplay.length
  );
  const columnCount = headCells.length + (tableSelection.selected ? 1 : 0) + 1; // account for checkbox and actions column

  const handleAddProductClick = () => {
    // navigate("/admin/requested-products/add"); // Example navigation
    console.log("Add new requested product (if applicable)");
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
        <Typography variant="h4">Requested Products Management</Typography>
        {/* Add button if there's a way to add requested products manually */}
        {/* <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddProductClick}
        >
          New Requested Product
        </Button> */}
      </Box>

      {/* Error Display */}
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error Fetching Requested Products</AlertTitle>
          {typeof fetchError === "string"
            ? fetchError
            : JSON.stringify(fetchError)}
        </Alert>
      )}

      <Card sx={{ minWidth: 900, boxShadow: "none" }}>
        <RequestedProductTableToolbar
          numSelected={tableSelection.selected.length}
          // currentParams={{ sortBy: orderBy, sortOrder: order }} // Pass current sort params
          // onParamsChange={handleParamsChange} // If you implement filtering/searching
          onBulkDelete={handleDeleteSelectedProducts}
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
            <RequestedProductTableHead
              order={order}
              orderBy={orderBy}
              rowCount={productsToDisplay.length}
              numSelected={tableSelection.selected.length}
              onSort={handleSort}
              onSelectAllRows={handleSelectAllRows}
              headCells={headCells}
            />
            <TableBody>
              {productsToDisplay.map((product) => (
                <RequestedProductTableRow
                  key={product._id}
                  product={product}
                  selected={tableSelection.selected.includes(product._id)}
                  onSelectRow={() => tableSelection.onSelectRow(product._id)}
                  onEditRow={() => handleEditRow(product._id)}
                  onDeleteRow={() => handleDeleteRow(product._id)}
                  onViewDetails={() => handleViewDetails(product._id)}
                />
              ))}
              {calculatedEmptyRows > 0 &&
                !isLoading &&
                productsToDisplay.length > 0 && (
                  <TableRow style={{ height: 53 * calculatedEmptyRows }}>
                    <TableCell colSpan={columnCount} />
                  </TableRow>
                )}
              {!isLoading && productsToDisplay.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      {fetchError
                        ? "Error loading requested products."
                        : "No requested products found."}
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
      <RequestedProductDetailsModal
        open={openDetailsModal}
        onClose={handleCloseDetailsModal}
        productId={selectedProductIdForDetails}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <RequestedProductDeleteConfirmationDialog
        open={openConfirmDeleteDialog}
        onClose={handleCloseConfirmDeleteDialog}
        onConfirm={handleConfirmDeleteSelectedProducts}
        title="Confirm Bulk Requested Product Deletion"
        message={
          productsToDeleteNames.length > 0
            ? `Are you sure you want to delete the following requested product(s): ${productsToDeleteNames.join(
                ", "
              )}? This action is irreversible.`
            : `Are you sure you want to delete ${tableSelection.selected.length} selected requested product(s)? This action is irreversible.`
        }
      />

      {/* Single Product Delete Confirmation Dialog */}
      <RequestedProductDeleteConfirmationDialog
        open={openSingleDeleteDialog}
        onClose={handleCloseSingleDeleteDialog}
        onConfirm={handleConfirmSingleProductDelete}
        title="Confirm Requested Product Deletion"
        message={
          productsToDeleteNames.length > 0
            ? `Are you sure you want to delete ${productsToDeleteNames[0]}? This action is irreversible.`
            : "Are you sure you want to delete this requested product? This action is irreversible."
        }
      />
    </DashboardContent>
  );
}
