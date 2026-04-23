import { API } from "./apis";

const createReview = (payload) => API.post("/reviews", payload);

const getItemReviews = (listingId, params = {}) =>
    API.get(`/reviews/item/${listingId}`, { params });

const hasUserReviewedListing = async (listingId, reviewerId) => {
    if (!listingId || !reviewerId) return false;

    const response = await getItemReviews(listingId, {
        reviewerId,
        limit: 1,
        page: 1,
        status: "all",
    });

    return (response?.data?.data || []).length > 0;
};

const getAdminReviews = (params = {}) => API.get("/reviews/admin", { params });

const updateReviewStatus = (id, status) => API.patch(`/reviews/admin/${id}/status`, { status });

export const reviewApi = {
    createReview,
    getItemReviews,
    hasUserReviewedListing,
    getAdminReviews,
    updateReviewStatus,
};
