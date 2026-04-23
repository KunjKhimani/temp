import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  Table,
  Button,
  TableBody,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  TableRow,
  TableCell,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Switch,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { format } from "date-fns";

import { 
  getPromoCodes, 
  createPromoCode, 
  deletePromoCode,
  updatePromoCodeStatus 
} from "../../../../services/apis";
import PromoCodeModal from "./components/PromoCodeModal";

export default function PromoCodeView() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getPromoCodes({
        page: page + 1,
        limit: rowsPerPage,
      });
      setPromoCodes(response.data.data || []);
      setTotalItems(response.data.pagination.total || 0);
      setTotalPages(response.data.pagination.pages || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch promo codes");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleSave = async (formData) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createPromoCode(formData);
      setSuccess("Promo code created successfully!");
      setModalOpen(false);
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create promo code");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    
    setError("");
    setSuccess("");
    try {
      await deletePromoCode(id);
      setSuccess("Promo code deleted successfully!");
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete promo code");
    }
  };

  const handleStatusToggle = async (id) => {
    setError("");
    setSuccess("");
    try {
      const response = await updatePromoCodeStatus(id);
      setSuccess(response.data.message);
      fetchCodes();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Promo Code Management
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage and create promotional codes for sellers
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setModalOpen(true)}
          >
            Add Promo Code
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>{error}</Alert>}

      <Card sx={{ boxShadow: "none" }}>
        <TableContainer sx={{ position: "relative", minHeight: 200 }}>
          {loading && (
            <Box
              sx={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                display: "flex", justifyContent: "center", alignItems: "center",
                bgcolor: "rgba(255, 255, 255, 0.7)",
                zIndex: 10,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Table stickyHeader>
            <TableBody>
              <TableRow sx={{ bgcolor: "background.neutral" }}>
                <TableCell>Code</TableCell>
                <TableCell>Percentage</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Usage Limit</TableCell>
                <TableCell>Used</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
              {promoCodes.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{row.percentage}%</TableCell>
                    <TableCell>{format(new Date(row.startDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{format(new Date(row.endDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{row.usageLimit || "Unlimited"}</TableCell>
                    <TableCell>{row.usedCount}</TableCell>
                    <TableCell>
                      <Tooltip title={row.isActive ? "Deactivate" : "Activate"}>
                        <Switch
                          checked={row.isActive}
                          onChange={() => handleStatusToggle(row._id)}
                          color="success"
                          size="small"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDelete(row._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              {!loading && promoCodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    No promo codes found. Click "Add Promo Code" to create one.
                  </TableCell>
                </TableRow>
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
          labelDisplayedRows={({ from, to }) => 
            `${from}-${to} of ${totalPages} ${totalPages <= 1 ? "" : ""}`
          }
        />
      </Card>

      <PromoCodeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        saving={saving}
      />
    </Container>
  );
}
