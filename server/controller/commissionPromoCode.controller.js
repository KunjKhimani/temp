const CommissionPromoCode = require("../model/commissionPromoCode.model");
const SellerCommissionOverride = require("../model/sellerCommissionOverride.model");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// --- ADMIN CONTROLLERS ---

// Create a new promo code
const createPromoCode = asyncHandler(async (req, res) => {
  const { code, percentage, startDate, endDate, usageLimit, description } = req.body;

  if (!code || percentage === undefined || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const existing = await CommissionPromoCode.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: "Promo code already exists" });
  }

  const promoCode = await CommissionPromoCode.create({
    code,
    percentage,
    startDate,
    endDate,
    usageLimit,
    description,
    createdBy: req.user?._id,
  });

  res.status(201).json({ success: true, data: promoCode });
});

// List all promo codes with pagination and search
const getAllPromoCodes = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  const query = {};
  if (search) {
    query.code = { $regex: search, $options: "i" };
  }

  const total = await CommissionPromoCode.countDocuments(query);
  const promoCodes = await CommissionPromoCode.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({ 
    success: true, 
    data: promoCodes,
    pagination: {
      total,
      page: parseInt(page),
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// Delete a promo code
const deletePromoCode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Promo Code ID format" });
  }

  const promoCode = await CommissionPromoCode.findByIdAndDelete(id);
  
  if (!promoCode) {
    return res.status(404).json({ success: false, message: "Promo code not found" });
  }

  res.status(200).json({ success: true, message: "Promo code deleted successfully" });
});

// --- SELLER CONTROLLERS ---

// Apply a promo code to a seller
const applyPromoCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const sellerId = req.user?._id;

  if (!code) {
    return res.status(400).json({ success: false, message: "Code is required" });
  }

  const promo = await CommissionPromoCode.findOne({ code: code.toUpperCase() });
  if (!promo) {
    return res.status(404).json({ success: false, message: "Invalid promo code" });
  }

  if (!promo.isValid()) {
    return res.status(400).json({ success: false, message: "Promo code is expired or inactive" });
  }

  // Update or create the seller override
  const override = await SellerCommissionOverride.findOneAndUpdate(
    { sellerId },
    {
      percentage: promo.percentage,
      untilDate: promo.endDate,
      durationDays: null, // Promo overrides durationDays
      appliedPromoCode: promo._id,
      updatedBy: req.user?._id,
    },
    { upsert: true, new: true }
  );

  // Increment usage count
  promo.usedCount += 1;
  await promo.save();

  res.status(200).json({
    success: true,
    message: `Promo code ${promo.code} applied successfully!`,
    data: {
      percentage: promo.percentage,
      validUntil: promo.endDate,
    }
  });
});

// Toggle promo code status (Admin only)
const togglePromoCodeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid Promo Code ID format" });
  }

  const promoCode = await CommissionPromoCode.findById(id);
  if (!promoCode) {
    return res.status(404).json({ success: false, message: "Promo code not found" });
  }

  promoCode.isActive = !promoCode.isActive;
  await promoCode.save();

  res.status(200).json({ 
    success: true, 
    message: `Promo code status set to ${promoCode.isActive ? "ACTIVE" : "INACTIVE"}`,
    data: promoCode 
  });
});

module.exports = {
  createPromoCode,
  getAllPromoCodes,
  deletePromoCode,
  applyPromoCode,
  togglePromoCodeStatus,
};
