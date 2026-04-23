// routes/product.routes.js
const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getMyProducts, // <<<--- IMPORT THE NEW CONTROLLER
} = require("../controller/product.controller");
const { authMiddleware, sellerAuth, optionalAuth } = require("../middleware/auth.js");
const upload = require("../utils/multer");
const asyncHandler = require("express-async-handler");

// --- PRODUCT ROUTES ---

// POST /api/product - Create a new product (Seller only)
router.post(
  "/",
  asyncHandler(authMiddleware),
  upload.array("productImages", 10),
  asyncHandler(createProduct)
);

// GET /api/product/my-products - Get products for the logged-in seller (Seller only) <<<--- NEW ROUTE
router.get(
  "/my-products",
  asyncHandler(authMiddleware),
  asyncHandler(getMyProducts) // Removed sellerAuth
);

// GET /api/product/search - Search for products (Public)
router.get("/search", asyncHandler(searchProducts));

// GET /api/product - Get all products (Public, with filtering)
router.get("/", asyncHandler(getProducts));

// GET /api/product/:productId - Get a single product by ID (Public, but populates req.user if token present)
router.get("/:productId", asyncHandler(optionalAuth), asyncHandler(getProductById));

// PUT /api/product/:productId - Update a product (Seller only, owner)
router.put(
  "/:productId",
  asyncHandler(authMiddleware),
  // asyncHandler(sellerAuth),
  upload.array("productImages", 10),
  asyncHandler(updateProduct)
);

// DELETE /api/product/:productId - Delete a product (Seller only, owner)
router.delete(
  "/:productId",
  asyncHandler(authMiddleware),
  asyncHandler(sellerAuth),
  asyncHandler(deleteProduct)
);

module.exports = router;
