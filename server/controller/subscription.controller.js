const User = require("../model/user.model");
const createError = require("../middleware/createError");
const {
  createPayment,
  completePayment,
  getPayment,
  getSquareConfig,
} = require("../utils/squareService");

const convertUsdToCents = (amountUsd) => Math.round(amountUsd * 100);

// Define your subscription plans and their prices (in USD)
const subscriptionPlans = {
  basic_account: {
    id: "basic_account",
    name: "Basic Account",
    price: 0, // Free Forever
    durationDays: 365 * 100, // Effectively forever for free accounts
    features: [
      "Up to 5 active listings",
      "Apply to 5 jobs or requests monthly",
      "Basic public profile",
      "Basic messaging",
      "Community support access",
    ],
  },
  growth_account: {
    id: "growth_account",
    name: "Growth Account",
    price: 19.9, // $19.90 USD
    durationDays: 30, // Monthly
    features: [
      "Everything in Basic",
      "Unlimited active listings",
      "Unlimited applications",
      "Advanced profile",
      "Job posting capabilities",
      "Scheduling + real-time chat/call",
      "Verified provider badge",
      "Priority search visibility",
      "Performance dashboard",
    ],
  },
  business_account: {
    id: "business_account",
    name: "Business Account",
    price: 39.9, // $39.90 USD
    durationDays: 30, // Monthly
    features: [
      "Everything in Growth",
      "Multi-user management",
      "Hiring & recruiting tools",
      "Mass job/contract posting",
      "Custom storefront or agency profile",
      "Shortlist, rate & filter applicants",
      "Dedicated account manager",
      "Priority homepage/category placement",
      "Premium support (email + chat)",
    ],
  },
};

const activateSubscription = (user, plan, startDate = new Date()) => {
  const now = startDate instanceof Date ? startDate : new Date(startDate);
  const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  user.subscription.plan = plan.id;
  user.subscription.startDate = now;
  user.subscription.endDate = endDate;
  user.subscription.isActive = true;
  user.subscription.paymentStatus = "paid";
  user.subscription.lastPaymentDate = new Date();
  user.subscription.nextBillingDate = endDate;
};

// @desc    Create Square checkout context for Subscription
// @route   POST /api/subscriptions/create-checkout-session
// @access  Private (User must be logged in)
const createSubscriptionCheckoutSession = async (req, res, next) => {
  const { planId } = req.body;
  const userId = req.user.id;

  console.log(
    `[createSubscriptionCheckoutSession] Received planId: ${planId}, userId: ${userId}`
  );

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found."));
    }

    const plan = subscriptionPlans[planId];
    if (!plan) {
      console.error(
        `[createSubscriptionCheckoutSession] Invalid planId: ${planId}`
      );
      return next(createError(400, "Invalid subscription plan selected."));
    }
    console.log(`[createSubscriptionCheckoutSession] Resolved plan:`, plan);

    if (plan.id === "basic_account") {
      activateSubscription(user, plan);
      await user.save();
      console.log(
        `[createSubscriptionCheckoutSession] User subscription after save (basic_account):`,
        user.subscription
      );
      return res.status(200).json({
        message: "Basic Account activated successfully!",
        clientSecret: "basic_account_activated", // Indicate basic account
      });
    }

    const sq = getSquareConfig();
    if (!sq.isConfigured) {
      return next(
        createError(
          500,
          "Square is not fully configured. Please set SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID and SQUARE_LOCATION_ID."
        )
      );
    }

    // Keep plan selected but do not activate until payment confirmation.
    user.subscription.plan = plan.id;
    user.subscription.isActive = false;
    user.subscription.paymentStatus = "pending";
    await user.save();

    res.status(200).json({
      clientSecret: "square_pending",
      paymentProvider: "square",
      square: {
        applicationId: sq.applicationId,
        locationId: sq.locationId,
        amount: convertUsdToCents(plan.price),
        currency: "USD",
      },
      message: "Square payment context created successfully.",
    });
  } catch (error) {
    console.error("Error in createSubscriptionCheckoutSession:", error);
    next(createError(500, "Failed to create subscription checkout session."));
  }
};

// @desc    Confirm Subscription Payment (after Square client-side tokenization)
// @route   POST /api/subscriptions/confirm-payment
// @access  Private (User must be logged in)
const confirmSubscriptionPayment = async (req, res, next) => {
  const { planId, paymentIntentId, sourceId, idempotencyKey } = req.body;
  const userId = req.user.id;

  console.log(
    `[confirmSubscriptionPayment] Received planId: ${planId}, paymentIntentId: ${paymentIntentId}, userId: ${userId}`
  );

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found."));
    }

    const plan = subscriptionPlans[planId];
    if (!plan) {
      console.error(`[confirmSubscriptionPayment] Invalid planId: ${planId}`);
      return next(createError(400, "Invalid subscription plan."));
    }
    console.log(`[confirmSubscriptionPayment] Resolved plan:`, plan);

    // Handle basic account confirmation (no payment required)
    if (plan.id === "basic_account") {
      activateSubscription(user, plan);
      await user.save();
      console.log(
        `[confirmSubscriptionPayment] User subscription after save (basic_account):`,
        user.subscription
      );
      return res
        .status(200)
        .json({ message: "Basic Account activated successfully!" });
    }

    const amountInCents = convertUsdToCents(plan.price);
    let finalPayment = null;

    if (sourceId) {
      const createResp = await createPayment({
        sourceId,
        amount: amountInCents,
        currency: "USD",
        idempotencyKey:
          idempotencyKey || `subscription-${userId}-${plan.id}-${Date.now()}`,
        autocomplete: false,
        note: `Subscription payment for ${plan.id} (${userId})`,
      });

      const createdPayment = createResp?.payment;
      if (!createdPayment?.id) {
        user.subscription.paymentStatus = "failed";
        await user.save();
        return next(createError(400, "Square payment creation failed."));
      }

      const completionResp = await completePayment(createdPayment.id);
      finalPayment = completionResp?.payment;
    } else if (paymentIntentId) {
      const fetchedResp = await getPayment(paymentIntentId);
      const fetchedPayment = fetchedResp?.payment;
      if (!fetchedPayment?.id) {
        return next(createError(400, "Invalid Square payment ID provided."));
      }

      if (fetchedPayment.status === "COMPLETED") {
        finalPayment = fetchedPayment;
      } else if (fetchedPayment.status === "APPROVED") {
        const completionResp = await completePayment(fetchedPayment.id);
        finalPayment = completionResp?.payment;
      } else {
        return next(
          createError(
            400,
            `Payment not completed. Current status: ${fetchedPayment.status}`
          )
        );
      }
    } else {
      return next(
        createError(400, "Provide either sourceId or paymentIntentId to confirm payment.")
      );
    }

    if (!finalPayment || finalPayment.status !== "COMPLETED") {
      user.subscription.paymentStatus = "failed";
      await user.save();
      return next(
        createError(
          400,
          `Payment not completed. Current status: ${finalPayment?.status || "unknown"}`
        )
      );
    }

    activateSubscription(user, plan, new Date((finalPayment.created_at && Date.parse(finalPayment.created_at)) || Date.now()));
    await user.save();

    const updatedUser = await User.findById(userId);
    res.status(200).json({
      message: "Subscription activated successfully!",
      paymentProvider: "square",
      paymentId: finalPayment.id,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in confirmSubscriptionPayment:", error);
    next(createError(500, "Failed to confirm subscription payment."));
  }
};

module.exports = {
  createSubscriptionCheckoutSession,
  confirmSubscriptionPayment,
};
