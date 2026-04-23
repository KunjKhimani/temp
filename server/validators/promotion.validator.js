// const expectedSortPriorityKeys = [
//   "special_deal",
//   "featured",
//   "community_offer",
//   "normal",
// ];

// /* ---------------- HELPERS ---------------- */

// const isFieldUpdated = (data, path) => {
//   return path.split(".").reduce((obj, key) => obj && obj[key], data) !== undefined;
// };

// const validatePlanArray = (plans, label) => {
//   if (!Array.isArray(plans)) {
//     throw new Error(`${label} must be an array of plan objects.`);
//   }

//   if (plans.length === 0) {
//     throw new Error(`${label} must contain at least one plan.`);
//   }

//   if (plans.length > 10) {
//     throw new Error(`${label} cannot contain more than 10 plans.`);
//   }

//   const durations = new Set();

//   plans.forEach((plan, index) => {
//     if (typeof plan !== "object" || plan === null) {
//       throw new Error(`${label}[${index}] must be an object.`);
//     }

//     if (typeof plan.price !== "number" || plan.price < 0) {
//       throw new Error(`${label}[${index}].price must be a non-negative number.`);
//     }

//     if (typeof plan.durationMonths !== "number" || plan.durationMonths <= 0) {
//       throw new Error(`${label}[${index}].durationMonths must be a positive number.`);
//     }

//     if (durations.has(plan.durationMonths)) {
//       throw new Error(`${label} durationMonths must be unique.`);
//     }
//     durations.add(plan.durationMonths);
//   });
// };

// /* ---------------- MAIN VALIDATOR ---------------- */

// const validatePromotionUpdate = (data, existingSettings) => {
//   if (!data || typeof data !== "object") {
//     throw new Error("Invalid payload");
//   }

//   // Quick size check to prevent memory exhaustion
//   if (JSON.stringify(data).length > 10000) {
//     throw new Error("Payload too large");
//   }

//   const minimumPaidPromotionFee =
//     data?.rules?.minimumPaidPromotionFee ??
//     existingSettings?.rules?.minimumPaidPromotionFee ??
//     0;

//   /* ---------------- ROOT PROTECTION ---------------- */

//   if (data?.plans) {
//     throw new Error(
//       "Root-level plans are not supported. Use featured.plans or communityOffer.plans."
//     );
//   }

//   /* ---------------- FEATURED ---------------- */

//   if (isFieldUpdated(data, "featured.plans")) {
//     validatePlanArray(data.featured.plans, "Featured plans");
//   }

//   /* ---------------- SPECIAL DEAL ---------------- */

//   if (isFieldUpdated(data, "specialDeal.activationFee")) {
//     const fee = data.specialDeal.activationFee;

//     if (typeof fee !== "number" || fee < 0) {
//       throw new Error("Special Deal activation fee must be a non-negative number.");
//     }

//     if (fee < minimumPaidPromotionFee) {
//       throw new Error(
//         "Special Deal activation fee cannot be lower than minimum paid promotion fee."
//       );
//     }
//   }

//   /* ---------------- COMMUNITY OFFER ---------------- */

//   if (isFieldUpdated(data, "communityOffer.plans")) {
//     const allowPaidBelowMin =
//       data.communityOffer.allowPaidTiersBelowMinimum ??
//       existingSettings?.communityOffer?.allowPaidTiersBelowMinimum;

//     const allowFreeTier =
//       data.communityOffer.allowFreeTier ??
//       existingSettings?.communityOffer?.allowFreeTier;

//     validatePlanArray(data.communityOffer.plans, "Community Offer plans");

//     data.communityOffer.plans.forEach((plan) => {
//       // Rule: Free tier must be exactly 0
//       if (plan.price === 0 && allowFreeTier === false) {
//         throw new Error("Free community plans are disabled.");
//       }

//       // Rule: Paid tiers must not be below minimum fee unless overridden
//       if (
//         plan.price > 0 &&
//         plan.price < minimumPaidPromotionFee &&
//         !allowPaidBelowMin
//       ) {
//         throw new Error(
//           `Community paid plan (${plan.price}) cannot be below minimum promotion fee (${minimumPaidPromotionFee}).`
//         );
//       }
//     });
//   }

//   /* ---------------- SORT PRIORITY ---------------- */

//   if (isFieldUpdated(data, "rules.sortPriority")) {
//     const sort = data.rules.sortPriority;

//     if (!Array.isArray(sort)) {
//       throw new Error("Sort priority must be an array.");
//     }

//     if (new Set(sort).size !== sort.length) {
//       throw new Error("Sort priority cannot contain duplicate values.");
//     }

//     sort.forEach((item) => {
//       if (!expectedSortPriorityKeys.includes(item)) {
//         throw new Error(`Invalid sort type: ${item}`);
//       }
//     });

//     if (sort.length !== expectedSortPriorityKeys.length) {
//        throw new Error("Sort priority must include all promotion types.");
//     }
//   }

//   /* ---------------- COMMISSION ---------------- */

//   if (data?.commission) {
//     const commission = data.commission;
//     const commissionType = commission.type ?? existingSettings?.commission?.type ?? "percentage";

//     if (!["percentage", "flat"].includes(commissionType)) {
//       throw new Error("Commission type must be percentage or flat.");
//     }

//     if (commissionType === "flat") {
//   if (
//     commission.standard ||
//     commission.featured ||
//     commission.specialDeal ||
//     commission.community
//   ) {
//     throw new Error("Cannot use percentage fields when commission type is flat.");
//   }
// }

//     // Shared Min/Max checks
//     const min = commission.minimumAmount ?? existingSettings?.commission?.minimumAmount;
//     const max = commission.maximumCap ?? existingSettings?.commission?.maximumCap;

//     if (min < 0 || max < 0) throw new Error("Commission limits cannot be negative.");
//     if (min !== undefined && max !== undefined && max < min) {
//       throw new Error("Max cap cannot be less than minimum amount.");
//     }

//     if (commissionType === "percentage") {
//       const validatePercent = (value, field) => {
//         if (value !== undefined && (typeof value !== "number" || value < 0 || value > 100)) {
//           throw new Error(`${field} must be a number between 0 and 100`);
//         }
//       };

//       // Standard & Featured
//       validatePercent(commission?.standard?.offerPercent, "Standard offerPercent");
//       validatePercent(commission?.standard?.requestPercent, "Standard requestPercent");
//       validatePercent(commission?.featured?.offerPercent, "Featured offerPercent");
//       validatePercent(commission?.featured?.requestPercent, "Featured requestPercent");

//       // Special Deal & Community
//       validatePercent(commission?.specialDeal?.offerPercent, "SpecialDeal offerPercent");
//       validatePercent(commission?.specialDeal?.requestPercent, "SpecialDeal requestPercent");
//       validatePercent(commission?.community?.lowCostPercent, "Community lowCostPercent");
//       validatePercent(commission?.community?.donation, "Community donation");

//       if (commission?.community?.free !== undefined && commission.community.free !== 0) {
//         throw new Error("Community free commission must be 0%");
//       }

//       if (commission.flatAmount > 0) {
//         throw new Error("Flat amount cannot be used in percentage mode.");
//       }
//     } else {
//       // Flat Mode
//       if (commission.flatAmount !== undefined && (typeof commission.flatAmount !== "number" || commission.flatAmount < 0)) {
//         throw new Error("Flat commission amount must be non-negative.");
//       }

//       if (commission.standard || commission.featured || commission.specialDeal || commission.community) {
//         throw new Error("Cannot use percentage fields when commission type is flat.");
//       }
//     }
//   }

//   /* ---------------- HOMEPAGE ---------------- */

//   if (isFieldUpdated(data, "homepage")) {
//     const limits = ["featuredLimit", "specialDealsLimit", "communityOffersLimit"];
//     const textFields = ["featuredSectionTitle", "specialDealsSectionTitle", "communityOffersSectionTitle"];

//     limits.forEach((key) => {
//       const val = data.homepage[key];
//       if (val !== undefined && (val < 0 || val > 100)) throw new Error(`${key} must be between 0-100`);
//     });

//     textFields.forEach((key) => {
//       const val = data.homepage[key];
//       if (val !== undefined && (typeof val !== "string" || val.trim() === "" || val.length > 100)) {
//         throw new Error(`${key} must be a non-empty string under 100 chars`);
//       }
//     });
//   }

//   /* ---------------- GLOBAL SAFETY ---------------- */

//   // Fixed: Use nullish coalescing to check logic against merged state
//   const isFeaturedEnabled = data.featured?.enabled ?? existingSettings?.featured?.enabled;
//   const isSpecialEnabled = data.specialDeal?.enabled ?? existingSettings?.specialDeal?.enabled;
//   const isCommunityEnabled = data.communityOffer?.enabled ?? existingSettings?.communityOffer?.enabled;

//   if (isFeaturedEnabled === false && isSpecialEnabled === false && isCommunityEnabled === false) {
//     throw new Error("At least one promotion must be enabled.");
//   }
// };

// module.exports = { validatePromotionUpdate };