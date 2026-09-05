const routingService = require('../services/routing.service');

/**
 * GET /api/v1/routes/accessible
 * Returns an accessible GeoJSON route between two points,
 * avoiding active obstacles relevant to the requested needs.
 */
const getAccessibleRoute = async (req, res, next) => {
  try {
    const { startLat, startLng, endLat, endLng, accessibilityNeeds } = req.query;

    // Parse accessibility needs from comma-separated string
    const needs = accessibilityNeeds
      ? accessibilityNeeds.split(',').map((n) => n.trim()).filter(Boolean)
      : [];

    const start = { lat: parseFloat(startLat), lng: parseFloat(startLng) };
    const end   = { lat: parseFloat(endLat),   lng: parseFloat(endLng)   };

    const route = await routingService.calculatePath(start, end, needs);

    res.status(200).json({
      success: true,
      data: route,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAccessibleRoute };
