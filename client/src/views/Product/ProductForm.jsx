/* eslint-disable no-unused-vars */
// src/components/Product/ProductForm.jsx
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Paper,
  IconButton,
  FormHelperText,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { productCategories } from "../../data/productCategory"; // Import productCategories

const priceUnits = [
  "item",
  "kg",
  "lb",
  "g",
  "oz",
  "piece",
  "pack",
  "set",
  "other",
];

const Input = styled("input")({ display: "none" });

const FileInputBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDragActive" && prop !== "hasError",
})(({ theme, isDragActive, hasError }) => ({
  border: `2px dashed ${hasError ? theme.palette.error.main : theme.palette.divider
    }`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: isDragActive
    ? theme.palette.action.hover
    : theme.palette.background.paper,
  transition: theme.transitions.create(["background-color", "border-color"]),
  "&:hover": { backgroundColor: theme.palette.action.hover },
  minHeight: 120,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
}));

const PreviewImage = styled("img")({
  maxHeight: "100px",
  maxWidth: "100px", // Make them square for a neat grid
  width: "100px",
  height: "100px",
  margin: "5px",
  borderRadius: "4px",
  objectFit: "cover", // Use cover for consistent sizing
  border: "1px solid #ddd",
});

const ProductForm = ({
  initialData,
  onSubmit,
  isLoading,
  submitButtonText = "Submit Product",
  showSpecialDealOption = false,
  listAsSpecialDeal = false,
  onListAsSpecialDealChange,
  disableSpecialDealOption = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(
    initialData?.category || ""
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    initialData?.subcategory || ""
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    priceUnit: "item",
    stock: "",
    tags: [],
    additionalInfo: "",
    isCommunity: false,
    ...initialData,
  });

  const [tagInput, setTagInput] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isDragActive, setIsDragActive] = useState(false);

  const previousInitialDataRef = React.useRef(initialData);
  useEffect(() => {
    // Only reset form if initialData has meaningfully changed (e.g. transitioning from Add to Edit)
    // or if it was initially null and now contains real data.
    const hasIdChanged = initialData?._id !== previousInitialDataRef.current?._id;
    const hasInitialDataArrived = !previousInitialDataRef.current && initialData;
    
    if (!hasIdChanged && !hasInitialDataArrived && previousInitialDataRef.current) {
        return;
    }

    const defaultState = {
      name: "",
      description: "",
      price: "",
      priceUnit: "item",
      stock: "",
      tags: [],
      additionalInfo: "",
      isCommunity: false,
    };
    const initialImages = initialData?.images || [];

    const parseSafeArray = (data) => {
      if (Array.isArray(data)) return data;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }
      return [];
    };

    setFormData({
      ...defaultState,
      ...(initialData || {}),
      tags: parseSafeArray(initialData?.tags),
      images: undefined,
      category: undefined, // Handled by selectedCategory
      subcategory: undefined, // Handled by selectedSubcategory
    });

    setSelectedCategory(initialData?.category || "");
    setSelectedSubcategory(initialData?.subcategory || "");

    setExistingImageUrls(
      initialImages.filter((img) => typeof img === "string")
    );
    setImageFiles([]);
    setImagePreviews((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return [];
    });
    
    previousInitialDataRef.current = initialData;
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    setSelectedSubcategory(""); // Reset subcategory when category changes
    if (formErrors.category)
      setFormErrors((prev) => ({ ...prev, category: null }));
    if (formErrors.subcategory)
      setFormErrors((prev) => ({ ...prev, subcategory: null }));
  };

  const handleSubcategoryChange = (e) => {
    const newSubcategory = e.target.value;
    setSelectedSubcategory(newSubcategory);
    if (formErrors.subcategory)
      setFormErrors((prev) => ({ ...prev, subcategory: null }));
  };

  // --- Image Handling ---
  const handleImageFilesChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files);
      if (files.length === 0) return;

      const currentTotalImages = existingImageUrls.length + imageFiles.length;
      const remainingSlots = 10 - currentTotalImages;
      const filesToProcess = files.slice(0, remainingSlots);

      const newValidFiles = filesToProcess.filter((file) =>
        file.type.startsWith("image/")
      );
      const newPreviews = newValidFiles.map((file) =>
        URL.createObjectURL(file)
      );

      setImageFiles((prevFiles) => [...prevFiles, ...newValidFiles]);
      setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

      if (formErrors.images)
        setFormErrors((prev) => ({ ...prev, images: null }));
      event.target.value = null; // Reset file input
    },
    [imageFiles, existingImageUrls.length, formErrors.images]
  );

  const removeNewImage = useCallback((indexToRemove) => {
    setImageFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    setImagePreviews((prevPreviews) => {
      const urlToRevoke = prevPreviews[indexToRemove];
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
      return prevPreviews.filter((_, index) => index !== indexToRemove);
    });
  }, []);

  const removeExistingImage = useCallback((indexToRemove) => {
    setExistingImageUrls((prevUrls) =>
      prevUrls.filter((_, index) => index !== indexToRemove)
    );
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        // Manually trigger the logic similar to handleImageFilesChange
        const currentTotalImages = existingImageUrls.length + imageFiles.length;
        const remainingSlots = 10 - currentTotalImages;
        const filesToProcess = files.slice(0, remainingSlots);

        const newValidFiles = filesToProcess.filter((file) =>
          file.type.startsWith("image/")
        );
        const newPreviews = newValidFiles.map((file) =>
          URL.createObjectURL(file)
        );

        setImageFiles((prevFiles) => [...prevFiles, ...newValidFiles]);
        setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
        if (formErrors.images)
          setFormErrors((prev) => ({ ...prev, images: null }));
      }
    },
    [imageFiles, existingImageUrls.length, formErrors.images]
  );

  const dragEvents = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  // --- Tags Handling ---
  const handleAddTag = () => {
    const trimmedInput = tagInput.trim().toLowerCase();
    if (
      trimmedInput &&
      !formData.tags.map((t) => t.toLowerCase()).includes(trimmedInput) &&
      formData.tags.length < 10
    ) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmedInput] }));
      setTagInput("");
    }
  };
  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter(
        (tag) => tag.toLowerCase() !== tagToRemove.toLowerCase()
      ),
    }));
  };

  // --- Form Validation ---
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Product name is required.";
    else if (formData.name.trim().length > 150)
      errors.name = "Name too long (max 150).";
    if (!formData.description.trim())
      errors.description = "Description is required.";
    else if (formData.description.trim().length > 2000)
      errors.description = "Description too long (max 2000).";
    if (
      formData.price === "" ||
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) < 0
    ) {
      errors.price = "Valid price (>=0) is required.";
    }
    if (!formData.priceUnit) errors.priceUnit = "Price unit is required.";
    if (!selectedCategory) errors.category = "Category is required.";
    // if (!selectedSubcategory) errors.subcategory = "Subcategory is required.";
    if (
      formData.stock === "" ||
      isNaN(parseInt(formData.stock)) ||
      parseInt(formData.stock) < 0
    ) {
      errors.stock = "Valid stock (>=0) is required.";
    }
    const totalImages = existingImageUrls.length + imageFiles.length;
    if (totalImages === 0) {
      errors.images = "At least one image is required.";
    } else if (totalImages > 10) {
      errors.images = "Maximum of 10 images allowed.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const productPayload = new FormData();

    // Append standard form data fields
    [
      "name",
      "description",
      "price",
      "priceUnit",
      "stock",
      "additionalInfo",
      "isCommunity",
    ].forEach((key) => {
      if (
        formData[key] !== undefined &&
        formData[key] !== null &&
        formData[key] !== ""
      ) {
        productPayload.append(key, formData[key]);
      }
    });

    productPayload.append("category", selectedCategory);
    productPayload.append("subcategory", selectedSubcategory);

    // Append tags as a JSON string
    if (formData.tags && formData.tags.length > 0) {
      productPayload.append("tags", JSON.stringify(formData.tags));
    }

    // Append existing image URLs/paths (for edit mode, to know which ones to keep)
    if (existingImageUrls && existingImageUrls.length > 0) {
      productPayload.append(
        "existingImages",
        JSON.stringify(existingImageUrls)
      );
    } else if (
      initialData?.images &&
      initialData.images.length > 0 &&
      existingImageUrls.length === 0
    ) {
      // This case means all existing images were removed
      productPayload.append("existingImages", JSON.stringify([]));
    }

    // Append new image files
    imageFiles.forEach((file) => {
      productPayload.append("productImages", file); // Field name for new files
    });

    onSubmit(productPayload);
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 } }}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name || "Max 150 characters"}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              error={!!formErrors.description}
              helperText={formErrors.description || "Max 2000 characters"}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="Price ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
              error={!!formErrors.price}
              helperText={formErrors.price || " "}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required error={!!formErrors.priceUnit}>
              <InputLabel>Price Unit</InputLabel>
              <Select
                name="priceUnit"
                value={formData.priceUnit}
                label="Price Unit"
                onChange={handleInputChange}
              >
                {priceUnits.map((unit) => (
                  <MenuItem
                    key={unit}
                    value={unit}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {unit}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.priceUnit && (
                <FormHelperText>{formErrors.priceUnit}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label="Stock Quantity"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              InputProps={{ inputProps: { min: 0 } }}
              error={!!formErrors.stock}
              helperText={formErrors.stock || " "}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!formErrors.category}>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={selectedCategory}
                label="Category"
                onChange={handleCategoryChange}
              >
                {productCategories.map((cat) => (
                  <MenuItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.category && (
                <FormHelperText>{formErrors.category}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl
              fullWidth
              disabled={!selectedCategory}
              error={!!formErrors.subcategory}
            >
              <InputLabel>Subcategory</InputLabel>
              <Select
                name="subcategory"
                value={selectedSubcategory}
                label="Subcategory"
                onChange={handleSubcategoryChange}
              >
                {selectedCategory &&
                  productCategories
                    .find((cat) => cat.name === selectedCategory)
                    ?.subcategories.map((subcat) => (
                      <MenuItem key={subcat} value={subcat}>
                        {subcat}
                      </MenuItem>
                    ))}
              </Select>
              {formErrors.subcategory && (
                <FormHelperText>{formErrors.subcategory}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Additional Information (Optional)"
              name="additionalInfo"
              value={formData.additionalInfo || ""}
              onChange={handleInputChange}
              helperText="E.g., care instructions, special notes."
            />
          </Grid>

          {/* Image Upload Section */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              Product Images (up to 10 total)
            </Typography>
            <FormControl fullWidth error={!!formErrors.images}>
              <Box
                component="label"
                htmlFor="product-image-input"
                sx={{ width: "100%" }}
              >
                <Input
                  accept="image/*"
                  id="product-image-input"
                  type="file"
                  multiple
                  onChange={handleImageFilesChange}
                  disabled={existingImageUrls.length + imageFiles.length >= 10}
                />
                <FileInputBox
                  {...dragEvents}
                  isDragActive={isDragActive}
                  hasError={!!formErrors.images}
                >
                  <AddPhotoAlternateIcon
                    sx={{ fontSize: 30, color: "text.disabled", mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Drag & drop or click to upload (
                    {10 - (existingImageUrls.length + imageFiles.length)}{" "}
                    remaining)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (Max 5MB per image, JPG/PNG/WebP)
                  </Typography>
                </FileInputBox>
              </Box>
              {formErrors.images && (
                <FormHelperText error sx={{ ml: 0 }}>
                  {formErrors.images}
                </FormHelperText>
              )}
            </FormControl>
            {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
              <Box
                display="flex"
                flexWrap="wrap"
                mt={2}
                p={1}
                border={1}
                borderColor="divider"
                borderRadius={1}
              >
                {existingImageUrls.map((url, index) => (
                  <Box
                    key={`existing-${index}`}
                    position="relative"
                    sx={{ m: 0.5 }}
                  >
                    <PreviewImage
                      src={
                        url.startsWith("http") || url.startsWith("blob:")
                          ? url
                          : `/api/uploads/${url.replace(/^uploads\//, "")}`
                      }
                      alt={`Existing image ${index + 1}`}
                    />
                    <Tooltip title="Remove existing image">
                      <IconButton
                        size="small"
                        onClick={() => removeExistingImage(index)}
                        sx={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          bgcolor: "rgba(255,255,255,0.8)",
                          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          p: 0.3,
                          border: "1px solid",
                          borderColor: "error.light",
                        }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
                {imagePreviews.map((previewUrl, index) => (
                  <Box key={`new-${index}`} position="relative" sx={{ m: 0.5 }}>
                    <PreviewImage
                      src={previewUrl}
                      alt={`New image ${index + 1}`}
                    />
                    <Tooltip title="Remove new image">
                      <IconButton
                        size="small"
                        onClick={() => removeNewImage(index)}
                        sx={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          bgcolor: "rgba(255,255,255,0.8)",
                          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          p: 0.3,
                          border: "1px solid",
                          borderColor: "error.light",
                        }}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}
          </Grid>

          {/* Tags Section */}
          <Grid item xs={12}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              Tags (Optional, up to 10)
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="Add Tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={formData.tags.length >= 10}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || formData.tags.length >= 10}
                size="medium"
              >
                Add
              </Button>
            </Box>
            {formData.tags.map((tag) => (
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  flexWrap: "wrap",
                  minHeight: "30px",
                }}
              >
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              </Box>
            ))}
          </Grid>

          <Grid item xs={12} >
            {showSpecialDealOption && (
              <Box
                sx={{
                  width: "100%",
                  mb: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      color="secondary"
                      checked={listAsSpecialDeal}
                      onChange={(event) =>
                        onListAsSpecialDealChange?.(event.target.checked)
                      }
                      disabled={disableSpecialDealOption || listAsSpecialDeal}
                    />
                  }
                  label="List as a special deal"
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", ml: { xs: 0, sm: 4.5 } }}
                >
                  After creating the product, you will complete special deal
                  details and activation payment.
                </Typography>
              </Box>
            )}
            <Button
              sx={{ mt: 2 }}
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                submitButtonText
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProductForm;
