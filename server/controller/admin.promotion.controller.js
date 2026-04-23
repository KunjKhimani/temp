const {
  ensureSettings,
  updateSettings,
  getHistory,
} = require("../services/promotion.service");
const { validatePromotionUpdate } = require("../validators");

const adminGetPromotionSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching promotion settings:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load promotion settings." });
  }
};

const adminUpdatePromotionSettings = async (req, res) => {
  console.log("🔥 RECEIVED BODY:", req.body);
console.log("🔥 COMMISSION:", req.body.commission);
  try {
    const payload = req.body || {};
    const adminId = req.user._id.toString();

    const currentSettings = await ensureSettings();
    validatePromotionUpdate(payload, currentSettings);

    const updatedSettings = await updateSettings(payload, adminId, payload.notes);
    return res.status(200).json({ success: true, data: updatedSettings });
  } catch (error) {
    console.error("Error updating promotion settings:", error.message);
    return res.status(400).json({ success: false, message: error.message || "Failed to update promotion settings." });
  }
};

const adminGetPromotionHistory = async (req, res) => {
  try {
    const history = await getHistory();
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Error fetching promotion history:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load promotion history." });
  }
};

const adminGetSubcategoryCommission = async (req, res) => {
  try {
    const { subcategory } = req.query;
    const settings = await ensureSettings();
    const communityConfig = settings.commission?.community;
    
    if (!communityConfig) {
      return res.status(404).json({ success: false, message: "Community commission settings not found." });
    }

    // 1. If NO subcategory is provided, return all configured subcategory commissions
    if (!subcategory) {
      return res.status(200).json({ 
        success: true, 
        globalRate: communityConfig.lowCostPercent ?? 0,
        allSubcategoryCommissions: communityConfig.subcategoryCommissions || []
      });
    }

    // 2. Otherwise, look for the specific subcategory commission
    let subCommission = null;
    if (communityConfig.subcategoryCommissions) {
      subCommission = communityConfig.subcategoryCommissions.find(
        (sc) => sc.subcategory.trim().toLowerCase() === subcategory.trim().toLowerCase()
      );
    }

    // 3. Return specific rate or fallback to global community rate
    if (subCommission && subCommission.lowCostPercent !== 0) {
      return res.status(200).json({ 
        success: true, 
        subcategory: subCommission.subcategory, 
        commission: subCommission.lowCostPercent,
        type: 'specific'
      });
    } else {
      return res.status(200).json({ 
        success: true, 
        subcategory: subcategory, 
        commission: communityConfig.lowCostPercent ?? 0,
        type: 'global'
      });
    }
  } catch (error) {
    console.error("Error fetching subcategory commission:", error.message);
    return res.status(500).json({ success: false, message: "Failed to load subcategory commission." });
  }
};

module.exports = {
  adminGetPromotionSettings,
  adminUpdatePromotionSettings,
  adminGetPromotionHistory,
  adminGetSubcategoryCommission,
};