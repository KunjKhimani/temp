const {
  getSquareConfig,
  listLocations,
  SQUARE_ENV,
} = require("../utils/squareService");

const squareHealthCheck = async (req, res) => {
  const config = getSquareConfig();

  if (!config.isConfigured) {
    return res.status(400).json({
      success: false,
      message:
        "Square is not fully configured. Set SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, and SQUARE_LOCATION_ID.",
      environment: SQUARE_ENV,
      configured: {
        hasAccessToken: Boolean(config.accessToken),
        hasApplicationId: Boolean(config.applicationId),
        hasLocationId: Boolean(config.locationId),
      },
    });
  }

  try {
    const response = await listLocations();
    const locations = response.locations || [];
    const activeLocation = locations.find((loc) => loc.status === "ACTIVE");
    const configuredLocationExists = locations.some(
      (loc) => loc.id === config.locationId
    );

    return res.status(200).json({
      success: true,
      message: "Square connection successful.",
      environment: SQUARE_ENV,
      configuredLocationId: config.locationId,
      configuredLocationExists,
      activeLocationId: activeLocation?.id || null,
      totalLocations: locations.length,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({
      success: false,
      message: "Square connection failed.",
      environment: SQUARE_ENV,
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  squareHealthCheck,
};
