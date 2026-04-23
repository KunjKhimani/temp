const mongoose = require("mongoose");
const Order = require("../model/order.model");
const createError = require("../middleware/createError");

// Admin: Get all orders
exports.getAllOrdersAdmin = async (req, res, next) => {
  try {
    // The isAdmin check will be handled by middleware on the route
    const orders = await Order.find()
      .populate({
        path: "service",
        select: "title price priceType type media",
        populate: {
          path: "createdBy",
          select:
            "name profilePicture accountType companyName representativeName",
        },
      })
      .populate(
        "buyer",
        "name email profilePicture accountType companyName representativeName"
      )
      .populate(
        "seller",
        "name email profilePicture accountType companyName representativeName"
      )
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(orders);
  } catch (error) {
    console.error(
      "Admin: Error fetching all orders:",
      error.message,
      error.stack
    );
    next(createError(500, "Failed to retrieve all orders."));
  }
};

// Admin: Get order by ID
exports.getOrderByIdAdmin = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createError(400, "Invalid Order ID format."));
    }
    const order = await Order.findById(orderId)
      .populate({
        path: "service",
        select:
          "title price priceType type media category subcategory createdBy availabilityType availableTimeSlots availabilityInfo",
        populate: {
          path: "createdBy",
          select:
            "name email companyName representativeName accountType profilePicture",
        },
      })
      .populate(
        "buyer",
        "name email profilePicture accountType companyName representativeName"
      )
      .populate(
        "seller",
        "name email profilePicture accountType companyName representativeName stripeAccountId"
      )
      .lean();

    if (!order) {
      return next(createError(404, "Order not found."));
    }
    res.status(200).json(order);
  } catch (error) {
    console.error(
      `Admin: Error fetching order by ID (${req.params?.orderId}):`,
      error.message,
      error.stack
    );
    next(createError(500, "Failed to retrieve order by ID."));
  }
};

// Admin: Update order
exports.updateOrderAdmin = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createError(400, "Invalid Order ID format."));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return next(createError(404, "Order not found."));
    }
    res
      .status(200)
      .json({ message: "Order updated successfully.", order: updatedOrder });
  } catch (error) {
    console.error(
      `Admin: Error updating order (${req.params?.orderId}):`,
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((el) => el.message);
      return next(
        createError(400, messages.join(". ") || "Order validation failed.")
      );
    }
    next(createError(500, "Failed to update order."));
  }
};

// Admin: Delete single order
exports.deleteOrderAdmin = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createError(400, "Invalid Order ID format."));
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return next(createError(404, "Order not found."));
    }
    res.status(200).json({ message: "Order deleted successfully." });
  } catch (error) {
    console.error(
      `Admin: Error deleting order (${req.params?.orderId}):`,
      error.message,
      error.stack
    );
    next(createError(500, "Failed to delete order."));
  }
};

// Admin: Delete multiple orders
exports.deleteMultipleOrdersAdmin = async (req, res, next) => {
  try {
    const { ids } = req.body; // Expecting an array of IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(
        createError(400, "Please provide an array of order IDs to delete.")
      );
    }

    // Validate all IDs are valid ObjectIds
    if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return next(createError(400, "One or more provided IDs are invalid."));
    }

    const result = await Order.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return next(createError(404, "No orders found with the provided IDs."));
    }
    res
      .status(200)
      .json({ message: `${result.deletedCount} orders deleted successfully.` });
  } catch (error) {
    console.error(
      "Admin: Error deleting multiple orders:",
      error.message,
      error.stack
    );
    next(createError(500, "Failed to delete multiple orders."));
  }
};
