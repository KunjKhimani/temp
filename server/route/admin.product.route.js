const express = require("express");
const {
  adminGetProducts,
  adminGetProductById,
  adminUpdateProduct,
  adminDeleteProduct,
  adminDeleteMultipleProducts,
} = require("../controller/admin.product.controller");
const { adminAuth, authMiddleware } = require("../middleware/auth"); // Assuming you have auth middleware

const router = express.Router();

// Protect all admin product routes with authentication and authorization for 'admin' role
router.use(authMiddleware);
router.use(adminAuth); // Ensure only users with 'admin' role can access these routes

// GET all products (for admin)
router.get("/", adminGetProducts);

// GET single product by ID (for admin)
router.get("/:productId", adminGetProductById);

// UPDATE product by ID (for admin)
router.put("/:productId", adminUpdateProduct);

// DELETE product by ID (for admin)
router.delete("/:productId", adminDeleteProduct);

// DELETE multiple products by IDs (for admin)
router.post("/multiple-delete", adminDeleteMultipleProducts); // Using POST for body with IDs

module.exports = router;
