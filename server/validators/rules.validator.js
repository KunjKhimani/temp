const expectedSortPriorityKeys = [
  "special_deal",
  "featured",
  "community_offer",
  "normal",
];

const validateRules = (data, existing) => {
  const rules = data.rules;
  if (!rules) return;

  const minFee =
    rules.minimumPaidPromotionFee ??
    existing?.rules?.minimumPaidPromotionFee ??
    0;

  if (minFee < 0) {
    throw new Error("Minimum paid promotion fee cannot be negative.");
  }

  if (rules.sortPriority) {
    const sort = rules.sortPriority;

    if (!Array.isArray(sort)) {
      throw new Error("Sort priority must be an array.");
    }

    if (new Set(sort).size !== sort.length) {
      throw new Error("Sort priority cannot contain duplicate values.");
    }

    sort.forEach((item) => {
      if (!expectedSortPriorityKeys.includes(item)) {
        throw new Error(`Invalid sort type: ${item}`);
      }
    });

    if (sort.length !== expectedSortPriorityKeys.length) {
      throw new Error("Sort priority must include all promotion types.");
    }
  }
};

module.exports = validateRules;