const validateCommunity = (data, existing) => {
  const community = data.communityOffer;
  if (!community) return;

  const minFee =
    existing?.rules?.minimumPaidPromotionFee ?? 0;

  if (community.plans) {
    if (!Array.isArray(community.plans) || community.plans.length === 0) {
      throw new Error("Community plans must be a non-empty array.");
    }

    community.plans.forEach((plan) => {
      if (plan.price < 0) {
        throw new Error("Community plan price cannot be negative.");
      }

      if (plan.price > 0 && plan.price < minFee) {
        throw new Error("Community paid plan below minimum fee.");
      }
    });
  }
};

module.exports = validateCommunity;