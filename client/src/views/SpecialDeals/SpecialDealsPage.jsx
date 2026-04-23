import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Breadcrumbs,
    Container,
    Grid,
    Typography,
    Link as MuiLink,
    CircularProgress,
    Alert,
    Pagination,
} from "@mui/material";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import NavigationButtons from "../../components/NavigationButtons";
import SearchMenu from "../LandingPage/components/SearchMenu";
import ServiceCard from "../Service/ServiceCard";
import ServiceRequestCard from "../ServiceRequest/ServiceRequestCard";
import ProductCard from "../Product/ProductCard";
import RequestedProductCard from "../../components/RequestedProductCard";
import { specialOfferApi } from "../../services/specialOfferApi";

const ITEMS_PER_PAGE = specialOfferApi.SPECIAL_OFFERS_LIMIT || 4;

const DEFAULT_PAGINATION = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: ITEMS_PER_PAGE,
};

const specialDealNavigationButtons = [
    { label: "All", value: "all" },
    { label: "Product Deal Request", value: "productRequest" },
    { label: "Product Deal Offer", value: "productOffer" },
    { label: "Service Deal Request", value: "serviceRequest" },
    { label: "Service Deal Offer", value: "serviceOffer" },
];

const SpecialDealsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // State derived from searchParams
    const activeTab = searchParams.get("tab") || "all";
    const currentPage = Number(searchParams.get("page")) || 1;
    
    // Other search parameters
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const providerName = searchParams.get("providerName") || "";
    const type = searchParams.get("type") || "";
    const locationPreference = searchParams.get("locationPreference") || "";
    const startDate = searchParams.get("startDate") || "";
    const startTime = searchParams.get("startTime") || "";

    const [offers, setOffers] = useState([]);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const activeTabLabel = useMemo(() => {
        return (
            specialDealNavigationButtons.find((button) => button.value === activeTab)
                ?.label || "All"
        );
    }, [activeTab]);

    useEffect(() => {
        let isMounted = true;

        const fetchSpecialOffers = async () => {
            setLoading(true);
            setError("");

            try {
                const rawParams = {
                    tab: activeTab,
                    page: currentPage,
                    limit: ITEMS_PER_PAGE,
                    q,
                    category,
                    location,
                    providerName,
                    type,
                    locationPreference,
                    startDate,
                    startTime,
                };

                // Remove undefined or empty parameters
                const cleanParams = Object.fromEntries(
                    Object.entries(rawParams).filter(([_, v]) => v !== undefined && v !== null && v !== "")
                );

                const response = await specialOfferApi.getSpecialOffers(cleanParams);

                if (!isMounted) return;

                const responseData = response?.data || {};
                const fetchedOffers = Array.isArray(responseData.offers)
                    ? responseData.offers
                    : [];
                const apiPagination = responseData.pagination || {};
                const totalItems = Number(apiPagination.totalItems) || fetchedOffers.length;
                const totalPagesFromApi = Number(apiPagination.totalPages) || 0;
                const totalPages =
                    totalPagesFromApi > 0
                        ? totalPagesFromApi
                        : Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
                const normalizedPage = Number(apiPagination.currentPage) || currentPage;

                setOffers(fetchedOffers);
                setPagination({
                    currentPage: normalizedPage,
                    totalPages,
                    totalItems,
                    limit: Number(apiPagination.limit) || ITEMS_PER_PAGE,
                });

                if (normalizedPage !== currentPage) {
                    setCurrentPage(normalizedPage);
                }
            } catch (fetchError) {
                if (!isMounted) return;

                setOffers([]);
                setPagination({
                    ...DEFAULT_PAGINATION,
                    currentPage,
                });
                setError(
                    fetchError?.response?.data?.message ||
                    "Failed to load special deals. Please try again."
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSpecialOffers();

        return () => {
            isMounted = false;
        };
    }, [activeTab, currentPage, q, category, location, providerName, type, locationPreference, startDate, startTime, reloadKey]);

    const handleTabSelect = (selectedTabValue) => {
        const nextTab = String(selectedTabValue || "all");

        if (nextTab === activeTab) {
            return;
        }

        const newParams = new URLSearchParams(searchParams);
        newParams.set("tab", nextTab);
        newParams.set("page", "1");
        setSearchParams(newParams, { replace: true });
    };

    const handlePageChange = (event, value) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", value.toString());
        setSearchParams(newParams, { replace: true });
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
                        to="/special-deals/categories"
                        color="inherit"
                        sx={{ textDecoration: "none" }}
                    >
                        Special Deals
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
                    width: "100%",
                    mt: 3, // Increased spacing from top
                    transform: "scale(0.8)",
                }}
            >
                <SearchMenu 
                    headingText="Searching for special deal requests or offers in services and products? Start here!" 
                    hideModeFilters={true}
                    isSpecialDeals={true}
                />
            </Box>

            <NavigationButtons
                buttons={specialDealNavigationButtons}
                selectedValue={activeTab}
                onButtonClick={handleTabSelect}
            />

            <Box sx={{ mt: 6, mb: 3 }}>
                <Typography variant="h5" component="h1" fontWeight={700}>
                    {category || "Special Deals"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {activeTabLabel} ({pagination.totalItems})
                </Typography>
            </Box>

            {loading ? (
                <Box
                    sx={{
                        minHeight: 320,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => setReloadKey((prev) => prev + 1)}
                        >
                            Retry
                        </Button>
                    }
                    sx={{ mt: 2 }}
                >
                    {error}
                </Alert>
            ) : offers.length === 0 ? (
                <Box
                    sx={{
                        minHeight: 240,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="h6" color="text.secondary">
                        No special deals found for this tab.
                    </Typography>
                </Box>
            ) : (
                <>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            {offers.map((offer) => {
                                const itemType = offer?.itemType;
                                const item = offer?.item || {};
                                
                                // Common layout for all cards in this page
                                const CardWrapper = ({ children }) => (
                                    <Grid item xs={12} sm={6} md={3} key={offer._id}>
                                        {children}
                                    </Grid>
                                );

                                switch (itemType) {
                                    case "Service":
                                        return (
                                            <CardWrapper key={offer._id}>
                                                <ServiceCard 
                                                    service={item} 
                                                    isSpecial={true} 
                                                    specialOffer={offer} 
                                                />
                                            </CardWrapper>
                                        );
                                    case "ServiceRequest":
                                        return (
                                            <CardWrapper key={offer._id}>
                                                <ServiceRequestCard 
                                                    request={item} 
                                                    isSpecial={true} 
                                                    specialOffer={offer} 
                                                    isSellerView={true}
                                                />
                                            </CardWrapper>
                                        );
                                    case "Product":
                                        return (
                                            <CardWrapper key={offer._id}>
                                                <ProductCard 
                                                    product={item} 
                                                    isSpecial={true} 
                                                    specialOffer={offer} 
                                                />
                                            </CardWrapper>
                                        );
                                    case "RequestedProduct":
                                        return (
                                            <CardWrapper key={offer._id}>
                                                <RequestedProductCard 
                                                    requestedProduct={item} 
                                                    isSpecial={true}
                                                    specialOffer={offer}
                                                />
                                            </CardWrapper>
                                        );
                                    default:
                                        return (
                                            <CardWrapper key={offer._id}>
                                                <Typography variant="body2">Unknown item type: {itemType}</Typography>
                                            </CardWrapper>
                                        );
                                }
                            })}
                        </Grid>
                    </Box>

                    {pagination.totalPages > 1 && (
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 1 }}>
                            <Pagination
                                count={pagination.totalPages}
                                page={currentPage}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}
                </>
            )}
        </Container>
    );
};

export default SpecialDealsPage;