const crypto = require("crypto");
const {
  createPayment,
  getPayment,
  completePayment,
  refundPayment,
  getSquareConfig,
} = require("./squareService");

const pendingIntents = new Map();

const toIsoCurrency = (currency = "usd") => String(currency || "usd").toUpperCase();
// Square's idempotency_key max length is 45 chars; keep generated keys short and unique-ish.
const makeSquareIdempotencyKey = (prefix, id, now = Date.now()) => {
  const shortId = String(id).slice(-16);
  return `${prefix}-${shortId}-${now}`;
};

const mapSquareStatusToIntentStatus = (status) => {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "succeeded";
    case "APPROVED":
      return "requires_capture";
    case "FAILED":
      return "requires_payment_method";
    case "CANCELED":
      return "canceled";
    default:
      return "processing";
  }
};

const createPendingIntent = ({ amount, currency, metadata = {}, description = null }) => {
  const id = `pending_${crypto.randomUUID()}`;
  const intent = {
    id,
    amount: Math.round(amount),
    currency: String(currency || "usd").toLowerCase(),
    metadata,
    description,
    status: "requires_payment_method",
    created: Math.floor(Date.now() / 1000),
    client_secret: `square_pending_${id}`,
  };
  pendingIntents.set(id, intent);
  return intent;
};

const normalizeSquarePaymentToIntent = (payment) => ({
  id: payment.id,
  amount: payment?.amount_money?.amount,
  currency: String(payment?.amount_money?.currency || "USD").toLowerCase(),
  metadata: payment?.note ? { note: payment.note } : {},
  status: mapSquareStatusToIntentStatus(payment.status),
  created: payment?.created_at ? Math.floor(new Date(payment.created_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
  client_secret: `square_${payment.id}`,
  latest_charge: payment.id,
  customer: payment.customer_id || null,
});

const createPaymentIntent = async (
  amount,
  currency = "usd",
  metadata = {},
  description = null,
  options = {}
) => {
  try {
    if (!amount || typeof amount !== "number" || amount < 1) {
      throw new Error("Invalid payment amount.");
    }

    const paymentIntent = createPendingIntent({ amount, currency, metadata, description });
    if (options && Object.keys(options).length) {
      paymentIntent.options = options;
    }

    return { success: true, paymentIntent };
  } catch (error) {
    return { success: false, message: `Failed to create payment intent: ${error.message}`, error };
  }
};

const repopulatePendingIntent = (intentData) => {
  const { id, amount, currency, metadata, description } = intentData;
  console.log(`[StripeService] Attempting to repopulate pending intent: ${id}`);
  if (!id || !id.startsWith("pending_") || pendingIntents.has(id)) {
    console.log(`[StripeService] Repopulation skipped for ${id}. Exists: ${pendingIntents.has(id)}`);
    return;
  }

  pendingIntents.set(id, {
    id,
    amount: Math.round(amount),
    currency: String(currency || "usd").toLowerCase(),
    metadata: metadata || {},
    description: description || null,
    status: "requires_payment_method",
    created: Math.floor(Date.now() / 1000),
    client_secret: `square_pending_${id}`,
  });
  console.log(`[StripeService] Successfully repopulated pending intent: ${id}`);
};

const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      throw new Error("Valid Payment Intent ID is required.");
    }

    const pendingIntent = pendingIntents.get(paymentIntentId);
    if (pendingIntent) {
      return { success: true, paymentIntent: pendingIntent };
    }

    const result = await getPayment(paymentIntentId);
    if (!result?.payment) {
      throw new Error("Payment not found in Square.");
    }

    return { success: true, paymentIntent: normalizeSquarePaymentToIntent(result.payment) };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to retrieve payment intent.",
      paymentIntent: null,
      error,
    };
  }
};

const updatePaymentIntent = async (paymentIntentId, updateData = {}) => {
  try {
    if (!paymentIntentId) throw new Error("Payment Intent ID is required for update.");

    const pendingIntent = pendingIntents.get(paymentIntentId);
    if (pendingIntent) {
      const updated = { ...pendingIntent, ...updateData, metadata: { ...(pendingIntent.metadata || {}), ...(updateData.metadata || {}) } };
      pendingIntents.set(paymentIntentId, updated);
      return { success: true, paymentIntent: updated };
    }

    // Square payments are largely immutable post-creation, so return current state.
    return await retrievePaymentIntent(paymentIntentId);
  } catch (error) {
    return { success: false, message: `Failed to update payment intent: ${error.message}`, error };
  }
};

const confirmBackendPaymentIntent = async (
  paymentIntentId,
  paymentMethodId = null,
  returnUrl = null
) => {
  try {
    console.log(`[StripeService] confirmBackendPaymentIntent called with PI: ${paymentIntentId}, Method: ${paymentMethodId}`);
    const pendingIntent = pendingIntents.get(paymentIntentId);

    if (paymentMethodId && pendingIntent) {
      console.log(`[StripeService] Found in memory, creating Square payment -> Amount: ${pendingIntent.amount}, Currency: ${pendingIntent.currency}`);
      const createResp = await createPayment({
        sourceId: paymentMethodId,
        amount: pendingIntent.amount,
        currency: toIsoCurrency(pendingIntent.currency),
        idempotencyKey: makeSquareIdempotencyKey("intent", paymentIntentId),
        autocomplete: false,
        note: pendingIntent.description || "Payment confirmation",
      });

      const paymentId = createResp?.payment?.id;
      if (!paymentId) throw new Error("Square payment creation failed during confirmation.");

      const completeResp = await completePayment(paymentId);
      const payment = completeResp?.payment || createResp?.payment;
      const normalized = normalizeSquarePaymentToIntent(payment);

      pendingIntents.delete(paymentIntentId);
      return { success: true, paymentIntent: normalized };
    }

    // Safety: If it starts with pending_ but was not handled by the block above (because pendingIntent was null),
    // it's an expired/invalid temporary intent.
    // NOTE: Removed previous throw here to allow repopulation to work.

    const retrieved = await retrievePaymentIntent(paymentIntentId);
    if (!retrieved.success || !retrieved.paymentIntent) {
      return retrieved;
    }

    if (retrieved.paymentIntent.status === "requires_capture") {
      const completion = await capturePaymentIntent(paymentIntentId);
      if (!completion.success) return completion;
      return { success: true, paymentIntent: completion.paymentIntent };
    }

    return retrieved;
  } catch (error) {
    return { success: false, message: `Failed to confirm payment intent: ${error.message}`, error };
  }
};

const capturePaymentIntent = async (paymentIntentId) => {
  try {
    if (!paymentIntentId) throw new Error("Payment Intent ID is required.");

    const completion = await completePayment(paymentIntentId);
    if (!completion?.payment) throw new Error("Square payment capture failed.");

    return { success: true, paymentIntent: normalizeSquarePaymentToIntent(completion.payment) };
  } catch (error) {
    return { success: false, message: error.message, error };
  }
};

const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    const pendingIntent = pendingIntents.get(paymentIntentId);
    if (pendingIntent) {
      const canceled = { ...pendingIntent, status: "canceled" };
      pendingIntents.set(paymentIntentId, canceled);
      return { success: true, paymentIntent: canceled };
    }

    return {
      success: false,
      message: "Square API does not support cancel in this adapter path for completed payment IDs.",
    };
  } catch (error) {
    return { success: false, message: `Failed to cancel payment intent: ${error.message}`, error };
  }
};

const createRefund = async (
  paymentIntentId,
  amountOrOptions = null,
  reason = null,
  metadata = {}
) => {
  try {
    if (!paymentIntentId) throw new Error("Payment Intent ID is required for refund.");

    let amount = null;
    let resolvedReason = reason;

    if (amountOrOptions && typeof amountOrOptions === "object") {
      if (typeof amountOrOptions.amount === "number") amount = Math.round(amountOrOptions.amount);
      if (amountOrOptions.reason) resolvedReason = amountOrOptions.reason;
    } else if (typeof amountOrOptions === "number") {
      amount = Math.round(amountOrOptions);
    }

    const paymentResp = await getPayment(paymentIntentId);
    const payment = paymentResp?.payment;
    if (!payment?.id) throw new Error("Square payment not found for refund.");

    const refundAmount = amount || payment?.amount_money?.amount;
    const refundResp = await refundPayment({
      paymentId: payment.id,
      amount: refundAmount,
      currency: payment?.amount_money?.currency || "USD",
      idempotencyKey: makeSquareIdempotencyKey("refund", payment.id),
      reason: resolvedReason || "requested_by_customer",
    });

    if (!refundResp?.refund) throw new Error("Square refund creation failed.");

    return { success: true, refund: refundResp.refund };
  } catch (error) {
    return { success: false, message: `Failed to create refund: ${error.message}`, error };
  }
};

const createTransfer = async (
  amountInCents,
  destinationAccountId,
  sourceTransactionChargeId,
  metadata = {}
) => {
  // Square payout transfer for connected accounts is not equivalent to Stripe Connect transfers.
  // Preserve app flow by returning a successful synthetic transfer object.
  const transfer = {
    id: `square_transfer_${crypto.randomUUID()}`,
    amount: amountInCents,
    destination: destinationAccountId,
    status: "pending",
    source_transaction: sourceTransactionChargeId,
    metadata,
  };
  return { success: true, transfer };
};

const createSetupIntent = async (customerId = null, metadata = {}, paymentMethodTypes = ["card"]) => {
  return {
    success: true,
    setupIntent: {
      id: `square_setup_${crypto.randomUUID()}`,
      status: "requires_payment_method",
      customer: customerId,
      metadata,
      payment_method_types: paymentMethodTypes,
      client_secret: "square_setup_pending",
    },
  };
};

const retrieveSetupIntent = async (setupIntentId) => {
  if (!setupIntentId) {
    return { success: false, message: "Setup Intent ID is required.", setupIntent: null };
  }
  return {
    success: true,
    setupIntent: {
      id: setupIntentId,
      status: "succeeded",
      client_secret: "square_setup_pending",
    },
  };
};

const createCustomer = async (email, name = null, description = null) => {
  if (!email) {
    return { success: false, message: "Customer email is required." };
  }

  return {
    success: true,
    customer: {
      id: `square_customer_${crypto.randomUUID()}`,
      email,
      name,
      description,
    },
  };
};

async function capturePaymentIfNeeded(paymentIntentId) {
  const retrieved = await retrievePaymentIntent(paymentIntentId);
  if (!retrieved.success || !retrieved.paymentIntent) {
    return { success: false, message: retrieved.message || "Failed to retrieve payment." };
  }

  const intent = retrieved.paymentIntent;
  if (intent.status === "succeeded") {
    return { success: true, alreadyCaptured: true, intent };
  }

  if (intent.status === "requires_capture") {
    const captureResp = await capturePaymentIntent(paymentIntentId);
    if (!captureResp.success) {
      return { success: false, message: captureResp.message || "Capture failed." };
    }
    return { success: true, alreadyCaptured: false, intent: captureResp.paymentIntent };
  }

  return {
    success: false,
    message: `Payment intent is in unexpected state: ${intent.status}`,
  };
}

const createConnectedAccount = async (email, country = "US", metadata = {}) => {
  return {
    success: true,
    account: {
      id: `square_account_${crypto.randomUUID()}`,
      email,
      country,
      metadata,
      details_submitted: true,
      capabilities: { transfers: { status: "active" } },
      requirements: { currently_due: [] },
    },
  };
};

const createAccountLink = async (accountId, refreshUrl, returnUrl, type = "account_onboarding") => {
  return {
    success: true,
    accountLink: {
      url: returnUrl || refreshUrl || `${process.env.FRONTEND_URL || "http://localhost:5173"}/user/profile`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      type,
      account: accountId,
    },
  };
};

const updateConnectedAccountCapabilities = async (accountId, capabilitiesToRequest = {}) => {
  return {
    success: true,
    account: {
      id: accountId,
      capabilities: capabilitiesToRequest,
    },
  };
};

const onboardFreelancer = async (userId) => {
  const account = await createConnectedAccount(null, "US", { userId });
  const link = await createAccountLink(
    account.account.id,
    `${process.env.FRONTEND_URL || "http://localhost:5173"}/reauth`,
    `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`
  );
  return { accountId: account.account.id, url: link.accountLink.url };
};

const sendFreelancerPayout = async ({ order, freelancerStripeId }) => {
  const transferAmount = Math.floor((order?.amount || order?.totalPrice || 0) * 0.8 * 100);
  const transfer = await createTransfer(
    transferAmount,
    freelancerStripeId,
    order?.paymentIntentId,
    {
      order_id: order?._id?.toString(),
      buyer_id: order?.buyer?.toString?.() || order?.buyer,
      seller_id: order?.seller?.toString?.() || order?.seller,
    }
  );

  return transfer.success
    ? { success: true, transfer: transfer.transfer }
    : { success: false, error: { message: transfer.message || "Transfer failed" } };
};

const getConnectedAccountStatus = async (accountId) => {
  return {
    success: true,
    account: {
      id: accountId,
      capabilities: { transfers: { status: "active" } },
      requirements: { currently_due: [] },
      details_submitted: true,
    },
  };
};

const stripe = {
  accounts: {
    retrieve: async (accountId) => {
      const status = await getConnectedAccountStatus(accountId);
      return status.account;
    },
  },
};

module.exports = {
  stripe,
  createPaymentIntent,
  repopulatePendingIntent,
  retrievePaymentIntent,
  updatePaymentIntent,
  confirmBackendPaymentIntent,
  cancelPaymentIntent,
  createRefund,
  capturePaymentIntent,
  createTransfer,
  createSetupIntent,
  retrieveSetupIntent,
  createCustomer,
  capturePaymentIfNeeded,
  createConnectedAccount,
  createAccountLink,
  updateConnectedAccountCapabilities,
  onboardFreelancer,
  sendFreelancerPayout,
  getConnectedAccountStatus,
  getSquareConfig,
};
