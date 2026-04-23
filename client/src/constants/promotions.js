export const PROMOTION_TYPES_FRONTEND = {
  STANDARD: "standard",
  PROMOTED: "promoted",
};

export const REQUEST_TYPE_SELECTIONS = Object.freeze({
  STANDARD: "standard",
  PROMOTED_1_MONTH: "promoted_1_month",
  PROMOTED_2_MONTH: "promoted_2_month",
  PROMOTED_3_MONTH: "promoted_3_month",
  PROMOTED_6_MONTH: "promoted_6_month",
});

export const PROMOTED_DURATION_BY_SELECTION = Object.freeze({
  [REQUEST_TYPE_SELECTIONS.PROMOTED_1_MONTH]: 1,
  [REQUEST_TYPE_SELECTIONS.PROMOTED_2_MONTH]: 2,
  [REQUEST_TYPE_SELECTIONS.PROMOTED_3_MONTH]: 3,
  [REQUEST_TYPE_SELECTIONS.PROMOTED_6_MONTH]: 6,
});

export const PROMOTION_PRICING_PROFILES = Object.freeze({
  DEFAULT: "default",
  COMMUNITY_OFFERS: "community_offers",
});

export const DEFAULT_SPECIAL_DEAL_ACTIVATION_FEE = 7.99;

export const DEFAULT_REQUEST_TYPE_OPTIONS = Object.freeze([
  {
    value: REQUEST_TYPE_SELECTIONS.STANDARD,
    requestType: PROMOTION_TYPES_FRONTEND.STANDARD,
    title: "Standard Post",
    description:
      "Get proposals from skilled service providers for your project.",
    features: [
      "Max 20 direct provider invitations",
      "Receive proposals organically",
      "Standard visibility in listings",
    ],
  },
  {
    value: REQUEST_TYPE_SELECTIONS.PROMOTED_1_MONTH,
    requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
    title: "Featured",
    durationLabel: "1 Month",
    feeLabel: "$4.99 USD",
    price: 4.99,
    description:
      "Maximize your reach to attract top-quality talent and get your project noticed faster.",
    features: [
      "Unlimited direct provider invitations",
      "Enhanced visibility (Promoted Badge)",
      "Attract top-tier service providers",
      "Promotion active for 1 month",
    ],
  },
  {
    value: REQUEST_TYPE_SELECTIONS.PROMOTED_3_MONTH,
    requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
    title: "Featured",
    durationLabel: "3 Months",
    feeLabel: "$9.90 USD",
    price: 9.9,
    description:
      "Stay promoted longer to keep your request visible and increase quality matches.",
    features: [
      "Unlimited direct provider invitations",
      "Enhanced visibility (Promoted Badge)",
      "Priority discoverability for longer campaigns",
      "Promotion active for 3 months",
    ],
  },
  {
    value: REQUEST_TYPE_SELECTIONS.PROMOTED_6_MONTH,
    requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
    title: "Featured",
    durationLabel: "6 Months",
    feeLabel: "$15.99 USD",
    price: 15.99,
    description:
      "Best long-term reach for ongoing hiring needs and consistent premium placement.",
    features: [
      "Unlimited direct provider invitations",
      "Enhanced visibility (Promoted Badge)",
      "Maximum sustained exposure",
      "Promotion active for 6 months",
    ],
  },
]);

export const COMMUNITY_OFFERS_REQUEST_TYPE_OPTIONS = Object.freeze([
  {
    value: REQUEST_TYPE_SELECTIONS.PROMOTED_1_MONTH,
    requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
    title: "Community Offer",
    durationLabel: "1 Month",
    feeLabel: "FREE",
    price: 0,
    description: "Promote your request for 1 month at no cost.",
    features: [
      "Unlimited direct provider invitations",
      "Enhanced visibility (Promoted Badge)",
      "Promotion active for 1 month",
    ],
  },
  {
    value: REQUEST_TYPE_SELECTIONS.PROMOTED_2_MONTH,
    requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
    title: "Community Offer",
    durationLabel: "2 Months",
    feeLabel: "$7.99 USD",
    price: 7.99,
    description: "Keep your request promoted for 2 months.",
    features: [
      "Unlimited direct provider invitations",
      "Enhanced visibility (Promoted Badge)",
      "Promotion active for 2 months",
    ],
  },
  {
    value: REQUEST_TYPE_SELECTIONS.PROMOTED_3_MONTH,
    requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
    title: "Community Offer",
    durationLabel: "3 Months",
    feeLabel: "$15.99 USD",
    price: 15.99,
    description: "Maximum visibility for longer hiring cycles.",
    features: [
      "Unlimited direct provider invitations",
      "Enhanced visibility (Promoted Badge)",
      "Promotion active for 3 months",
    ],
  },
]);

const toMonthLabel = (months) => `${months} Month${months > 1 ? "s" : ""}`;

const formatUsdFeeLabel = (price) => {
  const normalizedPrice = Number(price);
  if (!Number.isFinite(normalizedPrice)) {
    return "$0.00 USD";
  }

  if (normalizedPrice === 0) {
    return "FREE";
  }

  return `$${normalizedPrice.toFixed(2)} USD`;
};

const buildSelectionValueForMonths = (months) =>
  `promoted_${months}_month${months > 1 ? "s" : ""}`;

const parseDurationFromSelection = (selectedValue) =>
  Number(selectedValue?.match(/^promoted_(\d+)_month(?:s)?$/)?.[1]) || 0;

const toSortedValidPlans = (plans = []) =>
  plans
    .map((plan) => {
      const durationMonths = Number(plan?.durationMonths);
      const price = Number(plan?.price);

      if (!Number.isInteger(durationMonths) || durationMonths <= 0) {
        return null;
      }

      if (!Number.isFinite(price) || price < 0) {
        return null;
      }

      return {
        durationMonths,
        price,
        description: Array.isArray(plan?.description) ? plan.description : [],
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.durationMonths - b.durationMonths);

export const getSpecialDealActivationFee = (
  settings,
  fallback = DEFAULT_SPECIAL_DEAL_ACTIVATION_FEE
) => {
  const parsedFee = Number(settings?.specialDeal?.activationFee);
  return Number.isFinite(parsedFee) && parsedFee >= 0 ? parsedFee : fallback;
};

export const buildFeaturedRequestTypeOptions = (settings) => {
  const featured = settings?.featured;
  const plans = toSortedValidPlans(featured?.plans || []);

  if (!featured?.enabled || plans.length === 0) {
    return DEFAULT_REQUEST_TYPE_OPTIONS;
  }

  const title = featured.badgeLabel || "Featured";
  const dynamicFeaturedOptions = plans.map(({ durationMonths, price, description }) => {
    const hasDynamicDesc = Array.isArray(description) && description.length > 0;

    return {
      value: buildSelectionValueForMonths(durationMonths),
      requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
      title,
      durationLabel: toMonthLabel(durationMonths),
      feeLabel: formatUsdFeeLabel(price),
      price,
      description:
        durationMonths === 1
          ? "Maximize your reach to attract top-quality talent and get your project noticed faster."
          : `Stay promoted for ${toMonthLabel(durationMonths).toLowerCase()} to increase quality matches.`,
      features: hasDynamicDesc
        ? description
        : [
            "Unlimited direct provider invitations",
            "Enhanced visibility (Promoted Badge)",
            `Promotion active for ${toMonthLabel(durationMonths).toLowerCase()}`,
          ],
    };
  });

  return [DEFAULT_REQUEST_TYPE_OPTIONS[0], ...dynamicFeaturedOptions];
};

export const buildCommunityOfferRequestTypeOptions = (settings) => {
  const communityOffer = settings?.communityOffer;
  const plans = toSortedValidPlans(communityOffer?.plans || []);

  if (!communityOffer?.enabled || plans.length === 0) {
    return COMMUNITY_OFFERS_REQUEST_TYPE_OPTIONS;
  }

  const normalizedOptions = plans
    .map(({ durationMonths, price, description }) => {
      const hasDynamicDesc = Array.isArray(description) && description.length > 0;

      return {
        value: buildSelectionValueForMonths(durationMonths),
        requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
        title: communityOffer.badgeLabel || "Community Offer",
        durationLabel: toMonthLabel(durationMonths),
        feeLabel: formatUsdFeeLabel(price),
        price,
        description:
          price === 0
            ? `Promote your request for ${toMonthLabel(durationMonths).toLowerCase()} at no cost.`
            : `Keep your request promoted for ${toMonthLabel(durationMonths).toLowerCase()}.`,
        features: hasDynamicDesc
          ? description
          : [
            "Unlimited direct provider invitations",
            "Enhanced visibility (Promoted Badge)",
            `Promotion active for ${toMonthLabel(durationMonths).toLowerCase()}`,
          ],
      };
    })
    .filter(Boolean);

  return normalizedOptions.length > 0
    ? normalizedOptions
    : COMMUNITY_OFFERS_REQUEST_TYPE_OPTIONS;
};

export const mapSelectionToSubmissionPayload = (selectedValue) => {
  if (!selectedValue || selectedValue === REQUEST_TYPE_SELECTIONS.STANDARD) {
    return {
      requestType: PROMOTION_TYPES_FRONTEND.STANDARD,
      promotionDurationMonths: undefined,
    };
  }

  return {
    requestType: PROMOTION_TYPES_FRONTEND.PROMOTED,
    promotionDurationMonths:
      parseDurationFromSelection(selectedValue) ||
      PROMOTED_DURATION_BY_SELECTION[selectedValue] ||
      1,
  };
};
