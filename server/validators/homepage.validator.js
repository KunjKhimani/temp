const validateHomepage = (data) => {
  const homepage = data.homepage;
  if (!homepage) return;

  const limits = [
    "featuredLimit",
    "specialDealsLimit",
    "communityOffersLimit",
  ];

  limits.forEach((key) => {
    const val = homepage[key];
    if (val !== undefined && (val < 0 || val > 100)) {
      throw new Error(`${key} must be between 0-100`);
    }
  });

  const textFields = [
    "featuredSectionTitle",
    "specialDealsSectionTitle",
    "communityOffersSectionTitle",
  ];

  textFields.forEach((key) => {
    const val = homepage[key];
    if (
      val !== undefined &&
      (typeof val !== "string" || val.trim() === "" || val.length > 100)
    ) {
      throw new Error(`${key} must be valid text under 100 chars`);
    }
  });
};

module.exports = validateHomepage;