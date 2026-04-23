import { useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { format } from "date-fns";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Grid,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Link,
} from "@mui/material";

import { fetchRequestedProductById } from "../../../store/thunks/adminRequestedProductThunk";
import {
  selectRequestedProductLoading,
  selectRequestedProductError,
  selectSelectedRequestedProduct,
} from "../../../store/slice/adminRequestedProductSlice";

export function RequestedProductDetailsModal({ open, onClose, productId }) {
  const dispatch = useDispatch();
  const selectedProduct = useSelector(selectSelectedRequestedProduct);
  const isLoading = useSelector(selectRequestedProductLoading);
  const fetchError = useSelector(selectRequestedProductError);

  useEffect(() => {
    if (open && productId) {
      dispatch(fetchRequestedProductById(productId));
    }
  }, [dispatch, open, productId]);

  if (!open) return null; // Don't render if not open

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          pb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          Requested Product Details
        </Typography>
        {selectedProduct?.status && (
          <Chip
            label={selectedProduct.status}
            color={
              (selectedProduct.status === "pending" && "warning") ||
              (selectedProduct.status === "fulfilled" && "success") ||
              "info"
            }
            size="small"
            sx={{ textTransform: "capitalize" }}
          />
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {fetchError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error: {fetchError.message || JSON.stringify(fetchError)}
          </Alert>
        )}
        {!isLoading && !selectedProduct && !fetchError && (
          <Alert severity="info">No product details found.</Alert>
        )}

        {!isLoading && selectedProduct && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Stack spacing={1.5}>
                <Typography variant="h6">Product Information</Typography>
                <DetailItem label="Name" value={selectedProduct.name} />
                <DetailItem label="Category" value={selectedProduct.category} />
                {selectedProduct.subcategory && (
                  <DetailItem
                    label="Subcategory"
                    value={selectedProduct.subcategory}
                  />
                )}
                <DetailItem
                  label="Quantity"
                  value={`${selectedProduct.quantityRequested} ${selectedProduct.priceUnit}`}
                />
                {selectedProduct.targetPrice && (
                  <DetailItem
                    label="Target Price"
                    value={`$${selectedProduct.targetPrice} / ${selectedProduct.priceUnit}`}
                  />
                )}
                <DetailItem
                  label="Delivery Location"
                  value={selectedProduct.deliveryLocation}
                />
                <DetailItem
                  label="Requested Date"
                  value={format(
                    new Date(selectedProduct.createdAt),
                    "dd MMM yyyy"
                  )}
                />
                {selectedProduct.fulfillmentDeadline && (
                  <DetailItem
                    label="Fulfillment Deadline"
                    value={format(
                      new Date(selectedProduct.fulfillmentDeadline),
                      "dd MMM yyyy"
                    )}
                  />
                )}
                {selectedProduct.fulfillmentDate && (
                  <DetailItem
                    label="Fulfillment Date"
                    value={format(
                      new Date(selectedProduct.fulfillmentDate),
                      "dd MMM yyyy"
                    )}
                  />
                )}
                {selectedProduct.description && (
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="fontWeightMedium"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Description:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {selectedProduct.description}
                    </Typography>
                  </Box>
                )}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="fontWeightMedium"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      Tags:
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selectedProduct.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={1.5}>
                <Typography variant="h6">Associated Users</Typography>
                <DetailItem
                  label="Requested By ID"
                  value={selectedProduct.requestedBy}
                />
                {selectedProduct.fulfilledBy && (
                  <DetailItem
                    label="Fulfilled By ID"
                    value={selectedProduct.fulfilledBy}
                  />
                )}

                {selectedProduct.images &&
                  selectedProduct.images.length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ mt: 2 }}>
                        Images
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {selectedProduct.images.map((image, index) => (
                          <Grid item xs={6} sm={4} key={index}>
                            <Link
                              href={image}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Box
                                component="img"
                                src={image}
                                alt={`Product Image ${index + 1}`}
                                sx={{
                                  width: "100%",
                                  height: 100,
                                  objectFit: "cover",
                                  borderRadius: 1,
                                }}
                              />
                            </Link>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
              </Stack>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          "& > :not(:first-of-type)": { ml: 1 },
        }}
      >
        <Button onClick={onClose} color="inherit" variant="outlined">
          Close
        </Button>
        {/* Add action buttons here if needed, e.g., "Mark as Fulfilled", "Edit" */}
      </DialogActions>
    </Dialog>
  );
}

RequestedProductDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productId: PropTypes.string, // ID of the product to fetch details for
};

// Helper component for consistent detail item display
function DetailItem({ label, value }) {
  if (!value) return null;
  return (
    <Box>
      <Typography
        variant="body2"
        component="span"
        fontWeight="fontWeightMedium"
      >
        {label}:{" "}
      </Typography>
      <Typography variant="body2" component="span" color="text.secondary">
        {value}
      </Typography>
    </Box>
  );
}

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
