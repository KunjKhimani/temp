// src/services/serviceRequestApi.js
import { API } from "./apis"; // Your configured Axios instance

// --- Buyer Actions ---
const createServiceRequest = (serviceRequestFormData) => {
  return API.post("/service-request/create", serviceRequestFormData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const getMyServiceRequests = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/service-request/my-requests?${params.toString()}`);
};

const updateServiceRequest = (requestId, serviceRequestFormData) => {
  return API.put(`/service-request/${requestId}`, serviceRequestFormData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const deleteServiceRequest = (requestId) => {
  return API.delete(`/service-request/${requestId}`);
};

const closeServiceRequest = (requestId) => {
  return API.put(`/service-request/${requestId}/status/close`);
};

const inviteProvidersToRequest = (requestId, providerIdsArray) => {
  return API.post(`/service-request/${requestId}/invite-providers`, {
    providerIds: providerIdsArray,
  });
};

const buyerAcceptOffer = (requestId, offerId, data = {}) => {
  return API.put(
    `/service-request/${requestId}/offers/${offerId}/accept`,
    data
  );
};

// UPDATED: buyerRejectOffer to include rejectionReason
const buyerRejectOffer = (requestId, offerId, data = {}) => {
  // data should include { rejectionReason: "..." }
  return API.put(
    `/service-request/${requestId}/offers/${offerId}/reject`,
    data
  );
};

// NEW: Buyer submits a counter-offer
const buyerSubmitCounterOffer = (requestId, offerId, counterOfferData) => {
  // counterOfferData: { price, priceType, deliveryTime, message }
  return API.post(
    `/service-request/${requestId}/offers/${offerId}/counter`,
    counterOfferData
  );
};

// NEW: Seller responds to a counter-offer
const sellerRespondToCounterOffer = (requestId, offerId, responseData) => {
  // responseData: { accepted: boolean, sellerResponseMessage?: string }
  return API.post(
    `/service-request/${requestId}/offers/${offerId}/respond-counter`,
    responseData
  );
};

const setServiceRequestSchedule = (requestId, schedulePayload) => {
  // schedulePayload will now contain:
  // { action: 'propose'/'confirm', proposedDate?, proposedTimeSlot?, specificTimeDetails?, notes? }
  return API.post(`/service-request/${requestId}/schedule`, schedulePayload);
};

const markRequestInProgress = (requestId) => {
  return API.put(`/service-request/${requestId}/status/in-progress`);
};

const markRequestCompletedByParty = (requestId, partyData = {}) => {
  return API.put(`/service-request/${requestId}/status/complete`, partyData);
};

// NEW: Initiate payment for a service request
const initiateServiceRequestPayment = (requestId) => {
  return API.post(`/service-request/${requestId}/initiate-payment`);
};

// NEW: Request a refund for a service request
const requestServiceRefund = (requestId, refundData) => {
  return API.post(`/service-request/${requestId}/request-refund`, refundData);
};

// --- Public/Seller Actions ---
const getOpenServiceRequests = (queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/service-request?${params.toString()}`);
};

const getServiceRequestById = (requestId) => {
  return API.get(`/service-request/${requestId}/detail`);
};

const getOffersForRequest = (requestId, queryParams = {}) => {
  const params = new URLSearchParams(queryParams);
  return API.get(`/service-request/${requestId}/offers?${params.toString()}`);
};

const submitOffer = (requestId, offerData) => {
  return API.post(`/service-request/${requestId}/offers`, offerData);
};

// --- Promotion Payment Related ---
const confirmPromotionPayment = (
  serviceRequestId,
  paymentIntentId,
  sourceId,
  idempotencyKey
) => {
  return API.post(`/service-request/${serviceRequestId}/confirm-promotion`, {
    paymentIntentId,
    sourceId,
    idempotencyKey,
  });
};
const verifyPromotionPayment = (paymentIntentId, clientSecret) => {
  return API.post(`/service-request/payment/verify-promotion`, {
    paymentIntentId,
    clientSecret,
  });
};

// NEW: Confirm payment for a service request
const confirmServicePayment = (requestId, paymentData) => {
  return API.post(`/service-request/${requestId}/confirm-payment`, {
    ...paymentData,
  });
};

// NEW: Dispute a service request
const disputeServiceRequest = (requestId) => {
  return API.post(`/service-request/${requestId}/dispute`);
};

export const serviceRequestApi = {
  createServiceRequest,
  getMyServiceRequests,
  updateServiceRequest,
  deleteServiceRequest,
  getOpenServiceRequests,
  getServiceRequestById,
  confirmPromotionPayment,
  verifyPromotionPayment,
  inviteProvidersToRequest,
  getOffersForRequest,
  submitOffer,
  buyerAcceptOffer,
  buyerRejectOffer, // Updated signature if data always passed
  buyerSubmitCounterOffer, // NEW
  sellerRespondToCounterOffer, // NEW
  setServiceRequestSchedule,
  markRequestInProgress,
  markRequestCompletedByParty,
  closeServiceRequest,
  initiateServiceRequestPayment, // Add new API call
  requestServiceRefund, // Add new API call
  confirmServicePayment, // Add new API call
  disputeServiceRequest, // Add new API call
};
