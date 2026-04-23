/**
 * Returns a MongoDB aggregation stage that calculates a 'sortPriority' field.
 * This is used to boost featured, promoted, and special items to the top of listings.
 * 
 * Priority criteria:
 * 1. isSpecial: true
 * 2. isCommunity: true
 * 3. promotionDetails.isPromoted: true
 * 4. "featured" or "promoted" in the tags array
 * 
 * @returns {Object} MongoDB aggregation $addFields stage
 */
const getFeaturedSortStage = () => {
  return {
    $addFields: {
      sortPriority: {
        $cond: {
          if: {
            $or: [
              { $eq: ["$isSpecial", true] },
              { $eq: ["$isCommunity", true] },
              { $eq: ["$promotionDetails.isPromoted", true] },
              { $in: ["featured", { $ifNull: ["$tags", []] }] },
              { $in: ["promoted", { $ifNull: ["$tags", []] }] }
            ]
          },
          then: 1,
          else: 0
        }
      }
    }
  };
};

module.exports = {
  getFeaturedSortStage
};
