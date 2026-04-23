import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormHelperText,
  Avatar,
  Stack,
  IconButton,
} from "@mui/material";
// import Iconify from "../../components/iconify";
import { updateAdminProduct } from "../../../store/thunks/adminProductThunk";
import { Iconify } from "../../components/iconify";

// ----------------------------------------------------------------------

ProductDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object,
  onProductUpdated: PropTypes.func,
};

export default function ProductDetailModal({
  open,
  onClose,
  product,
  onProductUpdated,
}) {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.user);
  const { loading: updateLoading } = useSelector(
    (state) => state.adminProducts
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    priceUnit: "item",
    category: "",
    stock: "",
    status: "active",
    tags: [],
    additionalInfo: "",
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Manual submitting state

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        priceUnit: product.priceUnit || "item",
        category: product.category || "",
        stock: product.stock || "",
        status: product.status || "active",
        tags: product.tags || [],
        additionalInfo: product.additionalInfo || "",
      });
      setExistingImages(product.images || []);
      setSelectedImages([]);
    }
  }, [product]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData((prev) => ({
      ...prev,
      tags: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleImageChange = (event) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedImages((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveExistingImage = (imageToRemove) => {
    setExistingImages((prev) => prev.filter((img) => img !== imageToRemove));
  };

  const handleRemoveNewImage = (imageToRemove) => {
    setSelectedImages((prev) => prev.filter((file) => file !== imageToRemove));
  };

  const onSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsSubmitting(true);

    const productFormData = new FormData();
    productFormData.append("name", formData.name);
    productFormData.append("description", formData.description);
    productFormData.append("price", formData.price);
    productFormData.append("priceUnit", formData.priceUnit);
    productFormData.append("category", formData.category);
    productFormData.append("stock", formData.stock);
    productFormData.append("status", formData.status);
    productFormData.append("additionalInfo", formData.additionalInfo || "");
    productFormData.append("tags", JSON.stringify(formData.tags || []));

    productFormData.append("existingImages", JSON.stringify(existingImages));

    selectedImages.forEach((file) => {
      productFormData.append("images", file);
    });

    try {
      await dispatch(
        updateAdminProduct({
          token,
          productId: product._id,
          formData: productFormData,
        })
      ).unwrap();
      onProductUpdated && onProductUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update product:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allImages = [
    ...existingImages,
    ...selectedImages.map((file) => URL.createObjectURL(file)),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        {product ? `Edit Product: ${product.name}` : "Product Details"}
      </DialogTitle>
      <DialogContent dividers>
        {(updateLoading || isSubmitting) && (
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
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              zIndex: 1000,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <form onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="name"
                label="Product Name"
                fullWidth
                margin="normal"
                value={formData.name}
                onChange={handleChange}
              />
              <TextField
                name="description"
                label="Description"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange}
              />
              <TextField
                name="price"
                label="Price"
                fullWidth
                margin="normal"
                type="number"
                value={formData.price}
                onChange={handleChange}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Price Unit</InputLabel>
                <Select
                  name="priceUnit"
                  label="Price Unit"
                  value={formData.priceUnit}
                  onChange={handleChange}
                >
                  <MenuItem value="item">per item</MenuItem>
                  <MenuItem value="kg">per kg</MenuItem>
                  <MenuItem value="lb">per lb</MenuItem>
                  <MenuItem value="g">per g</MenuItem>
                  <MenuItem value="oz">per oz</MenuItem>
                  <MenuItem value="piece">per piece</MenuItem>
                  <MenuItem value="pack">per pack</MenuItem>
                  <MenuItem value="set">per set</MenuItem>
                  <MenuItem value="other">other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="category"
                label="Category"
                fullWidth
                margin="normal"
                value={formData.category}
                onChange={handleChange}
              />
              <TextField
                name="stock"
                label="Stock"
                fullWidth
                margin="normal"
                type="number"
                value={formData.stock}
                onChange={handleChange}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  label="Status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel htmlFor="tags-chip">Tags</InputLabel>
                <Select
                  name="tags"
                  multiple
                  value={formData.tags}
                  onChange={handleTagsChange}
                  input={<OutlinedInput id="tags-chip" label="Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {["Electronics", "Home", "Apparel", "Books", "Tools"].map(
                    (tag) => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <TextField
                name="additionalInfo"
                label="Additional Information"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                value={formData.additionalInfo}
                onChange={handleChange}
              />

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Product Images (Max 10)
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="product-image-upload"
                  multiple
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="product-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                  >
                    Upload Images
                  </Button>
                </label>
                <FormHelperText sx={{ mt: 1 }}>
                  You can upload up to 10 images.
                </FormHelperText>

                <Stack
                  direction="row"
                  flexWrap="wrap"
                  spacing={1}
                  sx={{ mt: 2 }}
                >
                  {existingImages.map((image, index) => (
                    <Box
                      key={`existing-${index}`}
                      sx={{ position: "relative" }}
                    >
                      <Avatar
                        src={image}
                        variant="rounded"
                        sx={{ width: 80, height: 80 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveExistingImage(image)}
                        sx={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          backgroundColor: "rgba(255,255,255,0.8)",
                          "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                        }}
                      >
                        <Iconify
                          icon="eva:close-circle-fill"
                          color="error.main"
                        />
                      </IconButton>
                    </Box>
                  ))}
                  {selectedImages.map((file, index) => (
                    <Box key={`new-${index}`} sx={{ position: "relative" }}>
                      <Avatar
                        src={URL.createObjectURL(file)}
                        variant="rounded"
                        sx={{ width: 80, height: 80 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveNewImage(file)}
                        sx={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          backgroundColor: "rgba(255,255,255,0.8)",
                          "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                        }}
                      >
                        <Iconify
                          icon="eva:close-circle-fill"
                          color="error.main"
                        />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
                {allImages.length === 0 && (
                  <FormHelperText error={true}>
                    At least one image is required.
                  </FormHelperText>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          onClick={onSubmit}
          disabled={isSubmitting || updateLoading || allImages.length === 0}
        >
          {isSubmitting || updateLoading ? (
            <CircularProgress size={24} />
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
