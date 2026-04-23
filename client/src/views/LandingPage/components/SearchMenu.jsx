/* eslint-disable react/prop-types */
// src/components/SearchMenu.jsx
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
  Divider,
  useMediaQuery,
  useTheme,
  Paper,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../../../store/slice/snackbarSlice";
import SearchIcon from "@mui/icons-material/Search";

const DEFAULT_SEARCH_HEADING =
  "Searching to offer or request services, products, or talent? Start here!";

const SearchMenu = ({
  integrated = false,
  headingText = DEFAULT_SEARCH_HEADING,
  hideModeFilters = false,
  isSpecialDeals = false,
  isCommunityOffers = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Initialize state from URL/Path
  const getInitialTabs = () => {
    let mode = "onsiteService";
    let type = "offered";

    if (location.pathname.includes("/service-requests")) {
      type = "requested";
    } else if (location.pathname.includes("/products")) {
      mode = "products";
    }

    const typeParam = searchParams.get("type");
    const locPref = searchParams.get("locationPreference");
    if (typeParam === "remote" || locPref === "remote") {
      mode = "remoteService";
    } else if (typeParam === "on-site" || locPref === "on-site") {
      mode = "onsiteService";
    }
    return { mode, type };
  };

  const initialTabs = getInitialTabs();
  const [activeSearchMode, setActiveSearchMode] = useState(initialTabs.mode);
  const [serviceRequestType, setServiceRequestType] = useState(initialTabs.type);

  const [formData, setFormData] = useState({
    searchTerm: searchParams.get("q") || "",
    location: searchParams.get("location") || "",
    startDate: searchParams.get("startDate") || "",
    startTime: searchParams.get("startTime") || "",
    providerName: searchParams.get("providerName") || "",
    productCategory: searchParams.get("category") || "",
  });

  // Sync formData with URL searchParams when they change (e.g., browser back/forward)
  useEffect(() => {
    setFormData({
      searchTerm: searchParams.get("q") || "",
      location: searchParams.get("location") || "",
      startDate: searchParams.get("startDate") || "",
      startTime: searchParams.get("startTime") || "",
      providerName: searchParams.get("providerName") || "",
      productCategory: searchParams.get("category") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    if (
      activeSearchMode === "onsiteService" ||
      activeSearchMode === "remoteService"
    ) {
      setFormData((prev) => {
        const keepLocation =
          activeSearchMode === "onsiteService" ||
          (activeSearchMode === "remoteService" &&
            serviceRequestType === "requested");
        return {
          ...prev,
          startDate:
            serviceRequestType === "offered" &&
              activeSearchMode === "onsiteService"
              ? prev.startDate
              : "",
          startTime:
            serviceRequestType === "offered" &&
              activeSearchMode === "onsiteService"
              ? prev.startTime
              : "",
          providerName:
            serviceRequestType === "offered" &&
              activeSearchMode === "remoteService"
              ? prev.providerName
              : "",
          location: keepLocation ? prev.location : "",
        };
      });
    }
  }, [serviceRequestType, activeSearchMode]);

  const handleSearchModeChange = (mode) => {
    if (mode !== null && mode !== activeSearchMode) {
      setActiveSearchMode(mode);
    }
  };

  const handleServiceRequestTypeChange = (type) => {
    if (type !== null && type !== serviceRequestType) {
      setServiceRequestType(type);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const params = (isSpecialDeals || isCommunityOffers)
      ? new URLSearchParams(searchParams)
      : new URLSearchParams();
    let navigationPath = "";
    let hasSearchCriteria = false;

    if (isSpecialDeals) {
      navigationPath = "/special-deals";
    }

    if (isCommunityOffers) {
      navigationPath = "/community-offers";
    }

    if (formData.searchTerm.trim()) {
      params.append("q", formData.searchTerm.trim());
      hasSearchCriteria = true;
    }

    if (isSpecialDeals || isCommunityOffers) {
      // Sync params with formData
      const syncFilter = (paramKey, value) => {
        if (value && value.trim()) {
          params.set(paramKey, value.trim());
          hasSearchCriteria = true;
        } else {
          params.delete(paramKey);
        }
      };

      syncFilter("q", formData.searchTerm);
      syncFilter("location", formData.location);
      syncFilter("startDate", formData.startDate);
      syncFilter("startTime", formData.startTime);
      syncFilter("providerName", formData.providerName);
      
      // For category, only update if the search box category is actually typed in.
      // If empty, we preserve the current category if it exists in URL.
      if (formData.productCategory.trim()) {
        params.set("category", formData.productCategory.trim());
        hasSearchCriteria = true;
      }
    }

    if (!isSpecialDeals && !isCommunityOffers) {
      if (
        activeSearchMode === "onsiteService" ||
        activeSearchMode === "remoteService"
      ) {
        if (serviceRequestType === "offered") {
          navigationPath = "/services/browse";
          params.append(
            "type",
            activeSearchMode === "onsiteService" ? "on-site" : "remote"
          );
          if (
            formData.providerName.trim() &&
            activeSearchMode === "remoteService"
          ) {
            params.append("providerName", formData.providerName.trim());
            hasSearchCriteria = true;
          }
          if (activeSearchMode === "onsiteService") {
            if (formData.location.trim()) {
              params.append("location", formData.location.trim());
              hasSearchCriteria = true;
            }
            if (formData.startDate)
              params.append("startDate", formData.startDate);
            if (formData.startTime)
              params.append("startTime", formData.startTime);
            if (formData.startDate || formData.startTime)
              hasSearchCriteria = true;
          }
        } else {
          // serviceRequestType === "requested"
          navigationPath = "/service-requests/browse";
          if (formData.location.trim()) {
            // If location is provided for requested
            params.append("location", formData.location.trim()); // Use this for location preference or specific location
            hasSearchCriteria = true;
          }
          // Add locationPreference based on the active tab if desired
          if (activeSearchMode === "onsiteService")
            params.append("locationPreference", "on-site");
          else if (activeSearchMode === "remoteService")
            params.append("locationPreference", "remote");
          if (params.has("locationPreference")) hasSearchCriteria = true;
        }
      } else if (activeSearchMode === "products") {
        navigationPath = "/products";
        if (formData.productCategory.trim()) {
          params.append("category", formData.productCategory.trim());
          hasSearchCriteria = true;
        }
      }
    }

    if (!hasSearchCriteria && !isSpecialDeals && !isCommunityOffers) {
      dispatch(
        showSnackbar({
          message: "Please enter at least one search criteria.",
          severity: "warning",
        })
      );
      return;
    }
    if (!navigationPath) {
      dispatch(
        showSnackbar({
          message: "Could not determine search page. Please try again.",
          severity: "error",
        })
      );
      return;
    }
    params.set("page", "1");
    navigate(`${navigationPath}?${params.toString()}`);
  };

  const controlSize = isMobile ? "small" : "medium";
  const currentModeIsService =
    activeSearchMode === "onsiteService" ||
    activeSearchMode === "remoteService";

  // Determine MD size for the searchTerm field
  let searchTermMdSize = 12; // Default to full width
  if (currentModeIsService) {
    if (activeSearchMode === "onsiteService") {
      // On-site (Offered or Requested)
      searchTermMdSize = 6;
    } else if (activeSearchMode === "remoteService") {
      // Remote (Offered or Requested)
      if (serviceRequestType === "offered") {
        // Remote Offered
        searchTermMdSize = 6;
      } else {
        // Remote Requested
        searchTermMdSize = 6; // <<<< MODIFIED: Make it 6 to share with location
      }
    }
  } else if (activeSearchMode === "products") {
    searchTermMdSize = 6;
  }

  return (
    <>
      {integrated ? (
        <Paper
          elevation={isMobile ? 0 : 2}
          sx={{
            width: "100%",
            p: { xs: 0.5, sm: 2.5 }, // Reduced padding for extra-small screens
            borderRadius: { xs: 0, sm: 2 },
            backgroundColor: isMobile ? "transparent" : "background.paper",
          }}
        >
          {/* Existing structure for integrated mode (Hero section) */}
          <Box sx={{ width: "100%" }}>
            <Box sx={{ pb: 3 }}>
              <Typography
                variant={isMobile ? "subtitle1" : "h4"}
                component="p"
                textAlign="left"
                fontWeight={700}
                color={theme.palette.primary.main}
              >
                {headingText}
              </Typography>
            </Box>
            {!hideModeFilters && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: 1,
                  // py: 0,
                  mb: currentModeIsService ? 1 : 2,
                }}
              >
                {[
                  { key: "onsiteService", label: "On-Site Services" },
                  { key: "remoteService", label: "Remote Services" },
                  { key: "products", label: "Products" },
                ].map((mode) => (
                  <Button
                    key={mode.key}
                    size={controlSize}
                    variant={
                      activeSearchMode === mode.key ? "contained" : "outlined"
                    }
                    onClick={() => handleSearchModeChange(mode.key)}
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      textTransform: "none",
                      flexGrow: isMobile ? 1 : 0,
                    }}
                  >
                    {mode.label}
                  </Button>
                ))}
              </Box>
            )}

            {!hideModeFilters && currentModeIsService && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mb: 2,
                }}
              >
                {["offered", "requested"].map((type) => (
                  <Button
                    key={type}
                    size="small"
                    variant={
                      serviceRequestType === type ? "contained" : "outlined"
                    }
                    onClick={() => handleServiceRequestTypeChange(type)}
                    color={
                      serviceRequestType === type ? "secondary" : "primary"
                    }
                    sx={{
                      fontSize: { xs: "0.7rem", sm: "0.85rem" },
                      textTransform: "none",
                      flexGrow: isMobile ? 1 : 0,
                    }}
                  >
                    {type === "offered" ? "Offered" : "Requested"}
                  </Button>
                ))}
              </Box>
            )}

            <Divider
              sx={{ mb: 2.5, display: !hideModeFilters && currentModeIsService ? "block" : "none" }}
            />

            <Grid container spacing={isMobile ? 1.5 : 2}>
              {/* Search Term Field - Common to most modes */}
              <Grid item xs={12} md={searchTermMdSize}>
                <TextField
                  size={controlSize}
                  fullWidth
                  label={
                    activeSearchMode === "products"
                      ? "Product Name / Keywords"
                      : serviceRequestType === "offered"
                        ? "Service Name / Category"
                        : "Request Title / Category"
                  }
                  name="searchTerm"
                  value={formData.searchTerm}
                  onChange={handleChange}
                />
              </Grid>

              {/* --- Fields specific to SERVICE modes --- */}
              {currentModeIsService && (
                <>
                  {/* Location Field for On-Site (Offered & Requested) and Remote Requested */}
                  {(activeSearchMode === "onsiteService" ||
                    (activeSearchMode === "remoteService" &&
                      serviceRequestType === "requested")) && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          size={controlSize}
                          fullWidth
                          label={
                            activeSearchMode === "onsiteService"
                              ? "Location / Zip Code"
                              : "Preferred Location (Optional)"
                          }
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                        />
                      </Grid>
                    )}

                  {/* Provider Name for Remote Offered */}
                  {activeSearchMode === "remoteService" &&
                    serviceRequestType === "offered" && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          size={controlSize}
                          fullWidth
                          label="Provider Name (Optional)"
                          name="providerName"
                          value={formData.providerName}
                          onChange={handleChange}
                        />
                      </Grid>
                    )}

                  {/* Date/Time for On-Site Offered */}
                  {activeSearchMode === "onsiteService" &&
                    serviceRequestType === "offered" && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            size={controlSize}
                            fullWidth
                            type="date"
                            name="startDate"
                            label="Start Date"
                            InputLabelProps={{ shrink: true }}
                            value={formData.startDate}
                            onChange={handleChange}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            size={controlSize}
                            fullWidth
                            type="time"
                            name="startTime"
                            label="Start Time"
                            InputLabelProps={{ shrink: true }}
                            value={formData.startTime}
                            onChange={handleChange}
                          />
                        </Grid>
                      </>
                    )}
                </>
              )}

              {/* --- Fields specific to PRODUCT mode --- */}
              {activeSearchMode === "products" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    size={controlSize}
                    fullWidth
                    label="Product Category (Optional)"
                    name="productCategory"
                    value={formData.productCategory}
                    onChange={handleChange}
                  />
                </Grid>
              )}

              {/* Common Search Button */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearch}
                  size={isMobile ? "medium" : "large"}
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      ) : (
        // New structure for non-integrated mode (title left, search right) - NO PAPER
        <Grid
          container
          spacing={isMobile ? 1.5 : 2}
          alignItems="center"
          sx={{
            width: "100%",
            justifyContent: "space-between",
            p: { xs: 1, sm: 2.5 },
          }}
        >
          <Grid item xs={12} md={6}>
            <Typography
              variant={isMobile ? "subtitle1" : "h4"}
              component="p"
              textAlign="left"
              fontWeight={700}
              color={theme.palette.primary.main}
            >
              {headingText}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ width: "100%" }}>
              {!hideModeFilters && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: currentModeIsService ? 1 : 2,
                  }}
                >
                  {[
                    { key: "onsiteService", label: "On-Site Services" },
                    { key: "remoteService", label: "Remote Services" },
                    { key: "products", label: "Products" },
                  ].map((mode) => (
                    <Button
                      key={mode.key}
                      size={controlSize}
                      variant={
                        activeSearchMode === mode.key ? "contained" : "outlined"
                      }
                      onClick={() => handleSearchModeChange(mode.key)}
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        textTransform: "none",
                        flexGrow: isMobile ? 1 : 0,
                      }}
                    >
                      {mode.label}
                    </Button>
                  ))}
                </Box>
              )}

              {!hideModeFilters && currentModeIsService && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  {["offered", "requested"].map((type) => (
                    <Button
                      key={type}
                      size="small"
                      variant={
                        serviceRequestType === type ? "contained" : "outlined"
                      }
                      onClick={() => handleServiceRequestTypeChange(type)}
                      color={
                        serviceRequestType === type ? "secondary" : "primary"
                      }
                      sx={{
                        fontSize: { xs: "0.7rem", sm: "0.85rem" },
                        textTransform: "none",
                        flexGrow: isMobile ? 1 : 0,
                      }}
                    >
                      {type === "offered" ? "Offered" : "Requested"}
                    </Button>
                  ))}
                </Box>
              )}

              <Divider
                sx={{
                  mb: 2.5,
                  display: !hideModeFilters && currentModeIsService ? "block" : "none",
                }}
              />

              <Grid container spacing={isMobile ? 1.5 : 2}>
                {/* Search Term Field - Common to most modes */}
                <Grid item xs={12} md={searchTermMdSize}>
                  <TextField
                    size={controlSize}
                    fullWidth
                    label={
                      activeSearchMode === "products"
                        ? "Product Name / Keywords"
                        : serviceRequestType === "offered"
                          ? "Service Name / Category"
                          : "Request Title / Category"
                    }
                    name="searchTerm"
                    value={formData.searchTerm}
                    onChange={handleChange}
                  />
                </Grid>

                {/* --- Fields specific to SERVICE modes --- */}
                {currentModeIsService && (
                  <>
                    {/* Location Field for On-Site (Offered & Requested) and Remote Requested */}
                    {(activeSearchMode === "onsiteService" ||
                      (activeSearchMode === "remoteService" &&
                        serviceRequestType === "requested")) && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            size={controlSize}
                            fullWidth
                            label={
                              activeSearchMode === "onsiteService"
                                ? "Location / Zip Code"
                                : "Preferred Location (Optional)"
                            }
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                          />
                        </Grid>
                      )}

                    {/* Provider Name for Remote Offered */}
                    {activeSearchMode === "remoteService" &&
                      serviceRequestType === "offered" && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            size={controlSize}
                            fullWidth
                            label="Provider Name (Optional)"
                            name="providerName"
                            value={formData.providerName}
                            onChange={handleChange}
                          />
                        </Grid>
                      )}

                    {/* Date/Time for On-Site Offered */}
                    {activeSearchMode === "onsiteService" &&
                      serviceRequestType === "offered" && (
                        <>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              size={controlSize}
                              fullWidth
                              type="date"
                              name="startDate"
                              label="Start Date"
                              InputLabelProps={{ shrink: true }}
                              value={formData.startDate}
                              onChange={handleChange}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              size={controlSize}
                              fullWidth
                              type="time"
                              name="startTime"
                              label="Start Time"
                              InputLabelProps={{ shrink: true }}
                              value={formData.startTime}
                              onChange={handleChange}
                            />
                          </Grid>
                        </>
                      )}
                  </>
                )}

                {/* --- Fields specific to PRODUCT mode --- */}
                {activeSearchMode === "products" && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      size={controlSize}
                      fullWidth
                      label="Product Category (Optional)"
                      name="productCategory"
                      value={formData.productCategory}
                      onChange={handleChange}
                    />
                  </Grid>
                )}

                {/* Common Search Button */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearch}
                    size={isMobile ? "medium" : "large"}
                    startIcon={<SearchIcon />}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default SearchMenu;
