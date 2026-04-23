// routes/index.js (or route/index.js based on your folder name)
const express = require("express");
const userRoute = require("./user.route.js");
const authRoute = require("./auth.route.js");
const serviceRoute = require("./service.route.js");
const orderRoute = require("./order.route.js");
const productRoute = require("./product.route.js"); // << IMPORT NEW PRODUCT ROUTE
const productOrderRoute = require("./productOrder.route.js"); // << IMPORT NEW PRODUCT ORDER ROUTE
const conversationRoute = require("./conversation.route.js");
const messageRoute = require("./message.route.js");
const notificationRoute = require("./notification.route.js");
const serviceRequestRoutes = require("./serviceRequest.routes");
const subscriptionRoute = require("./subscription.route"); // Import subscription route
const requestedProductRoute = require("./requestedProduct.route.js"); // Import requested product route
const userAnalyticsRoute = require("./user.analytics.route.js"); // Import user analytics route
const conversationAnalyticsRoute = require("./conversation.analytics.route.js"); // Import conversation analytics route
const messageAnalyticsRoute = require("./message.analytics.route.js"); // Import message analytics route
const serviceRequestAnalyticsRoute = require("./serviceRequest.analytics.route.js"); // Import service request analytics route
const serviceAnalyticsRoute = require("./service.analytics.route.js"); // Import service analytics route
const productAnalyticsRoute = require("./product.analytics.route.js"); // Import product analytics route
const orderAnalyticsRoute = require("./order.analytics.route.js"); // Import order analytics route
const productOrderAnalyticsRoute = require("./productOrder.analytics.route.js"); // Import product order analytics route
const adminOrderRoute = require("./admin.order.route.js"); // Import admin order route
const adminProductRoute = require("./admin.product.route.js"); // Import admin product route
const adminRequestedProductRoute = require("./admin.requestedProduct.route.js"); // Import admin requested product route
const adminPromotionRoute = require("./admin.promotion.route.js"); // Import admin promotion settings route
const squareRoute = require("./square.route.js"); // Square integration routes
const transactionRoute = require("./transaction.route.js"); // Transaction history routes
const specialOfferRoute = require("./specialOffer.route.js"); // Special offer routes
const communityOfferRoute = require("./communityOffer.route.js"); // Community offer routes
const reviewRoute = require("./review.route.js");
const sellerCommissionOverrideRoute = require("./sellerCommissionOverride.routes.js");
const commissionPromoCodeRoute = require("./commissionPromoCode.routes.js");
const serviceSubscriptionRoute = require("./serviceSubscription.route.js");



const router = express.Router(); // Create a main router instance

// Function to initialize all routes
const initializeRoutes = (app) => {
  // Mount Stripe webhook route first, as it needs raw body
  // app.use("/api/stripe-webhook", stripeWebhookRoute); // New webhook route for order payments

  // Mount individual route groups
  app.use("/api/user", userRoute);
  app.use("/api/auth", authRoute);
  app.use("/api/service", serviceRoute);
  app.use("/api/order", orderRoute); // For service orders
  app.use("/api/product", productRoute); // For products CRUD
  app.use("/api/product-order", productOrderRoute); // For product orders CRUD
  app.use("/api/conversation", conversationRoute);
  app.use("/api/message", messageRoute);
  app.use("/api/notification", notificationRoute);
  app.use("/api/service-request", serviceRequestRoutes);
  app.use("/api/subscriptions", subscriptionRoute); // Mount subscription routes
  app.use("/api/requested-products", requestedProductRoute); // Mount requested product routes
  app.use("/api/user-analytics", userAnalyticsRoute); // Mount user analytics route
  app.use("/api/conversation-analytics", conversationAnalyticsRoute); // Mount conversation analytics route
  app.use("/api/message-analytics", messageAnalyticsRoute); // Mount message analytics route
  app.use("/api/service-request-analytics", serviceRequestAnalyticsRoute); // Mount service request analytics route
  app.use("/api/service-analytics", serviceAnalyticsRoute); // Mount service analytics route
  app.use("/api/product-analytics", productAnalyticsRoute); // Mount product analytics route
  app.use("/api/order-analytics", orderAnalyticsRoute); // Mount order analytics route
  app.use("/api/product-order-analytics", productOrderAnalyticsRoute); // Mount product order analytics route
  app.use("/api/admin/orders", adminOrderRoute); // Mount admin order routes
  app.use("/api/admin/products", adminProductRoute); // Mount admin product routes
  app.use("/api/admin/requested-products", adminRequestedProductRoute); // Mount admin requested product routes
  app.use("/api/admin/promotions", adminPromotionRoute); // Mount admin promotion settings routes
  app.use("/api/square", squareRoute); // Mount square integration routes
  app.use("/api/transactions", transactionRoute); // Mount transaction history routes
  app.use("/api/special-offers", specialOfferRoute); // Mount special offer routes
  app.use("/api/community-offers", communityOfferRoute); // Mount community offer routes
  app.use("/api/reviews", reviewRoute); // Mount review routes
  app.use("/api/admin/seller-commissions", sellerCommissionOverrideRoute); // Mount seller commission overrides
  app.use("/api/promo-codes", commissionPromoCodeRoute); // Mount commission promo codes
  app.use("/api/service-subscriptions", serviceSubscriptionRoute); // Mount service subscription routes



  // You can also define routes directly on this main router if needed
  // For example, a health check for the API
  router.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", message: "API is healthy" });
  });
  app.use("/api", router); // Mount the main router for any routes defined directly on it

  // Welcome route can still be in the main app file or here
  app.get("/", (req, res) => {
    res.send(
      "Welcome to Sparework API - Routes Initialized via routes/index.js"
    );
  });
};

module.exports = initializeRoutes;
