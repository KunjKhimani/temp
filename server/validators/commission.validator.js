const validateCommission = (data, existing) => {
  const commission = data.commission;
  if (!commission) return;

  const type = commission.type ?? existing?.commission?.type ?? "percentage";

  if (!["percentage", "flat"].includes(type)) {
    throw new Error("Commission type must be percentage or flat.");
  }

  const min = commission.minimumAmount ?? existing?.commission?.minimumAmount;
  const max = commission.maximumCap ?? existing?.commission?.maximumCap;

  if (min < 0 || max < 0) {
    throw new Error("Commission limits cannot be negative.");
  }

  if (min !== undefined && max !== undefined && max < min) {
    throw new Error("Max cap cannot be less than minimum amount.");
  }

  if (type === "flat") {
    if (
      commission.standard ||
      commission.featured ||
      commission.specialDeal ||
      commission.community
    ) {
      throw new Error("Cannot use percentage fields when commission type is flat.");
    }

    if (
      commission.flatAmount !== undefined &&
      (typeof commission.flatAmount !== "number" || commission.flatAmount < 0)
    ) {
      throw new Error("Flat commission amount must be non-negative.");
    }
  }

  if (type === "percentage") {
    const validatePercent = (value, field) => {
      if (
        value !== undefined &&
        (typeof value !== "number" || value < 0 || value > 100)
      ) {
        throw new Error(`${field} must be between 0 and 100`);
      }
    };

    validatePercent(commission?.standard?.offerPercent, "Standard offerPercent");
    validatePercent(commission?.standard?.requestPercent, "Standard requestPercent");

    validatePercent(commission?.featured?.offerPercent, "Featured offerPercent");
    validatePercent(commission?.featured?.requestPercent, "Featured requestPercent");

    validatePercent(commission?.specialDeal?.offerPercent, "SpecialDeal offerPercent");
    validatePercent(commission?.specialDeal?.requestPercent, "SpecialDeal requestPercent");

    validatePercent(commission?.community?.lowCostPercent, "Community lowCostPercent");
    validatePercent(commission?.community?.donation, "Community donation");

    if (
      commission?.community?.free !== undefined &&
      commission.community.free !== 0
    ) {
      throw new Error("Community free commission must be 0%");
    }

    if (Array.isArray(commission?.community?.subcategoryCommissions)) {
      commission.community.subcategoryCommissions.forEach((sc, idx) => {
        if (!sc.subcategory || typeof sc.subcategory !== "string") {
          throw new Error(`Subcategory is required for community subcategory commission at index ${idx}`);
        }
        validatePercent(sc.lowCostPercent, `Community subcategory ${sc.subcategory} lowCostPercent`);
      });
    }

    if (commission.flatAmount > 0) {
      throw new Error("Flat amount cannot be used in percentage mode.");
    }
  }
};

module.exports = validateCommission;