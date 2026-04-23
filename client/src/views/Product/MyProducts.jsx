import { useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useDispatch, useSelector } from "react-redux";
import {
  selectMyProducts,
  selectMyProductsStatus,
  selectMyProductsError,
  clearMyProductsState,
} from "../../store/slice/productSlice";
import { fetchMyProductsThunk } from "../../store/thunks/productThunks";
import { selectUser } from "../../store/slice/userSlice";
import ProductCard from "./ProductCard"; // Import ProductCard

const MyProducts = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const myProducts = useSelector(selectMyProducts);
  const status = useSelector(selectMyProductsStatus);
  const error = useSelector(selectMyProductsError);

  // Effect for fetching products
  useEffect(() => {
    if (user?._id && status === "idle") {
      dispatch(fetchMyProductsThunk(user._id));
    }
  }, [dispatch, user?._id, status]);

  // Effect for clearing state on component unmount
  useEffect(() => {
    return () => {
      dispatch(clearMyProductsState());
    };
  }, [dispatch]);

  // Removed handleEditProduct and handleDeleteProduct as they will be on the detail page

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          My Products
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        My Products
      </Typography>

      {status === "loading" && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {status === "failed" && error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error: {error}
        </Alert>
      )}

      {status === "succeeded" && myProducts.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You haven&apos;t listed any products yet.{" "}
          <MuiLink component={RouterLink} to="/products/add">
            Add your first product!
          </MuiLink>
        </Alert>
      )}

      {status === "succeeded" && myProducts.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {myProducts.map((product) => (
            <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyProducts;
