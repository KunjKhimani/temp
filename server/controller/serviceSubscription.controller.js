const Service = require("../model/service.model");
const ServiceSubscription = require("../model/serviceSubscription.model");
const User = require("../model/user.model");
const { 
  upsertSubscriptionPlan, 
  createSubscription, 
  cancelSubscription, 
  createSquareCustomer, 
  createSquareCard 
} = require("../utils/squareService");

/**
 * Create a new service subscription
 */
const createServiceSubscription = async (req, res) => {
  try {
    const { serviceId, frequency, sourceId } = req.body;
    const buyerId = req.user._id;

    if (!serviceId || !frequency || !sourceId) {
      return res.status(400).json({ message: "serviceId, frequency, and sourceId are required." });
    }

    const service = await Service.findById(serviceId).populate("createdBy");
    if (!service) return res.status(404).json({ message: "Service not found." });

    if (!service.isSubscriptionEnabled) {
      return res.status(400).json({ message: "Subscriptions are not enabled for this service." });
    }

    if (!service.subscriptionFrequencies.includes(frequency)) {
      return res.status(400).json({ message: `Invalid frequency. Allowed: ${service.subscriptionFrequencies.join(", ")}` });
    }

    const sellerId = service.createdBy._id;
    const buyer = await User.findById(buyerId);

    // 1. Ensure Buyer has Square Customer ID
    let squareCustomerId = buyer.squareCustomerId;
    if (!squareCustomerId) {
      const customerResp = await createSquareCustomer({
        email: buyer.email,
        name: buyer.name
      });
      squareCustomerId = customerResp.customer.id;
      buyer.squareCustomerId = squareCustomerId;
      await buyer.save();
    }

    // 2. Link Card to Customer for Autopay
    try {
      await createSquareCard({
        customerId: squareCustomerId,
        sourceId: sourceId
      });
    } catch (cardError) {
      console.error("[ServiceSubscription] Card creation failed:", cardError.message);
      return res.status(400).json({ message: "Failed to store card for recurring payments." });
    }

    // 3. Create/Find Subscription Plan for this Service
    const planResp = await upsertSubscriptionPlan({
      name: service.title,
      amount: service.price * 100, // cents
      frequency: frequency
    });
    const planId = planResp.catalog_object.id;

    // 4. Start Square Subscription
    const subResp = await createSubscription({
      customerId: squareCustomerId,
      planId: planId,
      idempotencyKey: `sub-${buyerId}-${serviceId}-${Date.now()}`
    });

    const squareSub = subResp.subscription;

    // 5. Save in local DB
    const serviceSubscription = await ServiceSubscription.create({
      buyer: buyerId,
      seller: sellerId,
      service: serviceId,
      squareSubscriptionId: squareSub.id,
      squareCustomerId: squareCustomerId,
      squareCatalogPlanId: planId,
      frequency: frequency,
      amount: service.price,
      nextBillingDate: squareSub.next_billing_date
    });

    return res.status(201).json({
      message: "Subscription started successfully.",
      subscription: serviceSubscription
    });

  } catch (error) {
    console.error("Error creating service subscription:", error);
    return res.status(500).json({ message: error.message || "Failed to create subscription." });
  }
};

/**
 * Cancel a subscription
 */
const cancelServiceSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await ServiceSubscription.findById(id);

    if (!subscription) return res.status(404).json({ message: "Subscription not found." });

    // Ensure user is buyer or seller or admin
    const isBuyer = subscription.buyer.equals(req.user._id);
    const isSeller = subscription.seller.equals(req.user._id);
    if (!isBuyer && !isSeller && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    // Cancel in Square
    await cancelSubscription(subscription.squareSubscriptionId);

    // Update DB
    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    await subscription.save();

    return res.status(200).json({ message: "Subscription cancelled successfully." });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({ message: "Failed to cancel subscription." });
  }
};

/**
 * Get all subscriptions for a buyer
 */
const getBuyerSubscriptions = async (req, res) => {
  try {
    const subscriptions = await ServiceSubscription.find({ buyer: req.user._id })
      .populate("service", "title price")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(subscriptions);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch subscriptions." });
  }
};

/**
 * Get all subscriptions for a seller
 */
const getSellerSubscriptions = async (req, res) => {
  try {
    const subscriptions = await ServiceSubscription.find({ seller: req.user._id })
      .populate("service", "title price")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json(subscriptions);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch subscriptions." });
  }
};

module.exports = {
  createServiceSubscription,
  cancelServiceSubscription,
  getBuyerSubscriptions,
  getSellerSubscriptions
};
