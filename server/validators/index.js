const validateCommission = require("./commission.validator");
const validateRules = require("./rules.validator");
const validateFeatured = require("./featured.validator");
const validateCommunity = require("./community.validator");
const validateHomepage = require("./homepage.validator");

const validatePromotionUpdate = (data, existing) => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid payload");
  }

  if (JSON.stringify(data).length > 10000) {
    throw new Error("Payload too large");
  }

  // 🔥 ONLY VALIDATE WHAT IS SENT
  if (data.commission) validateCommission(data, existing);
  if (data.rules) validateRules(data, existing);
  if (data.featured) validateFeatured(data, existing);
  if (data.communityOffer) validateCommunity(data, existing);
  if (data.homepage) validateHomepage(data, existing);
};

module.exports = { validatePromotionUpdate };