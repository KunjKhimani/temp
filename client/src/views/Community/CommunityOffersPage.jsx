import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
    Container,
    Typography,
    Box,
    Button,
    Alert,
    Grid,
    CircularProgress,
    Pagination,
    Breadcrumbs,
    Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import {
    IconInbox,
} from "@tabler/icons-react";
import { selectIsLoggedIn, selectUser } from "../../store/slice/userSlice";
import { communityOfferApi } from "../../services/communityOfferApi";
import { showSnackbar } from "../../store/slice/snackbarSlice";
import { useDispatch } from "react-redux";
import ServiceCard from "../Service/ServiceCard";
import ServiceRequestCard from "../ServiceRequest/ServiceRequestCard";
import ProductCard from "../Product/ProductCard";
import RequestedProductCard from "../../components/RequestedProductCard";
import NavigationButtons from "../../components/NavigationButtons";
import SearchMenu from "../LandingPage/components/SearchMenu";

const communityNavigationButtons = [
    { label: "All", value: "all" },
    { label: "Product Request", value: "productRequest" },
    { label: "Product Offer", value: "productOffer" },
    { label: "Service Request", value: "serviceRequest" },
    { label: "Service Offer", value: "serviceOffer" },
];

const CommunityOffersPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const currentUser = useSelector(selectUser);
    const [searchParams, setSearchParams] = useSearchParams();

    // Search Parameters
    const urlType = searchParams.get("type"); // "Service", "ServiceRequest", etc.
    const mode = searchParams.get("mode"); // "Service" or "Product"
    const currentPage = Number(searchParams.get("page")) || 1;
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const q = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const providerName = searchParams.get("providerName") || "";
    const startDate = searchParams.get("startDate") || "";
    const startTime = searchParams.get("startTime") || "";

    // Derive activeTab from urlType
    const activeTab = useMemo(() => {
        if (urlType === "ServiceRequest") return "serviceRequest";
        if (urlType === "Service") return "serviceOffer";
        if (urlType === "RequestedProduct") return "productRequest";
        if (urlType === "Product") return "productOffer";
        return "all";
    }, [urlType]);

    // Listing State
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filter Navigation Buttons based on Mode (Service vs Product)
    const filteredButtons = useMemo(() => {
        if (mode === "Service") {
            return [
                { label: "All", value: "all" },
                { label: "Service Request", value: "serviceRequest" },
                { label: "Service Offer", value: "serviceOffer" },
            ];
        } else if (mode === "Product") {
            return [
                { label: "All", value: "all" },
                { label: "Product Request", value: "productRequest" },
                { label: "Product Offer", value: "productOffer" },
            ];
        }
        return communityNavigationButtons;
    }, [mode]);

    // Ensure activeTab is valid for the current filtered buttons
    useEffect(() => {
        const isValid = filteredButtons.some(b => b.value === activeTab);
        if (!isValid) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("tab", "all");
            setSearchParams(newParams, { replace: true });
        }
    }, [filteredButtons, activeTab, searchParams, setSearchParams]);

    const activeTabLabel = useMemo(() => {
        return (
            communityNavigationButtons.find((button) => button.value === activeTab)
                ?.label || "All"
        );
    }, [activeTab]);

    const fetchOffers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const rawParams = {
                type: urlType || undefined,
                page: currentPage,
                limit: 12,
                category: category || undefined,
                subcategory: subcategory || undefined,
                q: q || undefined,
                location: location || undefined,
                providerName: providerName || undefined,
                startDate: startDate || undefined,
                startTime: startTime || undefined
            };

            // Remove undefined or empty parameters
            const cleanParams = Object.fromEntries(
                Object.entries(rawParams).filter(([_, v]) => v !== undefined && v !== null && v !== "")
            );

            const response = await communityOfferApi.getCommunityOffers(cleanParams);

            if (response.data) {
                setOffers(response.data.offers || []);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setTotalItems(response.data.pagination?.totalItems || (response.data.offers?.length || 0));
            }
        } catch (err) {
            console.error("Error fetching community offers:", err);
            setError("Failed to load community offers. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [activeTab, currentPage, category, subcategory, q, location, providerName, startDate, startTime]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const handleTabSelect = (selectedTabValue) => {
        if (selectedTabValue === activeTab) return;

        const newParams = new URLSearchParams(searchParams);
        
        // Map tab value to API type parameter
        if (selectedTabValue === "serviceRequest") newParams.set("type", "ServiceRequest");
        else if (selectedTabValue === "serviceOffer") newParams.set("type", "Service");
        else if (selectedTabValue === "productRequest") newParams.set("type", "RequestedProduct");
        else if (selectedTabValue === "productOffer") newParams.set("type", "Product");
        else {
            newParams.delete("type");
        }

        newParams.set("page", "1");
        setSearchParams(newParams, { replace: true });
    };

    const handlePageChange = (event, value) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", value.toString());
        setSearchParams(newParams, { replace: true });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleEditClick = (item) => {
        // Removed as per request to use full page edit
    };

    const handleEditSuccess = (message) => {
        dispatch(showSnackbar({ message, severity: "success" }));
        fetchOffers(); // Refresh the list
    };

    return (
        <Container maxWidth="lg" sx={{ py: 2 }}>
            <Breadcrumbs
                separator={<ChevronRightIcon fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ mb: 0, color: "text.secondary", fontSize: "0.9rem" }}
            >
                <MuiLink
                    component={RouterLink}
                    to="/"
                    color="inherit"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        textDecoration: "none",
                    }}
                >
                    <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" /> Home
                </MuiLink>
                <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                    <MuiLink
                        component={RouterLink}
                        to="/community-offers/categories"
                        color="inherit"
                        sx={{ textDecoration: "none" }}
                    >
                        Community Offers
                    </MuiLink>
                </Typography>
                {category && (
                    <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                        {category}
                    </Typography>
                )}
            </Breadcrumbs>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    width: "125%", // Increase width to compensate for scale(0.8)
                    mt: 3,
                    transform: "scale(0.8)",
                    transformOrigin: "left top", // Align to left for perfect match
                    mb: -6, // Pull contents up to account for scaled height
                }}
            >
                <SearchMenu 
                    headingText="Searching for community requests or offers? Start here!" 
                    hideModeFilters={true}
                    isCommunityOffers={true}
                />
            </Box>

            <NavigationButtons
                buttons={filteredButtons}
                selectedValue={activeTab}
                onButtonClick={handleTabSelect}
            />

            <Box sx={{ mt: 6, mb: 3 }}>
                <Typography variant="h5" component="h1" fontWeight={700}>
                    {subcategory || category || "Community Offers"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {activeTabLabel} ({totalItems})
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                    <CircularProgress size={60} thickness={4} />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mx: "auto", maxWidth: 600 }}>{error}</Alert>
            ) : offers.length === 0 ? (
                <Box textAlign="center" py={10}>
                    <IconInbox size={80} color="#ccc" stroke={1} />
                    <Typography variant="h6" color="text.secondary" mt={2}>
                        No community offers found matching your criteria.
                    </Typography>
                    <Button 
                        variant="text" 
                        onClick={() => navigate("/community-offers")}
                        sx={{ mt: 1 }}
                    >
                        Clear All Filters
                    </Button>
                </Box>
            ) : (
                <Box>
                    <Grid container spacing={3}>
                        {offers.map((offer) => {
                            const itemType = offer.itemType || "ServiceRequest";
                            const commonCardProps = {
                                isCommunity: true,
                                isSpecial: offer.isSpecial,
                                specialOffer: offer.specialOffer || (offer.sellingPrice ? offer : null)
                            };

                            return (
                                <Grid item xs={12} sm={6} md={3} key={offer._id}>
                                    {itemType === "Service" ? (
                                        <ServiceCard 
                                            service={offer} 
                                            {...commonCardProps} 
                                        />
                                    ) : itemType === "Product" ? (
                                        <ProductCard 
                                            product={offer} 
                                            {...commonCardProps} 
                                        />
                                    ) : itemType === "ServiceRequest" ? (
                                        <ServiceRequestCard 
                                            request={offer} 
                                            isLoggedIn={isLoggedIn} 
                                            isSellerView={true}
                                            {...commonCardProps}
                                        />
                                    ) : (
                                        <RequestedProductCard 
                                            requestedProduct={offer} 
                                            {...commonCardProps}
                                        />
                                    )}
                                </Grid>
                            );
                        })}
                    </Grid>

                    {totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                            <Pagination 
                                count={totalPages} 
                                page={currentPage} 
                                onChange={handlePageChange} 
                                color="primary"
                                size="large"
                                shape="rounded"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </Box>
            )}
        </Container>
    );
};

export default CommunityOffersPage;
