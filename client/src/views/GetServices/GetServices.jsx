// src/views/GetServices/GetServices.jsx
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef } from "react";
import {
  Box,
  Breadcrumbs,
  Typography,
  Grid,
  Container,
  Paper,
  Divider,
  CircularProgress,
  Link as MuiLink,
  Alert,
  Button,
  Stack,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUser,
  selectFetchedServiceProviders,
  selectServiceProvidersFetchStatus,
  selectServiceProvidersFetchError,
} from "../../store/slice/userSlice";
import { fetchServiceProviders } from "../../store/thunks/userThunks";
import NavigationButtons from "../../components/NavigationButtons";

// Service (Seller Offerings) State
import {
  selectLatestServices,
  selectLatestServicesStatus,
  selectLatestServicesError,
} from "../../store/slice/serviceSlice";
import { fetchLatestServices } from "../../store/thunks/serviceThunks";

// Service Request (Buyer Needs) State
import { fetchOpenServiceRequestsThunk } from "../../store/thunks/serviceRequestThunks";
import {
  selectServiceRequestList as selectOpenServiceRequests,
  selectServiceRequestListStatus as selectOpenRequestsStatus,
  selectServiceRequestListError as selectOpenRequestsError,
} from "../../store/slice/serviceRequestSlice";

// Product State
import {
  selectLatestProducts,
  selectLatestProductsStatus,
  selectLatestProductsError,
} from "../../store/slice/productSlice";
import { fetchLatestProducts } from "../../store/thunks/productThunks";

// Requested Product State
import {
  selectLatestRequestedProducts,
  selectLatestRequestedProductsStatus,
  selectLatestRequestedProductsError,
} from "../../store/slice/requestedProductSlice";
import { fetchLatestRequestedProducts } from "../../store/thunks/requestedProductThunks";
import { fetchSpecialOffersThunk } from "../../store/thunks/specialOfferThunks";
import { fetchCommunityOffersThunk } from "../../store/thunks/communityOfferThunks";

import {
  selectSpecialOffers,
  selectSpecialOffersStatus,
  selectSpecialOffersError,
} from "../../store/slice/specialOfferSlice";
import {
  selectCommunityOffers,
  selectCommunityOffersStatus,
  selectCommunityOffersError,
} from "../../store/slice/communityOfferSlice";

import SearchMenu from "../LandingPage/components/SearchMenu";
import ServiceCard from "../Service/ServiceCard";
import ServiceRequestCard from "../../views/ServiceRequest/ServiceRequestCard";
import ProductCard from "../Product/ProductCard";
import RequestedProductCard from "../../components/RequestedProductCard"; // Ensure this component does NOT have its own Grid item wrapper
import SellerUserCard from "../../components/SellerUserCard"; // Import the new SellerUserCard component

const ITEMS_TO_DISPLAY = 4; // Max items to show in the grid for each section
const FETCH_LIMIT = ITEMS_TO_DISPLAY + 1; // Fetch one more to determine if "View All" is needed

const productSectionButtons = [
  { label: "Latest Products", value: "products" },
  { label: "Latest Product Requests", value: "requests" },
];

// Static data removed in favor of dynamic API integration

export default function GetServices() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const specialDealsSectionRef = useRef(null);
  const communityOffersSectionRef = useRef(null);

  const [currentProductSection, setCurrentProductSection] =
    React.useState("products");

  const scrollToSectionWithOffset = (ref) => {
    if (!ref?.current) return;

    const stickyHeaderOffset = 80;
    const sectionTop =
      ref.current.getBoundingClientRect().top +
      window.pageYOffset -
      stickyHeaderOffset;

    window.scrollTo({
      top: sectionTop,
      behavior: "smooth",
    });
  };

  const marketplaceSectionButtons = [
    { label: "Open Service Requests", to: "/service-requests/browse" },
    { label: "Recently Added Services", to: "/services/browse" },
    { label: "Products for sale", to: "/products" },
    { label: "Requested Products", to: "/requested-products" },
    { label: "Special Deals", value: "special-deals" },
    { label: "Community Offers", value: "community-offers" },
  ];

  const latestServices = useSelector(selectLatestServices);
  const servicesStatus = useSelector(selectLatestServicesStatus);
  const servicesError = useSelector(selectLatestServicesError);

  const openServiceRequests = useSelector(selectOpenServiceRequests);
  const requestsStatus = useSelector(selectOpenRequestsStatus);
  const requestsError = useSelector(selectOpenRequestsError);

  const latestProducts = useSelector(selectLatestProducts);
  const productsStatus = useSelector(selectLatestProductsStatus);
  const productsError = useSelector(selectLatestProductsError);

  const latestRequestedProducts = useSelector(selectLatestRequestedProducts);
  const requestedProductsStatus = useSelector(
    selectLatestRequestedProductsStatus
  );
  const requestedProductsError = useSelector(
    selectLatestRequestedProductsError
  );

  const specialOffers = useSelector(selectSpecialOffers);
  const specialOffersStatus = useSelector(selectSpecialOffersStatus);
  const specialOffersError = useSelector(selectSpecialOffersError);

  const communityOffersRaw = useSelector(selectCommunityOffers);
  const communityOffersStatus = useSelector(selectCommunityOffersStatus);
  const communityOffersError = useSelector(selectCommunityOffersError);

  // Normalize community offers to match ServiceCard expectations
  const communityOffers = communityOffersRaw.map((offer) => {
    // If it's a unified feed item, it has 'item' field from SpecialOffer logic, 
    // but CommunityOffer logic returns the object directly.
    return offer.item || offer;
  });

  // Seller Users (Providers) State
  const sellerUsers = useSelector(selectFetchedServiceProviders);
  const sellerUsersStatus = useSelector(selectServiceProvidersFetchStatus);
  const sellerUsersError = useSelector(selectServiceProvidersFetchError);

  useEffect(() => {
    dispatch(fetchLatestServices({ limit: FETCH_LIMIT }));
    dispatch(fetchOpenServiceRequestsThunk({ limit: FETCH_LIMIT }));
    dispatch(fetchLatestProducts({ limit: FETCH_LIMIT }));
    dispatch(fetchLatestRequestedProducts({ limit: FETCH_LIMIT }));
    dispatch(fetchServiceProviders({ role: "seller", limit: FETCH_LIMIT })); // Fetch seller users
    dispatch(fetchSpecialOffersThunk({ limit: FETCH_LIMIT, tab: "productOffer" })); // Fetch special deals (products)
    dispatch(fetchCommunityOffersThunk({ limit: FETCH_LIMIT, type: "Service" })); // Fetch community offers (services)
  }, [dispatch]);

  const renderSection = (
    title,
    items, // This will be the array fetched with FETCH_LIMIT
    status,
    error,
    viewAllLink,
    CardComponent,
    mainDataPropName, // Name of the prop for the item data (e.g., "service", "request", "product")
    additionalCardProps = {}, // For other static props like isSellerView
    retryAction
  ) => {
    // Slice to show only up to ITEMS_TO_DISPLAY
    const itemsToDisplayInGrid = items.slice(0, ITEMS_TO_DISPLAY);

    return (
      <Box mt={0} mb={5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}
        >
          <Typography variant="h5" fontWeight={600} color="text.primary">
            {title}
          </Typography>
          {status === "succeeded" && items.length > 0 && viewAllLink && (
            <Button
              onClick={() => navigate(viewAllLink)}
              variant="text"
              size="small"
            >
              View All
            </Button>
          )}
        </Stack>

        {status === "loading" && (
          <Box textAlign="center" my={3}>
            <CircularProgress size={28} />
            <Typography variant="caption" display="block" mt={1}>
              Loading {title.toLowerCase()}...
            </Typography>
          </Box>
        )}
        {status === "failed" && (
          <Box textAlign="center" my={3}>
            <Alert severity="error" sx={{ justifyContent: "center", mb: 2 }}>
              Failed to fetch {title.toLowerCase()}.{" "}
              {error?.message || error || "Please try again."}
            </Alert>
            {retryAction && (
              <Button onClick={retryAction} variant="outlined">
                Retry
              </Button>
            )}
          </Box>
        )}
        {status === "succeeded" && itemsToDisplayInGrid.length > 0 && (
          <Grid container spacing={3}>
            {" "}
            {/* Increased spacing further for better visual separation */}
            {itemsToDisplayInGrid.map((item) => {
              // Construct props for the CardComponent
              const propsForCard = {
                [mainDataPropName]: item, // Assign the item to the correct prop name
                ...additionalCardProps, // Spread other static props
              };
              // console.log(
              //   `Mapping item for ${title} with ID ${item._id}. Card gets props:`, propsForCard
              // );
              return (
                <Grid item xs={12} sm={6} md={3} key={item._id}>
                  <CardComponent {...propsForCard} />
                </Grid>
              );
            })}
          </Grid>
        )}
        {status === "succeeded" &&
          items.length === 0 && ( // Check original items array for "not found"
            <Typography
              textAlign="center"
              color="text.secondary"
              my={4}
              variant="subtitle1"
            >
              No {title.toLowerCase()} found.
            </Typography>
          )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 0.5, maxWidth: "100vw" }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 0, color: "text.secondary", fontSize: "0.9rem" }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
        </MuiLink>
        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          Marketplace
        </Typography>
      </Breadcrumbs>

      {/* <Typography
        variant="h5"
        component="h1"
        fontWeight={700}
        textAlign="left"
        color="text.primary"
        gutterBottom
        sx={{ mb: -0.8 }}
      >
        Find Services, Products, or Post Your Needs
      </Typography> */}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // mx: "auto",
          width: "100%",
          mt: "-30px",
          transform: "scale(0.8)",
          boxSizing: "border-box", // Ensure padding/border are included in width
        }}
      >
        <SearchMenu />
      </Box>

      <NavigationButtons
        buttons={marketplaceSectionButtons}
        onButtonClick={(value, button) => {
          if (value === "special-deals") {
            scrollToSectionWithOffset(specialDealsSectionRef);
            return;
          }

          if (value === "community-offers") {
            scrollToSectionWithOffset(communityOffersSectionRef);
            return;
          }

          if (button?.to) {
            navigate(button.to);
          }
        }}
      />

      {renderSection(
        "Open Service Requests",
        openServiceRequests,
        requestsStatus,
        requestsError,
        "/service-requests/browse", // Link for all service requests
        ServiceRequestCard,
        "request", // Main data prop name for ServiceRequestCard
        { isSellerView: true }, // Additional static props
        () => dispatch(fetchOpenServiceRequestsThunk({ limit: FETCH_LIMIT }))
      )}

      {renderSection(
        "Recently Added Services",
        latestServices,
        servicesStatus,
        servicesError,
        "/services/browse", // Link for all services
        ServiceCard,
        "service", // Main data prop name for ServiceCard
        {}, // Additional static props (none needed here)
        () => dispatch(fetchLatestServices({ limit: FETCH_LIMIT }))
      )}

      <Box ref={specialDealsSectionRef}>
        {renderSection(
          "Special Deals",
          specialOffers.map(o => o.item || o), // Extract item if nested (depends on API response structure)
          specialOffersStatus,
          specialOffersError,
          "/special-deals",
          ProductCard,
          "product",
          {},
          () => dispatch(fetchSpecialOffersThunk({ limit: FETCH_LIMIT, tab: "productOffer" }))
        )}
      </Box>

      <Box ref={communityOffersSectionRef}>
        {renderSection(
          "Community Offers",
          communityOffers,
          communityOffersStatus,
          communityOffersError,
          "/community-offers",
          ServiceCard,
          "service",
          {},
          () => dispatch(fetchCommunityOffersThunk({ limit: FETCH_LIMIT, type: "Service" }))
        )}
      </Box>

      {/*
      // Hire Top Talent Section
      {renderSection(
        "Hire Top Talent",
        sellerUsers,
        sellerUsersStatus,
        sellerUsersError,
        "/providers", // Link for all seller users (adjust as needed)
        SellerUserCard,
        "seller", // Main data prop name for SellerUserCard
        {}, // Additional static props (none needed here)
        () =>
          dispatch(
            fetchServiceProviders({ role: "seller", limit: FETCH_LIMIT })
          )
      )}
      */}

      <Divider sx={{ my: 5, borderColor: "grey.300" }} />

      <NavigationButtons
        buttons={productSectionButtons}
        selectedValue={currentProductSection}
        onButtonClick={(value) => setCurrentProductSection(value)}
      />

      {currentProductSection === "products" &&
        renderSection(
          "Buy new/used  products",
          latestProducts,
          productsStatus,
          productsError,
          "/products", // Link to ProductsListPage
          ProductCard,
          "product", // Main data prop name for ProductCard
          {}, // Additional static props (none needed here)
          () => dispatch(fetchLatestProducts({ limit: FETCH_LIMIT }))
        )}

      {currentProductSection === "requests" &&
        renderSection(
          "Latest Product Requests",
          latestRequestedProducts,
          requestedProductsStatus,
          requestedProductsError,
          "/requested-products/browse", // Link to BrowseRequestedProducts
          RequestedProductCard,
          "requestedProduct", // Main data prop name for RequestedProductCard
          {}, // Additional static props (none needed here)
          () => dispatch(fetchLatestRequestedProducts({ limit: FETCH_LIMIT }))
        )}
    </Container>
  );
}
