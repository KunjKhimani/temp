const mongoose = require("mongoose");

// Mock Env Vars to avoid FATAL ERROR in sendEmail.js
process.env.EMAIL_HOST = "localhost";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_USERNAME = "test";
process.env.EMAIL_PASSWORD = "test";
process.env.EMAIL_FROM_ADDRESS = "test@test.com";
process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = "test";

const Order = require("../model/order.model");
const ServiceSubscription = require("../model/serviceSubscription.model");
const Service = require("../model/service.model");
const User = require("../model/user.model");
const { squareWebhookHandler } = require("../controller/stripeWebhook.controller");

async function verifyWebhookOrderCreation() {
  console.log("Starting Webhook Order Creation Verification...");

  // 1. Setup Mock Data

  const buyer = await User.create({
    email: `buyer-${Date.now()}@test.com`,
    password: "password123",
    name: "Test Buyer"
  });

  const seller = await User.create({
    email: `seller-${Date.now()}@test.com`,
    password: "password123",
    name: "Test Seller",
    isSeller: true
  });

  const service = await Service.create({
    title: "Recurring Lawn Mowing",
    description: "Weekly grass cutting",
    price: 50,
    priceType: "per project",
    type: "on-site",
    availabilityType: "flexible",
    availabilityInfo: "Mon-Fri 9-5",
    createdBy: seller._id,
    isSubscriptionEnabled: true,
    subscriptionFrequencies: ["weekly"]
  });

  const sub = await ServiceSubscription.create({
    buyer: buyer._id,
    seller: seller._id,
    service: service._id,
    squareSubscriptionId: "sub_123456789",
    squareCustomerId: "cust_12345",
    squareCatalogPlanId: "plan_12345",
    frequency: "weekly",
    amount: 50
  });

  console.log("Mock data created. Subscription ID:", sub._id);

  // 2. Mock Webhook Event
  const mockReq = {
    headers: { "x-square-hmacsha256-signature": "dummy" },
    body: {
      type: "invoice.payment_succeeded",
      data: {
        object: {
          invoice: {
            id: "inv_abc123",
            subscription_id: "sub_123456789",
            next_payment_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      }
    }
  };


  const mockRes = {
    status: (code) => ({
      send: (msg) => console.log(`Response status: ${code}, message: ${msg}`),
      json: (data) => console.log(`Response status: ${code}, JSON:`, data)
    })
  };

  // Mock verifySquareSignature to always return true
  const stripeWebhookController = require("../controller/stripeWebhook.controller");
  // This is tricky because it's a private function in the controller.
  // But wait, the controller exports squareWebhookHandler.
  // I'll just mock the verification in the test.
  
  console.log("Simulating webhook call...");
  
  // We need to bypass signature check for the test
  process.env.SQUARE_WEBHOOK_SIGNATURE_KEY = ""; 

  await squareWebhookHandler(mockReq, mockRes);

  // 3. Verify Order Creation
  const newOrder = await Order.findOne({ subscriptionId: sub._id });
  if (newOrder) {
    console.log("✅ SUCCESS: Recurring Order Created!");
    console.log("Order Details:", {
      id: newOrder._id,
      status: newOrder.status,
      totalPrice: newOrder.totalPrice,
      isRecurring: newOrder.isRecurring
    });
  } else {
    console.error("❌ FAIL: Recurring Order NOT Created.");
  }

  // Cleanup
  await User.deleteOne({ _id: buyer._id });
  await User.deleteOne({ _id: seller._id });
  await Service.deleteOne({ _id: service._id });
  await ServiceSubscription.deleteOne({ _id: sub._id });
  await Order.deleteOne({ subscriptionId: sub._id });
}

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/sparework").then(() => {
  verifyWebhookOrderCreation().then(() => mongoose.disconnect());
});
