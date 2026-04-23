import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Table,
  TableBody,
  TableContainer,
  TablePagination,
  Typography,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import { getSellersWithCommission, deleteSellerCommission } from "../../../../services/apis";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../../../../store/slice/snackbarSlice";
import SellerTableHead from "./components/SellerTableHead";
import SellerTableRow from "./components/SellerTableRow";
import CommissionModal from "./components/CommissionModal";

const TABLE_HEAD = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email" },
  { id: "createdAt", label: "Joined Date" },
  { id: "subscription", label: "Subscription" },
  { id: "commission", label: "Commission (%)" },
  { id: "expiry", label: "Expiry" },
  { id: "action", label: "Action", align: "right" },
];

export default function SellerCommissionView() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const dispatch = useDispatch();

  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getSellersWithCommission({
        page: page + 1,
        limit: rowsPerPage,
      });
      setSellers(res.data.data);
      setTotalItems(res.data.pagination.total);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch sellers");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenModal = (seller) => {
    let displayName = seller.name || seller.email;
    if (seller.accountType === "agency") {
      displayName = seller.companyName || seller.representativeName || seller.email;
    }
    setSelectedSeller({ ...seller, displayName });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSeller(null);
  };

  const handleDeleteSellerCommission = async (seller) => {
    if (!window.confirm(`Are you sure you want to delete the commission override for ${seller.name || seller.email}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteSellerCommission(seller._id);
      dispatch(
        showSnackbar({
          message: "Commission override deleted successfully",
          severity: "success",
        })
      );
      fetchSellers();
    } catch (err) {
      console.error("Error deleting commission:", err);
      dispatch(
        showSnackbar({
          message: err.response?.data?.message || "Failed to delete commission",
          severity: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Platform Fees
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage platform fees for verified sellers
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer sx={{ position: "relative", minHeight: 200 }}>
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
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          <Table sx={{ minWidth: 800 }}>
            <SellerTableHead
              headLabel={TABLE_HEAD}
              rowCount={sellers.length}
              onRequestSort={() => {}} // Sorting not implemented yet as per request
            />
            <TableBody>
              {sellers.map((row) => (
                <SellerTableRow
                  key={row._id}
                  seller={row}
                  onOpenAction={() => handleOpenModal(row)}
                  onDelete={() => handleDeleteSellerCommission(row)}
                />
              ))}

              {!loading && sellers.length === 0 && (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body1">No sellers found</Typography>
                </Box>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} of ${totalPages} ${totalPages <= 1 ? "page" : "pages"}`
          }
        />
      </Card>

      {selectedSeller && (
        <CommissionModal
          open={modalOpen}
          onClose={handleCloseModal}
          sellerName={selectedSeller.displayName}
          sellerId={selectedSeller._id}
          override={selectedSeller.override}
          onRefresh={fetchSellers}
        />
      )}
    </Box>
  );
}
