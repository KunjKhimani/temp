const express = require("express");
const {
  getAllRequestedProducts,
  getRequestedProductById,
  deleteRequestedProduct,
  updateRequestedProduct,
  deleteMultipleRequestedProducts,
} = require("../controller/admin.requestedProduct.controller");
const { authMiddleware, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware, adminAuth);
// Restrict all routes after this middleware to 'admin' only

router
  .route("/")
  .get(getAllRequestedProducts)
  .delete(deleteMultipleRequestedProducts);

router
  .route("/:id")
  .get(getRequestedProductById)
  .put(updateRequestedProduct)
  .delete(deleteRequestedProduct);

module.exports = router;
