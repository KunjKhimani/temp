// routes/productOrder.routes.js
const express = require("express");
const router = express.Router();
const {
  createProductOrder,
  confirmProductOrderPayment,
  getProductOrders,
  getProductOrderById,
  sellerConfirmProductOrder, // <<< IMPORT
  sellerDeclineProductOrder, // <<< IMPORT
  shipProductOrder, // <<< IMPORT
  buyerMarkOrderDelivered, // <<< IMPORT
} = require("../controller/productOrder.controller.js");
const { authMiddleware, sellerAuth } = require("../middleware/auth.js"); // Import sellerAuth
const asyncHandler = require("express-async-handler");

// --- BUYER ROUTES ---
// POST /api/product-order/create - Create a new product order
router.post(
  "/create",
  asyncHandler(authMiddleware),
  asyncHandler(createProductOrder)
);

// PUT /api/product-order/:orderId/confirm-payment - Buyer confirms payment
router.put(
  "/:orderId/confirm-payment",
  asyncHandler(authMiddleware),
  asyncHandler(confirmProductOrderPayment)
);

// GET /api/product-order - Get product orders for the logged-in user (buyer or seller view)
router.get("/", asyncHandler(authMiddleware), asyncHandler(getProductOrders));

// GET /api/product-order/:orderId - Get a single product order by ID
router.get(
  "/:orderId",
  asyncHandler(authMiddleware),
  asyncHandler(getProductOrderById)
);

// PUT /api/product-order/:orderId/delivered - Buyer marks order as delivered
router.put(
  "/:orderId/delivered",
  asyncHandler(authMiddleware),
  asyncHandler(buyerMarkOrderDelivered)
);

// --- SELLER ROUTES ---
// PUT /api/product-order/:orderId/seller-confirm - Seller confirms order
router.put(
  "/:orderId/seller-confirm",
  asyncHandler(authMiddleware),
  asyncHandler(sellerAuth), // <<< Seller specific
  asyncHandler(sellerConfirmProductOrder)
);

// PUT /api/product-order/:orderId/seller-decline - Seller declines order
router.put(
  "/:orderId/seller-decline",
  asyncHandler(authMiddleware),
  asyncHandler(sellerAuth), // <<< Seller specific
  asyncHandler(sellerDeclineProductOrder)
);

// PUT /api/product-order/:orderId/ship - Seller ships order
router.put(
  "/:orderId/ship",
  asyncHandler(authMiddleware),
  asyncHandler(sellerAuth), // <<< Seller specific
  asyncHandler(shipProductOrder)
);

module.exports = router;
