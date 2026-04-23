/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import ProductForm from "./ProductForm"; // Import the reusable ProductForm
import { productApi } from "../../services/productApi";
import { useSelector } from "react-redux";

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await productApi.getProductById(productId);
        "EditProduct: Product fetched successfully:", response.data;
        setProduct(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch product.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setLoading(false);
      setError("No product ID provided.");
    }
  }, [productId]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError(null);

    try {
      // Authorization check: Only the seller who owns the product can edit it

      if (!user || user._id !== product.createdBy?._id) {
        const authError = "You are not authorized to edit this product.";
        setError(authError);

        setSubmitting(false);
        return;
      }

      const updateResponse = await productApi.updateProduct(
        productId,
        formData
      );

      navigate(`/product/${productId}`); // Navigate back to product detail page
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress /> <Typography ml={2}>Loading product...</Typography>
      </Box>
    );
  }

  if (error && !product) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          Failed to load product: {error}.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Back
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container>
        <Alert severity="info" sx={{ mt: 3 }}>
          Product not found.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  // Authorization check: Only the seller who owns the product can edit it
  if (!user || user._id !== product.createdBy?._id) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          You are not authorized to edit this product.
          <Button onClick={() => navigate(-1)} sx={{ ml: 1 }}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Edit Product
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        isLoading={submitting}
        submitButtonText="Update Product"
      />
    </Container>
  );
};

export default EditProduct;
