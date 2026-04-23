import React, { useEffect, useMemo } from "react";
import {
    Container,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Grid,
    Breadcrumbs,
    Link as MuiLink,
    Button,
} from "@mui/material";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { specialDealsCategories } from "../../data/specialDealsData";
import {
    fetchOpenServiceRequestsThunk,
} from "../../store/thunks/serviceRequestThunks";
import {
    selectServiceRequestList,
    selectServiceRequestListStatus,
    selectServiceRequestListError,
} from "../../store/slice/serviceRequestSlice";
import ServiceRequestCard from "../ServiceRequest/ServiceRequestCard";

const REQUEST_LIMIT = 48;

const normalizeLabel = (value = "") =>
    value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

const SpecialDealDetailPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { dealName = "" } = useParams();

    const decodedDealName = decodeURIComponent(dealName);
    const activeDeal = useMemo(() => {
        const byTitle = specialDealsCategories.find(
            (deal) => normalizeLabel(deal.footerTitle) === normalizeLabel(decodedDealName)
        );

        if (byTitle) {
            return byTitle;
        }

        return specialDealsCategories.find(
            (deal) => normalizeLabel(deal.highlightText) === normalizeLabel(decodedDealName)
        );
    }, [decodedDealName]);

    const requestList = useSelector(selectServiceRequestList);
    const requestStatus = useSelector(selectServiceRequestListStatus);
    const requestError = useSelector(selectServiceRequestListError);

    useEffect(() => {
        dispatch(fetchOpenServiceRequestsThunk({ page: 1, limit: REQUEST_LIMIT }));
    }, [dispatch]);

    const promotedRequests = useMemo(
        () =>
            requestList.filter(
                (request) => request?.promotionDetails?.isPromoted || request?.requestType === "promoted"
            ),
        [requestList]
    );

    const isFeaturedDealsPage =
        normalizeLabel(activeDeal?.footerTitle || "") === "featured-deals";

    return (
        <Container maxWidth="lg" sx={{ py: 2 }}>
            <Breadcrumbs
                separator={<ChevronRightIcon fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ mb: 2 }}
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
                    to="/special-deals"
                    color="inherit"
                    sx={{ textDecoration: "none" }}
                >
                    Special Deals
                </MuiLink>
                <Typography color="text.primary" sx={{ fontWeight: 500 }}>
                    {activeDeal?.footerTitle || decodedDealName}
                </Typography>
            </Breadcrumbs>

            <Button
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/special-deals")}
                sx={{ mb: 1, pl: 0 }}
            >
                Back to Special Deals
            </Button>

            <Typography variant="h4" component="h1" fontWeight={700} mb={0.8}>
                {activeDeal?.footerTitle || decodedDealName}
            </Typography>

            <Typography variant="subtitle1" color="text.secondary" mb={3}>
                {isFeaturedDealsPage
                    ? "Promoted Request Service"
                    : activeDeal?.subLabel || "Special deal details"}
            </Typography>

            {isFeaturedDealsPage && requestStatus === "loading" && (
                <Box textAlign="center" my={5}>
                    <CircularProgress />
                    <Typography mt={1}>Loading promoted requests...</Typography>
                </Box>
            )}

            {isFeaturedDealsPage && requestStatus === "failed" && (
                <Alert severity="error" sx={{ my: 2 }}>
                    Failed to load promoted requests: {requestError || "An unknown error occurred."}
                </Alert>
            )}

            {isFeaturedDealsPage && requestStatus === "succeeded" && (
                <>
                    {promotedRequests.length > 0 ? (
                        <Grid container spacing={3}>
                            {promotedRequests.map((request) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={request._id}>
                                    <ServiceRequestCard request={request} isSellerView={true} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography textAlign="center" color="text.secondary" my={5} variant="h6">
                            No promoted service requests found.
                        </Typography>
                    )}
                </>
            )}

            {!isFeaturedDealsPage && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    This deal page is ready. Featured Deals currently shows promoted service requests.
                </Alert>
            )}
        </Container>
    );
};

export default SpecialDealDetailPage;
