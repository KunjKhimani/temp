const express = require("express");
const router = express.Router();
const adminOrderController = require("../controller/admin.order.controller");
const { authMiddleware, adminAuth } = require("../middleware/auth"); // Assuming these exist

// All admin order routes will be prefixed with /api/admin/orders

// GET all orders (Admin)
router.get(
  "/",
  authMiddleware,
  adminAuth,
  adminOrderController.getAllOrdersAdmin
);

// GET order by ID (Admin)
router.get(
  "/:orderId",
  authMiddleware,
  adminAuth,
  adminOrderController.getOrderByIdAdmin
);

// PUT update order (Admin)
router.put(
  "/:orderId",
  authMiddleware,
  adminAuth,
  adminOrderController.updateOrderAdmin
);

// DELETE single order (Admin)
router.delete(
  "/:orderId",
  authMiddleware,
  adminAuth,
  adminOrderController.deleteOrderAdmin
);

// DELETE multiple orders (Admin)
router.post(
  "/bulk-delete",
  authMiddleware,
  adminAuth,
  adminOrderController.deleteMultipleOrdersAdmin
);

module.exports = router;
