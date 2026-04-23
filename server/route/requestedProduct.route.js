// routes/requestedProduct.routes.js
const express = require("express");
const router = express.Router();
const {
  createRequestedProduct,
  getRequestedProducts,
  getRequestedProductById,
  updateRequestedProduct,
  deleteRequestedProduct,
  searchRequestedProducts,
  getMyRequestedProducts,
} = require("../controller/requestedProduct.controller");
const { authMiddleware, adminAuth } = require("../middleware/auth.js"); // Assuming adminAuth exists
const upload = require("../utils/multer"); // For image uploads

const asyncHandler = require("express-async-handler");

// --- REQUESTED PRODUCT ROUTES ---

// POST /api/requested-products - Create a new requested product (Authenticated user)
router.post(
  "/",
  asyncHandler(authMiddleware),
  upload.array("requestedProductImages", 10), // Allow images for requested products
  asyncHandler(createRequestedProduct)
);

// GET /api/requested-products/my-requests - Get requests made by the logged-in user
router.get(
  "/my-requests",
  asyncHandler(authMiddleware),
  asyncHandler(getMyRequestedProducts)
);

// GET /api/requested-products/search - Search for requested products (Public)
router.get("/search", asyncHandler(searchRequestedProducts));

// GET /api/requested-products - Get all requested products (Public, with filtering)
router.get("/", asyncHandler(getRequestedProducts));

// GET /api/requested-products/:requestedProductId - Get a single requested product by ID (Public, auth handled in controller)
router.get("/:requestedProductId", asyncHandler(getRequestedProductById));

// PUT /api/requested-products/:requestedProductId - Update a requested product (Requester or Admin)
router.put(
  "/:requestedProductId",
  asyncHandler(authMiddleware), // User must be authenticated
  upload.array("requestedProductImages", 10),
  asyncHandler(updateRequestedProduct)
);

// DELETE /api/requested-products/:requestedProductId - Delete a requested product (Requester or Admin)
router.delete(
  "/:requestedProductId",
  asyncHandler(authMiddleware), // User must be authenticated
  asyncHandler(deleteRequestedProduct)
);

module.exports = router;
