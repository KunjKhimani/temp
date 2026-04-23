const axios = require("axios");

const SQUARE_ENV = (process.env.SQUARE_ENV || "sandbox").toLowerCase();
const SQUARE_BASE_URL =
  SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

const getSquareConfig = () => {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  const locationId = process.env.SQUARE_LOCATION_ID;

  return {
    accessToken,
    applicationId,
    locationId,
    isConfigured: Boolean(accessToken && applicationId && locationId),
  };
};

const getSquareHeaders = () => {
  const { accessToken } = getSquareConfig();
  if (!accessToken) {
    throw new Error("Missing SQUARE_ACCESS_TOKEN in environment.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Square-Version": "2025-10-16",
  };
};

const squareRequest = async ({ method, url, data = undefined }) => {
  try {
    const response = await axios({
      method,
      url: `${SQUARE_BASE_URL}${url}`,
      headers: getSquareHeaders(),
      data,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `[SquareService] API Error (${url}):`,
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error(`[SquareService] Request Error (${url}):`, error.message);
    }
    throw error;
  }
};

const listLocations = async () => {
  return squareRequest({ method: "GET", url: "/v2/locations" });
};

const createPayment = async ({
  sourceId,
  amount,
  currency = "USD",
  idempotencyKey,
  autocomplete = true,
  orderId,
  customerId,
  note,
  appFeeMoney,
}) => {
  if (!sourceId) throw new Error("sourceId is required.");
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest unit.");
  }
  if (!idempotencyKey) throw new Error("idempotencyKey is required.");

  const { locationId } = getSquareConfig();
  if (!locationId) throw new Error("Missing SQUARE_LOCATION_ID in environment.");

  const payload = {
    source_id: sourceId,
    idempotency_key: idempotencyKey,
    amount_money: {
      amount: Math.round(amount),
      currency,
    },
    location_id: locationId,
    autocomplete,
  };

  if (orderId) payload.order_id = orderId;
  if (customerId) payload.customer_id = customerId;
  if (note) payload.note = note;
  if (appFeeMoney) payload.app_fee_money = appFeeMoney;

  return squareRequest({
    method: "POST",
    url: "/v2/payments",
    data: payload,
  });
};

const getPayment = async (paymentId) => {
  if (!paymentId) throw new Error("paymentId is required.");
  return squareRequest({
    method: "GET",
    url: `/v2/payments/${paymentId}`,
  });
};

const completePayment = async (paymentId) => {
  if (!paymentId) throw new Error("paymentId is required.");
  return squareRequest({
    method: "POST",
    url: `/v2/payments/${paymentId}/complete`,
    data: {},
  });
};

const refundPayment = async ({
  paymentId,
  amount,
  currency = "USD",
  idempotencyKey,
  reason,
}) => {
  if (!paymentId) throw new Error("paymentId is required.");
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new Error("amount must be a positive integer in the smallest unit.");
  }
  if (!idempotencyKey) throw new Error("idempotencyKey is required.");

  const payload = {
    idempotency_key: idempotencyKey,
    payment_id: paymentId,
    amount_money: {
      amount: Math.round(amount),
      currency,
    },
  };

  if (reason) payload.reason = reason;

  return squareRequest({
    method: "POST",
    url: "/v2/refunds",
    data: payload,
  });
};

// --- CATALOG API (FOR SUBSCRIPTION PLANS) ---

const createCatalogObject = async (payload) => {
  return squareRequest({
    method: "POST",
    url: "/v2/catalog/object",
    data: payload,
  });
};

const upsertSubscriptionPlan = async ({ name, amount, frequency }) => {
  const cadence = frequency.toUpperCase() === "WEEKLY" ? "WEEKLY" : "MONTHLY";
  const idempotencyKey = `plan-${name.replace(/\s+/g, '-').toLowerCase()}-${amount}-${cadence}`;

  // We create a Subscription Plan Variation which is what the Subscription API actually uses.
  const payload = {
    idempotency_key: idempotencyKey,
    object: {
      type: "SUBSCRIPTION_PLAN_VARIATION",
      id: "#variation",
      subscription_plan_variation_data: {
        name: `${name} (${frequency})`,
        phases: [
          {
            cadence: cadence,
            recurring_price_money: {
              amount: Math.round(amount),
              currency: "USD"
            }
          }
        ],
        subscription_plan_id: "#plan"
      }
    },
    included_objects: [
      {
        type: "SUBSCRIPTION_PLAN",
        id: "#plan",
        subscription_plan_data: {
          name: name
        }
      }
    ]
  };

  return createCatalogObject(payload);
};

// --- SUBSCRIPTIONS API ---

const createSubscription = async ({ customerId, planId, locationId, startDate, idempotencyKey }) => {
  const { locationId: configLocationId } = getSquareConfig();
  const payload = {
    idempotency_key: idempotencyKey || `sub-${Date.now()}`,
    location_id: locationId || configLocationId,
    customer_id: customerId,
    plan_variation_id: planId, // Square now requires plan_variation_id
  };

  if (startDate) payload.start_date = startDate;

  return squareRequest({
    method: "POST",
    url: "/v2/subscriptions",
    data: payload,
  });
};

const getSubscription = async (subscriptionId) => {
  return squareRequest({
    method: "GET",
    url: `/v2/subscriptions/${subscriptionId}`,
  });
};

const cancelSubscription = async (subscriptionId) => {
  return squareRequest({
    method: "POST",
    url: `/v2/subscriptions/${subscriptionId}/cancel`,
    data: {},
  });
};

module.exports = {
  SQUARE_ENV,
  SQUARE_BASE_URL,
  getSquareConfig,
  listLocations,
  createPayment,
  getPayment,
  completePayment,
  refundPayment,
  createCatalogObject,
  upsertSubscriptionPlan,
  createSubscription,
  getSubscription,
  cancelSubscription,
  createSquareCustomer,
  createSquareCard,
};

async function createSquareCustomer({ email, name }) {
  return squareRequest({
    method: "POST",
    url: "/v2/customers",
    data: {
      email_address: email,
      given_name: name,
    },
  });
}

async function createSquareCard({ customerId, sourceId }) {
  return squareRequest({
    method: "POST",
    url: "/v2/cards",
    data: {
      idempotency_key: `card-${customerId}-${Date.now()}`,
      source_id: sourceId,
      card: {
        customer_id: customerId,
      },
    },
  });
}
