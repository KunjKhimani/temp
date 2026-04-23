const RequestedProduct = require("../model/requestedProduct.model");
const createError = require("../middleware/createError");

// View all requested products
exports.getAllRequestedProducts = async (req, res, next) => {
  try {
    const requestedProducts = await RequestedProduct.find();
    res.status(200).json({ success: true, data: requestedProducts });
  } catch (error) {
    next(createError(500, "Failed to fetch requested products"));
  }
};

// View requested product by ID
exports.getRequestedProductById = async (req, res, next) => {
  try {
    const requestedProduct = await RequestedProduct.findById(req.params.id);
    if (!requestedProduct) {
      return next(createError(404, "Requested product not found"));
    }
    res.status(200).json({ success: true, data: requestedProduct });
  } catch (error) {
    next(createError(500, "Failed to fetch requested product"));
  }
};

// Delete a requested product
exports.deleteRequestedProduct = async (req, res, next) => {
  try {
    const requestedProduct = await RequestedProduct.findByIdAndDelete(
      req.params.id
    );
    if (!requestedProduct) {
      return next(createError(404, "Requested product not found"));
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Requested product deleted successfully",
      });
  } catch (error) {
    next(createError(500, "Failed to delete requested product"));
  }
};

// Update a requested product
exports.updateRequestedProduct = async (req, res, next) => {
  try {
    const requestedProduct = await RequestedProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!requestedProduct) {
      return next(createError(404, "Requested product not found"));
    }
    res.status(200).json({ success: true, data: requestedProduct });
  } catch (error) {
    next(createError(500, "Failed to update requested product"));
  }
};

// Multiple delete of requested products
exports.deleteMultipleRequestedProducts = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(createError(400, "Please provide an array of IDs to delete"));
    }

    const result = await RequestedProduct.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return next(
        createError(404, "No requested products found for the provided IDs")
      );
    }

    res
      .status(200)
      .json({
        success: true,
        message: `${result.deletedCount} requested products deleted successfully`,
      });
  } catch (error) {
    next(createError(500, "Failed to delete multiple requested products"));
  }
};
