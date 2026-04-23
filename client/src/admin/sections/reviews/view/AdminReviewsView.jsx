/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
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

import {
  fetchAllAdminReviews,
  updateReviewStatusThunk,
} from "../../../../store/thunks/adminReviewThunk";
import {
  selectAdminReviews,
  selectAdminReviewsPagination,
  selectAdminReviewsLoading,
  selectAdminReviewsError,
  clearAdminReviewError,
  resetReviewStatus,
} from "../../../../store/slice/adminReviewSlice";
import { showSnackbar } from "../../../../store/slice/snackbarSlice";

import { ReviewTableHead, headCells } from "../ReviewTableHead";
import { ReviewTableRow } from "../ReviewTableRow";
import { ReviewTableToolbar } from "../ReviewTableToolbar";
import { DashboardContent } from "../../../layouts/dashboard/main";

export function AdminReviewsView() {
  const dispatch = useDispatch();

  const reviews = useSelector(selectAdminReviews);
  const pagination = useSelector(selectAdminReviewsPagination);
  const loading = useSelector(selectAdminReviewsLoading);
  const error = useSelector(selectAdminReviewsError);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterName, setFilterName] = useState("");
  const [selected, setSelected] = useState([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchReviews = useCallback(() => {
    dispatch(
      fetchAllAdminReviews({
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        search: filterName,
      })
    );
  }, [dispatch, page, rowsPerPage, sortBy, sortOrder, filterName]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    return () => {
      dispatch(clearAdminReviewError());
    };
  }, [dispatch]);

  const handleSort = useCallback((id) => {
    const isAsc = sortBy === id && sortOrder === "asc";
    setSortOrder(isAsc ? "desc" : "asc");
    setSortBy(id);
  }, [sortBy, sortOrder]);

  const handleSelectAllRows = useCallback((checked) => {
    if (checked) {
      const newSelecteds = reviews.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, [reviews]);

  const handleSelectRow = useCallback((id) => {
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
  }, [selected]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
    setPage(0);
  };

  const handleUpdateStatus = useCallback(async (id, status) => {
    try {
      await dispatch(updateReviewStatusThunk({ id, status })).unwrap();
      dispatch(
        showSnackbar({
          message: `Review status updated to ${status}`,
          severity: "success",
        })
      );
    } catch (err) {
      dispatch(
        showSnackbar({
          message: err || "Failed to update review status",
          severity: "error",
        })
      );
    }
  }, [dispatch]);

  const columnCount = headCells.length;

  return (
    <DashboardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mt={3} mb={4}>
        <Typography variant="h4">Reviews Management</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error Fetching Reviews</AlertTitle>
          {error}
        </Alert>
      )}

      <Card sx={{ minWidth: 900, boxShadow: "none" }}>
        <ReviewTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
        />

        <TableContainer sx={{ position: "relative", minHeight: 300, overflowX: "auto" }}>
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
            <ReviewTableHead
              currentParams={{ sortBy, sortOrder }}
              rowCount={reviews.length}
              numSelected={selected.length}
              onSort={handleSort}
              onSelectAllRows={handleSelectAllRows}
            />
            <TableBody>
              {reviews.map((review) => (
                <ReviewTableRow
                  key={review._id}
                  review={review}
                  selected={selected.indexOf(review._id) !== -1}
                  onSelectRow={handleSelectRow}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}

              {!loading && reviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columnCount} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      No reviews found.
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
          count={pagination.total}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
    </DashboardContent>
  );
}
