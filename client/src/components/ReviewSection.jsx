import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Rating,
  Stack,
  IconButton,
  CircularProgress,
  Grid,
  useTheme,
  alpha,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { reviewApi } from "../services/reviewApi";

const ReviewSection = ({ listingId, listingModel }) => {
  const theme = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchReviews = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const response = await reviewApi.getItemReviews(listingId, {
        limit: 3, // Changed from 5 to 3 for wider cards
        page: pageNum,
        status: "approved",
      });
      if (response?.data?.success) {
        setReviews(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (listingId) {
      fetchReviews(page);
    }
  }, [listingId, page, fetchReviews]);

  const handlePrevPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const getApiDomainForImages = () => {
    let domain = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    if (domain.endsWith("/api"))
      domain = domain.substring(0, domain.lastIndexOf("/api"));
    else if (domain.endsWith("/api/"))
      domain = domain.substring(0, domain.lastIndexOf("/api/"));
    return domain;
  };
  const API_DOMAIN = getApiDomainForImages();

  if (loading && page === 1) {
    return (
      <Box sx={{ mt: 4, py: 4, textAlign: "center" }}>
        <CircularProgress size={30} thickness={4} />
      </Box>
    );
  }

  if (!loading && reviews.length === 0 && page === 1) {
    return null;
  }

  return (
    <Box sx={{ mt: 8, mb: 6, position: "relative" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight="800"
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 0.5,
            }}
          >
            What Our Customers Say
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Average feedback from {totalItems} {totalItems === 1 ? "happy customer" : "happy customers"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <IconButton
            onClick={handlePrevPage}
            disabled={page === 1 || loading}
            sx={{
              bgcolor: "background.paper",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
              "&.Mui-disabled": { opacity: 0.4 },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={handleNextPage}
            disabled={page === totalPages || loading}
            sx={{
              bgcolor: "background.paper",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
              "&.Mui-disabled": { opacity: 0.4 },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ position: "relative", minHeight: "260px" }}>
        {loading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.background.default, 0.6),
              zIndex: 2,
              backdropFilter: "blur(2px)",
              borderRadius: 4,
            }}
          >
            <CircularProgress size={40} thickness={4} />
          </Box>
        )}

        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item xs={12} md={4} key={review._id}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: alpha(theme.palette.divider, 0.1),
                  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                  position: "relative",
                  overflow: "visible",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: -15,
                    right: 20,
                    bgcolor: "primary.main",
                    color: "white",
                    borderRadius: "50%",
                    p: 0.5,
                    display: "flex",
                  }}
                >
                  <FormatQuoteIcon fontSize="small" />
                </Box>

                <CardContent sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column" }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar
                      src={
                        review.reviewerId?.profilePicture
                          ? `${API_DOMAIN}/api/uploads/${review.reviewerId.profilePicture.replace(/^uploads\//, "")}`
                          : undefined
                      }
                      sx={{
                        width: 56,
                        height: 56,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        border: "2px solid white",
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" noWrap sx={{ fontSize: "1.1rem", fontWeight: 700 }}>
                        {review.reviewerId?.name || "User"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <Rating
                      value={review.rating}
                      readOnly
                      precision={0.5}
                      icon={<Box component="span" sx={{ fontSize: "1.2rem" }}>★</Box>}
                      emptyIcon={<Box component="span" sx={{ fontSize: "1.2rem", color: "divider" }}>★</Box>}
                      sx={{ color: "#FFB400" }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                      {review.rating.toFixed(1)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      color: "text.primary",
                      lineHeight: 1.7,
                      fontSize: "1.05rem",
                      fontStyle: "italic",
                      opacity: 0.9,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    "{review.comment}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {totalPages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 4 }}>
          {[...Array(totalPages)].map((_, i) => (
            <Box
              key={i}
              sx={{
                width: i + 1 === page ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: i + 1 === page ? "primary.main" : alpha(theme.palette.primary.main, 0.2),
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onClick={() => setPage(i + 1)}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ReviewSection;
