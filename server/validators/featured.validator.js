const validateFeatured = (data) => {
  const featured = data.featured;
  if (!featured) return;

  if (featured.plans) {
    if (!Array.isArray(featured.plans) || featured.plans.length === 0) {
      throw new Error("Featured plans must be a non-empty array.");
    }

    featured.plans.forEach((plan, index) => {
      if (plan.price < 0) {
        throw new Error(`Featured plan ${index} price must be >= 0`);
      }
      if (plan.durationMonths <= 0) {
        throw new Error(`Featured plan ${index} duration must be > 0`);
      }
    });
  }
};

module.exports = validateFeatured;