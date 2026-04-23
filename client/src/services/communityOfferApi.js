// src/services/communityOfferApi.js
import { API } from "./apis";

/**
 * Fetches community offers with optional type filtering and pagination.
 * 
 * @param {Object} queryParams - Query parameters for the request.
 * @param {string} [queryParams.type] - The type of offer to fetch ('ServiceRequest' or 'RequestedProduct').
 * @param {number} [queryParams.page=1] - The page number to fetch.
 * @param {number} [queryParams.limit=12] - The number of offers per page.
 * @returns {Promise<Object>} - A promise that resolves to the API response.
 */
const getCommunityOffers = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/community-offers?${params.toString()}`);
};

const updateCommunityOffer = (itemType, id, updatedFields) => {
  return API.patch(`/community-offers/${itemType}/${id}`, updatedFields);
};

export const communityOfferApi = {
  getCommunityOffers,
  updateCommunityOffer,
};
