import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Modal,
  Paper,
  IconButton,
} from "@mui/material";
import { Check, Visibility } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUnverifiedUsers,
  updateUserVerification,
  selectUnverifiedUsers,
  selectLoading,
  selectError,
} from "../../store/slice/adminSlice";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://46.202.89.184:5000/api";

const AdminPanel = () => {
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useDispatch();
  const sellers = useSelector(selectUnverifiedUsers);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  // Fetch sellers on mount
  useEffect(() => {
    dispatch(fetchUnverifiedUsers());
  }, [dispatch]);

  const handleVerify = (userId) => {
    dispatch(updateUserVerification(userId)).then(() => {
      dispatch(fetchUnverifiedUsers()); // Refresh unverified users list
    });
  };

  const handleViewDocuments = (documents) => {
    setSelectedDocuments(documents);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedDocuments([]);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Admin Panel - Seller Verification
      </Typography>
      {loading && sellers.length === 0 && <Typography>Loading...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller._id}>
                    <TableCell>{seller.name}</TableCell>
                    <TableCell>{seller.email}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDocuments(seller.documents)}
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        onClick={() => handleVerify(seller._id)}
                      >
                        Verify
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal for Viewing Documents */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Seller Documents
          </Typography>
          {selectedDocuments.length > 0 ? (
            selectedDocuments.map((doc, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {doc.type || "Unknown Type"}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  href={`${BASE_URL}${doc.url}`}
                  target="_blank"
                  sx={{ mt: 1 }}
                >
                  View Document
                </Button>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No documents available.
            </Typography>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminPanel;
