// src/views/SubCategory/SubCategory.jsx

import { useEffect } from "react";
import {
  Box,
  Breadcrumbs,
  Typography,
  Grid,
  Container,
  Link as MuiLink,
  CircularProgress,
  Button,
  Alert,
  Stack, // Added Alert for error display
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import { useDispatch, useSelector } from "react-redux";

// --- MODIFIED IMPORTS ---
import {
  selectServices, // Use this for the list of services
  selectServiceListStatus, // Use this for the status of fetching the list
  selectServiceListError, // Use this for errors related to fetching the list
  clearServiceListState, // Use this to clear the main list state if needed
} from "../../store/slice/serviceSlice";
import { fetchSubCategoryServices } from "../../store/thunks/serviceThunks";
// --- END MODIFIED IMPORTS ---

import { categoryExplanations } from "../../data/categoryDescription";
import CategoryIntro from "../Category/CategoryIntro";
import ServiceCard from "../Service/ServiceCard";

export default function SubCategory() {
  const { category, subcategory } = useParams();
  const dispatch = useDispatch();

  // Use the correct selectors for the main services list
  const services = useSelector(selectServices); // This will now hold the subcategory services
  const status = useSelector(selectServiceListStatus);
  const error = useSelector(selectServiceListError);

  const categoryInfo = categoryExplanations.find(
    (cat) => cat.name.toLowerCase() === category?.toLowerCase() // Case-insensitive match
  ) || {
    name: category || "Category",
    description: `Explore services in ${
      category || "this category"
    }. The subcategory is ${subcategory || "not specified"}.`,
    image: null,
  };

  useEffect(() => {
    if (category && subcategory) {
      dispatch(clearServiceListState()); // Clear previous list before fetching new
      dispatch(fetchSubCategoryServices({ category, subcategory }));
    }
    // return () => {
    //   dispatch(clearServiceListState()); // Clear when component unmounts or params change
    // };
  }, [dispatch, category, subcategory]);

  if (status === "loading") {
    return (
      <Container maxWidth="lg" sx={{ py: 5, textAlign: "center" }}>
        <CircularProgress />
        <Typography variant="h6" mt={2} color="text.secondary">
          Loading {subcategory?.replace("-", " ")} services...
        </Typography>
      </Container>
    );
  }

  if (status === "failed") {
    return (
      <Container maxWidth="lg" sx={{ py: 5, textAlign: "center" }}>
        <Alert severity="error" sx={{ justifyContent: "center", mb: 2 }}>
          Failed to fetch services for {subcategory?.replace("-", " ")}.{" "}
          {error || "Please try again."}
        </Alert>
        <Button
          onClick={() => {
            if (category && subcategory)
              dispatch(fetchSubCategoryServices({ category, subcategory }));
          }}
          variant="outlined"
        >
          Retry
        </Button>
      </Container>
    );
  }

  const capitalizedCategory = category
    ? category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Category";
  const capitalizedSubcategory = subcategory
    ? subcategory.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Subcategory";

  return (
    <Container maxWidth="lg" sx={{ py: 2, pb: 4 }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3, color: "text.secondary", fontSize: "0.9rem" }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <MuiLink
          component={RouterLink}
          to={`/category/${category}`}
          color="inherit"
          sx={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            textTransform: "capitalize",
          }}
        >
          {capitalizedCategory}
        </MuiLink>
        <Typography
          color="text.primary"
          sx={{ fontWeight: 500, textTransform: "capitalize" }}
        >
          {capitalizedSubcategory}
        </Typography>
      </Breadcrumbs>

      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        sx={{ mb: 1, textTransform: "capitalize" }}
      >
        {capitalizedSubcategory}
      </Typography>

      {/* Pass the MAIN category's info to the intro banner */}
      <CategoryIntro {...categoryInfo} />

      {services.length > 0 ? (
        <Grid container spacing={3} mt={1}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={service._id}>
              <ServiceCard
                service={service}
                category={category} // Pass the current category slug
                subcategory={subcategory} // Pass the current subcategory slug
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        status === "succeeded" && ( // Only show "no services" if fetch succeeded and list is empty
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No services currently available in &apos;{capitalizedSubcategory}
              &apos;.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Check back later or explore other services in the &apos;
              {capitalizedCategory}&apos; category.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                component={RouterLink}
                to={`/category/${category}`}
                variant="outlined"
              >
                Back to {capitalizedCategory}
              </Button>
              <Button component={RouterLink} to="/services" variant="contained">
                Browse All Services
              </Button>
            </Stack>
          </Box>
        )
      )}
    </Container>
  );
}
