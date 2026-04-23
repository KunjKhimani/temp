const Product = require("../model/product.model");
const SpecialOffer = require("../model/specialOffer.model");
const mongoose = require("mongoose");
const path = require("path"); // For constructing relative image paths

// --- ADMIN: GET ALL PRODUCTS (Admin Action, with filtering/pagination, includes all statuses) ---
const adminGetProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      priceUnit,
      status, // Admin can filter by any status
      sortBy,
      page = 1,
      limit = 12,
      searchTerm,
      sellerId,
    } = req.query;

    const query = {}; // Admin can view all products, regardless of status by default

    if (category) query.category = category;
    if (status) query.status = status; // Apply status filter if provided by admin
    if (sellerId) {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(400).json({ message: "Invalid Seller ID format." });
      }
      query.createdBy = sellerId;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (priceUnit) {
      query.priceUnit = priceUnit;
    }
    if (searchTerm) {
      query.$text = { $search: searchTerm };
    }

    const sortOptions = {};
    if (sortBy === "price_asc") sortOptions.price = 1;
    else if (sortBy === "price_desc") sortOptions.price = -1;
    else if (sortBy === "newest") sortOptions.createdAt = -1;
    else if (sortBy === "oldest") sortOptions.createdAt = 1;
    else if (sortBy === "name_asc") sortOptions.name = 1;
    else if (sortBy === "name_desc") sortOptions.name = -1;
    else if (sortBy === "stock_asc") sortOptions.stock = 1;
    else if (sortBy === "stock_desc") sortOptions.stock = -1;
    else sortOptions.createdAt = -1; // Default to newest

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate(
        "createdBy",
        "name companyName profilePicture accountType representativeName _id isVerified"
      )
      .populate("specialOffer")
      .sort(sortOptions)
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .lean();

    res.status(200).json({
      products,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
        totalItems: count,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error(
      "[adminGetProducts Controller] Error fetching products:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error fetching products." });
  }
};

// --- ADMIN: GET SINGLE PRODUCT BY ID (Admin Action) ---
const adminGetProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID format." });
    }

    const product = await Product.findById(productId)
      .populate(
        "createdBy",
        "name companyName profilePicture _id accountType representativeName isVerified"
      )
      .populate("specialOffer");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(
      `[adminGetProductById Controller] Error fetching product ${req.params.productId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error fetching product." });
  }
};

// --- ADMIN: UPDATE PRODUCT (Admin Action) ---
const adminUpdateProduct = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid Product ID format." });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const {
      name,
      description,
      price,
      priceUnit,
      category,
      stock,
      tags,
      additionalInfo,
      status, // Admin can directly set status
      existingImages,
      isSpecial,      // Special offer fields
      specialDescription,
      actualPrice,
      sellingPrice,
    } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = parseFloat(price);
    if (priceUnit) product.priceUnit = priceUnit;
    if (category) product.category = category;
    if (stock !== undefined) {
      product.stock = parseInt(stock, 10);
      // Admin can set status directly, but also auto-update based on stock if status not provided
      if (product.stock <= 0 && product.status !== "inactive") {
        // Don't override explicit 'inactive'
        product.status = "out-of-stock";
      } else if (product.stock > 0 && product.status === "out-of-stock") {
        product.status = "active";
      }
    }
    if (status) product.status = status; // Admin can explicitly set status

    if (tags) {
      try {
        product.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(product.tags)) product.tags = [product.tags];
      } catch (e) {
        product.tags = product.tags || [];
      }
    }
    if (additionalInfo !== undefined) product.additionalInfo = additionalInfo;

    // --- Special Offer Handling ---
    if (isSpecial === true || isSpecial === "true") {
      const aPrice = actualPrice !== undefined ? parseFloat(actualPrice) : (product.specialOffer ? (await SpecialOffer.findById(product.specialOffer))?.actualPrice : undefined);
      const sPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : (product.specialOffer ? (await SpecialOffer.findById(product.specialOffer))?.sellingPrice : undefined);

      if (isNaN(aPrice) || isNaN(sPrice)) {
        return res.status(400).json({
          message: "Actual price and selling price are required for special offers.",
        });
      }

      if (sPrice >= aPrice) {
        return res.status(400).json({
          message: "Selling price must be less than actual price.",
        });
      }

      let specialOffer;
      if (product.specialOffer) {
        specialOffer = await SpecialOffer.findById(product.specialOffer);
      }

      if (!specialOffer) {
        specialOffer = new SpecialOffer({
          item: product._id,
          itemType: "Product",
        });
      }

      if (specialDescription !== undefined) specialOffer.description = specialDescription;
      specialOffer.actualPrice = aPrice;
      specialOffer.sellingPrice = sPrice;
      specialOffer.priceDifference = parseFloat((aPrice - sPrice).toFixed(2));
      specialOffer.discountPercentage = Math.round(((aPrice - sPrice) / aPrice) * 100);
      specialOffer.status = "active";

      const savedOffer = await specialOffer.save();
      product.isSpecial = true;
      product.specialOffer = savedOffer._id;
      product.price = sPrice; // Update main price
    } else if (isSpecial === false || isSpecial === "false") {
      if (product.specialOffer) {
        await SpecialOffer.findByIdAndDelete(product.specialOffer);
        product.specialOffer = undefined;
      }
      product.isSpecial = false;
    }

    let currentImagePaths = product.images || [];
    if (existingImages !== undefined) {
      try {
        currentImagePaths = JSON.parse(existingImages);
        if (!Array.isArray(currentImagePaths)) currentImagePaths = [];
      } catch (e) {
        console.warn(
          "Could not parse existingImages, keeping current product images.",
          e
        );
      }
    }

    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map((file) => {
        const uploadsBaseDir = path.join(__dirname, "..", "uploads");
        const relativePath = path.relative(uploadsBaseDir, file.path);
        return relativePath.replace(/\\/g, "/");
      });
      currentImagePaths = [...currentImagePaths, ...newImagePaths];
    }

    if (currentImagePaths.length === 0) {
      return res
        .status(400)
        .json({ message: "Product must have at least one image." });
    }
    product.images = currentImagePaths.slice(0, 10);

    const updatedProduct = await product.save();
    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      `[adminUpdateProduct Controller] Error updating product ${productId}:`,
      error.message,
      error.stack
    );
    if (error.name === "ValidationError") {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res
        .status(400)
        .json({ message: "Validation Error", errors: validationErrors });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error updating product." });
  }
};

// --- ADMIN: DELETE PRODUCT (Admin Action) ---
const adminDeleteProduct = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid Product ID format." });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // TODO: Implement actual deletion of images from storage (fs.unlink or cloud storage SDK)
    // product.images.forEach(imagePath => { /* delete logic */ });

    await Product.findByIdAndDelete(productId);
    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error(
      `[adminDeleteProduct Controller] Error deleting product ${productId}:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error deleting product." });
  }
};

// --- ADMIN: DELETE MULTIPLE PRODUCTS (Admin Action) ---
const adminDeleteMultipleProducts = async (req, res) => {
  const { productIds } = req.body; // Expect an array of product IDs

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res
      .status(400)
      .json({ message: "No product IDs provided for deletion." });
  }

  const invalidIds = productIds.filter(
    (id) => !mongoose.Types.ObjectId.isValid(id)
  );
  if (invalidIds.length > 0) {
    return res
      .status(400)
      .json({ message: "One or more product IDs are invalid." });
  }

  try {
    // Admin can delete any product, no need to check createdBy
    const result = await Product.deleteMany({
      _id: { $in: productIds },
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No products found or deleted." });
    }

    res.status(200).json({
      message: `${result.deletedCount} products deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(
      `[adminDeleteMultipleProducts Controller] Error deleting multiple products:`,
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: "Internal Server Error deleting products." });
  }
};

module.exports = {
  adminGetProducts,
  adminGetProductById,
  adminUpdateProduct,
  adminDeleteProduct,
  adminDeleteMultipleProducts,
};
