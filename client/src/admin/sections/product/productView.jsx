/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Stack,
  Paper,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import { Scrollbar } from "../../components/scrollbar";
import { useTableSelection } from "../../../hooks/useTableSelection";
import {
  fetchAdminProducts,
  deleteAdminProduct,
  deleteMultipleAdminProducts,
} from "../../../store/thunks/adminProductThunk";
import {
  clearProductError,
  resetProductState,
} from "../../../store/slice/adminProductSlice";
import ProductTableHead from "./productTableHead";
import ProductTableToolbar from "./productTableToolbar";
import ProductTableRow from "./productTableRow";
import ProductDeleteConfirmationDialog from "./productDeleteConfirmationDialog";
import ProductDetailModal from "./productDetailModal";

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return array.filter(
      (product) =>
        product.name.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        product.category.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }
  return stabilizedThis.map((el) => el[0]);
}

export function ProductView() {
  const dispatch = useDispatch();
  const { products, pagination, loading, error } = useSelector(
    (state) => state.adminProducts
  );
  // Removed: const { token } = useSelector((state) => state.user); // No longer needed here

  const [page, setPage] = useState(0);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [filterName, setFilterName] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(pagination.limit);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] =
    useState(null);

  const {
    selected: selectedProducts,
    handleSelectAllClick,
    handleClick,
    setSelected: setSelectedProducts,
  } = useTableSelection(products.map((p) => p._id));

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    dispatch(
      fetchAdminProducts({
        queryParams: {
          page: newPage + 1,
          limit: rowsPerPage,
          searchTerm: filterName,
          sortBy:
            orderBy === "name"
              ? order === "asc"
                ? "name_asc"
                : "name_desc"
              : undefined,
        },
      })
    );
  };

  const handleChangeRowsPerPage = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setRowsPerPage(newLimit);
    setPage(0);
    dispatch(
      fetchAdminProducts({
        queryParams: {
          page: 1,
          limit: newLimit,
          searchTerm: filterName,
          sortBy:
            orderBy === "name"
              ? order === "asc"
                ? "name_asc"
                : "name_desc"
              : undefined,
        },
      })
    );
  };

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
    setPage(0);
    dispatch(
      fetchAdminProducts({
        queryParams: {
          page: 1,
          limit: rowsPerPage,
          searchTerm: event.target.value,
          sortBy:
            orderBy === "name"
              ? order === "asc"
                ? "name_asc"
                : "name_desc"
              : undefined,
        },
      })
    );
  };

  const handleDeleteProduct = (productId) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await dispatch(deleteAdminProduct({ productId: productToDelete }));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      dispatch(
        fetchAdminProducts({
          queryParams: {
            page: page + 1,
            limit: rowsPerPage,
            searchTerm: filterName,
            sortBy:
              orderBy === "name"
                ? order === "asc"
                  ? "name_asc"
                  : "name_desc"
                : undefined,
          },
        })
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length > 0) {
      await dispatch(
        deleteMultipleAdminProducts({ productIds: selectedProducts })
      );
      setSelectedProducts([]);
      dispatch(
        fetchAdminProducts({
          queryParams: {
            page: page + 1,
            limit: rowsPerPage,
            searchTerm: filterName,
            sortBy:
              orderBy === "name"
                ? order === "asc"
                  ? "name_asc"
                  : "name_desc"
                : undefined,
          },
        })
      );
    }
  };

  const handleViewProductDetails = (product) => {
    setSelectedProductForDetail(product);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedProductForDetail(null);
  };

  useEffect(() => {
    dispatch(
      fetchAdminProducts({
        queryParams: {
          page: page + 1,
          limit: rowsPerPage,
          searchTerm: filterName,
        },
      })
    );
    return () => {
      dispatch(resetProductState());
    };
  }, [dispatch, page, rowsPerPage, filterName]);

  useEffect(() => {
    if (error) {
      dispatch(clearProductError());
    }
  }, [error, dispatch]);

  const filteredProducts = applySortFilter(
    products,
    getComparator(order, orderBy),
    filterName
  );

  const isNotFound = !filteredProducts.length && !!filterName;

  return (
    <Container>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" gutterBottom>
          Products
        </Typography>
        {/* Add Product Button if needed */}
        {/* <Button
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() => console.log("Add new product")}
        >
          New Product
        </Button> */}
      </Stack>

      <Card>
        <ProductTableToolbar
          numSelected={selectedProducts.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
          onBulkDelete={handleBulkDelete}
        />

        <Scrollbar>
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <ProductTableHead
                order={order}
                orderBy={orderBy}
                headLabel={[
                  { id: "name", label: "Name" },
                  { id: "category", label: "Category" },
                  { id: "price", label: "Price" },
                  { id: "stock", label: "Stock" },
                  { id: "status", label: "Status" },
                  { id: "createdBy", label: "Seller" },
                  { id: "" },
                ]}
                rowCount={products.length}
                numSelected={selectedProducts.length}
                onRequestSort={handleRequestSort}
                onSelectAllClick={handleSelectAllClick}
              />
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Loading products...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => (
                      <ProductTableRow
                        key={row._id}
                        product={row}
                        selected={selectedProducts.indexOf(row._id) !== -1}
                        handleClick={(event) => handleClick(event, row._id)}
                        onDelete={() => handleDeleteProduct(row._id)}
                        onViewDetails={() => handleViewProductDetails(row)}
                      />
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Paper
                        sx={{
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h6" paragraph>
                          {!filterName ? "No products found." : "Not found"}
                        </Typography>

                        {isNotFound ? (
                          <Typography variant="body2">
                            No results found for &nbsp;
                            <strong>"{filterName}"</strong>.
                            <br /> Try checking for typos or using complete
                            words.
                          </Typography>
                        ) : null}
                      </Paper>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <ProductDeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {selectedProductForDetail && (
        <ProductDetailModal
          open={detailModalOpen}
          onClose={handleCloseDetailModal}
          product={selectedProductForDetail}
          onProductUpdated={() => {
            dispatch(
              fetchAdminProducts({
                queryParams: {
                  page: page + 1,
                  limit: rowsPerPage,
                  searchTerm: filterName,
                  sortBy:
                    orderBy === "name"
                      ? order === "asc"
                        ? "name_asc"
                        : "name_desc"
                      : undefined,
                },
              })
            );
          }}
        />
      )}
    </Container>
  );
}
