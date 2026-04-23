import { API } from "./apis"; // Import the configured axios instance

const SUBSCRIPTION_API_BASE_URL = "/subscriptions"; // Define your base URL for subscription APIs

export const createSubscriptionCheckoutSession = async (planId) => {
  try {
    const response = await API.post(
      `${SUBSCRIPTION_API_BASE_URL}/create-checkout-session`,
      { planId }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating subscription checkout session:", error);
    throw error;
  }
};

export const confirmSubscriptionPayment = async ({
  planId,
  paymentIntentId,
  sourceId,
  idempotencyKey,
}) => {
  try {
    const response = await API.post(
      `${SUBSCRIPTION_API_BASE_URL}/confirm-payment`,
      { planId, paymentIntentId, sourceId, idempotencyKey }
    );
    return response.data;
  } catch (error) {
    console.error("Error confirming subscription payment:", error);
    throw error;
  }
};

// You might add other subscription-related API calls here, e.g.,
// export const getUserSubscriptionStatus = async () => { ... };
// export const cancelSubscription = async () => { ... };
