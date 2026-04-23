const CommunityPayment = require("../model/communityPayment.model");

/**
 * Checks if a specific item has already used a free community offer (1 month plan with 0 fee).
 * @param {string} itemId - The ID of the item to check.
 * @returns {Promise<boolean>} - True if it has been used for this item, false otherwise.
 */
const hasUsedFreeCommunityOfferForItem = async (itemId) => {
  const previousFreeOffer = await CommunityPayment.findOne({
    item: itemId,
    isFreePlan: true,
    status: "succeeded",
  });
  return !!previousFreeOffer;
};

module.exports = {
  hasUsedFreeCommunityOfferForItem,
};
